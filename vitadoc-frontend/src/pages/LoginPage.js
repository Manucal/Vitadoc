import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(username, password);
      
      console.log('✅ Login exitoso:', data);
      
      // ✅ Verificar isSuperAdmin
      if (data.isSuperAdmin === true) {
        console.log('🔐 SUPER-ADMIN detectado, redirigiendo a /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('👤 Usuario normal, redirigiendo a /doctor-type-selection');
        navigate('/doctor-type-selection', { replace: true });
      }
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <h1>🏥 VitaDoc</h1>
          <p className="subtitle">Sistema de Historias Clínicas</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="super"
                required
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-login">
              {loading ? 'Conectando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="footer-text">
            © 2025 VitaDoc - Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
