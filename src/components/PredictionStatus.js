import React from 'react';

export const PredictionStatus = ({ lastEventInfo, eventCount, userStatus }) => {
  // Get appropriate status message and styles based on user status
  const getUserStatusInfo = () => {
    switch (userStatus) {
      case 'original':
        return {
          icon: '✅',
          message: 'Original User Detected',
          description: 'Your behavior matches the trained profile.',
          className: 'user-status-original'
        };
      case 'unknown':
        return {
          icon: '⚠️',
          message: 'Uncertain User Identity',
          description: 'Some behavioral patterns differ from the trained profile.',
          className: 'user-status-unknown'
        };
      case 'different':
        return {
          icon: '🚫',
          message: 'Different User Detected',
          description: 'Behavior patterns significantly different from trained profile.',
          className: 'user-status-different'
        };
      default:
        return {
          icon: '🔍',
          message: 'Analyzing User Behavior',
          description: 'Collecting data to determine user identity...',
          className: 'user-status-analyzing'
        };
    }
  };
  
  const statusInfo = getUserStatusInfo();
  
  return (
    <div className="prediction-status">
      <div className="prediction-header">
        <h2>Detection Mode</h2>
        <div className={`user-status ${statusInfo.className}`}>
          <span className="user-status-icon">{statusInfo.icon}</span>
          <div className="user-status-text">
            <div className="user-status-message">{statusInfo.message}</div>
            <div className="user-status-description">{statusInfo.description}</div>
          </div>
        </div>
      </div>
      
      <div className="prediction-instructions">
        <p>The system is now monitoring for user behavior anomalies:</p>
        <ul>
          <li>Continue using your device naturally</li>
          <li>Have someone else try using it to see the anomaly detection in action</li>
          <li>Watch the anomaly score to see how the system detects different users</li>
        </ul>
      </div>
      
      <div className="event-stats-container">
        <h3 className="event-stats-title">Event Activity</h3>
        <div className="event-stats-grid">
          <div className="event-stat-card">
            <div className="event-icon keyboard-icon">⌨️</div>
            <div className="event-count">{eventCount.typing || 0}</div>
            <div className="event-label">Keystrokes</div>
          </div>
          
          <div className="event-stat-card">
            <div className="event-icon mouse-icon">🖱️</div>
            <div className="event-count">{eventCount.click || 0}</div>
            <div className="event-label">Clicks</div>
            <div className="event-details">
              <span className="detail-item">L: {eventCount.leftClick || 0}</span>
              <span className="detail-item">M: {eventCount.middleClick || 0}</span>
              <span className="detail-item">R: {eventCount.rightClick || 0}</span>
            </div>
          </div>
          
          <div className="event-stat-card">
            <div className="event-icon move-icon">↔️</div>
            <div className="event-count">{eventCount.move || 0}</div>
            <div className="event-label">Movements</div>
          </div>
          
          <div className="event-stat-card">
            <div className="event-icon scroll-icon">⇅</div>
            <div className="event-count">{eventCount.scroll || 0}</div>
            <div className="event-label">Scrolls</div>
            <div className="event-details">
              <span className="detail-item">↑: {eventCount.scrollUp || 0}</span>
              <span className="detail-item">↓: {eventCount.scrollDown || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {lastEventInfo && (
        <div className="event-feedback">
          <p className="last-event">Last detected event: <strong>{lastEventInfo}</strong></p>
        </div>
      )}
    </div>
  );
}; 