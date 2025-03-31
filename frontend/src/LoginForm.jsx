import React, { useState } from 'react';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "http://192.168.14.45:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);


    try {
      console.log(`Attempting login for user: ${username}`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      console.log("Auth response:", data);
      
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        // Force page reload to update authentication state
        window.location.reload();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
    console.log("Login form submitted") ;
    console.log("API URL:", `${API_BASE_URL}/api/auth/login`);
    console.log("Credentials:", { username, password: "***" });
  };

  return (
    <div className="lcars-panel login-form">
      <h2>Login</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Login'}
          </button>
        </div>
      </form>
      
      <div className="login-info">
        <p>This application requires pre-registered access.</p>
        <p>Please contact your administrator if you need an account.</p>
      </div>
    </div>
  );
}

export default LoginForm;
