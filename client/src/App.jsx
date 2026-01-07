import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ODESolver from './components/ODESolver';
import MonteCarloSimulator from './components/MonteCarloSimulator';
import OptimizationSolver from './components/OptimizationSolver';

function App() {
  const [activeTab, setActiveTab] = useState('ode');

  const tabs = [
    { id: 'ode', label: 'ODE Solver', component: <ODESolver /> },
    { id: 'monte-carlo', label: 'Monte Carlo', component: <MonteCarloSimulator /> },
    { id: 'optimization', label: 'Optimization', component: <OptimizationSolver /> }
  ];

  return (
    <div className="app">
      <div className="container">
        <motion.div 
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Numerical Methods Lab</h1>
          <p>Interactive simulations for differential equations, optimization, and Monte Carlo methods</p>
        </motion.div>

        <motion.div 
          className="tabs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {tabs.find(tab => tab.id === activeTab)?.component}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;