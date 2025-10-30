import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
// Prefer .env.local if present; fallback to default .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}
import express from 'express';
import cors from 'cors';
import { aiRouter } from './routes/ai.js';

const app = express();

// Basic CORS setup; tighten origins per environment as needed
app.use(cors());
app.use(express.json({ limit: '512kb' }));

// Serve static files from src directory
// In Vercel, files are relative to the function directory (src/)
const staticPath = process.env.VERCEL || process.env.VERCEL_ENV ? path.join(__dirname) : 'src';
app.use(express.static(staticPath));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Root route - serve app.html (the to-do list app)
app.get('/', (_req, res) => {
  const appPath = path.join(staticPath, 'app.html');
  res.sendFile(path.resolve(appPath));
});

app.use('/api/ai', aiRouter);

// Serve index.html for /index route (landing page)
app.get('/index.html', (_req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(path.resolve(indexPath));
});

// Fallback for all other routes - serve app.html for SPA routing
app.get('*', (_req, res) => {
  const appPath = path.join(staticPath, 'app.html');
  res.sendFile(path.resolve(appPath));
});

// Export for Vercel serverless function
export default app;

// Only start server if running locally (not on Vercel)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`AI Analyst API listening on http://localhost:${port}`);
  });
}

