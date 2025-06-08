import { useState, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { extractFeatures } from '../utils/featureExtraction';
import { saveModelStats, loadModelStats, deleteModelStats } from '../utils/indexedDBHelper';

export const useTypingModel = () => {
  const [isTraining, setIsTraining] = useState(true);
  const [modelTrained, setModelTrained] = useState(false);
  const [anomalyScore, setAnomalyScore] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState('');
  
  const autoencoder = useRef(null);
  const normalThreshold = useRef(0);
  const featureStats = useRef({ mean: null, std: null });
  const modelVersion = useRef(1);
  
  const MODEL_PATH = 'indexeddb://input-behavior-model-v2';
  
  const createAutoencoder = (inputSize) => {
    // Enhanced model architecture with deeper layers
    const hiddenSize1 = Math.max(Math.floor(inputSize * 2), 16);
    const hiddenSize2 = Math.max(Math.floor(inputSize * 1.5), 12);
    const bottleneckSize = Math.max(Math.floor(inputSize * 0.75), 8);
    
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: [inputSize], 
          units: hiddenSize1, 
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: hiddenSize2, 
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dense({ 
          units: bottleneckSize, 
          activation: 'relu' 
        }),
      ]
    });

    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: [bottleneckSize], 
          units: hiddenSize2, 
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dense({ 
          units: hiddenSize1, 
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dense({ 
          units: inputSize, 
          activation: 'sigmoid' 
        })
      ]
    });

    const autoencoderModel = tf.sequential({
      layers: [...encoder.layers, ...decoder.layers]
    });

    autoencoderModel.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'meanSquaredError'
    });

    return autoencoderModel;
  };

  const trainModel = useCallback(async (inputData, trainingConfig = {}) => {
    const {
      minSamples = 200,
      epochs = 100,
      batchSize = 32,
      validationSplit = 0.2,
      earlyStoppingPatience = 10
    } = trainingConfig;

    if (inputData.length < minSamples) {
      setTrainingStatus(`Not enough training data. Collected: ${inputData.length}/${minSamples}`);
      setTrainingProgress(Math.min(99, Math.floor((inputData.length / minSamples) * 100)));
      return false;
    }

    console.log('Training with', inputData.length, 'samples');
    setTrainingStatus('Preprocessing data...');
    
    try {
      // Extract enhanced features
      const features = extractFeatures(inputData);
      
      if (features.length === 0) {
        setTrainingStatus('Failed to extract features from input data');
        return false;
      }
      
      // Get input dimension from first sample
      const inputDim = features[0].length;
      console.log(`Training model with input dimension: ${inputDim}`);
      setTrainingStatus(`Building model (input dim: ${inputDim})...`);
      
      const tensorData = tf.tensor2d(features);
      
      // Calculate statistics for normalization
      const mean = tensorData.mean(0);
      const std = tensorData.sub(mean).square().mean(0).sqrt();
      featureStats.current = { 
        mean: await mean.array(), 
        std: await std.array(), 
        inputDim: inputDim,
        sampleCount: inputData.length,
        featureNames: Object.keys(inputData[0])
      };
      
      // Normalize data
      const normalizedData = tensorData.sub(mean).div(std.add(1e-7));
      
      // Create improved autoencoder
      autoencoder.current = createAutoencoder(inputDim);
      
      // Split data for training and validation
      const splitIdx = Math.floor(normalizedData.shape[0] * (1 - validationSplit));
      const trainData = normalizedData.slice([0, 0], [splitIdx, inputDim]);
      const valData = normalizedData.slice([splitIdx, 0], [normalizedData.shape[0] - splitIdx, inputDim]);
      
      // Early stopping callback
      let bestLoss = Infinity;
      let patience = earlyStoppingPatience;
      
      // Train model with early stopping
      setTrainingStatus('Training model...');
      
      for (let epoch = 0; epoch < epochs; epoch++) {
        const result = await autoencoder.current.fit(trainData, trainData, {
          epochs: 1,
          batchSize: batchSize,
          shuffle: true,
          validationData: [valData, valData],
          verbose: 0
        });
        
        const trainLoss = result.history.loss[0];
        const valLoss = result.history.val_loss[0];
        
        // Update progress
        setTrainingProgress(Math.floor((epoch / epochs) * 100));
        setTrainingStatus(`Training model: Epoch ${epoch+1}/${epochs} - loss: ${trainLoss.toFixed(4)}, val_loss: ${valLoss.toFixed(4)}`);
        
        // Check early stopping
        if (valLoss < bestLoss) {
          bestLoss = valLoss;
          patience = earlyStoppingPatience;
        } else {
          patience--;
          if (patience <= 0) {
            console.log(`Early stopping at epoch ${epoch+1}`);
            setTrainingStatus(`Early stopping at epoch ${epoch+1}`);
            break;
          }
        }
      }
      
      // Calculate threshold for anomaly detection using validation set
      const predictions = autoencoder.current.predict(normalizedData);
      const errors = predictions.sub(normalizedData).square().mean(1);
      const errorArray = await errors.array();
      
      // Advanced threshold calculation using percentiles
      errorArray.sort((a, b) => a - b);
      const threshold95 = errorArray[Math.floor(errorArray.length * 0.95)];
      const threshold99 = errorArray[Math.floor(errorArray.length * 0.99)];
      
      // Store multiple thresholds for different sensitivity levels
      normalThreshold.current = {
        medium: threshold95,
        high: threshold99,
        // Also store mean + 2*std for backward compatibility
        legacy: errorArray.reduce((a, b) => a + b) / errorArray.length + 
                2 * Math.sqrt(errorArray.reduce((sum, err) => 
                  sum + Math.pow(err - (errorArray.reduce((a, b) => a + b) / errorArray.length), 2), 0) / errorArray.length)
      };
      
      // Save improved model to IndexedDB
      setTrainingStatus('Saving model...');
      await saveModel();
      
      // Cleanup tensors
      tensorData.dispose();
      normalizedData.dispose();
      trainData.dispose();
      valData.dispose();
      predictions.dispose();
      errors.dispose();
      mean.dispose();
      std.dispose();
      
      setIsTraining(false);
      setModelTrained(true);
      setTrainingProgress(100);
      setTrainingStatus('Model trained successfully');
      console.log('Model trained successfully! Thresholds:', normalThreshold.current);
      
      return true;
    } catch (error) {
      console.error("Error training model:", error.message);
      setTrainingStatus(`Error: ${error.message}`);
      return false;
    }
  }, []);

  const saveModel = async () => {
    if (autoencoder.current) {
      try {
        // Save model using TensorFlow.js built-in IndexedDB support
        await autoencoder.current.save(MODEL_PATH);
        
        // Save additional statistics to our custom IndexedDB store
        await saveModelStats({
          threshold: normalThreshold.current,
          featureStats: featureStats.current,
          version: modelVersion.current,
          timestamp: new Date().toISOString()
        });
        
        console.log('Model and stats saved to IndexedDB successfully');
      } catch (error) {
        console.error('Error saving model to IndexedDB:', error);
      }
    }
  };

  const loadModel = useCallback(async () => {
    try {
      // Try to load model from IndexedDB
      const loadedModel = await tf.loadLayersModel(MODEL_PATH);
      
      // Load statistics from our custom IndexedDB store
      const stats = await loadModelStats();
      
      if (loadedModel && stats) {
        autoencoder.current = loadedModel;
        normalThreshold.current = stats.threshold;
        featureStats.current = stats.featureStats;
        modelVersion.current = stats.version || 1;
        setModelTrained(true);
        setIsTraining(false);
        setTrainingProgress(100);
        setTrainingStatus('Model loaded from IndexedDB');
        console.log('Model loaded from IndexedDB successfully');
      } else {
        console.log('Could not find complete model data in IndexedDB');
        setTrainingStatus('No saved model found. Starting fresh training.');
      }
    } catch (error) {
      console.log('No saved model found in IndexedDB:', error.message);
      setTrainingStatus('No saved model found. Starting fresh training.');
    }
  }, []);

  const calculateAnomalyScore = useCallback(async (eventType, eventData, interval, sensitivity = 'medium') => {
    if (!modelTrained || !autoencoder.current) {
      return null;
    }

    // Extract features for the current event
    const features = extractFeatures([{
      eventType,
      interval,
      ...eventData
    }]);
    
    if (features.length === 0) {
      return null;
    }

    try {
      const input = tf.tensor2d(features);
      const { mean, std, inputDim } = featureStats.current;
      
      // Check if input dimensions match the model's expected dimensions
      if (input.shape[1] !== mean.length) {
        console.warn(`Input feature dimension (${input.shape[1]}) doesn't match model's expected dimension (${mean.length})`);
        input.dispose();
        return null;
      }
      
      const meanTensor = tf.tensor1d(mean);
      const stdTensor = tf.tensor1d(std);
      
      // Normalize input
      const normalizedInput = input.sub(meanTensor).div(stdTensor.add(1e-7));
      
      // Get reconstruction
      const reconstruction = autoencoder.current.predict(normalizedInput);
      
      // Calculate reconstruction error (MSE)
      const error = reconstruction.sub(normalizedInput).square().mean().arraySync();
      
      // Cleanup tensors
      input.dispose();
      meanTensor.dispose();
      stdTensor.dispose();
      normalizedInput.dispose();
      reconstruction.dispose();
      
      // Get appropriate threshold based on sensitivity
      const threshold = normalThreshold.current[sensitivity] || normalThreshold.current.medium;
      
      // Convert error to anomaly score (0-100)
      const score = Math.min(100, Math.max(0, (error / threshold) * 75));
      
      return score;
    } catch (error) {
      console.error("Error calculating anomaly score:", error.message);
      return null;
    }
  }, [modelTrained]);

  const pauseTraining = useCallback(() => {
    setIsTraining(false);
  }, []);

  const resumeTraining = useCallback(() => {
    setIsTraining(true);
  }, []);

  const resetModel = useCallback(async () => {
    try {
      // Remove model from IndexedDB
      await tf.io.removeModel(MODEL_PATH);
      
      // Remove model stats from IndexedDB
      await deleteModelStats();
      
      console.log('Model data cleared from IndexedDB successfully');
    } catch (error) {
      console.log('Error clearing model data:', error.message);
    }
    
    setIsTraining(true);
    setModelTrained(false);
    setAnomalyScore(null);
    setTrainingProgress(0);
    setTrainingStatus('');
    
    if (autoencoder.current) {
      autoencoder.current.dispose();
      autoencoder.current = null;
    }
    normalThreshold.current = 0;
    featureStats.current = { mean: null, std: null };
  }, []);
  
  return {
    isTraining,
    setIsTraining,
    modelTrained,
    setModelTrained,
    anomalyScore,
    setAnomalyScore,
    trainingProgress,
    trainingStatus,
    trainModel,
    calculateAnomalyScore,
    resetModel,
    loadModel,
    pauseTraining,
    resumeTraining
  };
};