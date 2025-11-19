// vitadoc-frontend/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <p>⏳ Cargando...</p>
      </div>
    );
  }

  // No autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Requiere SUPER-ADMIN pero no lo es
  if (requireSuperAdmin && !isSuperAdmin) {
    console.warn('⚠️ Acceso denegado: No es SUPER-ADMIN');
    return <Navigate to="/doctor-type-selection" replace />;
  }

  return children;
}
