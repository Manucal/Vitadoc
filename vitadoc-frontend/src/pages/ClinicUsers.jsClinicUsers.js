import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/AdminPage.css'; // Usamos estilos existentes para ahorrar tiempo

export default function ClinicUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para el modal de crear usuario
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    document_id: '',
    phone: '',
    role: 'doctor' // Rol por defecto
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [tempPassword, setTempPassword] = useState(''); // Para mostrar la contraseña generada

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar el equipo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setTempPassword('');
    
    try {
      setCreating(true);
      const response = await api.post('/users', newUser, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.data.success) {
        // Usuario creado con éxito
        setTempPassword(response.data.tempPassword); // Mostrar contraseña temporal
        await fetchUsers(); // Recargar lista
        setNewUser({ full_name: '', email: '', document_id: '', phone: '', role: 'doctor' }); // Limpiar form
        alert('✅ Usuario creado correctamente.');
      }

    } catch (err) {
      console.error(err);
      // 🔒 AQUÍ CAPTURAMOS EL BLOQUEO DEL PLAN
      if (err.response && err.response.data && err.response.data.code === 'PLAN_LIMIT_REACHED') {
        setCreateError(`⛔ ${err.response.data.error}`);
        // Opcional: Aquí podrías mostrar un botón de "Mejorar Plan"
      } else {
        setCreateError(err.response?.data?.error || 'Error al crear usuario.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCreateError('');
    setTempPassword('');
  };

  return (
    <div className="page-center">
      <div className="admin-container" style={{ maxWidth: '1000px' }}>
        <div className="admin-header">
          <h2>Gestión de Equipo Médico</h2>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => navigate('/doctor-patient-action')}>
              ← Volver
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              + Nuevo Usuario
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Email</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{textAlign: 'center'}}>Cargando equipo...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign: 'center'}}>No hay usuarios registrados.</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.full_name}</strong>
                      <br/>
                      <small style={{color: '#666'}}>{user.document_id}</small>
                    </td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'admin' ? 'Admin' : 
                         user.role === 'nurse' ? 'Enfermería' : 
                         user.role === 'secretary' ? 'Secretaría' : 'Médico'}
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status-badge status-${user.status}`}>
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL PARA CREAR USUARIO */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Agregar Miembro al Equipo</h3>
                <button className="modal-close-btn" onClick={handleCloseModal}>✕</button>
              </div>
              
              <div className="modal-body">
                {createError && (
                  <div className="alert alert-error" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #ef4444' }}>
                    <strong>{createError}</strong>
                  </div>
                )}

                {tempPassword ? (
                  <div className="success-message" style={{ textAlign: 'center', padding: '20px' }}>
                    <h4 style={{ color: '#16a34a' }}>¡Usuario Creado!</h4>
                    <p>Por favor copia la contraseña temporal:</p>
                    <div style={{ background: '#f3f4f6', padding: '10px', margin: '10px 0', fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold' }}>
                      {tempPassword}
                    </div>
                    <button className="btn btn-primary" onClick={handleCloseModal}>Cerrar</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Nombre Completo</label>
                      <input name="full_name" value={newUser.full_name} onChange={handleInputChange} className="input-field" required />
                    </div>
                    
                    <div className="form-group">
                      <label>Cédula / Documento</label>
                      <input name="document_id" value={newUser.document_id} onChange={handleInputChange} className="input-field" required />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" name="email" value={newUser.email} onChange={handleInputChange} className="input-field" required />
                    </div>

                    <div className="form-group">
                      <label>Rol</label>
                      <select name="role" value={newUser.role} onChange={handleInputChange} className="input-field">
                        <option value="doctor">Médico</option>
                        <option value="nurse">Enfermera(o)</option>
                        <option value="secretary">Secretaria(o)</option>
                        <option value="admin">Administrador (Puede editar)</option>
                      </select>
                    </div>

                    <div className="modal-actions">
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={creating}>
                        {creating ? 'Verificando Plan...' : 'Crear Usuario'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}