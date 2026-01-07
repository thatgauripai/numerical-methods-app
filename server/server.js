import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import Simulation from './models/Simulation.js';
import UserSession from './models/UserSession.js';
import historyRoutes from './routes/history.js';
import optimizationRoutes from './routes/optimization.js';
import sessionsRoutes from './routes/sessions.js';
import simulationsRoutes from './routes/simulations.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:3002';

// Connect to MongoDB
connectDB();

// Rate limiting from environment variables
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});

app.use(limiter);
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/history', historyRoutes);
app.use('/api/optimization', optimizationRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/simulations', simulationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Numerical Methods API',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Database statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [sessionCount, simulationCount, recentActivity] = await Promise.all([
      UserSession.countDocuments(),
      Simulation.countDocuments(),
      Simulation.find().sort({ createdAt: -1 }).limit(5).select('type method createdAt')
    ]);

    res.json({
      sessions: sessionCount,
      simulations: simulationCount,
      recentActivity,
      database: 'MongoDB',
      status: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch database statistics' });
  }
});

// ... rest of your existing endpoints (solve-ode, monte-carlo, optimize)

// Enhanced ODE solver with MongoDB storage
app.post('/api/solve-ode', async (req, res) => {
  const startTime = Date.now();
  const { sessionId = generateSessionId(), ...params } = req.body;
  
  try {
    // Track user session
    await UserSession.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { simulationsCount: 1 },
        $set: { lastActivity: new Date() }
      },
      { upsert: true, new: true }
    );

    const response = await axios.post(`${PYTHON_SERVICE_URL}/solve-ode`, params);
    const executionTime = Date.now() - startTime;

    // Store simulation in MongoDB
    const simulation = new Simulation({
      sessionId,
      type: 'ode',
      method: params.method,
      parameters: params,
      results: response.data,
      executionTime
    });
    await simulation.save();

    res.json({ ...response.data, simulationId: simulation._id });
  } catch (error) {
    res.status(500).json({ 
      error: 'Computation service unavailable',
      details: error.message 
    });
  }
});

// Enhanced Monte Carlo with MongoDB
app.post('/api/monte-carlo', async (req, res) => {
  const startTime = Date.now();
  const { sessionId = generateSessionId(), ...params } = req.body;
  
  try {
    await UserSession.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { simulationsCount: 1 },
        $set: { lastActivity: new Date() }
      },
      { upsert: true, new: true }
    );

    const response = await axios.post(`${PYTHON_SERVICE_URL}/monte-carlo`, params);
    const executionTime = Date.now() - startTime;

    const simulation = new Simulation({
      sessionId,
      type: 'monte_carlo',
      method: params.type,
      parameters: params,
      results: response.data,
      executionTime
    });
    await simulation.save();

    res.json({ ...response.data, simulationId: simulation._id });
  } catch (error) {
    res.status(500).json({ error: 'Computation failed' });
  }
});

// Enhanced Optimization with MongoDB
app.post('/api/optimize', async (req, res) => {
  const startTime = Date.now();
  const { sessionId = generateSessionId(), ...params } = req.body;
  
  try {
    await UserSession.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { simulationsCount: 1 },
        $set: { lastActivity: new Date() }
      },
      { upsert: true, new: true }
    );

    const response = await axios.post(`${PYTHON_SERVICE_URL}/optimize`, params);
    const executionTime = Date.now() - startTime;

    const simulation = new Simulation({
      sessionId,
      type: 'optimization',
      method: params.method,
      parameters: params,
      results: response.data,
      executionTime
    });
    await simulation.save();

    res.json({ ...response.data, simulationId: simulation._id });
  } catch (error) {
    res.status(500).json({ error: 'Optimization failed' });
  }
});

// Session statistics
app.get('/api/session/:sessionId/stats', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const stats = await Simulation.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalTime: { $sum: '$executionTime' },
          avgTime: { $avg: '$executionTime' }
        }
      }
    ]);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session stats' });
  }
});

function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9);
}

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
});