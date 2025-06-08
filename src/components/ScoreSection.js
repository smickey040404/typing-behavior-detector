import React from 'react';

export const ScoreSection = ({ anomalyScore, anomalyHistory, userStatus }) => {
  const score = parseFloat(anomalyScore);
  
  // Determine score class based on value
  const getScoreClass = (scoreValue) => {
    if (scoreValue >= 60) return 'critical';
    if (scoreValue >= 40) return 'high';
    if (scoreValue >= 25) return 'medium';
    return 'low';
  };
  
  // Generate appropriate message based on score and user status
  const getScoreMessage = () => {
    if (score >= 60) {
      return 'Critical anomaly detected! User behavior significantly different from trained profile.';
    } else if (score >= 40) {
      return 'High anomaly level. This interaction pattern differs from the trained user.';
    } else if (score >= 25) {
      return 'Moderate anomaly detected. Some behavioral differences present.';
    } else {
      return 'Normal behavior pattern. Matches the trained user profile.';
    }
  };
  
  // Create the history chart visualization
  const renderHistoryChart = () => {
    if (!anomalyHistory || anomalyHistory.length === 0) return null;
    
    return (
      <div className="history-chart">
        <div className="chart-title">Anomaly History (Recent Events)</div>
        <div className="chart-container">
          <div className="chart-thresholds">
            <div className="threshold critical-threshold">60</div>
            <div className="threshold high-threshold">40</div>
            <div className="threshold medium-threshold">25</div>
          </div>
          <div className="chart-bars">
            {anomalyHistory.map((value, index) => (
              <div 
                key={index} 
                className={`chart-bar ${getScoreClass(value)}`}
                style={{ height: `${Math.min(100, value)}%` }}
                title={`Event ${index + 1}: ${value.toFixed(1)}%`}
              ></div>
            ))}
          </div>
          <div className="chart-baseline"></div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color legend-low"></span>
            <span className="legend-label">Normal (0-25%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color legend-medium"></span>
            <span className="legend-label">Moderate (25-40%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color legend-high"></span>
            <span className="legend-label">High (40-60%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color legend-critical"></span>
            <span className="legend-label">Critical (60%+)</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="score-section">
      <h2>Anomaly Detection</h2>
      
      <div className="current-score-container">
        <div className="score-label">Current Anomaly Score:</div>
        <div className={`score-gauge ${getScoreClass(score)}`}>
          <div className="score-value">
            <span className="score-number">{anomalyScore}%</span>
            <span className="score-level">{getScoreClass(score)}</span>
          </div>
          <div className="gauge-indicator" style={{ transform: `rotate(${Math.min(180, score * 1.8)}deg)` }}></div>
        </div>
        <p className="score-message">
          {getScoreMessage()}
        </p>
      </div>
      
      {renderHistoryChart()}
    </div>
  );
};