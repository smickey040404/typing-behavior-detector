import React from 'react';

export const PredictionStatus = ({ lastEventInfo, eventCount }) => {
  return (
    <div className="prediction-status">
      <p>Model trained! Continue interacting to see anomaly detection</p>
      
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
        <p className="last-event">Last event: {lastEventInfo}</p>
      )}
    </div>
  );
}; 