import React, { useState } from 'react';

export const ConfigPanel = ({ config, onConfigChange, isTraining }) => {
  const [localConfig, setLocalConfig] = useState(config);
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    if (type === 'number') {
      setLocalConfig(prev => ({
        ...prev,
        [name]: parseInt(value, 10)
      }));
    } else if (type === 'select-one') {
      setLocalConfig(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (type === 'range') {
      // For sliders (feature importance)
      const nameParts = name.split('.');
      if (nameParts.length === 2 && nameParts[0] === 'featureImportance') {
        const featureType = nameParts[1];
        setLocalConfig(prev => ({
          ...prev,
          featureImportance: {
            ...prev.featureImportance,
            [featureType]: parseFloat(value)
          }
        }));
      }
    }
  };
  
  const handleApply = () => {
    onConfigChange(localConfig);
  };
  
  const presetConfigurations = [
    { 
      name: "Quick Demo (1 min)", 
      config: { 
        trainingPeriod: 60, 
        minSamples: 100, 
        sensitivity: "medium" 
      } 
    },
    { 
      name: "Standard (5 min)", 
      config: { 
        trainingPeriod: 300, 
        minSamples: 300, 
        sensitivity: "medium" 
      } 
    },
    { 
      name: "Thorough (10 min)", 
      config: { 
        trainingPeriod: 600, 
        minSamples: 500, 
        sensitivity: "medium" 
      } 
    },
    { 
      name: "High Security (15 min)", 
      config: { 
        trainingPeriod: 900, 
        minSamples: 800, 
        sensitivity: "high" 
      } 
    }
  ];
  
  const applyPreset = (preset) => {
    const newConfig = {
      ...localConfig,
      ...preset.config
    };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };
  
  return (
    <div className="config-panel">
      <h3>Training Configuration</h3>
      
      <div className="config-presets">
        <h4>Quick Presets:</h4>
        <div className="preset-buttons">
          {presetConfigurations.map(preset => (
            <button 
              key={preset.name} 
              onClick={() => applyPreset(preset)}
              disabled={isTraining}
              className="preset-button"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="config-form">
        <div className="config-group">
          <label htmlFor="trainingPeriod">
            Training Period (seconds):
            <span className="config-value">{localConfig.trainingPeriod}</span>
          </label>
          <input 
            type="number" 
            id="trainingPeriod"
            name="trainingPeriod"
            min="30"
            max="3600"
            value={localConfig.trainingPeriod}
            onChange={handleChange}
            disabled={isTraining}
          />
          <div className="time-presets">
            <button 
              onClick={() => setLocalConfig(prev => ({ ...prev, trainingPeriod: 60 }))}
              disabled={isTraining}
              className="time-preset-button"
            >
              1m
            </button>
            <button 
              onClick={() => setLocalConfig(prev => ({ ...prev, trainingPeriod: 300 }))}
              disabled={isTraining}
              className="time-preset-button"
            >
              5m
            </button>
            <button 
              onClick={() => setLocalConfig(prev => ({ ...prev, trainingPeriod: 600 }))}
              disabled={isTraining}
              className="time-preset-button"
            >
              10m
            </button>
            <button 
              onClick={() => setLocalConfig(prev => ({ ...prev, trainingPeriod: 1800 }))}
              disabled={isTraining}
              className="time-preset-button"
            >
              30m
            </button>
            <button 
              onClick={() => setLocalConfig(prev => ({ ...prev, trainingPeriod: 3600 }))}
              disabled={isTraining}
              className="time-preset-button"
            >
              1h
            </button>
          </div>
        </div>
        
        <div className="config-group">
          <label htmlFor="minSamples">
            Minimum Samples:
            <span className="config-value">{localConfig.minSamples}</span>
          </label>
          <input 
            type="number" 
            id="minSamples"
            name="minSamples"
            min="50"
            max="2000"
            value={localConfig.minSamples}
            onChange={handleChange}
            disabled={isTraining}
          />
        </div>
        
        <div className="config-group">
          <label htmlFor="sensitivity">
            Detection Sensitivity:
            <span className="config-value">{localConfig.sensitivity}</span>
          </label>
          <select
            id="sensitivity"
            name="sensitivity"
            value={localConfig.sensitivity}
            onChange={handleChange}
          >
            <option value="low">Low (fewer alerts, more tolerant)</option>
            <option value="medium">Medium (balanced)</option>
            <option value="high">High (more alerts, less tolerant)</option>
          </select>
        </div>
        
        <div className="feature-importance-section">
          <h4>Feature Importance:</h4>
          
          <div className="slider-group">
            <label htmlFor="featureImportance.typing">
              Typing: 
              <span className="config-value">{localConfig.featureImportance.typing.toFixed(1)}</span>
            </label>
            <input 
              type="range" 
              id="featureImportance.typing"
              name="featureImportance.typing"
              min="0.1"
              max="2.0"
              step="0.1"
              value={localConfig.featureImportance.typing}
              onChange={handleChange}
            />
          </div>
          
          <div className="slider-group">
            <label htmlFor="featureImportance.mouseMove">
              Mouse Movement: 
              <span className="config-value">{localConfig.featureImportance.mouseMove.toFixed(1)}</span>
            </label>
            <input 
              type="range" 
              id="featureImportance.mouseMove"
              name="featureImportance.mouseMove"
              min="0.1"
              max="2.0"
              step="0.1"
              value={localConfig.featureImportance.mouseMove}
              onChange={handleChange}
            />
          </div>
          
          <div className="slider-group">
            <label htmlFor="featureImportance.mouseClick">
              Mouse Clicks: 
              <span className="config-value">{localConfig.featureImportance.mouseClick.toFixed(1)}</span>
            </label>
            <input 
              type="range" 
              id="featureImportance.mouseClick"
              name="featureImportance.mouseClick"
              min="0.1"
              max="2.0"
              step="0.1"
              value={localConfig.featureImportance.mouseClick}
              onChange={handleChange}
            />
          </div>
          
          <div className="slider-group">
            <label htmlFor="featureImportance.scroll">
              Scrolling: 
              <span className="config-value">{localConfig.featureImportance.scroll.toFixed(1)}</span>
            </label>
            <input 
              type="range" 
              id="featureImportance.scroll"
              name="featureImportance.scroll"
              min="0.1"
              max="2.0"
              step="0.1"
              value={localConfig.featureImportance.scroll}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
      
      <div className="config-actions">
        <button 
          className="apply-button"
          onClick={handleApply}
          disabled={isTraining}
        >
          Apply Configuration
        </button>
      </div>
    </div>
  );
}; 