const express = require('express');
const cors = require('cors');

const app = express();

const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: corsOrigin
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareLink backend is running'
  });
});

module.exports = app;
