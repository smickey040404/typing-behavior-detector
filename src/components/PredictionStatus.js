import React from 'react';

export const PredictionStatus = ({ lastKeyPressed }) => {
  return (
    <div className="prediction-status">
      <p>Model trained! Continue typing to see anomaly detection</p>
      {lastKeyPressed && (
        <p className="last-key">Last key: "{lastKeyPressed}"</p>
      )}
    </div>
  );
}; 