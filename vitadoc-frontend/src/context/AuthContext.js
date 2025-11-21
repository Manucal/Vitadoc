// vitadoc-frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // ✅ CORRECTO: Usar api.js (que ya tiene /api en baseURL)
      const response = await api.get('/auth/me');
      setUser(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Token inválido:', err);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // ✅ CORRECTO: Usar api.js en lugar de fetch directamente
      // api.js ya tiene:
      // - baseURL: https://vitadoc-backend.onrender.com/api
      // - Interceptores para JWT
      // - Manejo de CORS
      const response = await api.post('/auth/login', { username, password });
      
      const data = response.data;

      localStorage.setItem('authToken', data.token);
      setUser({
        id: data.userId,
        tenant_id: data.clientId,
        isSuperAdmin: data.isSuperAdmin,
        role: 'admin',
      });
      setError(null);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      // ✅ CORRECTO: Usar api.js
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Error al logout:', err);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const isSuperAdmin = user?.isSuperAdmin === true || (user?.role === 'admin' && user?.tenant_id === null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
