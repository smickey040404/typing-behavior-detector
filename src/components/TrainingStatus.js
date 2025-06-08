import React from 'react';

export const TrainingStatus = ({ timer, sampleCount, lastEventInfo, eventCount, minSamples, progress, status }) => {
  // Calculate sample collection progress
  const sampleProgress = Math.min(100, Math.floor((sampleCount / minSamples) * 100));
  
  // Format time remaining in MM:SS format
  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="training-status">
      <div className="training-header">
        <h2>Training Mode</h2>
        <div className="training-timer">
          <span className="timer-label">Time remaining:</span>
          <span className="timer-value">{formatTimeRemaining(timer)}</span>
        </div>
      </div>
      
      <div className="training-progress-container">
        <div className="progress-section">
          <div className="progress-label">
            <span>Data Collection:</span>
            <span className="progress-value">{sampleProgress}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${sampleProgress}%` }}></div>
          </div>
          <div className="progress-details">
            Samples: {sampleCount} / {minSamples} minimum required
          </div>
        </div>
        
        {progress > 0 && (
          <div className="progress-section">
            <div className="progress-label">
              <span>Model Training:</span>
              <span className="progress-value">{progress}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-details">
              {status || 'Preparing to train model...'}
            </div>
          </div>
        )}
      </div>
      
      <div className="training-instructions">
        <p>Please continue using your device naturally:</p>
        <ul>
          <li>Type text in the box below</li>
          <li>Move your mouse around the page</li>
          <li>Click on different areas</li>
          <li>Scroll up and down</li>
          <li>Use keyboard shortcuts</li>
        </ul>
        <p>The more varied your interaction, the better the model will learn your behavior patterns.</p>
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