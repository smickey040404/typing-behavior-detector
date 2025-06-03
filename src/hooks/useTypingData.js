import { useRef } from 'react';

export const useTypingData = () => {
  const inputData = useRef([]);
  const previousEvent = useRef(null);
  const previousTimestamp = useRef(null);
  
  const addEvent = (eventType, eventData, interval) => {
    inputData.current.push({
      eventType,
      ...eventData,
      interval
    });
  };
  
  const clearInputData = () => {
    inputData.current = [];
    previousEvent.current = null;
    previousTimestamp.current = null;
  };
  
  return {
    inputData: inputData.current,
    addEvent,
    clearInputData,
    previousEvent,
    previousTimestamp
  };
}; 