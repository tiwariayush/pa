# Personal Assistant Mobile App

React Native mobile application for the Personal Assistant system. Built with Expo for cross-platform iOS and Android support.

## Features

### Core Functionality
- **Voice Capture**: Natural language task input with real-time transcription
- **Smart Recommendations**: "What should I do now?" contextual suggestions
- **Task Management**: Domain-organized tasks with priority scoring
- **Calendar Integration**: Task scheduling and calendar synchronization
- **AI Assistant**: Chat interface for planning and research

### User Experience
- **5-Tab Navigation**: Home, Inbox, Tasks, Calendar, Assistant
- **Context-Aware Interface**: Time, location, and energy-based suggestions  
- **Beautiful Design**: Modern UI with Material Design 3 components
- **Offline Support**: Local state management with sync capabilities
- **Cross-Platform**: Single codebase for iOS and Android

## Architecture

```
React Native App (Expo)
├── Navigation (React Navigation)
│   ├── Auth Stack (Login/Register)
│   └── Main Tabs (Home/Inbox/Tasks/Calendar/Assistant)
├── State Management (Zustand)
│   ├── Auth Store (User authentication)
│   └── Task Store (Task operations)
├── Services
│   ├── API Service (Backend communication)
│   ├── Voice Service (STT/Recording)
│   └── Storage Service (Local persistence)
└── UI Components
    ├── Task Items
    ├── Voice Recorder
    └── Recommendation Cards
```

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Mac) or Android Studio
- Personal Assistant Backend running

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure API endpoint:**
   ```typescript
   // src/services/api.ts
   this.baseURL = __DEV__ 
     ? 'http://YOUR_LOCAL_IP:8000'  // Replace with your IP
     : 'https://your-production-api.com';
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator  
   npm run android
   
   # Web (for testing)
   npm run web
   ```

## Project Structure

```
mobile/
├── App.tsx                 # Root component
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── src/
    ├── components/        # Reusable UI components
    ├── navigation/        # Navigation setup
    ├── screens/          # Screen components
    │   ├── auth/         # Login/Register
    │   ├── home/         # Main dashboard
    │   ├── inbox/        # Captured items
    │   ├── tasks/        # Task management
    │   ├── calendar/     # Calendar view
    │   ├── assistant/    # AI chat
    │   └── capture/      # Voice capture
    ├── services/         # API and external services
    ├── stores/           # State management
    ├── types/            # TypeScript definitions
    ├── theme/            # Design system
    └── utils/            # Helper functions
```

## Key Screens

### Home Screen - "What should I do now?"

The main dashboard that provides contextual recommendations:

```typescript
// Features:
- Time/location/energy context display
- Top 3 AI-recommended tasks
- Today's overview with stats
- Quick action buttons
- Voice capture FAB
```

**Key Components:**
- Context header with time/location chips
- Recommendation cards with confidence scores
- Statistics overview (overdue, due today, in progress)
- Urgent task alerts

### Voice Capture Screen

Immersive voice recording interface:

```typescript
// Features:
- Animated recording indicator
- Real-time duration tracking
- Visual feedback with pulse animations
- Manual text input fallback
- Processing state with AI feedback
```

**User Flow:**
1. Tap and hold to record
2. Speak naturally about tasks
3. AI processes and structures input
4. Review parsed tasks
5. Confirm and add to system

### Task Management

Comprehensive task organization:

```typescript
// Features:
- Domain filtering (Family, Home, Job, Company, Personal)
- Status-based views (Today, This Week, Later)
- Priority indicators and sorting
- Quick status updates
- Calendar integration
```

## State Management

### Auth Store (Zustand)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Task Store (Zustand)

```typescript
interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  filters: TaskFilters;
  fetchTasks: () => Promise<void>;
  processVoiceCapture: (request: VoiceCaptureRequest) => Promise<VoiceCaptureResponse>;
  getWhatNowRecommendations: (request: WhatNowRequest) => Promise<WhatNowResponse>;
}
```

## API Integration

### Voice Capture Flow

```typescript
// 1. Record audio
const audioData = await recordVoice();

// 2. Send to backend
const result = await apiService.processVoiceCapture({
  audioData: base64Audio,
  location: 'home',
  context: { energyLevel: 'high' }
});

// 3. Review parsed tasks
navigation.navigate('CaptureReview', { captureResult: result });
```

### Task Operations

```typescript
// Create task
const newTask = await apiService.createTask({
  title: 'Book baby vaccines',
  domain: TaskDomain.FAMILY,
  priority: Priority.HIGH,
  requiresCalendarBlock: true
});

// Get recommendations
const recommendations = await apiService.getWhatNowRecommendations({
  currentTime: new Date().toISOString(),
  availableDurationMin: 45,
  energyLevel: 'high',
  location: 'home'
});
```

## Design System

### Theme Configuration

```typescript
export const theme = {
  colors: {
    primary: '#6366F1',    // Indigo
    secondary: '#EC4899',  // Pink
    domains: {
      family: '#EC4899',   // Pink
      home: '#F59E0B',     // Amber
      job: '#3B82F6',      // Blue
      company: '#8B5CF6',  // Purple
      personal: '#10B981', // Emerald
    },
    priorities: {
      critical: '#DC2626', // Red
      high: '#EA580C',     // Orange
      medium: '#CA8A04',   // Yellow
      low: '#059669',      // Green
      someday: '#6B7280',  // Gray
    }
  }
};
```

### Typography & Spacing

```typescript
export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
};

export const typography = {
  sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
  weights: { regular: '400', medium: '500', bold: '700' }
};
```

## Voice Recording

### Audio Configuration

```typescript
// High-quality recording setup
const recordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};
```

### Permissions

```json
// app.json
{
  "permissions": [
    "RECORD_AUDIO",
    "CAMERA",
    "CALENDAR", 
    "NOTIFICATIONS"
  ]
}
```

## Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (if configured)
npm run test:e2e
```

### Code Quality

```bash
# TypeScript checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Debugging

```bash
# Enable remote debugging
npm start -- --dev-client

# View logs
npx expo logs

# Clear cache
npx expo r -c
```

## Building for Production

### iOS

```bash
# Build for App Store
expo build:ios --type archive

# Or with EAS Build
eas build --platform ios
```

### Android

```bash
# Build APK
expo build:android --type apk

# Build AAB for Play Store
expo build:android --type app-bundle

# Or with EAS Build
eas build --platform android
```

### Configuration

```json
// app.json production config
{
  "expo": {
    "name": "Personal Assistant",
    "slug": "personal-assistant",
    "version": "1.0.0",
    "privacy": "public",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.personalassistant.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.personalassistant.app",
      "versionCode": 1
    }
  }
}
```

## Performance Optimization

### State Management
- Use Zustand selectors to prevent unnecessary re-renders
- Implement proper memoization for expensive computations
- Lazy load screens and components

### API Calls
- Implement request caching
- Use optimistic updates for better UX
- Add retry logic for failed requests

### Memory Management
- Properly dispose of audio recordings
- Clear large objects from memory
- Use FlatList for large task lists

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo r -c
   ```

2. **iOS Simulator audio issues**
   - Ensure simulator audio is enabled
   - Test on physical device for voice features

3. **Android permissions**
   - Check app permissions in device settings
   - Request permissions at runtime

4. **API connection issues**
   - Verify backend is running
   - Check network configuration
   - Use correct IP address for device testing

### Performance Issues

- **Slow startup**: Optimize bundle size, use code splitting
- **Memory leaks**: Properly cleanup listeners and subscriptions
- **Laggy animations**: Use native driver, reduce JS thread work

## Deployment

### App Store Guidelines
- Follow iOS Human Interface Guidelines
- Ensure accessibility compliance
- Test on various device sizes
- Provide privacy policy

### Play Store Requirements
- Target latest Android API level
- Provide app screenshots and descriptions
- Test on different Android versions
- Handle runtime permissions properly

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-screen`
3. Follow coding standards and design system
4. Test on both iOS and Android
5. Submit pull request with screenshots

## License

This project is licensed under the MIT License.
