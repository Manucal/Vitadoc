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
    const storedUser = localStorage.getItem('user');

    if (!token) {
      setLoading(false);
      return;
    }

    // Si ya tenemos usuario en local, lo cargamos rápido
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    try {
      const response = await api.get('/auth/me');
      // Actualizamos con la info fresca del servidor
      const userData = response.data.data || response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData)); // Actualizar local
      setError(null);
    } catch (err) {
      console.error('Token inválido o expirado:', err);
      // Si falla, limpiamos todo por seguridad
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;

      // 1. Guardar Token
      localStorage.setItem('authToken', data.token);

      // 2. Construir objeto de usuario con datos REALES del backend
      // (Intentamos leer data.user, si no existe construimos uno con lo que haya)
      const userData = data.user || {
        id: data.userId,
        tenant_id: data.clientId, // O data.tenantId según tu backend
        role: data.role,          // ¡IMPORTANTE! Usar el rol real
        fullName: data.full_name || username,
        isSuperAdmin: data.isSuperAdmin
      };

      // 3. Guardar Usuario en Estado y en LocalStorage (¡El paso que faltaba!)
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setError(null);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error al iniciar sesión';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      // Intentar avisar al backend (opcional)
      await api.post('/auth/logout'); 
    } catch (err) {
      console.error('Logout local:', err);
    } finally {
      // Limpiar todo
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('doctorType');
      localStorage.removeItem('userId');
      localStorage.removeItem('clientId');
      setUser(null);
    }
  };

  const isSuperAdmin = user?.isSuperAdmin === true || (user?.role === 'admin' && !user?.tenant_id);

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