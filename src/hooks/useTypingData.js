import { useRef } from 'react';

export const useTypingData = () => {
  const keystrokeData = useRef([]);
  const previousKey = useRef(null);
  const previousTimestamp = useRef(null);
  
  const addKeystroke = (prevKey, currentKey, interval) => {
    keystrokeData.current.push({
      previousKey: prevKey,
      currentKey: currentKey,
      interval: interval
    });
  };
  
  const clearKeystrokeData = () => {
    keystrokeData.current = [];
    previousKey.current = null;
    previousTimestamp.current = null;
  };
  
  return {
    keystrokeData: keystrokeData.current,
    addKeystroke,
    clearKeystrokeData,
    previousKey,
    previousTimestamp
  };
}; 