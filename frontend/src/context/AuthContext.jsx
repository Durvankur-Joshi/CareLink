import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('carelink_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('carelink_token');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        if (response.data?.success && response.data?.data?.user) {
          setUser(response.data.data.user);
          setToken(storedToken);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('carelink_token');
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        localStorage.removeItem('carelink_token');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { user: loggedInUser, token: authToken } = response.data.data;
    localStorage.setItem('carelink_token', authToken);
    setToken(authToken);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    return loggedInUser;
  };

  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    const { user: registeredUser, token: authToken } = response.data.data;
    localStorage.setItem('carelink_token', authToken);
    setToken(authToken);
    setUser(registeredUser);
    setIsAuthenticated(true);
    return registeredUser;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
    } finally {
      localStorage.removeItem('carelink_token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
