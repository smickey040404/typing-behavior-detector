import React from 'react';

export const TrainingStatus = ({ timer, sampleCount, lastKeyPressed }) => {
  return (
    <div className="training-status">
      <p>Training in progress... {timer}s remaining</p>
      <p>Please type normally in the input field below</p>
      <p className="sample-count">Samples collected: {sampleCount}</p>
      {lastKeyPressed && (
        <p className="last-key">Last key: "{lastKeyPressed}"</p>
      )}
    </div>
  );
}; 