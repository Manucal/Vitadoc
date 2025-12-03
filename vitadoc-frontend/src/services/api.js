import axios from 'axios';

// ✅ URL del Backend
const API_BASE_URL = 'https://vitadoc-backend.onrender.com';

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

// ✅ INTERCEPTOR RESPONSE: Manejo inteligente de errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      console.error('❌ Error de conexión:', error.message);
      alert('⚠️ Error de conexión. Verifica tu internet.');
      return Promise.reject(error);
    }

    const status = error.response.status;
    const originalRequestUrl = error.config.url; // 👈 Capturamos qué URL falló

    // 1️⃣ MANEJO DEL ERROR 401 (No autorizado)
    if (status === 401) {
      // 🛑 EXCEPCIÓN IMPORTANTE: 
      // Si el error viene del LOGIN, NO redireccionar. Deja que el usuario vea el mensaje "Contraseña incorrecta".
      if (originalRequestUrl && originalRequestUrl.includes('/login')) {
        return Promise.reject(error);
      }

      // Si el error 401 ocurre en CUALQUIER OTRA PARTE (sesión vencida real)
      console.warn('⚠️ Sesión expirada (401). Redirigiendo al inicio...');
      localStorage.removeItem('authToken');
      
      // ✅ CORRECCIÓN: Redirigir a una ruta que SÍ existe
      window.location.href = '/doctor-type-selection'; 
      return Promise.reject(error);
    }

    // 2️⃣ MANEJO DE OTROS ERRORES
    if (status === 403) {
      console.error('❌ Acceso denegado (403)');
      alert('❌ No tienes permiso para realizar esta acción');
    }

    if (status >= 500) {
      console.error(`❌ Error servidor (${status}):`, error.response.data);
      alert('❌ Error en el servidor. Intenta más tarde.');
    }

    return Promise.reject(error);
  }
);

export default api;