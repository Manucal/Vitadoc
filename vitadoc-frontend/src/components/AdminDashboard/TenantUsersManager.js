import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import DeleteConfirmModal from '../DeleteConfirmModal';
import '../../styles/TenantUsersManager.css';

export default function TenantUsersManager({ tenantId, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: ''
  });

  // Estados para información de plan y límites
  const [tenantInfo, setTenantInfo] = useState({
    plan: 'basic',
    limit: 1,
    currentUsers: 0
  });

  // Estados para modal de eliminación
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null,
    userName: null
  });
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTenantInfo();
    fetchTenantUsers();
  }, [tenantId]);

  // Obtener información del tenant (plan y límite)
  const fetchTenantInfo = async () => {
    try {
      const response = await api.get('/tenants');
      const tenant = response.data.data?.find(t => t.id === tenantId);
      
      if (tenant) {
        const planLimits = {
          basic: 1,
          standard: 3,
          premium: 5,
          enterprise: 999999
        };

        setTenantInfo({
          plan: tenant.subscription_plan || 'basic',
          limit: planLimits[tenant.subscription_plan] || 1,
          currentUsers: tenant.user_count || 0
        });
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error);
      toast.error('❌ Error al cargar información de la clínica');
    }
  };

  const fetchTenantUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tenants/${tenantId}/users`);
      setUsers(response.data.data || []);
      
      // Actualizar conteo de usuarios
      setTenantInfo(prev => ({
        ...prev,
        currentUsers: response.data.data?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('❌ Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    });
  };

  const handleSaveEdit = async () => {
    try {
      const updateToast = toast.loading('⏳ Actualizando usuario...');
      await api.put(`/tenants/${tenantId}/users/${editingId}`, editForm);
      setUsers(users.map(u => u.id === editingId ? { ...u, ...editForm } : u));
      
      toast.dismiss(updateToast);
      toast.success('✓ Usuario actualizado exitosamente');
      setEditingId(null);
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMsg = error.response?.data?.error || 'Error desconocido';
      toast.error('❌ Error al actualizar usuario: ' + errorMsg);
    }
  };

  // Abrir modal de eliminación
  const handleDeleteUser = (userId, userName) => {
    setDeleteModal({
      isOpen: true,
      userId,
      userName
    });
    setDeleteStep(1);
  };

  // Confirmar eliminación (2 pasos)
  const handleConfirmDelete = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    if (deleteStep === 2) {
      try {
        setIsDeleting(true);
        const deleteToast = toast.loading('⏳ Eliminando usuario...');
        
        await api.delete(`/tenants/${tenantId}/users/${deleteModal.userId}`);
        setUsers(users.filter(u => u.id !== deleteModal.userId));
        
        // Actualizar información del tenant
        await fetchTenantInfo();
        
        toast.dismiss(deleteToast);
        toast.success('✓ Usuario eliminado exitosamente');
        setDeleteModal({ isOpen: false, userId: null, userName: null });
        setDeleteStep(1);
      } catch (error) {
        console.error('Error deleting user:', error);
        const errorMsg = error.response?.data?.error || 'Error desconocido';
        toast.error('❌ Error al eliminar usuario: ' + errorMsg);
        setIsDeleting(false);
      }
    }
  };

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, userId: null, userName: null });
    setDeleteStep(1);
    setIsDeleting(false);
  };

  // ✨ NUEVO: Calcular estados del plan
  const isLimitReached = tenantInfo.currentUsers >= tenantInfo.limit;
  const isNearLimit = tenantInfo.currentUsers >= tenantInfo.limit * 0.75 && !isLimitReached;
  const usersRemaining = tenantInfo.limit - tenantInfo.currentUsers;
  const progressPercent = Math.min((tenantInfo.currentUsers / tenantInfo.limit) * 100, 100);

  // ✨ NUEVO: Determinar clase del badge
  const getBadgeClass = () => {
    if (isLimitReached) return 'danger';
    if (isNearLimit) return 'warning';
    return 'success';
  };

  // ✨ NUEVO: Determinar clase del progress bar
  const getProgressClass = () => {
    if (isLimitReached) return 'danger';
    if (isNearLimit) return 'warning';
    return '';
  };

  // ✨ NUEVO: Obtener texto de estado
  const getStatusInfo = () => {
    if (isLimitReached) {
      return {
        text: `⚠️ Límite alcanzado (${tenantInfo.currentUsers}/${tenantInfo.limit})`,
        className: 'status-text danger'
      };
    }
    if (isNearLimit) {
      return {
        text: `⚡ ${usersRemaining} usuario${usersRemaining !== 1 ? 's' : ''} disponible${usersRemaining !== 1 ? 's' : ''}`,
        className: 'status-text warning'
      };
    }
    return {
      text: `✅ ${usersRemaining} usuarios disponibles`,
      className: 'status-text success'
    };
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return <div className="users-manager-loading">⏳ Cargando usuarios...</div>;
  }

  return (
    <div className="tenant-users-manager">
      {/* HEADER */}
      <div className="users-manager-header">
        <h3>👥 Gestión de Usuarios</h3>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      {/* ✨ NUEVO: PLAN INFO SECTION */}
      <div className="plan-info">
        <div className="plan-header">
          <h3 className="plan-name">Plan: {tenantInfo.plan.toUpperCase()}</h3>
          <span className="plan-price">
            {tenantInfo.limit === 999999 ? 'Usuarios ilimitados' : `Máximo: ${tenantInfo.limit} usuario${tenantInfo.limit !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* User Count Badge */}
        <div className={`limit-badge ${getBadgeClass()}`}>
          <span className="user-count">{tenantInfo.currentUsers}</span>
          <span className="divider">/</span>
          <span className="max-count">{tenantInfo.limit === 999999 ? '∞' : tenantInfo.limit}</span>
        </div>

        {/* Progress Bar */}
        {tenantInfo.limit !== 999999 && (
          <div className="progress-bar-container">
            <div className="progress-bar-label">
              <span>Uso del plan</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${getProgressClass()}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Text */}
        <p className={statusInfo.className}>{statusInfo.text}</p>

        {/* Limit Alert */}
        {isLimitReached && (
          <div className="limit-alert">
            <div className="limit-alert-icon">🚫</div>
            <div className="limit-alert-content">
              <p className="limit-alert-message">
                Has alcanzado el límite de usuarios de tu plan {tenantInfo.plan.toUpperCase()}.
              </p>
              <button
                className="limit-alert-action"
                onClick={() => window.location.href = '/upgrade'}
              >
                Actualizar plan →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* USUARIOS TABLE */}
      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h4 className="empty-state-title">Sin usuarios</h4>
          <p className="empty-state-description">Agrega tu primer usuario para comenzar</p>
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    {editingId === user.id ? (
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="edit-input"
                      />
                    ) : (
                      user.full_name
                    )}
                  </td>
                  <td>
                    <code>{user.username}</code>
                  </td>
                  <td>
                    {editingId === user.id ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="edit-input"
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td>
                    {editingId === user.id ? (
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="edit-input"
                      />
                    ) : (
                      user.phone || '-'
                    )}
                  </td>
                  <td>
                    {editingId === user.id ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="edit-select"
                      >
                        <option value="doctor">doctor</option>
                        <option value="nurse">nurse</option>
                        <option value="secretary">secretary</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'doctor' && '👨‍⚕️ Doctor'}
                        {user.role === 'nurse' && '👩‍⚕️ Nurse'}
                        {user.role === 'secretary' && '📋 Secretary'}
                        {user.role === 'admin' && '⚙️ Admin'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {user.status === 'active' ? '✓ Activo' : '⊗ Inactivo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {editingId === user.id ? (
                      <>
                        <button className="btn-save" onClick={handleSaveEdit}>✓ Guardar</button>
                        <button className="btn-cancel" onClick={() => setEditingId(null)}>✕ Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-edit-sm" onClick={() => handleEdit(user)}>✏️ Editar</button>
                        <button 
                          className="btn-delete-sm" 
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                        >
                          🗑️ Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de eliminación */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        step={deleteStep}
        itemName={deleteModal.userName}
        itemType="Usuario"
        details={[
          'Se perderá el acceso a la clínica',
          'No se pueden recuperar los datos de autenticación',
          'Los reportes del usuario permanecerán en el sistema'
        ]}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}