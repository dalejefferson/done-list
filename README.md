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

Create a `.env.local` file in the root directory (see `env.example` for all available variables):

```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
PORT=3001
```

**Important**: Never commit `.env.local` or `.env` files to version control. They are already excluded in `.gitignore`.

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

## Deployment to Vercel

This app is configured for deployment on Vercel with serverless functions.

### Prerequisites
- Vercel account ([sign up here](https://vercel.com))
- GitHub repository (code pushed to GitHub)

### Deployment Steps

1. **Connect your GitHub repository to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Environment Variables in Vercel:**
   After importing, go to Project Settings → Environment Variables and add:
   
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   OPENAI_MODEL=gpt-3.5-turbo (optional)
   AI_MAX_TOKENS=1200 (optional)
   ```

3. **Deploy:**
   - Vercel will automatically detect the `vercel.json` configuration
   - Click "Deploy" and your app will be live!

4. **Update API URLs:**
   - After deployment, update your frontend code to use the Vercel URL for API calls
   - The API will be available at `https://your-app.vercel.app/api/ai/analyze-task`

### Environment Variables for Vercel

All environment variables are securely stored in Vercel's dashboard and never exposed in the codebase. The following variables are required:

- `OPENAI_API_KEY` - Your OpenAI API key for AI features
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key (safe to expose in frontend)

Optional variables:
- `OPENAI_MODEL` - Model to use (default: `gpt-3.5-turbo`)
- `AI_MAX_TOKENS` - Max tokens for AI responses (default: `1200`)
- `AI_RATELIMIT_ENABLED` - Enable rate limiting (default: `false` for dev)
- `AI_RATELIMIT_WINDOW_MS` - Rate limit window in ms (default: `60000`)
- `AI_RATELIMIT_MAX` - Max requests per window (default: `100`)

## Development Notes

- The app uses AsyncStorage for local data persistence
- AI features require the backend server to be running (or deployed to Vercel)
- Date picker functionality is basic - consider adding `@react-native-community/datetimepicker` for better UX
- For production, update the `API_BASE` URL to your deployed backend

## Security Notes

- ✅ All API keys are stored as environment variables
- ✅ No secrets are committed to the repository
- ✅ `.env*` files are excluded via `.gitignore`
- ✅ Supabase anon key is safe to expose in frontend (designed for client-side use)

## License

MIT
