import React, { useState } from 'react';
import api from '../services/api';
import '../styles/LoginPage.css';

function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    clientName: '',
    clientType: 'hospital',
  });

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Login
        const response = await api.post('/auth/login', {
          username: formData.username,
          password: formData.password,
        });

        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('clientId', response.data.clientId);

        setSuccess('¡Login exitoso! Redirigiendo...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        // Register
        const response = await api.post('/auth/register', formData);

        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('clientId', response.data.clientId);

        setSuccess('¡Registro exitoso! Redirigiendo...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error en la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🏥 VitaDoc</h1>
        <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ej: Dr. Juan García"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nombre del Establecimiento</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  placeholder="Ej: Clínica Central"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo de Establecimiento</label>
                <select
                  name="clientType"
                  value={formData.clientType}
                  onChange={handleChange}
                >
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clínica</option>
                  <option value="consultory">Consultorio</option>
                </select>
              </div>

              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nombre de usuario"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="toggle-form">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="btn-toggle"
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión aquí'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
