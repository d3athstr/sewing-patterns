import React, { useState } from 'react';
import { useAuth } from './auth.jsx';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Use the authentication context instead of direct fetch
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log(`Attempting login for user: ${username}`);
    
    // Use the login function from auth context
    const success = await login(username, password);
    
    console.log("Login attempt completed, success:", success);
    console.log("Credentials used:", { username, password: "***" });
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
