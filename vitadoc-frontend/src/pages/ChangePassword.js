import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/DoctorLogin.css'; // Reusamos estilos para mantener consistencia

export default function ChangePassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('La nueva contraseña no puede ser igual a la anterior');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess('¡Contraseña actualizada exitosamente!');
        
        // Actualizar el estado local del usuario para quitar el bloqueo
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.must_change_password = false;
        localStorage.setItem('user', JSON.stringify(storedUser));

        // Redirigir después de 1.5 segundos
        setTimeout(() => {
          if (storedUser.role === 'admin' && !storedUser.tenant_id) {
             navigate('/admin', { replace: true });
          } else {
             navigate('/doctor-patient-action', { replace: true });
          }
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="doctor-login-container" style={{maxWidth: '450px'}}>
        <div className="login-header">
          <h2 style={{color: '#d32f2f', marginBottom: '10px'}}>⚠️ Cambio Obligatorio</h2>
          <p className="login-subtitle">
            Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Contraseña Actual (Temporal)</label>
            <input
              type="password"
              name="currentPassword"
              className="input-field"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Nueva Contraseña</label>
            <input
              type="password"
              name="newPassword"
              className="input-field"
              placeholder="Mínimo 8 caracteres"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              className="input-field"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message" style={{color: '#16a34a', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold'}}>{success}</div>}

          <button
            type="submit"
            className="btn btn-iniciarsesion btn-full"
            disabled={loading}
            style={{background: loading ? '#ccc' : '#d32f2f', borderColor: '#d32f2f'}}
          >
            {loading ? 'Actualizando...' : 'Cambiar Contraseña y Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}