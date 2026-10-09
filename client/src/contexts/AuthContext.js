import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const parseJsonResponse = async (res) => {
  try {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { error: text || `Server error (${res.status})` };
    }
  } catch {
    return { error: `Network error (${res.status})` };
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { token } : null;
  });
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await parseJsonResponse(res);
            setCurrentUser({ token });
            setDbUser(data);
          } else if (res.status === 401 || res.status === 403) {
            // Only clear token if server explicitly invalidates authentication
            localStorage.removeItem('token');
            setCurrentUser(null);
            setDbUser(null);
          }
        } catch (error) {
          console.warn("Could not reach backend (server starting or cold-start):", error);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    localStorage.setItem('token', data.token);
    setCurrentUser({ token: data.token });
    setDbUser(data.user);
  };

  const register = async (email, password, name) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    localStorage.setItem('token', data.token);
    setCurrentUser({ token: data.token });
    setDbUser(data.user);
  };

  const loginWithGoogle = async () => {
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('../config/firebase');
      const result = await signInWithPopup(auth, googleProvider);
      
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL,
          googleId: result.user.uid
        })
      });
      
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status}): Please check backend URL configuration on Vercel.`);
      }
      
      if (!data.token) {
        throw new Error('Server did not return authentication token.');
      }

      localStorage.setItem('token', data.token);
      setCurrentUser({ token: data.token });
      setDbUser(data.user);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateProfile = async (displayName, photoURL) => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ displayName, photoURL })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to update profile');
      err.suggestions = data.suggestions;
      throw err;
    }
    setDbUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setDbUser(null);
  };

  const getToken = () => localStorage.getItem('token');

  const value = {
    currentUser,
    dbUser,
    isAdmin: dbUser?.role === 'admin',
    login,
    register,
    signup: register,
    loginWithGoogle,
    googleSignIn: loginWithGoogle,
    updateProfile,
    logout,
    getToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
