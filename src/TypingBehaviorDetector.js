import React, { useState, useEffect, useRef } from 'react';
import './TypingBehaviorDetector.css';
import { useTypingModel } from './hooks/useTypingModel';
import { useTypingData } from './hooks/useTypingData';
import { TrainingStatus } from './components/TrainingStatus';
import { PredictionStatus } from './components/PredictionStatus';
import { InfoSection } from './components/InfoSection';
import { ScoreSection } from './components/ScoreSection';
import { ConfigPanel } from './components/ConfigPanel';

const TypingBehaviorDetector = () => {
  const [inputValue, setInputValue] = useState('');
  const [trainingConfig, setTrainingConfig] = useState({
    trainingPeriod: 60, // Default 60 seconds (1 minute)
    minSamples: 200,    // Minimum samples before training completes
    sensitivity: 'medium', // Detection sensitivity (low, medium, high)
    featureImportance: { // Weights for different event types
      typing: 1.0,
      mouseMove: 0.7,
      mouseClick: 0.8, 
      scroll: 0.6
    }
  });
  
  const [timer, setTimer] = useState(trainingConfig.trainingPeriod);
  const [lastEventInfo, setLastEventInfo] = useState('');
  const [eventCount, setEventCount] = useState({ typing: 0, click: 0, move: 0, scroll: 0 });
  const [showConfig, setShowConfig] = useState(false);
  const [userStatus, setUserStatus] = useState('original'); // 'original', 'unknown', 'different'
  const [anomalyHistory, setAnomalyHistory] = useState([]);
  
  const containerRef = useRef(null);
  const throttleRef = useRef({ move: 0, scroll: 0 });
  const sessionId = useRef(Date.now().toString(36) + Math.random().toString(36).substring(2));
  
  const {
    isTraining,
    setIsTraining,
    modelTrained,
    setModelTrained,
    anomalyScore,
    setAnomalyScore,
    trainingProgress,
    trainingStatus,
    trainModel,
    calculateAnomalyScore,
    resetModel,
    loadModel,
    pauseTraining,
    resumeTraining
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
      if (inputData.length >= trainingConfig.minSamples) {
        trainModel(inputData, {
          minSamples: trainingConfig.minSamples,
          epochs: 150,
          batchSize: 32
        });
      } else {
        // Not enough data yet, extend the timer
        setTimer(30); // Add 30 more seconds
      }
    }
  }, [timer, isTraining, inputData, trainModel, trainingConfig]);

  // Load model on component mount
  useEffect(() => {
    loadModel();
  }, [loadModel]);
  
  // Track anomaly history
  useEffect(() => {
    if (anomalyScore !== null && modelTrained) {
      // Add to rolling history (last 20 events)
      setAnomalyHistory(prev => {
        const newHistory = [...prev, parseFloat(anomalyScore)];
        if (newHistory.length > 20) {
          return newHistory.slice(-20);
        }
        return newHistory;
      });
    }
  }, [anomalyScore, modelTrained]);
  
  // Determine user status based on anomaly history
  useEffect(() => {
    if (anomalyHistory.length >= 10 && modelTrained) {
      // Calculate average recent anomaly score
      const recentAvg = anomalyHistory.slice(-10).reduce((sum, score) => sum + score, 0) / 10;
      
      // Determine user status based on average score and sensitivity
      const thresholds = {
        low: { unknown: 35, different: 55 },
        medium: { unknown: 30, different: 45 },
        high: { unknown: 25, different: 40 }
      };
      
      const { unknown, different } = thresholds[trainingConfig.sensitivity] || thresholds.medium;
      
      if (recentAvg < unknown) {
        setUserStatus('original');
      } else if (recentAvg < different) {
        setUserStatus('unknown');
      } else {
        setUserStatus('different');
      }
    }
  }, [anomalyHistory, modelTrained, trainingConfig.sensitivity]);
  
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
        
        // Add timestamp to event data
        eventData.timestamp = currentTimestamp;
        
        if (isTraining) {
          // Store training data with specific event type
          addEvent(specificEventType, eventData, interval);
        } else if (modelTrained) {
          // Calculate anomaly score with sensitivity setting
          const score = await calculateAnomalyScore(
            specificEventType, 
            eventData, 
            interval,
            trainingConfig.sensitivity
          );
          
          if (score !== null) {
            // Apply feature importance weighting
            let weightedScore = score;
            if (eventType === 'typing' && trainingConfig.featureImportance.typing !== 1.0) {
              weightedScore *= trainingConfig.featureImportance.typing;
            } else if (eventType === 'mouseMove' && trainingConfig.featureImportance.mouseMove !== 1.0) {
              weightedScore *= trainingConfig.featureImportance.mouseMove;
            } else if (eventType === 'mouseClick' && trainingConfig.featureImportance.mouseClick !== 1.0) {
              weightedScore *= trainingConfig.featureImportance.mouseClick;
            } else if (eventType === 'scroll' && trainingConfig.featureImportance.scroll !== 1.0) {
              weightedScore *= trainingConfig.featureImportance.scroll;
            }
            
            setAnomalyScore(weightedScore.toFixed(2));
          }
        }
      }

      previousEvent.current = { 
        type: specificEventType,
        timestamp: currentTimestamp,
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
  
  const handleConfigChange = (newConfig) => {
    setTrainingConfig(prev => ({
      ...prev,
      ...newConfig
    }));
    
    // If training period changed and we're still training, update the timer
    if (isTraining && newConfig.trainingPeriod && newConfig.trainingPeriod !== trainingConfig.trainingPeriod) {
      setTimer(newConfig.trainingPeriod);
    }
  };
  
  const handleResetModel = () => {
    resetModel();
    clearInputData();
    setInputValue('');
    setTimer(trainingConfig.trainingPeriod);
    setLastEventInfo('');
    setEventCount({ typing: 0, click: 0, move: 0, scroll: 0 });
    setAnomalyHistory([]);
    setUserStatus('original');
    throttleRef.current = { move: 0, scroll: 0 };
    sessionId.current = Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  const handlePauseTraining = () => {
    pauseTraining();
  };
  
  const handleResumeTraining = () => {
    resumeTraining();
  };
  
  const toggleConfig = () => {
    setShowConfig(!showConfig);
  };

  return (
    <div className="typing-detector-container" ref={containerRef}>
      <div className='typing-detector'>
        <h1>User Behavior Anomaly Detector</h1>
        
        <div className="control-panel">
          <button 
            className="config-button" 
            onClick={toggleConfig}
          >
            {showConfig ? 'Hide Settings' : 'Show Settings'}
          </button>
          
          <button 
            className="reset-button" 
            onClick={handleResetModel}
          >
            Delete Model & Restart
          </button>
          
          {isTraining && inputData.length > 20 && (
            <button 
              className="pause-button" 
              onClick={handlePauseTraining}
            >
              Finish Training Now
            </button>
          )}
          
          {!isTraining && !modelTrained && (
            <button 
              className="resume-button" 
              onClick={handleResumeTraining}
            >
              Resume Training
            </button>
          )}
        </div>
        
        {showConfig && (
          <ConfigPanel 
            config={trainingConfig} 
            onConfigChange={handleConfigChange} 
            isTraining={isTraining}
          />
        )}
        
        <div className="status-section">
          {isTraining ? (
            <TrainingStatus 
              timer={timer} 
              sampleCount={inputData.length} 
              lastEventInfo={lastEventInfo} 
              eventCount={eventCount}
              minSamples={trainingConfig.minSamples}
              progress={trainingProgress}
              status={trainingStatus}
            />
          ) : (
            <PredictionStatus 
              lastEventInfo={lastEventInfo} 
              eventCount={eventCount} 
              userStatus={userStatus}
            />
          )}
        </div>
        
        <div className="input-section">
          <h3>Interact Anywhere or Type Below:</h3>
          <textarea
            className="input-field"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isTraining 
              ? `Continue typing naturally for ${timer} more seconds to train the model...` 
              : "Type here to test the model's anomaly detection..."}
          />
        </div>
        
        {modelTrained && (
          <ScoreSection 
            anomalyScore={anomalyScore} 
            anomalyHistory={anomalyHistory}
            userStatus={userStatus}
          />
        )}
        
        <InfoSection 
          isTraining={isTraining} 
          modelTrained={modelTrained} 
          trainingConfig={trainingConfig}
          sessionId={sessionId.current}
        />
      </div>
    </div>
  );
};

export default TypingBehaviorDetector; 