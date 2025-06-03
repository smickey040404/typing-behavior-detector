import { useState, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { extractFeatures } from '../utils/featureExtraction';

export const useTypingModel = () => {
  const [isTraining, setIsTraining] = useState(true);
  const [modelTrained, setModelTrained] = useState(false);
  const [anomalyScore, setAnomalyScore] = useState(null);
  
  const autoencoder = useRef(null);
  const normalThreshold = useRef(0);
  const featureStats = useRef({ mean: null, std: null });
  
  const createAutoencoder = (inputSize) => {
    const hiddenSize = Math.max(Math.floor(inputSize * 1.5), 5);
    const bottleneckSize = Math.max(Math.floor(inputSize * 0.75), 2);
    
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [inputSize], units: hiddenSize, activation: 'relu' }),
        tf.layers.dense({ units: bottleneckSize, activation: 'relu' }),
      ]
    });

    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [bottleneckSize], units: hiddenSize, activation: 'relu' }),
        tf.layers.dense({ units: inputSize, activation: 'sigmoid' })
      ]
    });

    const autoencoderModel = tf.sequential({
      layers: [...encoder.layers, ...decoder.layers]
    });

    autoencoderModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    return autoencoderModel;
  };

  const trainModel = useCallback(async (inputData) => {
    if (inputData.length < 20) {
      console.log('Not enough training data. Please provide more input.');
      return false;
    }

    console.log('Training with', inputData.length, 'samples');
    
    try {
      // Extract features
      const features = extractFeatures(inputData);
      
      if (features.length === 0) {
        console.log('Failed to extract features from input data');
        return false;
      }
      
      // Get input dimension from first sample
      const inputDim = features[0].length;
      console.log(`Training model with input dimension: ${inputDim}`);
      
      const tensorData = tf.tensor2d(features);
      
      // Calculate statistics for normalization
      const mean = tensorData.mean(0);
      const std = tensorData.sub(mean).square().mean(0).sqrt();
      featureStats.current = { 
        mean: await mean.array(), 
        std: await std.array(), 
        inputDim: inputDim
      };
      
      // Normalize data
      const normalizedData = tensorData.sub(mean).div(std.add(1e-7));
      
      // Create and train autoencoder
      autoencoder.current = createAutoencoder(inputDim);
      
      await autoencoder.current.fit(normalizedData, normalizedData, {
        epochs: 50,
        batchSize: 16,
        shuffle: true,
        verbose: 0
      });
      
      // Calculate threshold for anomaly detection
      const predictions = autoencoder.current.predict(normalizedData);
      const errors = predictions.sub(normalizedData).square().mean(1);
      const errorArray = await errors.array();
      
      // Set threshold as mean + 2 * std of reconstruction errors
      const meanError = errorArray.reduce((a, b) => a + b) / errorArray.length;
      const stdError = Math.sqrt(
        errorArray.reduce((sum, err) => sum + Math.pow(err - meanError, 2), 0) / errorArray.length
      );
      normalThreshold.current = meanError + 2 * stdError;
      
      // Save model to localStorage
      await saveModel();
      
      // Cleanup tensors
      tensorData.dispose();
      normalizedData.dispose();
      predictions.dispose();
      errors.dispose();
      mean.dispose();
      std.dispose();
      
      setIsTraining(false);
      setModelTrained(true);
      console.log('Model trained successfully! Threshold:', normalThreshold.current);
      
      return true;
    } catch (error) {
      console.error("Error training model:", error.message);
      return false;
    }
  }, []);

  const saveModel = async () => {
    if (autoencoder.current) {
      await autoencoder.current.save('localstorage://input-behavior-model');
      localStorage.setItem('input-behavior-stats', JSON.stringify({
        threshold: normalThreshold.current,
        featureStats: featureStats.current
      }));
    }
  };

  const loadModel = useCallback(async () => {
    try {
      const loadedModel = await tf.loadLayersModel('localstorage://input-behavior-model');
      const stats = JSON.parse(localStorage.getItem('input-behavior-stats'));
      
      if (loadedModel && stats) {
        autoencoder.current = loadedModel;
        normalThreshold.current = stats.threshold;
        featureStats.current = stats.featureStats;
        setModelTrained(true);
        setIsTraining(false);
        console.log('Model loaded from storage');
      }
    } catch (error) {
      console.log('No saved model found');
    }
  }, []);

  const calculateAnomalyScore = useCallback(async (eventType, eventData, interval) => {
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
      
      // Calculate reconstruction error
      const error = reconstruction.sub(normalizedInput).square().mean().arraySync();
      
      // Cleanup tensors
      input.dispose();
      meanTensor.dispose();
      stdTensor.dispose();
      normalizedInput.dispose();
      reconstruction.dispose();
      
      // Convert error to anomaly score (0-100)
      const score = Math.min(100, Math.max(0, (error / normalThreshold.current) * 50));
      
      return score;
    } catch (error) {
      console.error("Error calculating anomaly score:", error.message);
      return null;
    }
  }, [modelTrained]);

  const resetModel = useCallback(async () => {
    try {
      await tf.io.removeModel('localstorage://input-behavior-model');
      localStorage.removeItem('input-behavior-stats');
    } catch (error) {
      console.log('No saved model to delete');
    }
    
    setIsTraining(true);
    setModelTrained(false);
    setAnomalyScore(null);
    
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
    trainModel,
    calculateAnomalyScore,
    resetModel,
    loadModel
  };
}; 