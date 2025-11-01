import express from 'express';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../utils/prompt.js';

export const aiRouter = express.Router();

// very light IP-based rate limiting (memory-only)
// Tunable via env: AI_RATELIMIT_WINDOW_MS, AI_RATELIMIT_MAX
// Set AI_RATELIMIT_ENABLED=false to disable for local dev
// Default: DISABLED in development (NODE_ENV !== 'production')
const WINDOW_MS = Number(process.env.AI_RATELIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.AI_RATELIMIT_MAX || 100);
const RATE_LIMIT_ENABLED = process.env.AI_RATELIMIT_ENABLED === 'true';
const isProduction = process.env.NODE_ENV === 'production';
const ipToHits = new Map();

function rateLimit(req, res, next) {
  // Completely disable rate limiting in development unless explicitly enabled
  if (!isProduction && !RATE_LIMIT_ENABLED) {
    return next(); // Skip entirely in dev
  }
  
  // Skip rate limiting if explicitly disabled
  if (!RATE_LIMIT_ENABLED) {
    return next();
  }
  
  const now = Date.now();
  // Prefer X-Forwarded-For, fallback to socket address, then express ip
  const xff = (req.headers['x-forwarded-for'] || '').toString();
  const firstForwarded = xff.split(',')[0]?.trim();
  const ip = firstForwarded || req.socket?.remoteAddress || req.ip || 'local';
  
  // Additional bypass for localhost/local IPs
  const isLocal = ip === 'local' || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isProduction && isLocal) {
    return next(); // Bypass for localhost in dev
  }
  
  const entry = ipToHits.get(ip) || { count: 0, ts: now };
  if (now - entry.ts > WINDOW_MS) {
    entry.count = 0;
    entry.ts = now;
  }
  entry.count += 1;
  ipToHits.set(ip, entry);
  if (entry.count > MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((entry.ts + WINDOW_MS - now) / 1000));
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  next();
}

aiRouter.post('/analyze-task', rateLimit, async (req, res) => {
  try {
    const { taskText, context, regenerate } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Server missing OpenAI API key' });
    }

    if (typeof taskText !== 'string' || !taskText.trim()) {
      return res.status(400).json({ error: 'taskText is required and must be a non-empty string' });
    }

    const safeTaskText = String(taskText).slice(0, 4000);
    const safeContext = context && typeof context === 'object' ? context : undefined;
    const isRegenerate = Boolean(regenerate);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // Use fastest model - gpt-3.5-turbo is typically fastest for simple tasks
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const useStreaming = process.env.AI_STREAMING !== 'false'; // Default to streaming enabled

    const systemPrompt = buildSystemPrompt();
    // Ultra-minimal prompt for fastest response
    const userPrompt = isRegenerate 
      ? `Better version: ${safeTaskText}`
      : `Task: ${safeTaskText}`;

    // Use streaming for faster response
    if (useStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Aggressive timeout: fail fast if >2 seconds
      const timeoutMs = 2000;
      const startTime = Date.now();
      
      const streamPromise = client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: Number(process.env.AI_MAX_TOKENS || 400), // Aggressively reduced for sub-2s responses
        temperature: 0.1, // Very low for fastest, most deterministic responses
        stream: true
      });

      // Race with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });

      let stream;
      try {
        stream = await Promise.race([streamPromise, timeoutPromise]);
      } catch (err) {
        if (err.message === 'Request timeout') {
          res.write(`data: ${JSON.stringify({ type: 'error', error: 'Request took too long' })}\n\n`);
          return res.end();
        }
        throw err;
      }

      let fullText = '';
      const streamStartTime = Date.now();
      for await (const chunk of stream) {
        // Check timeout during streaming
        if (Date.now() - streamStartTime > timeoutMs) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: 'Request took too long' })}\n\n`);
          return res.end();
        }
        
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullText += content;
          // Send incremental updates to client
          res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
        }
      }

      // Parse final JSON
      let data;
      try {
        data = JSON.parse(fullText);
      } catch (_e) {
        // fallback: attempt to extract JSON block
        const match = fullText.match(/\{[\s\S]*\}$/);
        if (match) {
          data = JSON.parse(match[0]);
        } else {
          res.write(`data: ${JSON.stringify({ type: 'error', error: 'Invalid JSON from model', raw: fullText.slice(0, 500) })}\n\n`);
          return res.end();
        }
      }

      // minimal shape check
      if (!Array.isArray(data?.steps)) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Model response missing steps[]', raw: data })}\n\n`);
        return res.end();
      }

      // Limit to max 4 steps for faster responses
      if (data.steps.length > 4) {
        data.steps = data.steps.slice(0, 4);
      }

      // Send final result
      res.write(`data: ${JSON.stringify({ type: 'complete', ok: true, model, result: data })}\n\n`);
      return res.end();
    } else {
      // Non-streaming fallback (original behavior)
      // Aggressive timeout: fail fast if >2 seconds
      const timeoutMs = 2000;
      
      const responsePromise = client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: Number(process.env.AI_MAX_TOKENS || 400), // Aggressively reduced for sub-2s responses
        temperature: 0.1 // Very low for fastest responses
      });

      // Race with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });

      let response;
      try {
        response = await Promise.race([responsePromise, timeoutPromise]);
      } catch (err) {
        if (err.message === 'Request timeout') {
          return res.status(504).json({ error: 'Request took too long', details: 'AI response exceeded 2 second timeout' });
        }
        throw err;
      }

      const text = response?.choices?.[0]?.message?.content || '';
      let data;
      try {
        data = JSON.parse(text);
      } catch (_e) {
        // fallback: attempt to extract JSON block
        const match = text.match(/\{[\s\S]*\}$/);
        if (match) {
          data = JSON.parse(match[0]);
        } else {
          return res.status(502).json({ error: 'Invalid JSON from model', raw: text.slice(0, 500) });
        }
      }

      // minimal shape check
      if (!Array.isArray(data?.steps)) {
        return res.status(502).json({ error: 'Model response missing steps[]', raw: data });
      }

      // Limit to max 4 steps for faster responses
      if (data.steps.length > 4) {
        data.steps = data.steps.slice(0, 4);
      }

      return res.json({
        ok: true,
        model,
        result: data
      });
    }
  } catch (err) {
    const code = err?.status || 500;
    const details = err?.message || 'unknown';
    // Log server-side for debugging
    console.error('[AI] Analysis failed:', { code, details, error: err });
    return res.status(code).json({ error: 'AI analysis failed', details });
  }
});


