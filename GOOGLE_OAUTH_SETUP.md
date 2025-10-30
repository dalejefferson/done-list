# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication so you can sign in with your real Gmail account.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type (unless you have a Google Workspace)
   - Fill in the required information (App name, User support email, Developer contact email)
   - Add your email to test users if needed
   - Click **Save and Continue** through the scopes and test users steps
6. Back in Credentials, select **Web application** as the application type
7. Give it a name (e.g., "Done List App")
8. Add **Authorized redirect URIs**:
   ```
   https://bmtqecovjalcgieoeyqx.supabase.co/auth/v1/callback
   ```
   Also add for local development (if testing locally):
   ```
   http://localhost:3000/auth/v1/callback
   ```
9. Click **Create**
10. **Save the Client ID and Client Secret** - you'll need these for Supabase

## Step 2: Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: **DONE LIST** (bmtqecovjalcgieoeyqx)
3. Navigate to **Authentication** > **Providers** in the left sidebar
4. Find **Google** in the list of providers and click on it
5. Toggle **Enable Google provider** to ON
6. Enter your **Google Client ID** (from Step 1)
7. Enter your **Google Client Secret** (from Step 1)
8. Click **Save**

## Step 3: Configure Redirect URLs in Supabase

1. Still in Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add your **Site URL** (for production):
   ```
   https://yourdomain.com
   ```
   Or for local development:
   ```
   http://localhost:3000
   ```
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/app.html
   https://yourdomain.com/app.html
   ```
   (Replace with your actual domain when deploying)

## Step 4: Test Google Sign-In

1. Open your app in the browser
2. Click **Sign in with Google** button
3. You should be redirected to Google's sign-in page
4. Sign in with your Gmail account
5. You'll be redirected back to your app (`app.html`)
6. You should now be signed in!

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console matches exactly: `https://bmtqecovjalcgieoeyqx.supabase.co/auth/v1/callback`
- Check for trailing slashes or http vs https mismatches

### Error: "invalid_client"
- Verify your Client ID and Client Secret are correct in Supabase
- Make sure you copied them from the correct OAuth client in Google Cloud Console

### Error: "access_denied"
- Check your OAuth consent screen configuration
- Make sure your email is added as a test user (if app is in testing mode)
- Verify the app is published or you're using a test account

### Not redirecting after sign-in
- Check that the redirect URL in Supabase matches your app's URL
- Verify `app.html` exists and is accessible
- Check browser console for any JavaScript errors

## Notes

- The OAuth flow uses Supabase's built-in OAuth handler
- After Google authentication, Supabase redirects to your app with tokens in the URL hash
- The app automatically processes these tokens and creates a session
- Your Gmail email will be used as your account identifier in Supabase

## Security

- Never commit your Google Client Secret to version control
- The Client Secret is stored securely in Supabase (server-side only)
- The Client ID is safe to expose (it's used in the OAuth flow)

