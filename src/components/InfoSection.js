import React, { useState } from 'react';

export const InfoSection = ({ isTraining, modelTrained, trainingConfig, sessionId }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  // Format training period in human-readable format
  const formatTrainingPeriod = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''}`;
    return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) !== 1 ? 's' : ''} ${Math.floor((seconds % 3600) / 60)} minute${Math.floor((seconds % 3600) / 60) !== 1 ? 's' : ''}`;
  };
  
  return (
    <div className="info-section">
      <div className="info-header" onClick={toggleDetails}>
        <h3>System Information {showDetails ? '▼' : '▶'}</h3>
      </div>
      
      {showDetails && (
        <div className="info-details">
          <div className="info-section-group">
            <h4>Current Configuration:</h4>
            <ul className="info-list">
              <li>Session ID: {sessionId}</li>
              <li>Status: {isTraining ? 'Training Mode' : (modelTrained ? 'Detection Mode' : 'Idle')}</li>
              <li>Training Period: {formatTrainingPeriod(trainingConfig.trainingPeriod)}</li>
              <li>Minimum Samples: {trainingConfig.minSamples}</li>
              <li>Detection Sensitivity: {trainingConfig.sensitivity.charAt(0).toUpperCase() + trainingConfig.sensitivity.slice(1)}</li>
            </ul>
          </div>
          
          <div className="info-section-group">
            <h4>How It Works:</h4>
            <ul className="info-list">
              <li>The system trains on your unique behavioral patterns</li>
              <li>Uses a deep neural network autoencoder for anomaly detection</li>
              <li>Captures multiple behavioral features:</li>
              <ul>
                <li>Keystroke dynamics (timing, patterns, transitions)</li>
                <li>Mouse movement trajectories (velocity, acceleration, smoothness)</li>
                <li>Click behavior (position, frequency, patterns)</li>
                <li>Scrolling style (speed, consistency, reading patterns)</li>
                <li>Interaction sequence patterns and transitions</li>
              </ul>
              <li>After training, continuously monitors for behavioral anomalies</li>
              <li>Models are saved locally using IndexedDB for persistence</li>
            </ul>
          </div>
          
          <div className="info-section-group">
            <h4>Advanced Features:</h4>
            <ul className="info-list">
              <li>Multi-dimensional feature engineering (12 features per event)</li>
              <li>Context-aware pattern recognition</li>
              <li>Adaptive sensitivity thresholds</li>
              <li>Feature importance weighting</li>
              <li>Real-time anomaly visualization</li>
              <li>Continuous user identity verification</li>
            </ul>
          </div>
          
          <div className="info-section-group">
            <h4>User Experience Tips:</h4>
            <ul className="info-list">
              <li>For best results, use the system naturally during training</li>
              <li>Longer training periods (5+ minutes) provide better accuracy</li>
              <li>Vary your interaction patterns during training</li>
              <li>To test detection, have another person use your device</li>
              <li>Adjust sensitivity settings based on your security needs</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 