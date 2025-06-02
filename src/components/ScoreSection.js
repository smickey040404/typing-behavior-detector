import React from 'react';

export const ScoreSection = ({ anomalyScore }) => {
  const score = parseFloat(anomalyScore);
  return (
    <div className="score-section">
      <h3>Anomaly Score</h3>
      <div className={`score ${score > 50 ? 'high' : 'low'}`}>
        {anomalyScore}%
      </div>
      <p className="score-description">
        {score > 50 
          ? 'Unusual typing pattern detected!' 
          : 'Normal typing pattern'}
      </p>
    </div>
  );
}; 