import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import './TypingBehaviorDetector.css';

const TypingBehaviorDetector = () => {
  const [inputValue, setInputValue] = useState('');
  const [isTraining, setIsTraining] = useState(true);
  const [anomalyScore, setAnomalyScore] = useState(null);
  const [trainingTime, setTrainingTime] = useState(30); // 30 seconds training time
  const [modelTrained, setModelTrained] = useState(false);
  const [timer, setTimer] = useState(trainingTime);
  const [lastKeyPressed, setLastKeyPressed] = useState('');
  
  const keystrokeData = useRef([]);
  const previousKey = useRef(null);
  const previousTimestamp = useRef(null);
  const autoencoder = useRef(null);
  const normalThreshold = useRef(0);
  const featureStats = useRef({ mean: null, std: null });

  // Start training timer when component mounts
  useEffect(() => {
    if (isTraining && timer > 0) {
      const countdown = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0 && isTraining) {
      // Training time is up, process the data and train the model
      trainAutoencoder();
    }
  }, [timer, isTraining]);

  // Feature extraction function
  const extractFeatures = (data) => {
    const features = [];
    
    data.forEach(item => {
      // Map all characters to a numerical value
      let prevKeyCode, currKeyCode;
      
      // Handle different key types
      const getKeyCode = (key) => {
        if (key.length === 1) {
          // Single character - use char code
          return key.charCodeAt(0) / 255; // Normalize to 0-1 range
        } else {
          // Special keys mapping
          const specialKeys = {
            'Enter': 0.9,
            'Backspace': 0.91,
            'Space': 0.92,
            ' ': 0.92,
            'Tab': 0.93,
            'Shift': 0.94,
            'Control': 0.95,
            'Alt': 0.96,
            'Meta': 0.97,
            'CapsLock': 0.98,
            'Escape': 0.99,
            'ArrowLeft': 0.85,
            'ArrowRight': 0.86,
            'ArrowUp': 0.87,
            'ArrowDown': 0.88,
            'Delete': 0.89
          };
          return specialKeys[key] || 0.84; // Default for unknown special keys
        }
      };
      
      prevKeyCode = getKeyCode(item.previousKey);
      currKeyCode = getKeyCode(item.currentKey);
      
      // Normalize interval (log scale for better distribution)
      const normalizedInterval = Math.log(item.interval + 1) / 10;
      
      features.push([
        prevKeyCode,
        currKeyCode,
        normalizedInterval
      ]);
    });
    
    return features;
  };

  // Create and train autoencoder
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

  const trainAutoencoder = async () => {
    if (keystrokeData.current.length < 20) {
      console.log('Not enough training data. Please type more.');
      // Reset timer for more training
      setTimer(15);
      return;
    }

    console.log('Training with', keystrokeData.current.length, 'samples');
    
    // Extract features
    const features = extractFeatures(keystrokeData.current);
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
    
    // Clear input field after training completes
    setInputValue('');
  };

  const saveModel = async () => {
    if (autoencoder.current) {
      await autoencoder.current.save('localstorage://typing-behavior-model');
      localStorage.setItem('typing-behavior-stats', JSON.stringify({
        threshold: normalThreshold.current,
        featureStats: featureStats.current
      }));
    }
  };

  const loadModel = async () => {
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
  };

  // Load model on component mount
  useEffect(() => {
    loadModel();
  }, []);

  const calculateAnomalyScore = async (previousKey, currentKey, interval) => {
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
  };

  const handleKeyDown = async (e) => {
    const currentTimestamp = Date.now();
    const currentKey = e.key;
    
    // Update last key pressed display
    setLastKeyPressed(currentKey);

    if (previousKey.current && previousTimestamp.current) {
      const interval = currentTimestamp - previousTimestamp.current;
      
      if (isTraining) {
        // Store training data
        keystrokeData.current.push({
          previousKey: previousKey.current,
          currentKey: currentKey,
          interval: interval
        });
      } else if (modelTrained) {
        // Calculate anomaly score
        const score = await calculateAnomalyScore(previousKey.current, currentKey, interval);
        if (score !== null) {
          setAnomalyScore(score.toFixed(2));
        }
      }
    }

    previousKey.current = currentKey;
    previousTimestamp.current = currentTimestamp;
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const resetModel = async () => {
    // Delete saved model
    try {
      await tf.io.removeModel('localstorage://typing-behavior-model');
      localStorage.removeItem('typing-behavior-stats');
    } catch (error) {
      console.log('No saved model to delete');
    }
    
    // Reset everything
    setInputValue('');
    setIsTraining(true);
    setAnomalyScore(null);
    setModelTrained(false);
    setTimer(trainingTime);
    setLastKeyPressed('');
    keystrokeData.current = [];
    previousKey.current = null;
    previousTimestamp.current = null;
    if (autoencoder.current) {
      autoencoder.current.dispose();
      autoencoder.current = null;
    }
    normalThreshold.current = 0;
    featureStats.current = { mean: null, std: null };
  };

  return (
    <div className="typing-detector-container">
      <h1>Typing Behavior Anomaly Detector</h1>
      
      <div className="status-section">
        {isTraining ? (
          <div className="training-status">
            <p>Training in progress... {timer}s remaining</p>
            <p>Please type normally in the input field below</p>
            <p className="sample-count">Samples collected: {keystrokeData.current.length}</p>
            {lastKeyPressed && (
              <p className="last-key">Last key: "{lastKeyPressed}"</p>
            )}
          </div>
        ) : (
          <div className="prediction-status">
            <p>Model trained! Continue typing to see anomaly detection</p>
            {lastKeyPressed && (
              <p className="last-key">Last key: "{lastKeyPressed}"</p>
            )}
          </div>
        )}
      </div>

      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Start typing here..."
          className="typing-input"
          autoFocus
        />
      </div>

      {anomalyScore !== null && !isTraining && (
        <div className="score-section">
          <h3>Anomaly Score</h3>
          <div className={`score ${anomalyScore > 50 ? 'high' : 'low'}`}>
            {anomalyScore}%
          </div>
          <p className="score-description">
            {anomalyScore > 50 
              ? 'Unusual typing pattern detected!' 
              : 'Normal typing pattern'}
          </p>
        </div>
      )}

      <div className="controls-section">
        <button onClick={resetModel} className="reset-button">
          Delete Model & Restart
        </button>
      </div>

      <div className="info-section">
        <h4>How it works:</h4>
        <ul>
          <li>The model trains on your typing patterns for {trainingTime} seconds</li>
          <li>Uses a neural network autoencoder to learn normal behavior</li>
          <li>Tracks ALL characters including letters, numbers, symbols, and special keys</li>
          <li>Monitors key transitions and timing intervals between keystrokes</li>
          <li>After training, it detects anomalies in typing behavior</li>
          <li>Model is saved locally and loaded on page refresh</li>
          <li>High scores indicate unusual typing patterns</li>
        </ul>
      </div>
    </div>
  );
};

export default TypingBehaviorDetector; 