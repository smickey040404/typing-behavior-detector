import React, { useState, useEffect, useRef } from 'react';
import './TypingBehaviorDetector.css';
import { useTypingModel } from './hooks/useTypingModel';
import { useTypingData } from './hooks/useTypingData';
import { TrainingStatus } from './components/TrainingStatus';
import { PredictionStatus } from './components/PredictionStatus';
import { InfoSection } from './components/InfoSection';
import { ScoreSection } from './components/ScoreSection';

const TypingBehaviorDetector = () => {
  const [inputValue, setInputValue] = useState('');
  const [trainingTime] = useState(30); // 30 seconds training time
  const [timer, setTimer] = useState(trainingTime);
  const [lastEventInfo, setLastEventInfo] = useState('');
  const [eventCount, setEventCount] = useState({ typing: 0, click: 0, move: 0, scroll: 0 });
  
  const containerRef = useRef(null);
  const throttleRef = useRef({ move: 0, scroll: 0 });
  
  const {
    isTraining,
    setIsTraining,
    modelTrained,
    setModelTrained,
    anomalyScore,
    setAnomalyScore,
    trainModel,
    calculateAnomalyScore,
    resetModel,
    loadModel
  } = useTypingModel();
  
  const {
    inputData,
    addEvent,
    clearInputData,
    previousEvent,
    previousTimestamp
  } = useTypingData();
  
  // Start training timer when component mounts
  useEffect(() => {
    if (isTraining && timer > 0) {
      const countdown = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0 && isTraining) {
      // Training time is up, process the data and train the model
      trainModel(inputData);
    }
  }, [timer, isTraining, inputData, trainModel]);

  // Load model on component mount
  useEffect(() => {
    loadModel();
  }, [loadModel]);
  
  // Process input event and calculate anomaly score if model is trained
  const processEvent = async (eventType, eventData) => {
    try {
      const currentTimestamp = Date.now();
      
      // Get specific event type
      let specificEventType = eventType;
      if (eventType === 'mouseClick') {
        // Map button numbers to names (0=left, 1=middle, 2=right)
        const buttonNames = ['leftClick', 'middleClick', 'rightClick'];
        const buttonIndex = eventData.button;
        if (buttonIndex >= 0 && buttonIndex <= 2) {
          specificEventType = buttonNames[buttonIndex];
        } else {
          specificEventType = 'mouseClick';
        }
        console.log(`Mouse click detected: button=${eventData.button}, type=${specificEventType}`);
      } else if (eventType === 'scroll') {
        // Differentiate between scroll up and scroll down
        specificEventType = eventData.deltaY > 0 ? 'scrollDown' : 'scrollUp';
      }
      
      // Update event count
      setEventCount(prev => {
        // Create a copy of the previous counts
        const newCounts = { ...prev };
        
        // Increment the specific count based on event type
        if (eventType === 'typing') {
          newCounts.typing = (newCounts.typing || 0) + 1;
        } else if (eventType === 'mouseClick') {
          newCounts.click = (newCounts.click || 0) + 1;
          if (eventData.button === 0) {
            newCounts.leftClick = (newCounts.leftClick || 0) + 1;
          } else if (eventData.button === 1) {
            newCounts.middleClick = (newCounts.middleClick || 0) + 1;
          } else if (eventData.button === 2) {
            newCounts.rightClick = (newCounts.rightClick || 0) + 1;
          }
        } else if (eventType === 'mouseMove') {
          newCounts.move = (newCounts.move || 0) + 1;
        } else if (eventType === 'scroll') {
          newCounts.scroll = (newCounts.scroll || 0) + 1;
          if (eventData.deltaY > 0) {
            newCounts.scrollDown = (newCounts.scrollDown || 0) + 1;
          } else {
            newCounts.scrollUp = (newCounts.scrollUp || 0) + 1;
          }
        }
        
        return newCounts;
      });

      // Set last event info with more specific details
      let eventInfo;
      if (eventType === 'typing') {
        eventInfo = `Key: ${eventData.currentKey}`;
      } else if (eventType === 'mouseClick') {
        const buttonNames = ['Left', 'Middle', 'Right'];
        const buttonName = buttonNames[eventData.button] || 'Unknown';
        eventInfo = `${buttonName} Click at (${Math.round(eventData.clientX)}, ${Math.round(eventData.clientY)})`;
      } else if (eventType === 'mouseMove') {
        eventInfo = `Move: (${Math.round(eventData.movementX)}, ${Math.round(eventData.movementY)})`;
      } else if (eventType === 'scroll') {
        const direction = eventData.deltaY > 0 ? 'Down' : 'Up';
        eventInfo = `Scroll ${direction}: ${Math.abs(Math.round(eventData.deltaY))}`;
      }
      setLastEventInfo(eventInfo);

      if (previousEvent.current && previousTimestamp.current) {
        const interval = currentTimestamp - previousTimestamp.current;
        
        if (isTraining) {
          // Store training data with specific event type
          addEvent(specificEventType, eventData, interval);
        } else if (modelTrained) {
          // Calculate anomaly score
          const score = await calculateAnomalyScore(specificEventType, eventData, interval);
          if (score !== null) {
            setAnomalyScore(score.toFixed(2));
          }
        }
      }

      previousEvent.current = { 
        type: specificEventType,
        ...eventData 
      };
      previousTimestamp.current = currentTimestamp;
    } catch (error) {
      console.error("Error processing event:", error);
    }
  };
  
  const handleKeyDown = (e) => {
    processEvent('typing', {
      previousKey: previousEvent.current?.currentKey || '',
      currentKey: e.key
    });
  };

  const handleMouseDown = (e) => {
    console.log(`Mouse button pressed: ${e.button} (0=left, 1=middle, 2=right)`);
    processEvent('mouseClick', {
      button: e.button,
      clientX: e.clientX,
      clientY: e.clientY
    });
  };
  
  const handleMouseMove = (e) => {
    // Throttle mouse move events to avoid too many events
    const now = Date.now();
    if (now - throttleRef.current.move < 100) return; // 100ms throttle
    throttleRef.current.move = now;
    
    processEvent('mouseMove', {
      movementX: e.movementX,
      movementY: e.movementY,
      clientX: e.clientX,
      clientY: e.clientY
    });
  };
  
  const handleScroll = (e) => {
    // Throttle scroll events
    const now = Date.now();
    if (now - throttleRef.current.scroll < 100) return; // 100ms throttle
    throttleRef.current.scroll = now;
    
    processEvent('scroll', {
      deltaY: e.deltaY,
      clientX: e.clientX || window.innerWidth / 2, // Might not have coordinates
      clientY: e.clientY || window.innerHeight / 2
    });
  };

  // Handle context menu (right click)
  const handleContextMenu = (e) => {
    // Prevent default context menu to properly capture right clicks
    e.preventDefault();
  };

  // Setup and cleanup event listeners
  useEffect(() => {
    const container = containerRef.current;
    
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('wheel', handleScroll);
      container.addEventListener('contextmenu', handleContextMenu);
      
      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('wheel', handleScroll);
        container.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [containerRef.current]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const handleResetModel = () => {
    resetModel();
    clearInputData();
    setInputValue('');
    setTimer(trainingTime);
    setLastEventInfo('');
    setEventCount({ typing: 0, click: 0, move: 0, scroll: 0 });
    throttleRef.current = { move: 0, scroll: 0 };
  };

  return (
    <div className="typing-detector-container" ref={containerRef}>
      <div className='typing-detector'>
      <h1>User Input Behavior Anomaly Detector</h1>
      
      <div className="status-section">
        {isTraining ? (
          <TrainingStatus 
            timer={timer} 
            sampleCount={inputData.length} 
            lastEventInfo={lastEventInfo} 
            eventCount={eventCount}
          />
        ) : (
          <PredictionStatus lastEventInfo={lastEventInfo} eventCount={eventCount} />
        )}
      </div>

      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type here, click, move mouse, or scroll..."
          className="typing-input"
          autoFocus
        />
      </div>

      {anomalyScore !== null && !isTraining && (
        <ScoreSection anomalyScore={anomalyScore} />
      )}

      <div className="controls-section">
        <button onClick={handleResetModel} className="reset-button">
          Delete Model & Restart
        </button>
      </div>

      <InfoSection trainingTime={trainingTime} />
      </div>
    </div>
  );
};

export default TypingBehaviorDetector; 