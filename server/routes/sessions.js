import express from 'express';
import UserSession from '../models/UserSession.js';
import Simulation from '../models/Simulation.js';

const router = express.Router();

// Get session statistics
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await UserSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get detailed statistics
    const stats = await Simulation.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalTime: { $sum: '$executionTime' },
          avgTime: { $avg: '$executionTime' },
          lastRun: { $max: '$createdAt' }
        }
      }
    ]);

    const methodStats = await Simulation.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: { type: '$type', method: '$method' },
          count: { $sum: 1 },
          avgTime: { $avg: '$executionTime' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      sessionInfo: session,
      typeStats: stats,
      methodStats: methodStats,
      totalSimulations: session.simulationsCount
    });
  } catch (error) {
    console.error('Session stats error:', error);
    res.status(500).json({ error: 'Failed to fetch session statistics' });
  }
});

// Get all sessions (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    
    const sessions = await UserSession.find()
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('sessionId simulationsCount lastActivity createdAt');

    const totalSessions = await UserSession.countDocuments();

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSessions,
        pages: Math.ceil(totalSessions / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Sessions list error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Delete session and associated simulations
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Delete session and simulations in parallel
    const [sessionResult, simulationResult] = await Promise.all([
      UserSession.deleteOne({ sessionId }),
      Simulation.deleteMany({ sessionId })
    ]);

    res.json({
      message: 'Session deleted successfully',
      deletedSession: sessionResult.deletedCount,
      deletedSimulations: simulationResult.deletedCount
    });
  } catch (error) {
    console.error('Session deletion error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Get session activity timeline
router.get('/:sessionId/timeline', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 20 } = req.query;
    
    const timeline = await Simulation.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('type method executionTime createdAt parameters.function')
      .lean();

    // Format timeline data
    const formattedTimeline = timeline.map(sim => ({
      id: sim._id,
      type: sim.type,
      method: sim.method,
      executionTime: sim.executionTime,
      createdAt: sim.createdAt,
      function: sim.parameters?.function?.substring(0, 50) + (sim.parameters?.function?.length > 50 ? '...' : ''),
      timestamp: sim.createdAt.getTime()
    }));

    res.json(formattedTimeline);
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

export default router;