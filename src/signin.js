/*
  Sign in page logic
*/

import { auth } from './services/auth.js';
import { Particles } from './utils/particles.js';

const signinForm = document.getElementById('signin-form');
const googleSigninBtn = document.getElementById('google-signin-btn');
const signinBtn = document.getElementById('signin-btn');
const errorMessage = document.getElementById('error-message');

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

// Handle form submission
signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }
  
  signinBtn.disabled = true;
  signinBtn.textContent = 'Signing in...';
  
  try {
    const { user, error } = await auth.signIn(email, password);
    
    if (error) {
      showError(error.message || 'Invalid email or password. Please try again.');
      signinBtn.disabled = false;
      signinBtn.textContent = 'Sign In';
      return;
    }
    
    // Success - redirect to app
    signinBtn.textContent = 'Success! Redirecting...';
    window.location.href = 'app.html';
  } catch (err) {
    showError('An unexpected error occurred. Please try again.');
    signinBtn.disabled = false;
    signinBtn.textContent = 'Sign In';
  }
});

// Handle Google sign in
googleSigninBtn.addEventListener('click', async () => {
  hideError();
  googleSigninBtn.disabled = true;
  
  try {
    const { error } = await auth.signInWithGoogle();
    
    if (error) {
      showError(error.message || 'Failed to sign in with Google. Please try again.');
      googleSigninBtn.disabled = false;
    }
    // If successful, user will be redirected by OAuth flow
  } catch (err) {
    showError('An unexpected error occurred. Please try again.');
    googleSigninBtn.disabled = false;
  }
});

// Initialize particles background
function initParticles() {
  const container = document.getElementById('particles-container');
  if (container) {
    // Color palette: muted greens, grays, and off-white tones
    const colorPalette = [
      '#5A8A8C', // muted green-gray (accent)
      '#6B9A9D', // lighter muted green
      '#4A7A7C', // darker muted green
      '#8B8B8B', // medium gray
      '#A0A0A0', // lighter gray
      '#6B6B6B', // darker gray
      '#F5F5F0', // off-white
      '#E8E8E3', // cream
      '#DADAD5', // muted cream
    ];
    
    new Particles({
      container,
      quantity: 100,
      staticity: 50,
      ease: 50,
      size: 0.7, // Increased from 0.4 for bigger particles
      colors: colorPalette,
      vx: 0,
      vy: 0,
    });
  }
}

// Check if user is already signed in
(async function init() {
  const { user } = await auth.getSession();
  if (user) {
    // User is already signed in, redirect to app
    window.location.href = 'app.html';
    return;
  }
  
  initParticles();
})();


