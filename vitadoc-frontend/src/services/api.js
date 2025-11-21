import axios from 'axios';

// ✅ CORRECTO: URL directa (sin process.env que causa problemas)
const API_BASE_URL = 'https://vitadoc-backend.onrender.com';

// ⚠️ IMPORTANTE: Agregar /api al baseURL
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ INTERCEPTOR REQUEST: Agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ INTERCEPTOR RESPONSE: Manejar errores globalmente
api.interceptors.response.use(
  (response) => {
    // ✅ Respuesta exitosa
    return response;
  },
  (error) => {
    // ❌ Error en la respuesta
    
    if (!error.response) {
      // Error de red (sin respuesta del servidor)
      console.error('❌ Error de conexión:', error.message);
      alert('⚠️ Error de conexión. Verifica tu internet.');
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 401) {
      // Token expiró o inválido
      console.warn('⚠️ Sesión expirado (401)');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status === 403) {
      // Acceso denegado
      console.error('❌ Acceso denegado (403)');
      alert('❌ No tienes permiso para realizar esta acción');
      return Promise.reject(error);
    }

    if (status >= 500) {
      // Error del servidor
      console.error(`❌ Error servidor (${status}):`, error.response.data);
      alert('❌ Error en el servidor. Intenta más tarde.');
      return Promise.reject(error);
    }

    if (status >= 400) {
      // Error del cliente (400, 404, etc)
      console.error(`❌ Error (${status}):`, error.response.data);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
