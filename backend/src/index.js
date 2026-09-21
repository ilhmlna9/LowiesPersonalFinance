import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import prisma from './config/db.js';
import authRouter from './routes/auth.routes.js';
import transactionRouter from './routes/transaction.routes.js';
import budgetRouter from './routes/budget.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import reportRouter from './routes/report.routes.js';
import telegramRouter from './routes/telegram.routes.js';
import whatsappRouter from './routes/whatsapp.routes.js';

const app = express();

// ============ MIDDLEWARE ============
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// ============ ROUTES ============
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reports', reportRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/whatsapp', whatsappRouter);

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// ============ 404 ============
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============ SERVER START ============
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`🚀 Lowies Backend running on port ${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;