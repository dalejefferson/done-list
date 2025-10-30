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
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    const systemPrompt = buildSystemPrompt();
    const userPrompt = [
      isRegenerate 
        ? 'Generate an IMPROVED and MORE DETAILED version of the task analysis. Provide better, more actionable steps with clearer explanations. Make the suggestions more comprehensive and helpful.'
        : 'Analyze the following task and produce JSON only. Do not include prose outside JSON.',
      '',
      'Task:',
      safeTaskText,
      '',
      'Optional context (may be omitted):',
      safeContext ? JSON.stringify(safeContext).slice(0, 4000) : '(none)'
    ].join('\n');

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: Number(process.env.AI_MAX_TOKENS || 1200)
    });

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

    return res.json({
      ok: true,
      model,
      result: data
    });
  } catch (err) {
    const code = err?.status || 500;
    const details = err?.message || 'unknown';
    // Log server-side for debugging
    console.error('[AI] Analysis failed:', { code, details, error: err });
    return res.status(code).json({ error: 'AI analysis failed', details });
  }
});


