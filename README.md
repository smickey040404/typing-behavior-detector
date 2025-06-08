# User Behavior Anomaly Detector

A React.js application that uses TensorFlow.js to detect anomalies in user typing and interaction patterns through advanced machine learning techniques.

## Key Features

- **Configurable Training Period**: Train from 1 minute to several hours depending on security needs
- **Comprehensive Behavioral Analysis**: Captures typing patterns, mouse movements, click behaviors, and scrolling styles
- **Deep Neural Network**: Uses an advanced autoencoder neural network for high-accuracy anomaly detection
- **Multi-dimensional Feature Engineering**: Extracts 12 features per event for detailed behavioral profiling
- **Real-time Detection**: Continuously monitors all input patterns for anomalies after training
- **Model Persistence**: Saves trained models to browser IndexedDB for persistence between sessions
- **Visual Analytics**: Real-time anomaly score display with history visualization
- **User Identity Verification**: Determines if current user matches the trained profile
- **Adaptive Sensitivity**: Configurable thresholds for different security requirements
- **Feature Importance Weighting**: Adjustable weights for different types of behavioral inputs

## How It Works

### Training Phase
1. When the user starts interacting with the application, the system begins collecting behavioral data
2. The configurable training phase collects a minimum number of samples (default: 200)
3. The system captures multiple behavioral features:
   - Keystroke dynamics (timing, patterns, transitions)
   - Mouse movement trajectories (velocity, acceleration, smoothness)
   - Click behavior (position, frequency, patterns)
   - Scrolling style (speed, consistency, reading patterns)
   - Contextual sequence patterns between different event types
4. After sufficient data collection, the system trains a deep autoencoder neural network

### Detection Phase
1. The autoencoder learns to reconstruct normal interaction patterns for the current user
2. During detection, it measures reconstruction errors to identify anomalies
3. Higher reconstruction errors indicate unusual behavior patterns
4. The system computes anomaly scores on a 0-100 scale
5. Visual indicators and history tracking show behavioral pattern changes
6. User identity classification provides feedback on whether the current user matches the trained profile

## Technical Architecture

### Frontend
- **React.js**: Component-based UI framework
- **TensorFlow.js**: In-browser machine learning
- **IndexedDB**: Model persistence with larger storage capacity

### Machine Learning Model
- **Type**: Deep autoencoder neural network with regularization
- **Architecture**: 
  - Encoder: Input → Dense(32) → Dropout(0.2) → Dense(24) → Dense(16) → Latent Space(8)
  - Decoder: Latent Space(8) → Dense(16) → Dense(24) → Dense(32) → Output
- **Training**: Early stopping, validation split, and adaptive learning rate
- **Loss Function**: Mean Squared Error
- **Optimizer**: Adam (learning rate: 0.0005)

### Feature Engineering
- **Context-aware Features**: Analyzes patterns across multiple events
- **Behavioral Metrics**: Captures velocity, acceleration, typing rhythm, etc.
- **Time-based Analysis**: Considers timing between events and event sequences
- **Normalization**: Z-score normalization with advanced thresholding
- **Feature Vector**: 12-dimensional feature vectors per input event

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
2. Select a training configuration (or use the default)
3. Start interacting with the system naturally (typing, moving mouse, clicking, scrolling)
4. Continue normal usage during the training period
5. After training completes, the model automatically begins anomaly detection
6. View your anomaly score and history in real-time
7. Have someone else use the system to see how it detects different users

## Configuration Options

- **Training Period**: Set the amount of time for collecting training data (60s to several hours)
- **Minimum Samples**: Set the minimum number of events required before training completes
- **Detection Sensitivity**: Choose between Low, Medium, and High sensitivity levels
- **Feature Importance**: Adjust the weights for different types of input behaviors

## Performance Considerations

- **Training Time**: Longer training periods result in higher accuracy
- **Sample Diversity**: Including a variety of behaviors during training improves detection
- **Processing Overhead**: Model training occurs in a non-blocking manner
- **Storage Usage**: Models are stored in IndexedDB with efficient compression

## Dependencies

- React.js (v19+)
- TensorFlow.js (v4+)
- Standard React development dependencies

## Future Enhancements

- Continuous learning mode for long-term adaptation
- Cross-device profile synchronization
- Keyboard dynamics cryptographic authentication
- Role-based access control integration
- Behavioral biometric multi-factor authentication
