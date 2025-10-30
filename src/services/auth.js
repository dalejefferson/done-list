/*
  Authentication service using Supabase Auth.
  Handles sign up, sign in, sign out, and session management.
*/

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - uses environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bmtqecovjalcgieoeyqx.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.warn('Warning: the Supabase anon key is not set. Authentication features may not work.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const auth = {
  /**
   * Get current user session
   * @returns {Promise<{user: object|null, session: object|null}>}
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return { user: null, session: null };
    }
    return { user: session?.user || null, session };
  },

  /**
   * Sign up with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: object|null, error: Error|null}>}
   */
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/app.html'
      }
    });
    
    if (error) {
      return { user: null, error };
    }
    
    return { user: data.user, error: null };
  },

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: object|null, error: Error|null}>}
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { user: null, error };
    }
    
    return { user: data.user, error: null };
  },

  /**
   * Sign in with Google OAuth
   * @returns {Promise<{error: Error|null}>}
   */
  async signInWithGoogle() {
    // Construct redirect URL - always redirect to app.html after OAuth
    const redirectUrl = `${window.location.origin}/app.html`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    return { error };
  },

  /**
   * Sign out current user
   * @returns {Promise<{error: Error|null}>}
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current user
   * @returns {Promise<object|null>}
   */
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return user;
  },

  /**
   * Listen to auth state changes
   * @param {function} callback
   * @returns {function} unsubscribe function
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session?.user || null);
    });
  }
};

