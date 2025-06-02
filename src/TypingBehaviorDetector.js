import React, { useState, useEffect } from 'react';
import './TypingBehaviorDetector.css';
import { useTypingModel } from './hooks/useTypingModel';
import { useTypingData } from './hooks/useTypingData';
import { TrainingStatus } from './components/TrainingStatus';
import { PredictionStatus } from './components/PredictionStatus';
import { InfoSection } from './components/InfoSection';
import { ScoreSection } from './components/ScoreSection';

const TypingBehaviorDetector = () => {
  const [inputValue, setInputValue] = useState('');
  const [trainingTime] = useState(30); // 30 seconds training time
  const [timer, setTimer] = useState(trainingTime);
  const [lastKeyPressed, setLastKeyPressed] = useState('');
  
  const {
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
  } = useTypingModel();
  
  const {
    keystrokeData,
    addKeystroke,
    clearKeystrokeData,
    previousKey,
    previousTimestamp
  } = useTypingData();
  
  // Start training timer when component mounts
  useEffect(() => {
    if (isTraining && timer > 0) {
      const countdown = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0 && isTraining) {
      // Training time is up, process the data and train the model
      trainModel(keystrokeData);
    }
  }, [timer, isTraining, keystrokeData, trainModel]);

  // Load model on component mount
  useEffect(() => {
    loadModel();
  }, [loadModel]);
  
  const handleKeyDown = async (e) => {
    const currentTimestamp = Date.now();
    const currentKey = e.key;
    
    setLastKeyPressed(currentKey);

    if (previousKey.current && previousTimestamp.current) {
      const interval = currentTimestamp - previousTimestamp.current;
      
      if (isTraining) {
        // Store training data
        addKeystroke(previousKey.current, currentKey, interval);
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
  
  const handleResetModel = () => {
    resetModel();
    clearKeystrokeData();
    setInputValue('');
    setTimer(trainingTime);
    setLastKeyPressed('');
    setAnomalyScore(null);
  };

  return (
    <div className="typing-detector-container">
      <h1>Typing Behavior Anomaly Detector</h1>
      
      <div className="status-section">
        {isTraining ? (
          <TrainingStatus 
            timer={timer} 
            sampleCount={keystrokeData.length} 
            lastKeyPressed={lastKeyPressed} 
          />
        ) : (
          <PredictionStatus lastKeyPressed={lastKeyPressed} />
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
        <ScoreSection anomalyScore={anomalyScore} />
      )}

      <div className="controls-section">
        <button onClick={handleResetModel} className="reset-button">
          Delete Model & Restart
        </button>
      </div>

      <InfoSection trainingTime={trainingTime} />
    </div>
  );
};

export default TypingBehaviorDetector; 