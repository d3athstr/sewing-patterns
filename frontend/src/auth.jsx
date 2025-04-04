import { useState, useEffect, createContext, useContext } from 'react';

// Create an authentication context
const AuthContext = createContext(null);

// Use relative URL or determine from window.location
const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') 
  ? 'http://localhost:5000'  // Local development
  : window.location.origin;  // Production/deployed environment

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Explicitly initialize isAuthenticated state
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  console.log("AuthProvider initialized with token:", token ? "exists" : "none");
  console.log("Initial isAuthenticated state:", isAuthenticated);
  console.log("Using API_BASE_URL:", API_BASE_URL);

  // Check if user is authenticated on load
  useEffect(() => {
    const checkAuth = async () => {
      console.log("checkAuth running, token:", token ? "exists" : "none");
      
      if (token) {
        try {
          console.log("Checking authentication with token:", token.substring(0, 10) + "...");
          
          // Use direct URL without /api prefix for auth endpoints
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log("Auth check response status:", response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log("User authenticated successfully:", userData);
            setUser(userData);
            setIsAuthenticated(true);
            console.log("isAuthenticated set to TRUE");
          } else {
            // Token is invalid or expired
            console.log("Token invalid or expired, status:", response.status);
            localStorage.removeItem('token');
            setToken(null);
            setIsAuthenticated(false);
            console.log("isAuthenticated set to FALSE");
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          setError("Failed to verify authentication");
          setIsAuthenticated(false);
          console.log("isAuthenticated set to FALSE due to error");
        }
      } else {
        console.log("No token found in localStorage");
        setIsAuthenticated(false);
        console.log("isAuthenticated set to FALSE due to no token");
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
      // Use direct URL without /api prefix for auth endpoints
      const loginUrl = `${API_BASE_URL}/auth/login`;
      console.log(`Attempting login request to ${loginUrl}`);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      console.log("Login response status:", response.status);
      
      if (!response.ok) {
        console.error("Login failed with status:", response.status);
        if (response.status === 404) {
          throw new Error("Login endpoint not found. Please check server configuration.");
        }
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Login failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Login response data:", data);
      
      if (data.access_token) {
        console.log("Login successful, storing token");
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user || { username: username }); // Fallback if user data not provided
        setIsAuthenticated(true);
        console.log("isAuthenticated set to TRUE after successful login");
        return true;
      } else {
        console.error("Login failed: No access token in response");
        setError("Login failed: Invalid server response");
        setIsAuthenticated(false);
        console.log("isAuthenticated set to FALSE after failed login");
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
      setIsAuthenticated(false);
      console.log("isAuthenticated set to FALSE due to login error");
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
    setIsAuthenticated(false);
    console.log("isAuthenticated set to FALSE after logout");
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
    
    // Ensure URL starts with a slash if it doesn't already
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    
    // Special handling for auth endpoints - remove /api prefix
    const finalUrl = normalizedUrl.startsWith('/api/auth/') 
      ? `${API_BASE_URL}${normalizedUrl.replace('/api/auth/', '/auth/')}`
      : `${API_BASE_URL}${normalizedUrl}`;
      
    console.log(`Making authenticated request to: ${finalUrl}`);
    console.log("Request headers:", headers);
    
    try {
      const response = await fetch(finalUrl, {
        ...options,
        headers
      });
      
      console.log(`Response status for ${normalizedUrl}:`, response.status);
      
      // If unauthorized, clear token and user
      if (response.status === 401) {
        console.log("Received 401 Unauthorized, clearing authentication");
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        console.log("isAuthenticated set to FALSE due to 401 response");
      }
      
      return response;
    } catch (error) {
      console.error(`Error in authFetch for ${normalizedUrl}:`, error);
      throw error;
    }
  };

  // Debug: Log when auth state changes
  useEffect(() => {
    console.log("Auth state updated - isAuthenticated:", isAuthenticated);
    console.log("User:", user);
  }, [isAuthenticated, user]);

  const authContextValue = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    authFetch,
    API_BASE_URL
  };
  
  console.log("Rendering AuthProvider with context:", {
    user: user ? "exists" : "null",
    loading,
    error: error || "none",
    isAuthenticated
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
