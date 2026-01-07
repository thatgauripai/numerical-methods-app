from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import minimize
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

def euler_method(f, y0, t_span, n_steps):
    t0, tf = t_span
    t = np.linspace(t0, tf, n_steps)
    h = (tf - t0) / (n_steps - 1)
    y = np.zeros(n_steps)
    y[0] = y0
    
    for i in range(n_steps - 1):
        y[i + 1] = y[i] + h * f(t[i], y[i])
    
    return t, y

def runge_kutta_4(f, y0, t_span, n_steps):
    t0, tf = t_span
    t = np.linspace(t0, tf, n_steps)
    h = (tf - t0) / (n_steps - 1)
    y = np.zeros(n_steps)
    y[0] = y0
    
    for i in range(n_steps - 1):
        k1 = h * f(t[i], y[i])
        k2 = h * f(t[i] + h/2, y[i] + k1/2)
        k3 = h * f(t[i] + h/2, y[i] + k2/2)
        k4 = h * f(t[i] + h, y[i] + k3)
        y[i + 1] = y[i] + (k1 + 2*k2 + 2*k3 + k4) / 6
    
    return t, y

@app.route('/solve-ode', methods=['POST'])
def solve_ode():
    try:
        data = request.json
        method = data.get('method', 'euler')
        ode_func = data['function']
        y0 = data['y0']
        t_span = data['t_span']
        n_steps = data.get('n_steps', 100)
        
        # Convert string function to callable
        f = lambda t, y: eval(ode_func, {'np': np, 't': t, 'y': y})
        
        if method == 'euler':
            t, y = euler_method(f, y0, t_span, n_steps)
        elif method == 'rk4':
            t, y = runge_kutta_4(f, y0, t_span, n_steps)
        elif method == 'scipy':
            sol = solve_ivp(f, t_span, [y0], t_eval=np.linspace(t_span[0], t_span[1], n_steps))
            t, y = sol.t, sol.y[0]
        else:
            return jsonify({'error': 'Invalid method'}), 400
        
        return jsonify({
            't': t.tolist(),
            'y': y.tolist(),
            'method': method,
            'n_steps': n_steps
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/monte-carlo', methods=['POST'])
def monte_carlo():
    try:
        data = request.json
        simulation_type = data['type']
        n_simulations = data['n_simulations']
        
        if simulation_type == 'pi_estimation':
            points_inside = 0
            points = []
            
            for _ in range(n_simulations):
                x, y = np.random.random(), np.random.random()
                inside = (x**2 + y**2) <= 1
                points_inside += inside
                points.append({'x': x, 'y': y, 'inside': bool(inside)})
            
            pi_estimate = 4 * points_inside / n_simulations
            
            return jsonify({
                'pi_estimate': pi_estimate,
                'points': points[:1000],  # Limit points for performance
                'n_simulations': n_simulations
            })
        
        elif simulation_type == 'option_pricing':
            # Simple Black-Scholes Monte Carlo
            S0 = data.get('S0', 100)
            K = data.get('K', 100)
            T = data.get('T', 1)
            r = data.get('r', 0.05)
            sigma = data.get('sigma', 0.2)
            
            payoffs = []
            for _ in range(n_simulations):
                WT = np.random.normal(0, np.sqrt(T))
                ST = S0 * np.exp((r - 0.5 * sigma**2) * T + sigma * WT)
                payoff = max(ST - K, 0)
                payoffs.append(payoff)
            
            option_price = np.exp(-r * T) * np.mean(payoffs)
            
            return jsonify({
                'option_price': option_price,
                'payoffs': payoffs[:1000],
                'parameters': {'S0': S0, 'K': K, 'T': T, 'r': r, 'sigma': sigma}
            })
        
        else:
            return jsonify({'error': 'Unknown simulation type'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/optimize', methods=['POST'])
def optimize():
    try:
        data = request.json
        objective_func = data['function']
        method = data.get('method', 'BFGS')
        x0 = data.get('x0', [0])
        bounds = data.get('bounds')
        
        # Convert string function to callable
        func = lambda x: eval(objective_func, {'np': np, 'x': np.array(x)})
        
        if bounds:
            bounds = [(b[0], b[1]) for b in bounds]
            result = minimize(func, x0, method=method, bounds=bounds)
        else:
            result = minimize(func, x0, method=method)
        
        return jsonify({
            'success': result.success,
            'x': result.x.tolist(),
            'fun': result.fun,
            'nfev': result.nfev,
            'nit': result.nit,
            'message': str(result.message)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(port=3002, debug=True)