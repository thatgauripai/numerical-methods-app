import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useNumericalMethods } from '../hooks/useNumericalMethods';

const OptimizationSolver = () => {
  const { loading, error, results, optimize } = useNumericalMethods();
  const [formData, setFormData] = useState({
    function: 'x[0]**2 + x[1]**2',
    method: 'BFGS',
    x0: '0, 0', // Changed from array to string
    bounds: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      const params = {
        function: formData.function,
        method: formData.method,
        x0: formData.x0.split(',').map(x => parseFloat(x.trim()))
      };

      // Validate x0
      if (params.x0.some(isNaN)) {
        alert('Please enter valid numbers for initial guess');
        return;
      }

      if (formData.bounds && formData.bounds.trim()) {
        params.bounds = formData.bounds.split(';').map(bound => 
          bound.split(',').map(x => parseFloat(x.trim()))
        );
        
        // Validate bounds
        if (params.bounds.some(bound => bound.some(isNaN))) {
          alert('Please enter valid numbers for bounds');
          return;
        }
      }

      console.log('Sending optimization request:', params);
      optimize(params);
    } catch (error) {
      console.error('Error parsing inputs:', error);
      alert('Error parsing inputs. Please check your format.');
    }
  };

  const predefinedFunctions = [
    { label: 'Sphere: x² + y²', value: 'x[0]**2 + x[1]**2' },
    { label: 'Rosenbrock: 100*(y-x²)² + (1-x)²', value: '100*(x[1]-x[0]**2)**2 + (1-x[0])**2' },
    { label: 'Ackley Function', 
      value: '-20*np.exp(-0.2*np.sqrt(0.5*(x[0]**2+x[1]**2))) - np.exp(0.5*(np.cos(2*np.pi*x[0])+np.cos(2*np.pi*x[1]))) + np.e + 20' },
    { label: 'Simple Quadratic: 3*x² + 2*x + 1', value: '3*x[0]**2 + 2*x[0] + 1' }
  ];

  // Test with a simple 1D function first
  const quickTest = () => {
    setFormData({
      function: 'x[0]**2 + 2*x[0] + 1',
      method: 'BFGS',
      x0: '5',
      bounds: ''
    });
    
    // Auto-submit after a short delay
    setTimeout(() => {
      document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card"
    >
      <h2>Optimization Solver</h2>

      {/* Quick test button */}
      <div style={{ marginBottom: '20px' }}>
        <button type="button" onClick={quickTest} className="btn" style={{ background: '#48bb78' }}>
          Quick Test (Simple Quadratic)
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="controls">
          <div className="form-group">
            <label>Optimization Method</label>
            <select name="method" value={formData.method} onChange={handleChange}>
              <option value="BFGS">BFGS</option>
              <option value="Nelder-Mead">Nelder-Mead</option>
              <option value="CG">Conjugate Gradient</option>
              <option value="L-BFGS-B">L-BFGS-B (with bounds)</option>
              <option value="Powell">Powell</option>
            </select>
          </div>

          <div className="form-group">
            <label>Initial Guess (x0)</label>
            <input
              type="text"
              name="x0"
              value={formData.x0}
              onChange={handleChange}
              placeholder="0, 0"
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              For 1D: "5", For 2D: "1, 2", For 3D: "1, 2, 3"
            </small>
          </div>

          <div className="form-group">
            <label>Bounds (optional)</label>
            <input
              type="text"
              name="bounds"
              value={formData.bounds}
              onChange={handleChange}
              placeholder="-10,10; -5,5"
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Format: "min1,max1; min2,max2" for each dimension
            </small>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Objective Function</label>
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  setFormData({...formData, function: e.target.value});
                }
              }}
              value=""
            >
              <option value="">Choose predefined function...</option>
              {predefinedFunctions.map((func, idx) => (
                <option key={idx} value={func.value}>{func.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="function"
              value={formData.function}
              onChange={handleChange}
              placeholder="x[0]**2 + x[1]**2"
              style={{ marginTop: '10px' }}
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Use x[0], x[1] for variables. Example: "x[0]**2 + np.sin(x[1])"
            </small>
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Optimizing...' : 'Optimize'}
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
            <h3>Optimization Results</h3>
            <p><strong>Success:</strong> {results.success ? 'Yes' : 'No'}</p>
            <p><strong>Optimal Point:</strong> [{Array.isArray(results.x) ? results.x.map(x => x.toFixed(6)).join(', ') : results.x}]</p>
            <p><strong>Optimal Value:</strong> {results.fun?.toFixed(6)}</p>
            <p><strong>Iterations:</strong> {results.nit}</p>
            <p><strong>Function Evaluations:</strong> {results.nfev}</p>
            <p><strong>Message:</strong> {results.message}</p>
          </div>

          {/* Visualization for 1D functions */}
          {Array.isArray(results.x) && results.x.length === 1 && (
            <div className="chart-container">
              <h4>Function Visualization</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={Array.from({length: 100}, (_, i) => {
                    const x = results.x[0] - 2 + i * 0.04; // Center around solution
                    try {
                      // Safe evaluation for 1D functions
                      const y = eval(formData.function.replace(/x\[0\]/g, `(${x})`).replace(/np\./g, 'Math.'));
                      return { x, y };
                    } catch (e) {
                      return { x, y: 0 };
                    }
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="x" 
                    label={{ value: 'x', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'f(x)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value, name) => [value.toFixed(4), 'f(x)']}
                    labelFormatter={(value) => `x: ${value.toFixed(4)}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    dot={false}
                    name="Objective Function"
                  />
                  {/* Mark optimal point */}
                  <Line 
                    type="monotone"
                    data={[{x: results.x[0], y: results.fun}, {x: results.x[0], y: results.fun}]}
                    stroke="#f56565"
                    strokeWidth={2}
                    dot={{ fill: '#f56565', r: 6 }}
                    name="Optimum"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && results && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f7fafc', borderRadius: '5px' }}>
          <h4>Debug Info:</h4>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </motion.div>
  );
};

export default OptimizationSolver;