import React from 'react';

export const InfoSection = ({ trainingTime }) => {
  return (
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
  );
}; 