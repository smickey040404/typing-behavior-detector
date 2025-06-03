import React from 'react';

export const InfoSection = ({ trainingTime }) => {
  return (
    <div className="info-section">
      <h4>How it works:</h4>
      <ul>
        <li>The model trains on your interaction patterns for {trainingTime} seconds</li>
        <li>Uses a neural network autoencoder to learn normal behavior</li>
        <li>Captures typing, mouse clicks, movements, and scrolling</li>
        <li>Monitors key transitions, mouse positions, click locations, and scroll patterns</li>
        <li>After training, it detects anomalies in user behavior</li>
        <li>Model is saved locally and loaded on page refresh</li>
        <li>High scores indicate unusual interaction patterns</li>
      </ul>
    </div>
  );
}; 