import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['ode', 'monte_carlo', 'optimization'],
    required: true
  },
  method: String,
  parameters: mongoose.Schema.Types.Mixed,
  results: mongoose.Schema.Types.Mixed,
  executionTime: Number,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  }
});

// Index for faster queries
simulationSchema.index({ sessionId: 1, createdAt: -1 });
simulationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model('Simulation', simulationSchema);