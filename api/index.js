import express from 'express';
import fetch from 'node-fetch';
import https from 'https';
import cors from 'cors';

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow all methods
  allowedHeaders: '*', // Allow all headers
  credentials: true // Allow credentials
}));

// Parse JSON bodies
app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Middleware to handle all requests
app.use('*', async (req, res) => {
  const targetUrl = new URL(req.originalUrl, 'https://models.flock.io').toString();

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'models.flock.io',
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    // Forward the status code
    res.status(response.status);

    // Forward the headers
    for (const [key, value] of response.headers) {
      if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Forward the response body
    const data = await response.text();
    res.send(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message || 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 7200;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
