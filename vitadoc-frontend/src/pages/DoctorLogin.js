import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/DoctorLogin.css';

export default function DoctorLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doctorType = localStorage.getItem('doctorType');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!username || !password) {
        setError('Por favor completa todos los campos');
        setLoading(false);
        return;
      }

      // ✅ Usar AuthContext.login()
      const data = await login(username, password);

      console.log('✅ Login exitoso:', data);

      // ============================================================
      // 🟢 GUARDAR EL USUARIO EN LOCAL STORAGE
      // ============================================================
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('💾 Usuario guardado en Local Storage:', data.user);
      }
      // ============================================================

      // 🛑 NUEVO: Verificar si DEBE cambiar contraseña (SECUESTRO)
      if (data.user.must_change_password) {
        console.log('⚠️ Cambio de contraseña obligatorio detectado');
        navigate('/change-password', { replace: true });
        return;
      }

      // Si no, flujo normal
      if (data.isSuperAdmin === true) {
        console.log('🔐 SUPER-ADMIN detectado, redirigiendo a /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('👤 Usuario clínica, redirigiendo a /doctor-patient-action');
        navigate('/doctor-patient-action', { replace: true });
      }
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    localStorage.removeItem('doctorType');
    navigate('/doctor-type-selection');
  };

  return (
    <div className="page-center">
      <div className="doctor-login-container">
        <button className="back-button" onClick={handleBack}>
          ← Atrás
        </button>

        <div className="login-header">
          <img src="/logotipo.png" alt="VitaDoc" className="logo" />
          <p className="login-subtitle">
            {doctorType === 'clinic' ? ' Médico de Clínica' : ' Médico Privado'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              className="input-field"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              className="input-field"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-iniciarsesion btn-full"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="footer-text">
          ¿Problemas para ingresar?{' '}
          <a href="#" className="link">
            Contacta al administrador
          </a>
        </p>
      </div>
    </div>
  );
}