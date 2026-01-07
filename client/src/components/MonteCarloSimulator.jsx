import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNumericalMethods } from '../hooks/useNumericalMethods';

const MonteCarloSimulator = () => {
  const { loading, error, results, runMonteCarlo } = useNumericalMethods();
  const [simulationType, setSimulationType] = useState('pi_estimation');
  const [animationFrame, setAnimationFrame] = useState(0);

  const [formData, setFormData] = useState({
    n_simulations: 1000,
    S0: 100,
    K: 100,
    T: 1,
    r: 0.05,
    sigma: 0.2
  });

  useEffect(() => {
    if (results && results.points && animationFrame < results.points.length - 1) {
      const timer = setTimeout(() => {
        setAnimationFrame(prev => prev + 1);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [results, animationFrame]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: parseFloat(e.target.value)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAnimationFrame(0);
    runMonteCarlo({
      type: simulationType,
      ...formData
    });
  };

  const renderPiAnimation = () => {
    if (!results?.points) return null;

    const currentPoints = results.points.slice(0, animationFrame + 1);
    const pointsInside = currentPoints.filter(p => p.inside).length;
    const currentPi = pointsInside > 0 ? (4 * pointsInside / currentPoints.length).toFixed(6) : '0';

    return (
      <div className="animation-container">
        <div className="points-grid" style={{ width: '400px', height: '400px' }}>
          {currentPoints.map((point, idx) => (
            <div
              key={idx}
              className={`point ${point.inside ? 'inside' : 'outside'}`}
              style={{
                left: `${point.x * 400}px`,
                top: `${point.y * 400}px`
              }}
            />
          ))}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '400px',
            border: '2px solid #333',
            borderRadius: '50%'
          }} />
        </div>
        <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
          π ≈ {currentPi} (after {currentPoints.length} points)
        </div>
        <div style={{ marginTop: '10px' }}>
          Accuracy: {Math.abs(Math.PI - parseFloat(currentPi)).toFixed(6)}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="card"
    >
      <h2>Monte Carlo Simulations</h2>

      <div className="tabs">
        <div 
          className={`tab ${simulationType === 'pi_estimation' ? 'active' : ''}`}
          onClick={() => setSimulationType('pi_estimation')}
        >
          π Estimation
        </div>
        <div 
          className={`tab ${simulationType === 'option_pricing' ? 'active' : ''}`}
          onClick={() => setSimulationType('option_pricing')}
        >
          Option Pricing
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="controls">
          <div className="form-group">
            <label>Number of Simulations</label>
            <input
              type="number"
              name="n_simulations"
              value={formData.n_simulations}
              onChange={handleChange}
              min="100"
              max="1000000"
            />
          </div>

          {simulationType === 'option_pricing' && (
            <>
              <div className="form-group">
                <label>Initial Price (S0)</label>
                <input
                  type="number"
                  name="S0"
                  value={formData.S0}
                  onChange={handleChange}
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Strike Price (K)</label>
                <input
                  type="number"
                  name="K"
                  value={formData.K}
                  onChange={handleChange}
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Time to Expiry (T)</label>
                <input
                  type="number"
                  name="T"
                  value={formData.T}
                  onChange={handleChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Risk-free Rate (r)</label>
                <input
                  type="number"
                  name="r"
                  value={formData.r}
                  onChange={handleChange}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Volatility (σ)</label>
                <input
                  type="number"
                  name="sigma"
                  value={formData.sigma}
                  onChange={handleChange}
                  step="0.01"
                />
              </div>
            </>
          )}
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Running Simulation...' : 'Run Simulation'}
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
            <h3>Simulation Results</h3>
            
            {simulationType === 'pi_estimation' ? (
              <>
                <p>Final π Estimate: {results.pi_estimate?.toFixed(6)}</p>
                <p>Actual π: {Math.PI.toFixed(6)}</p>
                <p>Error: {Math.abs(Math.PI - results.pi_estimate).toFixed(6)}</p>
                <p>Total Simulations: {results.n_simulations}</p>
                
                {renderPiAnimation()}
              </>
            ) : (
              <>
                <p>Option Price: ${results.option_price?.toFixed(2)}</p>
                <p>Simulations: {results.n_simulations}</p>
                <div>
                  <h4>Parameters:</h4>
                  <pre>{JSON.stringify(results.parameters, null, 2)}</pre>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MonteCarloSimulator;