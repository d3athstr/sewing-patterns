import { useState, useEffect, createContext, useContext } from 'react';

// Create an authentication context
const AuthContext = createContext(null);

// API base URL - hardcoded for now, should be environment variable in production
const API_BASE_URL = "http://192.168.14.45:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          console.log("Checking authentication with token");
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log("User authenticated:", userData);
            setUser(userData);
          } else {
            // Token is invalid or expired
            console.log("Token invalid or expired");
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          setError("Failed to verify authentication");
        }
      } else {
        console.log("No token found");
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [token]);

  // Login function
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
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
      console.log("Login response:", data);
      
      if (response.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return true;
      } else {
        setError(data.error || "Login failed");
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Get auth header for API requests
  const getAuthHeader = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Authenticated fetch function
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      ...getAuthHeader()
    };
    
    return fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
      isAuthenticated: !!token,
      authFetch,
      API_BASE_URL
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}
