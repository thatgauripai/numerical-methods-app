import { useState, useCallback } from 'react';
import axios from 'axios';

export const useNumericalMethods = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Generate or retrieve session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem('numericalMethodsSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('numericalMethodsSessionId', sessionId);
    }
    return sessionId;
  };

  const solveODE = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const sessionId = getSessionId();
      const response = await axios.post('/api/solve-ode', { ...params, sessionId });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to solve ODE');
    } finally {
      setLoading(false);
    }
  }, []);

  const runMonteCarlo = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const sessionId = getSessionId();
      const response = await axios.post('/api/monte-carlo', { ...params, sessionId });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Monte Carlo simulation failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const optimize = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const sessionId = getSessionId();
      const response = await axios.post('/api/optimize', { ...params, sessionId });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // New method to fetch simulation history
  const getHistory = useCallback(async (type, limit = 10) => {
    try {
      const sessionId = getSessionId();
      const response = await axios.get(`/api/history/${sessionId}?type=${type}&limit=${limit}`);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch history:', err);
      return [];
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    results,
    solveODE,
    runMonteCarlo,
    optimize,
    getHistory,
    clearResults
  };
};