const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const testRoutes = require('./routes/test.routes');

const app = express();

const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareLink backend is running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({
    success: false,
    message: message
  });
});

module.exports = app;
