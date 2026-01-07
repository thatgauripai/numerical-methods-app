import express from 'express';
import Simulation from '../models/Simulation.js';

const router = express.Router();

// Get simulation history for a session
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type, limit = 10 } = req.query;
    
    const query = { sessionId };
    if (type) query.type = type;
    
    const simulations = await Simulation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('type method parameters results executionTime createdAt');
    
    res.json(simulations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch simulation history' });
  }
});

// Get popular simulations (for discovery)
router.get('/popular/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    const popularSimulations = await Simulation.aggregate([
      { $match: { type } },
      { 
        $group: {
          _id: '$parameters.function',
          count: { $sum: 1 },
          avgExecutionTime: { $avg: '$executionTime' },
          lastRun: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json(popularSimulations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch popular simulations' });
  }
});

export default router;