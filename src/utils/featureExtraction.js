// Feature extraction function for input behavior data
export const extractFeatures = (data) => {
  const features = [];
  const MAX_FEATURES = 6; // Maximum number of features across all event types
  
  data.forEach(item => {
    // Common features for all event types
    // Normalized interval (log scale for better distribution)
    const normalizedInterval = Math.log(item.interval + 1) / 10;
    
    let eventFeatures = [];
    
    if (item.eventType === 'typing') {
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
      
      eventFeatures = [
        0.1, // Identifier for typing event
        prevKeyCode,
        currKeyCode,
        normalizedInterval,
        0, // Padding
        0  // Padding
      ];
    } 
    else if (item.eventType === 'mouseClick' || 
             item.eventType === 'leftClick' || 
             item.eventType === 'middleClick' || 
             item.eventType === 'rightClick') {
      // Get button code (0 = left, 0.5 = middle, 1 = right)
      let buttonCode;
      if (item.eventType === 'leftClick') {
        buttonCode = 0;
      } else if (item.eventType === 'middleClick') {
        buttonCode = 0.5;
      } else if (item.eventType === 'rightClick') {
        buttonCode = 1;
      } else {
        // Using the standard button property (0=left, 1=middle, 2=right)
        buttonCode = item.button / 2; // Normalize to 0-1 range
        console.log(`Processing click with button=${item.button}, buttonCode=${buttonCode}`);
      }
      
      eventFeatures = [
        0.2, // Identifier for mouse click
        buttonCode,
        item.clientX / window.innerWidth, // Normalized X position
        item.clientY / window.innerHeight, // Normalized Y position
        normalizedInterval,
        0  // Padding
      ];
    }
    else if (item.eventType === 'mouseMove') {
      eventFeatures = [
        0.3, // Identifier for mouse movement
        item.movementX / 100, // Normalized movement X (capped)
        item.movementY / 100, // Normalized movement Y (capped)
        item.clientX / window.innerWidth, // Normalized X position
        item.clientY / window.innerHeight, // Normalized Y position
        normalizedInterval
      ];
    }
    else if (item.eventType === 'scroll' || 
             item.eventType === 'scrollUp' || 
             item.eventType === 'scrollDown') {
      // Set scroll direction identifier
      const scrollDirectionCode = item.eventType === 'scrollUp' ? 0 : 
                                 item.eventType === 'scrollDown' ? 1 : 
                                 (item.deltaY > 0 ? 1 : 0);
      
      // Get absolute delta value
      const absDelta = Math.abs(item.deltaY);
      
      eventFeatures = [
        0.4, // Identifier for scroll
        scrollDirectionCode, // 0 = up, 1 = down
        absDelta / 100, // Normalized scroll amount (absolute value)
        item.clientX / window.innerWidth, // Normalized X position
        item.clientY / window.innerHeight, // Normalized Y position
        normalizedInterval
      ];
    }
    
    // Ensure all feature vectors have the same length
    if (eventFeatures.length > 0) {
      // Pad or truncate to MAX_FEATURES
      while (eventFeatures.length < MAX_FEATURES) {
        eventFeatures.push(0); // Pad with zeros
      }
      if (eventFeatures.length > MAX_FEATURES) {
        eventFeatures = eventFeatures.slice(0, MAX_FEATURES);
      }
      
      features.push(eventFeatures);
    }
  });
  
  return features;
}; 