# Running on iPhone - Quick Guide

## Step 1: Install Expo Go on Your iPhone

1. Open the **App Store** on your iPhone
2. Search for **"Expo Go"**
3. Install the app (it's free)

## Step 2: Start the Expo Development Server

In your terminal, run:
```bash
npm start
```

You'll see a QR code in the terminal and a message like:
```
Metro waiting on exp://192.168.x.x:8081
```

## Step 3: Connect Your iPhone

**Option A: Scan QR Code (Easiest)**
1. Open the **Expo Go** app on your iPhone
2. Tap **"Scan QR Code"**
3. Point your camera at the QR code in the terminal
4. The app will load automatically

**Option B: Manual Connection**
1. Make sure your iPhone and computer are on the **same WiFi network**
2. In Expo Go app, tap **"Enter URL manually"**
3. Enter the URL shown in your terminal (starts with `exp://`)

## Step 4: Update API URL for Physical Device

Since you're running on a real iPhone (not simulator), you need to update the API base URL:

1. Open `app/index.js`
2. Find the `getApiBase()` function around line 17
3. Change these two lines:
   ```javascript
   const USE_PHYSICAL_DEVICE = true; // Change from false to true
   const LOCAL_IP = '192.168.2.70'; // Your computer's IP (already set!)
   ```
4. Save the file - Expo will reload automatically

## Step 5: Start the Backend Server

The AI features need the backend server running. Open a **new terminal window** and run:

```bash
npm run server
```

**Important**: Make sure both servers are running:
- ✅ Expo dev server (`npm start`) - Terminal 1
- ✅ Backend server (`npm run server`) - Terminal 2

## Troubleshooting

### "Unable to connect" error
- Make sure both devices are on the **same WiFi network**
- Check that your computer's firewall isn't blocking port 8081
- Try restarting Expo: Press `r` in the Expo terminal to reload

### "Network request failed" for AI features
- Make sure the backend server is running (`npm run server`)
- Verify the `LOCAL_IP` in `app/index.js` matches your computer's IP
- Check that port 3001 isn't blocked by firewall

### Can't find your computer's IP?
Run this in terminal:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for something like `192.168.x.x` - that's your local IP!

### Expo Go won't scan QR code
- Make sure your terminal window is large enough to show the full QR code
- Try the manual URL entry method instead
- Make sure you're scanning the QR code from the Expo terminal, not a screenshot

## Quick Checklist

- [ ] Expo Go installed on iPhone
- [ ] iPhone and computer on same WiFi
- [ ] `npm start` running (Terminal 1)
- [ ] `npm run server` running (Terminal 2)
- [ ] `USE_PHYSICAL_DEVICE = true` in `app/index.js`
- [ ] `LOCAL_IP` set to your computer's IP
- [ ] Scanned QR code or entered URL manually

## Your Current Setup

- **Computer IP**: `192.168.2.70` (already detected!)
- **Backend URL**: `http://192.168.2.70:3001`
- **Expo URL**: Check your terminal after running `npm start`

Once everything is connected, your app should load on your iPhone! 🎉

