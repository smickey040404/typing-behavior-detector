import React from 'react';

export const TrainingStatus = ({ timer, sampleCount, lastEventInfo, eventCount }) => {
  return (
    <div className="training-status">
      <p>Training in progress... {timer}s remaining</p>
      <p>Please type, click, move and scroll naturally in the area below</p>
      <p className="sample-count">Samples collected: {sampleCount}</p>
      
      <div className="event-stats">
        <p>Event Counts:</p>
        <ul className="event-counts-list">
          <li>Typing: {eventCount.typing || 0}</li>
          <li>
            Mouse Clicks: {eventCount.click || 0}
            <ul>
              <li>Left: {eventCount.leftClick || 0}</li>
              <li>Middle: {eventCount.middleClick || 0}</li>
              <li>Right: {eventCount.rightClick || 0}</li>
            </ul>
          </li>
          <li>Mouse Movement: {eventCount.move || 0}</li>
          <li>
            Scrolling: {eventCount.scroll || 0}
            <ul>
              <li>Up: {eventCount.scrollUp || 0}</li>
              <li>Down: {eventCount.scrollDown || 0}</li>
            </ul>
          </li>
        </ul>
      </div>
      
      {lastEventInfo && (
        <p className="last-event">Last event: {lastEventInfo}</p>
      )}
    </div>
  );
}; 