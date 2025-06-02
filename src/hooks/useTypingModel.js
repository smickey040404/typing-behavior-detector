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
  
  const createAutoencoder = () => {
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [3], units: 6, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'relu' }),
        tf.layers.dense({ units: 2, activation: 'sigmoid' })
      ]
    });

    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [2], units: 3, activation: 'relu' }),
        tf.layers.dense({ units: 6, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'sigmoid' })
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

  const trainModel = useCallback(async (keystrokeData) => {
    if (keystrokeData.length < 20) {
      console.log('Not enough training data. Please type more.');
      return false;
    }

    console.log('Training with', keystrokeData.length, 'samples');
    
    // Extract features
    const features = extractFeatures(keystrokeData);
    const tensorData = tf.tensor2d(features);
    
    // Calculate statistics for normalization
    const mean = tensorData.mean(0);
    const std = tensorData.sub(mean).square().mean(0).sqrt();
    featureStats.current = { 
      mean: await mean.array(), 
      std: await std.array() 
    };
    
    // Normalize data
    const normalizedData = tensorData.sub(mean).div(std.add(1e-7));
    
    // Create and train autoencoder
    autoencoder.current = createAutoencoder();
    
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
  }, []);

  const saveModel = async () => {
    if (autoencoder.current) {
      await autoencoder.current.save('localstorage://typing-behavior-model');
      localStorage.setItem('typing-behavior-stats', JSON.stringify({
        threshold: normalThreshold.current,
        featureStats: featureStats.current
      }));
    }
  };

  const loadModel = useCallback(async () => {
    try {
      const loadedModel = await tf.loadLayersModel('localstorage://typing-behavior-model');
      const stats = JSON.parse(localStorage.getItem('typing-behavior-stats'));
      
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

  const calculateAnomalyScore = useCallback(async (previousKey, currentKey, interval) => {
    if (!modelTrained || !autoencoder.current) {
      return null;
    }

    // Extract features for the current keystroke
    const features = extractFeatures([{
      previousKey,
      currentKey,
      interval
    }]);
    
    const input = tf.tensor2d(features);
    const { mean, std } = featureStats.current;
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
  }, [modelTrained]);

  const resetModel = useCallback(async () => {
    try {
      await tf.io.removeModel('localstorage://typing-behavior-model');
      localStorage.removeItem('typing-behavior-stats');
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