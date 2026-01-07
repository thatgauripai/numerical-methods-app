import express from 'express';
import Simulation from '../models/Simulation.js';

const router = express.Router();

// Get all simulations with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      sessionId, 
      type, 
      method, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (sessionId) query.sessionId = sessionId;
    if (type) query.type = type;
    if (method) query.method = method;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const simulations = await Simulation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('type method parameters results executionTime createdAt sessionId metadata')
      .lean();

    const totalSimulations = await Simulation.countDocuments(query);
    const totalPages = Math.ceil(totalSimulations / parseInt(limit));

    res.json({
      simulations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSimulations,
        pages: totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Simulations list error:', error);
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
});

// Get simulation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const simulation = await Simulation.findById(id);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    res.json(simulation);
  } catch (error) {
    console.error('Simulation fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
});

// Delete simulation by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const simulation = await Simulation.findByIdAndDelete(id);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    res.json({ 
      message: 'Simulation deleted successfully',
      deletedSimulation: simulation._id 
    });
  } catch (error) {
    console.error('Simulation deletion error:', error);
    res.status(500).json({ error: 'Failed to delete simulation' });
  }
});

// Get simulation statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    const matchStage = sessionId ? { sessionId } : {};

    const stats = await Simulation.aggregate([
      { $match: matchStage },
      {
        $facet: {
          typeDistribution: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                avgTime: { $avg: '$executionTime' },
                totalTime: { $sum: '$executionTime' }
              }
            }
          ],
          methodDistribution: [
            {
              $group: {
                _id: { type: '$type', method: '$method' },
                count: { $sum: 1 },
                avgTime: { $avg: '$executionTime' }
              }
            },
            { $sort: { count: -1 } }
          ],
          performanceStats: [
            {
              $group: {
                _id: null,
                totalSimulations: { $sum: 1 },
                totalExecutionTime: { $sum: '$executionTime' },
                avgExecutionTime: { $avg: '$executionTime' },
                maxExecutionTime: { $max: '$executionTime' },
                minExecutionTime: { $min: '$executionTime' }
              }
            }
          ],
          recentActivity: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                type: 1,
                method: 1,
                executionTime: 1,
                createdAt: 1,
                'parameters.function': 1
              }
            }
          ],
          hourlyDistribution: [
            {
              $group: {
                _id: {
                  hour: { $hour: '$createdAt' },
                  type: '$type'
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.hour': 1 } }
          ]
        }
      }
    ]);

    res.json(stats[0]);
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Search simulations by function content
router.get('/search/functions', async (req, res) => {
  try {
    const { q, type, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const query = {
      'parameters.function': { $regex: q, $options: 'i' }
    };
    
    if (type) query.type = type;

    const simulations = await Simulation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('type method parameters.function executionTime createdAt')
      .lean();

    res.json(simulations);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get popular functions
router.get('/popular/functions', async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    const matchStage = type ? { type } : {};

    const popularFunctions = await Simulation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$parameters.function',
          count: { $sum: 1 },
          type: { $first: '$type' },
          avgExecutionTime: { $avg: '$executionTime' },
          lastUsed: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(popularFunctions);
  } catch (error) {
    console.error('Popular functions error:', error);
    res.status(500).json({ error: 'Failed to fetch popular functions' });
  }
});

export default router;