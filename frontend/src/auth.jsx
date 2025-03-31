import { useState, useEffect, createContext, useContext } from 'react';

// Create an authentication context
const AuthContext = createContext(null);

// API base URL - should be environment variable in production
const API_BASE_URL = "http://192.168.14.45:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug: Log initial state
  console.log("AuthProvider initialized with token:", token ? "exists" : "none");

  // Check if user is authenticated on load
  useEffect(() => {
    const checkAuth = async () => {
      console.log("checkAuth running, token:", token ? "exists" : "none");
      
      if (token) {
        try {
          console.log("Checking authentication with token:", token.substring(0, 10) + "...");
          
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log("Auth check response status:", response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log("User authenticated successfully:", userData);
            setUser(userData);
          } else {
            // Token is invalid or expired
            console.log("Token invalid or expired, status:", response.status);
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          setError("Failed to verify authentication");
        }
      } else {
        console.log("No token found in localStorage");
      }
      
      setLoading(false);
      console.log("Authentication check completed, loading set to false");
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (username, password) => {
    console.log("Login function called for user:", username);
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting login request to ${API_BASE_URL}/api/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      console.log("Login response status:", response.status);
      
      const data = await response.json();
      console.log("Login response data:", data);
      
      if (response.ok && data.access_token) {
        console.log("Login successful, storing token");
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user || { username: username }); // Fallback if user data not provided
        return true;
      } else {
        console.error("Login failed:", data.error || "Unknown error");
        setError(data.error || "Login failed");
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
      console.log("Login attempt completed, loading set to false");
    }
  };

  // Logout function
  const logout = () => {
    console.log("Logging out user");
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
    
    console.log(`Making authenticated request to: ${API_BASE_URL}${url}`);
    console.log("Request headers:", headers);
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
      });
      
      console.log(`Response status for ${url}:`, response.status);
      
      // If unauthorized, clear token and user
      if (response.status === 401) {
        console.log("Received 401 Unauthorized, clearing authentication");
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
      
      return response;
    } catch (error) {
      console.error(`Error in authFetch for ${url}:`, error);
      throw error;
    }
  };

  // Debug: Log when auth state changes
  useEffect(() => {
    console.log("Auth state updated - isAuthenticated:", !!token);
    console.log("User:", user);
  }, [token, user]);

  const authContextValue = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!token,
    authFetch,
    API_BASE_URL
  };
  
  console.log("Rendering AuthProvider with context:", {
    user: user ? "exists" : "null",
    loading,
    error: error || "none",
    isAuthenticated: !!token
  });

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth must be used within an AuthProvider");
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
