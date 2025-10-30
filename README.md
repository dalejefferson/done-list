# Done List - Expo React Native App

A minimal, calm task list app built with Expo and React Native. Features AI-powered task breakdown suggestions, subtasks, calendar integration, and a beautiful UI.

## Quick Start

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode (Mac only)
- For Android: Android Studio

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

3. Run on your device/emulator:
- **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
- **Android**: Press `a` in the terminal or scan QR code with Expo Go app
- **Web**: Press `w` in the terminal

### Backend Server

The app requires a backend server for AI features. Start it separately:

```bash
npm run server
```

The backend runs on `http://localhost:3001` by default.

**Important**: Update the `API_BASE` constant in `app/index.js`:
- iOS Simulator: `http://localhost:3001`
- Android Emulator: `http://10.0.2.2:3001`
- Physical Device: Use your computer's local IP address (e.g., `http://192.168.1.100:3001`)

### Environment Variables

Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

## Project Structure

- `app/` - Expo Router app directory
  - `_layout.js` - Root layout component
  - `index.js` - Main todo list screen
- `src/` - Source files
  - `services/backend-native.js` - AsyncStorage-backed backend service
  - `server.js` - Express backend server for AI features
  - `routes/ai.js` - AI analysis endpoint
- `assets/` - Images and other assets (create this folder with icon.png, splash.png, etc.)

## Features

- ✅ Add, toggle, delete tasks
- ✅ Filter by All/Active/Completed
- ✅ Subtasks with automatic parent completion
- ✅ AI-powered task breakdown suggestions
- ✅ Everyday task toggle
- ✅ Date assignment (basic implementation)
- ✅ Persistent storage with AsyncStorage
- ✅ Beautiful UI matching the web version

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

Or use EAS Build:
```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## Development Notes

- The app uses AsyncStorage for local data persistence
- AI features require the backend server to be running
- Date picker functionality is basic - consider adding `@react-native-community/datetimepicker` for better UX
- For production, update the `API_BASE` URL to your deployed backend

## License

MIT
