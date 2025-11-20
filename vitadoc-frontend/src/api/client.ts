// VitaDoc Frontend - Cliente HTTP
// Archivo: vitadocfrontend/src/api/client.ts
// Descripción: Cliente reutilizable para todas las llamadas al backend

import axios, { AxiosInstance, AxiosError } from 'axios';

// Tipos de respuesta estándar
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// Crear instancia de axios configurada
const createApiClient = (): AxiosInstance => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    console.warn('⚠️ VITE_API_URL no está definida. Revisa .env.local');
  }

  const client = axios.create({
    baseURL: apiUrl,
    timeout: 10000, // 10 segundos
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor: Agregar token de autenticación si existe
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor: Manejar errores globales
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expirado - limpiar localStorage y redirigir a login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// Métodos helpers para llamadas comunes
export const api = {
  // GET
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.get<ApiResponse<T>>(endpoint);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // POST
  post: async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.post<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // PUT
  put: async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.put<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // DELETE
  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.delete<ApiResponse<T>>(endpoint);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Función para manejar errores
const handleApiError = (error: any): ApiResponse<never> => {
  console.error('❌ Error de API:', error);

  if (axios.isAxiosError(error)) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      message: error.response?.data?.message || 'Error desconocido',
    };
  }

  return {
    success: false,
    error: 'Error de conexión',
  };
};

export default api;
