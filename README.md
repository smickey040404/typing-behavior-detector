# Typing Behavior Anomaly Detector

A React.js application that uses TensorFlow.js to detect anomalies in user typing patterns through unsupervised machine learning.

## Features

- **Automatic Training**: Model training begins immediately when a user starts typing
- **Unsupervised Learning**: Uses an autoencoder neural network for anomaly detection
- **Real-time Detection**: After training, continuously monitors typing patterns for anomalies
- **Local Model Persistence**: Saves trained models to browser localStorage
- **No Manual Controls**: Fully automated training and prediction process
- **Visual Feedback**: Real-time anomaly score display with visual indicators
- **Full Character Support**: Tracks ALL keyboard inputs including letters, numbers, symbols, and special keys

## How It Works

### Training Phase (30 seconds)
1. When a user opens the page and starts typing, the system automatically begins collecting keystroke data
2. The model captures three key features:
   - Previous key pressed (any character, number, symbol, or special key)
   - Current key pressed (any character, number, symbol, or special key)
   - Time interval between keystrokes
3. After 30 seconds of data collection, the system trains an autoencoder neural network

### Detection Phase
1. The autoencoder learns to reconstruct normal typing patterns
2. When detecting anomalies, it measures reconstruction error
3. High reconstruction errors indicate unusual typing patterns
4. Anomaly scores are displayed as percentages (0-100%)

## Technical Architecture

### Frontend
- **React.js**: Component-based UI framework
- **TensorFlow.js**: Browser-based machine learning
- **LocalStorage**: Model persistence

### Machine Learning Model
- **Type**: Autoencoder neural network
- **Architecture**: 
  - Encoder: 3 → 6 → 3 → 2 neurons
  - Decoder: 2 → 3 → 6 → 3 neurons
- **Loss Function**: Mean Squared Error
- **Optimizer**: Adam (learning rate: 0.001)

### Feature Engineering
- **Character Normalization**: Maps all characters to numerical values
  - Single characters: Normalized using their ASCII/Unicode values (0-255 range)
  - Special keys: Mapped to specific normalized values (Enter, Backspace, Arrows, etc.)
- **Interval Scaling**: Log transformation for better distribution
- **Data Normalization**: Z-score normalization using training statistics

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Open the application in your browser
2. Start typing in the input field
3. Continue typing normally for 30 seconds while the model trains
4. After training completes, the model will automatically detect anomalies
5. View your anomaly score in real-time as you type
6. Use "Delete Model & Restart" to reset and retrain

## Model Storage

The trained model and statistics are saved to browser localStorage:
- **Model**: `localstorage://typing-behavior-model`
- **Statistics**: `typing-behavior-stats` (threshold, normalization parameters)

## Dependencies

- React.js (v18+)
- TensorFlow.js (v4+)
- Standard React development dependencies

## Future Enhancements

- Additional features like typing speed, key hold duration
- Multi-user profile support
- Export/import trained models
- More sophisticated anomaly detection algorithms
- Visualization of typing patterns
