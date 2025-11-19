import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/InvitationsManager.css';

export default function InvitationsManager() {
  const [invitations, setInvitations] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'doctor',
    notes: '',
  });

  useEffect(() => {
    fetchClients();
    fetchInvitations();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/invitations');
      setInvitations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId) {
      alert('❌ Debe seleccionar un cliente');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/invitations', {
        clientId: formData.clientId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        notes: formData.notes,
      });

      setInvitations((prev) => [response.data.data, ...prev]);
      setFormData({
        clientId: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'doctor',
        notes: '',
      });
      setShowForm(false);
      alert(`✅ Invitación creada exitosamente\n\nToken: ${response.data.data.invitation_token}`);
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert('❌ Error al crear invitación: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    alert('✅ Token copiado al portapapeles');
  };

  const handleDeleteInvitation = async (invitationId) => {
    if (window.confirm('⚠️ ¿Revocar esta invitación?')) {
      try {
        await api.delete(`/invitations/${invitationId}`);
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
        alert('✅ Invitación revocada');
      } catch (error) {
        console.error('Error deleting invitation:', error);
        alert('❌ Error al revocar invitación');
      }
    }
  };

  const filteredInvitations = invitations.filter((inv) => {
    const matchesSearch =
      inv.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      filterStatus === 'all' || inv.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const roleIcons = {
    admin: '👨‍💼',
    doctor: '👨‍⚕️',
    nurse: '👩‍⚕️',
    assistant: '📋'
  };

  return (
    <div className="invitations-manager">
      <div className="manager-header">
        <div>
          <h2>Gestión de Invitaciones</h2>
          <p className="header-subtitle">Invita usuarios a las clínicas para usar VitaDoc</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setFormData({
              clientId: '',
              fullName: '',
              email: '',
              phone: '',
              role: 'doctor',
              notes: '',
            });
            setShowForm(!showForm);
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Nueva Invitación'}
        </button>
      </div>

      {/* FILTROS */}
      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">📊 Todos los estados</option>
            <option value="pending">⏳ Pendientes</option>
            <option value="accepted">✓ Aceptadas</option>
            <option value="rejected">✗ Rechazadas</option>
          </select>
        </div>
      </div>

      {/* FORMULARIO */}
      {showForm && (
        <form className="invitation-form" onSubmit={handleSubmit}>
          <h3>➕ Nueva Invitación</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Seleccionar Cliente *</label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Elige una clínica --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Rol *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="admin">👨‍💼 Admin de Clínica</option>
                <option value="doctor">👨‍⚕️ Doctor</option>
                <option value="nurse">👩‍⚕️ Enfermera</option>
                <option value="assistant">📋 Asistente</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="Dr. Juan Pérez"
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="doctor@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+57-300-1234567"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Notas (Opcional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Agregar notas relevantes..."
              rows="2"
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? '⏳ Enviando...' : '✅ Crear Invitación'}
          </button>
        </form>
      )}

      {/* LISTADO DE INVITACIONES */}
      {loading && !showForm ? (
        <div className="loading">⏳ Cargando invitaciones...</div>
      ) : (
        <div className="invitations-list">
          {filteredInvitations.length === 0 ? (
            <p className="no-data">📭 No hay invitaciones</p>
          ) : (
            filteredInvitations.map((invitation) => (
              <div key={invitation.id} className="invitation-item">
                <div className="invitation-icon">
                  {roleIcons[invitation.role] || '👤'}
                </div>
                
                <div className="invitation-info">
                  <h4>{invitation.full_name}</h4>
                  <p><strong>Email:</strong> {invitation.email}</p>
                  <p><strong>Rol:</strong> {invitation.role}</p>
                  <p><strong>Estado:</strong> 
                    <span className={`status ${invitation.status}`}>
                      {invitation.status === 'pending' && '⏳ Pendiente'}
                      {invitation.status === 'accepted' && '✓ Aceptada'}
                      {invitation.status === 'rejected' && '✗ Rechazada'}
                    </span>
                  </p>
                </div>

                <div className="invitation-token">
                  <p><strong>Token:</strong></p>
                  <code>{invitation.invitation_token?.substring(0, 16)}...</code>
                  <button
                    className="btn-copy"
                    onClick={() => handleCopyToken(invitation.invitation_token)}
                    title="Copiar token completo"
                  >
                    📋 Copiar
                  </button>
                </div>

                <button
                  className="btn-delete"
                  onClick={() => handleDeleteInvitation(invitation.id)}
                >
                  🗑️ Revocar
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
