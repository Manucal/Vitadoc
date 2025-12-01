import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/ClinicUsers.css';

export default function ClinicUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Datos
  const [userData, setUserData] = useState({
    id: null,
    full_name: '',
    email: '',
    document_id: '',
    phone: '',
    role: 'doctor'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  
  // Resultados exitosos
  const [tempPassword, setTempPassword] = useState('');
  const [resetName, setResetName] = useState('');

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
      setError('Error al cargar el equipo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setUserData({ id: null, full_name: '', email: '', document_id: '', phone: '', role: 'doctor' });
    setIsEditing(false);
    setTempPassword('');
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setUserData({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      document_id: user.document_id || '',
      phone: user.phone || '',
      role: user.role
    });
    setIsEditing(true);
    setTempPassword('');
    setModalError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setTempPassword('');
    
    try {
      setIsSubmitting(true);
      let response;

      if (isEditing) {
        // EDITAR
        response = await api.put(`/users/${userData.id}`, userData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        alert('✅ Usuario actualizado correctamente');
        setShowModal(false);
      } else {
        // CREAR
        response = await api.post('/users', userData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        setTempPassword(response.data.tempPassword);
      }

      await fetchUsers();
      if (!response.data.tempPassword) { 
         // Si es edición, cerramos. Si es creación, mantenemos abierto para mostrar pass.
      }

    } catch (err) {
      if (err.response?.data?.code === 'PLAN_LIMIT_REACHED') {
        setModalError(`⛔ ${err.response.data.error}`);
      } else {
        setModalError(err.response?.data?.error || 'Error al procesar.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(`¿Resetear contraseña para ${user.full_name}? Se generará una nueva temporal.`)) return;

    try {
      const response = await api.post(`/users/${user.id}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.data.success) {
        setTempPassword(response.data.tempPassword);
        setResetName(user.full_name);
        setShowResetModal(true);
      }
    } catch (err) {
      alert('Error al resetear contraseña: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      fetchUsers();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="page-center">
      <div className="clinic-container">
        
        {/* ✅ BOTÓN ATRÁS SIMPLE (Fuera del header, arriba a la izquierda) */}
        <button className="back-button-simple" onClick={() => navigate('/doctor-patient-action')}>
          ← Atrás
        </button>

        <div className="clinic-header">
          <h2>Gestión de Equipo Médico</h2>
          <div className="header-actions">
            {/* El botón Volver se movió arriba, aquí solo queda Nuevo Usuario */}
            <button className="btn-primary" onClick={openCreateModal}>
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
                <th style={{textAlign: 'right'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.full_name}</strong><br/>
                    <small style={{color:'#888'}}>{user.document_id}</small>
                  </td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'nurse' ? 'Enfermería' : user.role === 'secretary' ? 'Secretaría' : 'Médico'}
                    </span>
                  </td>
                  <td>{user.email}</td>
                  <td><span className="status-badge status-active">Activo</span></td>
                  <td style={{textAlign: 'right'}}>
                    <div className="action-buttons-row">
                      <button className="btn-icon edit" title="Editar" onClick={() => openEditModal(user)}>✏️</button>
                      <button className="btn-icon key" title="Resetear Contraseña" onClick={() => handleResetPassword(user)}>🔑</button>
                      {user.role !== 'admin' && (
                        <button className="btn-icon delete" title="Eliminar" onClick={() => handleDelete(user.id)}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL CREAR/EDITAR */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>
              
              <div className="modal-body">
                {modalError && <div className="alert alert-error">{modalError}</div>}

                {/* Si se creó y hay password temporal, mostrarlo */}
                {!isEditing && tempPassword ? (
                  <div className="success-message" style={{textAlign:'center'}}>
                    <h4 style={{color:'#16a34a'}}>¡Usuario Creado!</h4>
                    <p>Contraseña temporal:</p>
                    <div style={{background:'#f3f4f6', padding:'10px', fontSize:'18px', fontWeight:'bold', margin:'10px 0'}}>
                      {tempPassword}
                    </div>
                    <button className="btn-primary" style={{width:'100%'}} onClick={() => setShowModal(false)}>Cerrar</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Nombre Completo</label>
                      <input name="full_name" value={userData.full_name} onChange={handleInputChange} className="input-field" required />
                    </div>
                    <div className="form-group">
                      <label>Cédula / Documento</label>
                      <input name="document_id" value={userData.document_id} onChange={handleInputChange} className="input-field" required />
                    </div>
                    <div className="form-group">
                      <label>Email (Usuario)</label>
                      <input type="email" name="email" value={userData.email} onChange={handleInputChange} className="input-field" required disabled={isEditing} />
                      {isEditing && <small style={{color:'#999'}}>El email no se puede cambiar</small>}
                    </div>
                    <div className="form-group">
                      <label>Rol</label>
                      <select name="role" value={userData.role} onChange={handleInputChange} className="input-field">
                        <option value="doctor">Médico</option>
                        <option value="nurse">Enfermería</option>
                        <option value="secretary">Secretaría</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                      <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Usuario')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL RESET PASSWORD */}
        {showResetModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{textAlign:'center'}}>
              <h3 style={{color:'#eab308'}}>🔑 Contraseña Reseteada</h3>
              <p>Nueva contraseña temporal para <strong>{resetName}</strong>:</p>
              <div style={{background:'#fffbeb', padding:'15px', border:'2px dashed #eab308', fontSize:'20px', fontWeight:'bold', margin:'20px 0', color:'#333'}}>
                {tempPassword}
              </div>
              <p style={{fontSize:'13px', color:'#666'}}>Por favor entrégala al usuario. Deberá cambiarla al ingresar.</p>
              <button className="btn-primary" style={{marginTop:'10px'}} onClick={() => setShowResetModal(false)}>Entendido</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}