import mongoose from 'mongoose';

const optimizationResultSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  function: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['BFGS', 'Nelder-Mead', 'CG', 'L-BFGS-B', 'Powell']
  },
  initialGuess: {
    type: [Number],
    required: true
  },
  bounds: {
    type: [[Number]],
    default: null
  },
  optimalPoint: {
    type: [Number],
    required: true
  },
  optimalValue: {
    type: Number,
    required: true
  },
  iterations: {
    type: Number,
    required: true
  },
  functionEvaluations: {
    type: Number,
    required: true
  },
  success: {
    type: Boolean,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  executionTime: {
    type: Number,
    required: true
  },
  dimensions: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  }
});

// Index for faster queries
optimizationResultSchema.index({ sessionId: 1, createdAt: -1 });
optimizationResultSchema.index({ method: 1 });
optimizationResultSchema.index({ function: 1 });

// Static method to get optimization statistics
optimizationResultSchema.statics.getOptimizationStats = function(sessionId) {
  return this.aggregate([
    { $match: { sessionId } },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        avgIterations: { $avg: '$iterations' },
        avgExecutionTime: { $avg: '$executionTime' },
        successRate: { 
          $avg: { 
            $cond: [{ $eq: ['$success', true] }, 1, 0] 
          } 
        },
        lastRun: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

export default mongoose.model('OptimizationResult', optimizationResultSchema);