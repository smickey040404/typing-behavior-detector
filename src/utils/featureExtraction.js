// Feature extraction function for input behavior data
export const extractFeatures = (data) => {
  const features = [];
  const MAX_FEATURES = 12; // Expanded feature vector size
  
  // Prepare contextual features (patterns over time)
  let typingSpeed = [];
  let keyPressPatterns = {};
  let mouseMoveVelocity = [];
  let clickPositions = [];
  
  // First pass: collect statistics for contextual features
  data.forEach((item, index) => {
    if (index > 0) {
      const prevItem = data[index - 1];
      const interval = item.interval;
      
      // Track typing speed patterns
      if (item.eventType === 'typing') {
        typingSpeed.push(interval);
        
        // Track digraph patterns (common key combinations)
        if (prevItem.eventType === 'typing') {
          const digraph = `${prevItem.currentKey}_${item.currentKey}`;
          keyPressPatterns[digraph] = (keyPressPatterns[digraph] || 0) + 1;
        }
      }
      
      // Track mouse movement velocity
      if (item.eventType === 'mouseMove' && prevItem.eventType === 'mouseMove') {
        const dx = item.clientX - prevItem.clientX;
        const dy = item.clientY - prevItem.clientY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const velocity = distance / interval;
        mouseMoveVelocity.push(velocity);
      }
      
      // Track click positions
      if (item.eventType.includes('Click')) {
        clickPositions.push({
          x: item.clientX / window.innerWidth,
          y: item.clientY / window.innerHeight
        });
      }
    }
  });
  
  // Calculate statistics
  const getStats = (arr) => {
    if (arr.length === 0) return { mean: 0, std: 1 };
    const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return { mean, std: Math.sqrt(variance) };
  };
  
  const typingStats = getStats(typingSpeed);
  const velocityStats = getStats(mouseMoveVelocity);
  
  // Calculate click dispersion (how spread out clicks are)
  let clickDispersion = 0;
  if (clickPositions.length > 1) {
    const avgX = clickPositions.reduce((sum, pos) => sum + pos.x, 0) / clickPositions.length;
    const avgY = clickPositions.reduce((sum, pos) => sum + pos.y, 0) / clickPositions.length;
    
    const distances = clickPositions.map(pos => 
      Math.sqrt(Math.pow(pos.x - avgX, 2) + Math.pow(pos.y - avgY, 2))
    );
    clickDispersion = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  }
  
  // Second pass: extract enhanced features
  data.forEach((item, index) => {
    // Common features for all event types
    // Normalized interval (log scale for better distribution)
    const normalizedInterval = Math.log(item.interval + 1) / 10;
    
    // Time of day as a feature (circadian rhythm patterns)
    const timestamp = item.timestamp || Date.now();
    const date = new Date(timestamp);
    const hourOfDay = date.getHours() / 24; // 0-1 range
    
    // Contextual features
    let prevEventType = 0;
    let nextEventType = 0;
    
    if (index > 0) {
      const prevEventMapping = {
        'typing': 0.1,
        'leftClick': 0.2,
        'middleClick': 0.25,
        'rightClick': 0.3,
        'mouseMove': 0.4,
        'scrollUp': 0.5,
        'scrollDown': 0.6
      };
      prevEventType = prevEventMapping[data[index - 1].eventType] || 0;
    }
    
    if (index < data.length - 1) {
      const nextEventMapping = {
        'typing': 0.1,
        'leftClick': 0.2,
        'middleClick': 0.25,
        'rightClick': 0.3,
        'mouseMove': 0.4,
        'scrollUp': 0.5,
        'scrollDown': 0.6
      };
      nextEventType = nextEventMapping[data[index + 1].eventType] || 0;
    }
    
    let eventFeatures = [];
    
    if (item.eventType === 'typing') {
      // Map all characters to a numerical value
      let prevKeyCode, currKeyCode;
      
      // Handle different key types
      const getKeyCode = (key) => {
        if (!key) return 0;
        
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
      
      // Detect common patterns (word endings, capital letters, etc.)
      let patternFeature = 0;
      if (item.currentKey === ' ' || item.currentKey === 'Enter' || item.currentKey === '.') {
        patternFeature = 0.8; // Word or sentence ending
      } else if (item.previousKey === 'Shift') {
        patternFeature = 0.9; // Capital letter
      } else if (item.currentKey === 'Backspace') {
        patternFeature = 0.7; // Correction
      }
      
      // Calculate typing rhythm feature - how consistent is this keypress with the user's pattern
      let typingRhythm = 0;
      if (typingSpeed.length > 5) {
        const normalizedSpeed = (normalizedInterval - typingStats.mean) / (typingStats.std || 1);
        typingRhythm = 1 / (1 + Math.exp(-normalizedSpeed)); // Sigmoid normalization to 0-1
      }
      
      // Repeated character detection
      const isRepeatedChar = item.previousKey === item.currentKey ? 1 : 0;
      
      eventFeatures = [
        0.1, // Identifier for typing event
        prevKeyCode,
        currKeyCode,
        normalizedInterval,
        patternFeature,
        typingRhythm,
        isRepeatedChar,
        prevEventType,
        nextEventType,
        hourOfDay,
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
      }
      
      // Enhanced position features
      const xPos = item.clientX / window.innerWidth;
      const yPos = item.clientY / window.innerHeight;
      
      // Distance from center
      const distFromCenter = Math.sqrt(
        Math.pow(xPos - 0.5, 2) + 
        Math.pow(yPos - 0.5, 2)
      );
      
      // Detect edge clicking behavior
      const isEdgeClick = (xPos < 0.1 || xPos > 0.9 || yPos < 0.1 || yPos > 0.9) ? 1 : 0;
      
      // Click consistency with pattern
      const clickConsistency = clickDispersion > 0 ? 
        Math.min(1, 1 / (clickDispersion * 10)) : 0.5;
      
      eventFeatures = [
        0.2, // Identifier for mouse click
        buttonCode,
        xPos, // Normalized X position
        yPos, // Normalized Y position
        normalizedInterval,
        distFromCenter,
        isEdgeClick,
        clickConsistency,
        prevEventType,
        nextEventType,
        hourOfDay,
        0  // Padding
      ];
    }
    else if (item.eventType === 'mouseMove') {
      // Calculate velocity and acceleration
      let velocity = 0;
      let acceleration = 0;
      
      if (index > 0 && data[index - 1].eventType === 'mouseMove') {
        const prevItem = data[index - 1];
        const dx = item.clientX - prevItem.clientX;
        const dy = item.clientY - prevItem.clientY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        velocity = distance / item.interval;
        
        // Normalize velocity based on statistics
        velocity = velocity / (velocityStats.mean * 3 || 1);
        velocity = Math.min(1, Math.max(0, velocity));
        
        if (index > 1 && data[index - 2].eventType === 'mouseMove') {
          const prevVelocity = mouseMoveVelocity[index - 2] || 0;
          acceleration = (velocity - prevVelocity) / item.interval;
          acceleration = Math.min(1, Math.max(-1, acceleration)) * 0.5 + 0.5; // Normalize to 0-1
        }
      }
      
      // Mouse trajectory smoothness
      let smoothness = 0.5;
      if (index > 2 && 
          data[index - 1].eventType === 'mouseMove' && 
          data[index - 2].eventType === 'mouseMove') {
        // Calculate angle changes in trajectory
        const p1 = { x: data[index - 2].clientX, y: data[index - 2].clientY };
        const p2 = { x: data[index - 1].clientX, y: data[index - 1].clientY };
        const p3 = { x: item.clientX, y: item.clientY };
        
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        
        const v1Mag = Math.sqrt(v1.x*v1.x + v1.y*v1.y);
        const v2Mag = Math.sqrt(v2.x*v2.x + v2.y*v2.y);
        
        if (v1Mag > 0 && v2Mag > 0) {
          const dotProduct = v1.x*v2.x + v1.y*v2.y;
          const cosAngle = dotProduct / (v1Mag * v2Mag);
          smoothness = (cosAngle + 1) / 2; // Convert from -1,1 to 0,1
        }
      }
      
      eventFeatures = [
        0.3, // Identifier for mouse movement
        item.movementX / 100, // Normalized movement X (capped)
        item.movementY / 100, // Normalized movement Y (capped)
        item.clientX / window.innerWidth, // Normalized X position
        item.clientY / window.innerHeight, // Normalized Y position
        normalizedInterval,
        velocity,
        acceleration,
        smoothness,
        prevEventType,
        nextEventType,
        hourOfDay
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
      
      // Normalize to a reasonable range (0-1)
      const normalizedDelta = Math.min(1, absDelta / 300);
      
      // Detect scroll pattern (smooth vs chunky scrolling)
      let scrollPattern = 0.5;
      if (index > 0 && 
          (data[index - 1].eventType === 'scrollUp' || 
           data[index - 1].eventType === 'scrollDown' ||
           data[index - 1].eventType === 'scroll')) {
        const prevDelta = Math.abs(data[index - 1].deltaY);
        const deltaDiff = Math.abs(absDelta - prevDelta);
        scrollPattern = 1 - Math.min(1, deltaDiff / 100);
      }
      
      // Reading pattern detection (slow, methodical scrolling vs fast skimming)
      let readingPattern = 0.5;
      if (normalizedInterval > 0.2 && normalizedDelta < 0.3) {
        readingPattern = 0.8; // Likely reading
      } else if (normalizedInterval < 0.1 && normalizedDelta > 0.7) {
        readingPattern = 0.2; // Likely skimming
      }
      
      eventFeatures = [
        0.4, // Identifier for scroll
        scrollDirectionCode, // 0 = up, 1 = down
        normalizedDelta, // Normalized scroll amount
        item.clientX / window.innerWidth, // Normalized X position
        item.clientY / window.innerHeight, // Normalized Y position
        normalizedInterval,
        scrollPattern,
        readingPattern,
        prevEventType,
        nextEventType,
        hourOfDay,
        0 // Padding
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