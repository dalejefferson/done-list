# Expo Setup Guide

## Quick Start

1. **Install dependencies** (already done):
```bash
npm install
```

2. **Start the Expo development server**:
```bash
npm start
```

3. **Run on your device**:
   - Install **Expo Go** app on your iOS/Android device
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator, `w` for web

## Backend Server

The AI features require the backend server to be running:

```bash
npm run server
```

**Important**: Update the `API_BASE` in `app/index.js` based on your setup:
- **iOS Simulator**: `http://localhost:3001` ✅ (already set)
- **Android Emulator**: `http://10.0.2.2:3001` ✅ (already set)
- **Physical Device**: Use your computer's local IP (e.g., `http://192.168.1.100:3001`)

To find your local IP:
- **Mac/Linux**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows**: `ipconfig` (look for IPv4 Address)

## Assets

You'll need to create these assets in an `assets/` folder:
- `icon.png` - App icon (1024x1024px)
- `splash.png` - Splash screen (1242x2436px)
- `adaptive-icon.png` - Android adaptive icon (1024x1024px)
- `favicon.png` - Web favicon (48x48px)

For now, the app will work without these, but Expo will show warnings.

## Troubleshooting

### "Network request failed" error
- Make sure the backend server is running (`npm run server`)
- Check that the `API_BASE` URL matches your setup
- For physical devices, ensure both device and computer are on the same WiFi network

### Metro bundler issues
- Clear cache: `npx expo start --clear`
- Reset: `rm -rf node_modules && npm install`

### iOS Simulator not starting
- Make sure Xcode is installed
- Run `xcode-select --install` if needed

### Android Emulator not starting
- Make sure Android Studio is installed
- Create an Android Virtual Device (AVD) in Android Studio

## Next Steps

1. Create app assets (icon, splash screen)
2. Test on physical device
3. Consider adding a date picker library for better date assignment UX
4. Update API_BASE for production deployment

