import React, { useState } from 'react';
import { useAuth } from './auth';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const { login, register, error, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegistering) {
      await register(username, email, password);
    } else {
      await login(username, password);
    }
  };

  return (
    <div className="lcars-panel">
      <h2>{isRegistering ? 'Create Account' : 'Login'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        {isRegistering && (
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}
        
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
        </button>
        
        <button 
          type="button" 
          onClick={() => setIsRegistering(!isRegistering)}
          className="secondary-button"
        >
          {isRegistering ? 'Back to Login' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
