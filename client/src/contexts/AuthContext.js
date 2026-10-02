import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Will hold the token
  const [dbUser, setDbUser] = useState(null); // Will hold the user object
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser({ token });
            setDbUser(data);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error("Failed to fetch user", error);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setCurrentUser({ token: data.token });
    setDbUser(data.user);
  };

  const register = async (email, password, name) => {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setCurrentUser({ token: data.token });
    setDbUser(data.user);
  };

  const loginWithGoogle = async () => {
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('../config/firebase');
      const result = await signInWithPopup(auth, googleProvider);
      
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL,
          googleId: result.user.uid
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Google login failed on server');
      }
      
      const data = await res.json();
      localStorage.setItem('token', data.token);
      setCurrentUser({ token: data.token });
      setDbUser(data.user);
    } catch (error) {
      console.error(error);
      throw error;
    }
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
    login,
    register,
    signup: register,
    loginWithGoogle,
    googleSignIn: loginWithGoogle,
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
