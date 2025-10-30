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

// Serve static files from src directory
app.use(express.static('src'));

// Basic CORS setup; tighten origins per environment as needed
app.use(cors());
app.use(express.json({ limit: '512kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/ai', aiRouter);

// Export for Vercel serverless function
export default app;

// Only start server if running locally (not on Vercel)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`AI Analyst API listening on http://localhost:${port}`);
  });
}

