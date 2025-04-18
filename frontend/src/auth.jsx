import { useState, useEffect, createContext, useContext } from 'react';

// Create an authentication context
const AuthContext = createContext(null);

// Use direct port 5000 connection to backend API based on curl test results
const API_BASE_URL = "https://garmentgallery.empire12.net/";

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
          
          // Use direct API endpoint with port 5000
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            // Add cache control to prevent caching
            cache: 'no-store'
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
      // Use direct API endpoint with port 5000 as confirmed by curl test
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      console.log(`Attempting login request to ${loginUrl}`);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        // Add cache control to prevent caching
        cache: 'no-store'
      });
      
      console.log("Login response status:", response.status);
      
      if (!response.ok) {
        console.error("Login failed with status:", response.status);
        if (response.status === 404) {
          throw new Error("Login endpoint not found. Please check server configuration.");
        }
        if (response.status === 405) {
          throw new Error("Method not allowed. The server doesn't accept POST requests to this endpoint.");
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
    
    // Use direct API endpoint with port 5000
    const finalUrl = `${API_BASE_URL}${normalizedUrl}`;
      
    console.log(`Making authenticated request to: ${finalUrl}`);
    console.log("Request headers:", headers);
    
    try {
      // Add cache control to all requests
      const fetchOptions = {
        ...options,
        headers,
        cache: 'no-store'
      };
      
      const response = await fetch(finalUrl, fetchOptions);
      
      console.log(`Response status for ${normalizedUrl}:`, response.status);
      
      // Log response body for debugging
      if (response.status !== 200) {
        const responseText = await response.clone().text();
        console.error(`Error response body: ${responseText}`);
      }
      
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
