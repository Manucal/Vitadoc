import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import TenantUsersManager from './TenantUsersManager';
import DeleteConfirmModal from '../DeleteConfirmModal';
import '../../styles/ClientsManager.css';

export default function ClientsManager({ onUpdate, onSelectTenant }) {
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showUsersManager, setShowUsersManager] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    tenantId: null,
    tenantName: null
  });
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    type: 'clinic',
    subscription_plan: 'basic',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenants');
      setTenants(response.data.data || []);
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('❌ Error al cargar clínicas');
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
    try {
      setLoading(true);

      if (editingId) {
        const updateToast = toast.loading('⏳ Actualizando clínica...');
        await api.put(`/tenants/${editingId}`, formData);
        setTenants((prev) =>
          prev.map((t) => (t.id === editingId ? { ...t, ...formData } : t))
        );
        toast.dismiss(updateToast);
        toast.success('✓ Clínica actualizada exitosamente');
        setEditingId(null);
      } else {
        toast.error('Para crear nueva clínica, usa el formulario de Crear Clínica en Resumen');
        return;
      }

      setFormData({
        name: '',
        contact_email: '',
        contact_phone: '',
        type: 'clinic',
        subscription_plan: 'basic',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tenant) => {
    setFormData({
      name: tenant.name,
      contact_email: tenant.contact_email,
      contact_phone: tenant.contact_phone || '',
      type: tenant.type,
      subscription_plan: tenant.subscription_plan,
    });
    setEditingId(tenant.id);
    setShowForm(true);
  };

  const handleDeactivateTenant = async (tenantId, tenantName) => {
    const confirmed = window.confirm(
      `⚠️ ¿Estás seguro que quieres DESACTIVAR la clínica "${tenantName}"?\n\nLos usuarios de esta clínica NO PODRÁN acceder al sistema.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const deactivateToast = toast.loading('⏳ Desactivando clínica...');
      
      await api.patch(`/tenants/${tenantId}/deactivate`);
      
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenantId ? { ...t, status: 'inactive' } : t
        )
      );
      
      toast.dismiss(deactivateToast);
      toast.success('✓ Clínica desactivada exitosamente');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error desactivating tenant:', error);
      toast.error('❌ Error al desactivar clínica: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateTenant = async (tenantId, tenantName) => {
    const confirmed = window.confirm(
      `✅ ¿Estás seguro que quieres REACTIVAR la clínica "${tenantName}"?\n\nLos usuarios podrán acceder nuevamente.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const reactivateToast = toast.loading('⏳ Reactivando clínica...');
      
      await api.patch(`/tenants/${tenantId}/reactivate`);
      
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenantId ? { ...t, status: 'active' } : t
        )
      );
      
      toast.dismiss(reactivateToast);
      toast.success('✓ Clínica reactivada exitosamente');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error reactivating tenant:', error);
      toast.error('❌ Error al reactivar clínica: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = (tenantId, tenantName) => {
    setDeleteModal({
      isOpen: true,
      tenantId,
      tenantName
    });
    setDeleteStep(1);
  };

  const handleConfirmDelete = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    if (deleteStep === 2) {
      try {
        setIsDeleting(true);
        const deleteToast = toast.loading('⏳ Eliminando clínica...');
        
        await api.delete(`/tenants/${deleteModal.tenantId}`);
        setTenants((prev) => prev.filter((t) => t.id !== deleteModal.tenantId));
        
        toast.dismiss(deleteToast);
        toast.success('✓ Clínica eliminada exitosamente');
        setDeleteModal({ isOpen: false, tenantId: null, tenantName: null });
        setDeleteStep(1);
        onUpdate && onUpdate();
      } catch (error) {
        console.error('Error deleting tenant:', error);
        toast.error('❌ Error al eliminar clínica: ' + error.response?.data?.error);
        setIsDeleting(false);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, tenantId: null, tenantName: null });
    setDeleteStep(1);
    setIsDeleting(false);
  };

  const handleManageUsers = (tenant) => {
    setSelectedTenant(tenant);
    setShowUsersManager(true);
    if (onSelectTenant) {
      onSelectTenant(tenant.id);
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contact_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;

    const matchesPlan = filterPlan === 'all' || tenant.subscription_plan === filterPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const planColors = {
    basic: '#3773f5',
    standard: '#36c6ae',
    premium: '#ffab24',
    enterprise: '#bb62ef',
  };

  const planPrices = {
    basic: '$99K/mes',
    standard: '$189K/mes',
    premium: '$299K/mes',
    enterprise: 'Personalizado',
  };

  return (
    <div className="clients-manager">
      <div className="manager-header">
        <div>
          <h2>🏥 Gestión de Clínicas</h2>
          <p className="header-subtitle">Administra todas las clínicas registradas en VitaDoc</p>
        </div>
      </div>

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
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">📊 Todos los estados</option>
            <option value="active">✓ Activos</option>
            <option value="inactive">⊗ Inactivos</option>
            <option value="suspended">🚫 Suspendidos</option>
          </select>
        </div>

        <div className="filter-group">
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
            <option value="all">💳 Todos los planes</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {showForm && (
        <form className="client-form" onSubmit={handleSubmit}>
          <h3>✏️ Editar Clínica</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre de la Clínica *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Clínica del Sur"
              />
            </div>
            <div className="form-group">
              <label>Email de Contacto *</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleInputChange}
                required
                placeholder="admin@clinica.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                placeholder="+57-300-1234567"
              />
            </div>
            <div className="form-group">
              <label>Tipo de Clínica</label>
              <select name="type" value={formData.type} onChange={handleInputChange}>
                <option value="clinic">🏥 Clínica</option>
                <option value="hospital">🏗️ Hospital</option>
                <option value="consultory">👨‍⚕️ Consultorio</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Plan de Suscripción</label>
              <select
                name="subscription_plan"
                value={formData.subscription_plan}
                onChange={handleInputChange}
              >
                <option value="basic">💰 Basic ($99K/mes - 1 usuario)</option>
                <option value="standard">💎 Standard ($189K/mes - 3 usuarios)</option>
                <option value="premium">👑 Premium ($299K/mes - 5 usuarios)</option>
                <option value="enterprise">🌟 Enterprise (Personalizado)</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '⏳ Procesando...' : '✅ Actualizar'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              ✕ Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && !showForm ? (
        <div className="loading">⏳ Cargando clínicas...</div>
      ) : (
        <div className="clients-grid">
          {filteredTenants.length === 0 ? (
            <p className="no-data">📭 No hay clínicas que coincidan con los filtros</p>
          ) : (
            filteredTenants.map((tenant) => (
              <div key={tenant.id} className="client-card">
                <div className="card-header">
                  <div className="header-info">
                    <h3>{tenant.name}</h3>
                    <span className={`badge ${tenant.type}`}>
                      {tenant.type === 'clinic' && '🏥'}
                      {tenant.type === 'hospital' && '🏗️'}
                      {tenant.type === 'consultory' && '👨‍⚕️'}
                      {tenant.type}
                    </span>
                  </div>
                  <span className={`status ${tenant.status}`}>
                    {tenant.status === 'active' && '✓ Activo'}
                    {tenant.status === 'inactive' && '⊗ Inactivo'}
                    {tenant.status === 'suspended' && '🚫 Suspendido'}
                  </span>
                </div>

                <div className="card-body">
                  <p>
                    <strong>Email:</strong> {tenant.contact_email}
                  </p>
                  <p>
                    <strong>Teléfono:</strong> {tenant.contact_phone || 'No registrado'}
                  </p>

                  <div className="plan-badge" style={{ borderLeftColor: planColors[tenant.subscription_plan] }}>
                    <strong>Plan:</strong> {tenant.subscription_plan.toUpperCase()}
                    <br />
                    <small>{planPrices[tenant.subscription_plan]}</small>
                  </div>

                  <div className="limits">
                    <div className="limit-item">
                      <span>👥 Usuarios Activos</span>
                      <strong>{tenant.user_count || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    className="btn-manage-users"
                    onClick={() => handleManageUsers(tenant)}
                    title="Ver, editar y eliminar usuarios"
                  >
                    👥 Gestionar Usuarios
                  </button>
                  <button className="btn-edit" onClick={() => handleEdit(tenant)}>
                    ✏️ Editar
                  </button>
                  {tenant.status === 'inactive' ? (
                    <button 
                      className="btn-reactivate" 
                      onClick={() => handleReactivateTenant(tenant.id, tenant.name)}
                      title="Reactivar esta clínica"
                    >
                      ✅ Reactivar
                    </button>
                  ) : (
                    <button 
                      className="btn-deactivate" 
                      onClick={() => handleDeactivateTenant(tenant.id, tenant.name)}
                      title="Desactivar acceso a esta clínica"
                    >
                      🚫 Desactivar
                    </button>
                  )}
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showUsersManager && selectedTenant && (
        <TenantUsersManager
          tenantId={selectedTenant.id}
          onClose={() => setShowUsersManager(false)}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        step={deleteStep}
        itemName={deleteModal.tenantName}
        itemType="Clínica"
        details={[
          'Todos los usuarios de la clínica',
          'Todos los pacientes registrados',
          'Todas las consultas médicas',
          'Todos los historiales clínicos',
          'Todos los diagnósticos y medicamentos',
          'Todos los datos de auditoría'
        ]}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}
