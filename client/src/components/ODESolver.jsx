import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useNumericalMethods } from '../hooks/useNumericalMethods';

const ODESolver = () => {
  const { loading, error, results, solveODE } = useNumericalMethods();
  const [formData, setFormData] = useState({
    function: 'np.cos(t) - y',
    y0: 0,
    t_start: 0,
    t_end: 10,
    n_steps: 100,
    method: 'euler'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    solveODE({
      ...formData,
      t_span: [formData.t_start, formData.t_end]
    });
  };

  const predefinedFunctions = [
    { label: 'Simple Decay: -0.1*y', value: '-0.1 * y' },
    { label: 'Oscillation: cos(t) - y', value: 'np.cos(t) - y' },
    { label: 'Exponential Growth: 0.5*y', value: '0.5 * y' },
    { label: 'Non-linear: y*(1 - y)', value: 'y * (1 - y)' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card"
    >
      <h2>ODE Solver</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="controls">
          <div className="form-group">
            <label>Method</label>
            <select name="method" value={formData.method} onChange={handleChange}>
              <option value="euler">Euler's Method</option>
              <option value="rk4">Runge-Kutta 4th Order</option>
              <option value="scipy">Scipy Solver</option>
            </select>
          </div>

          <div className="form-group">
            <label>Initial Value (y0)</label>
            <input
              type="number"
              name="y0"
              value={formData.y0}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label>Time Start</label>
            <input
              type="number"
              name="t_start"
              value={formData.t_start}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label>Time End</label>
            <input
              type="number"
              name="t_end"
              value={formData.t_end}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label>Number of Steps</label>
            <input
              type="number"
              name="n_steps"
              value={formData.n_steps}
              onChange={handleChange}
              min="10"
              max="10000"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>ODE Function (dy/dt = f(t, y))</label>
            <select 
              onChange={(e) => setFormData({...formData, function: e.target.value})}
              value={formData.function}
            >
              <option value="">Custom function...</option>
              {predefinedFunctions.map((func, idx) => (
                <option key={idx} value={func.value}>{func.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="function"
              value={formData.function}
              onChange={handleChange}
              placeholder="e.g., np.cos(t) - y"
              style={{ marginTop: '10px' }}
            />
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Solving...' : 'Solve ODE'}
        </button>
      </form>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {results && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="results">
            <h3>Results ({results.method})</h3>
            <p>Steps: {results.n_steps}</p>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={results.t.map((t, i) => ({ t, y: results.y[i] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" label={{ value: 'Time (t)', position: 'insideBottom' }} />
                <YAxis label={{ value: 'y(t)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="y" 
                  stroke="#667eea" 
                  strokeWidth={2}
                  dot={false}
                  name="Solution"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ODESolver;