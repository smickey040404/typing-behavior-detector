// Feature extraction function for keystroke data
export const extractFeatures = (data) => {
  const features = [];
  
  data.forEach(item => {
    // Map all characters to a numerical value
    let prevKeyCode, currKeyCode;
    
    // Handle different key types
    const getKeyCode = (key) => {
      if (key.length === 1) {
        // Single character - use char code
        return key.charCodeAt(0) / 255; // Normalize to 0-1 range
      } else {
        // Special keys mapping
        const specialKeys = {
          'Enter': 0.9,
          'Backspace': 0.91,
          'Space': 0.92,
          ' ': 0.92,
          'Tab': 0.93,
          'Shift': 0.94,
          'Control': 0.95,
          'Alt': 0.96,
          'Meta': 0.97,
          'CapsLock': 0.98,
          'Escape': 0.99,
          'ArrowLeft': 0.85,
          'ArrowRight': 0.86,
          'ArrowUp': 0.87,
          'ArrowDown': 0.88,
          'Delete': 0.89
        };
        return specialKeys[key] || 0.84; // Default for unknown special keys
      }
    };
    
    prevKeyCode = getKeyCode(item.previousKey);
    currKeyCode = getKeyCode(item.currentKey);
    
    // Normalize interval (log scale for better distribution)
    const normalizedInterval = Math.log(item.interval + 1) / 10;
    
    features.push([
      prevKeyCode,
      currKeyCode,
      normalizedInterval
    ]);
  });
  
  return features;
}; 