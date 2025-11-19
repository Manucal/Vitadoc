import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ClientsManager from '../components/AdminDashboard/ClientsManager';
import InvitationsManager from '../components/AdminDashboard/InvitationsManager';
import AnalyticsDashboard from '../components/AdminDashboard/AnalyticsDashboard';
import CreateTenantForm from '../components/AdminDashboard/CreateTenantForm';
import BulkUserCreation from '../components/AdminDashboard/BulkUserCreation';
import AuditLogsTab from '../components/AdminDashboard/AuditLogsTab';
import '../styles/AdminPage.css';



export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalClients: 0,
    activeClients: 0,
    totalUsers: 0,
    mrr: 0,
    clientGrowth: 0
  });



  useEffect(() => {
    fetchUserData();
    fetchAnalytics();
  }, []);



  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;
      setUser(userData);
    } catch (error) {
      console.error('Error verificando usuario:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };




  const fetchAnalytics = async () => {
    try {
      const tenantsResponse = await api.get('/tenants');
      const tenants = tenantsResponse.data.data || [];
      const totalClients = tenants.length;
      const activeClients = tenants.filter(c => c.status === 'active').length;
      const planPrices = {
        basic: 99,
        standard: 189,
        premium: 299
      };
      const mrr = tenants.reduce((sum, tenant) =>
        sum + (planPrices[tenant.subscription_plan] || 0), 0
      );
      setAnalytics({
        totalClients,
        activeClients,
        totalUsers: tenants.reduce((sum, c) => sum + (c.user_count || 0), 0),
        mrr,
        clientGrowth: activeClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };



  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('doctorType');  // ← Limpiar doctorType también
      navigate('/doctor-type-selection', { replace: true });  // ← Ir a doctor-type-selection
    } catch {}
  };




  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'overview') fetchAnalytics();
  };



  const handleSelectTenant = (tenantId) => {
    setSelectedTenantId(tenantId);
  };



  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Cargando VitaDoc Dashboard...</p>
      </div>
    );
  }



  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>🏥 VitaDoc <span className="admin-label">SUPER ADMIN</span></h1>
            <p className="admin-subtitle">Panel global · Gestión SaaS multi-clínica</p>
          </div>
          <div>
            <span className="admin-user">{user?.full_name} <small>· Admin</small></span>
            <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        </div>
      </header>



      <nav className="admin-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => handleTabChange('overview')}>
          📊 Resumen
        </button>
        <button className={activeTab === 'clients' ? 'active' : ''} onClick={() => handleTabChange('clients')}>
          🏢 Clínicas
        </button>
        <button className={activeTab === 'invitations' ? 'active' : ''} onClick={() => handleTabChange('invitations')}>
          ✉️ Invitaciones
        </button>
        <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => handleTabChange('analytics')}>
          📈 Analíticas
        </button>
        <button className={activeTab === 'audit' ? 'active' : ''} onClick={() => handleTabChange('audit')}>
          📋 Auditoría
        </button>
      </nav>



      <main className="admin-content">
        {activeTab === 'overview' && (
          <>
            <section className="admin-kpis">
              <div className="kpi-card kpi-green">
                <div className="kpi-label">Clientes Activos</div>
                <div className="kpi-value">{analytics.activeClients}</div>
                <div className="kpi-mini">de {analytics.totalClients} creados</div>
              </div>
              <div className="kpi-card kpi-blue">
                <div className="kpi-label">Ingresos Mensuales (MRR)</div>
                <div className="kpi-value">${analytics.mrr.toLocaleString()}K</div>
                <div className="kpi-mini">COP - recurrente</div>
              </div>
              <div className="kpi-card kpi-orange">
                <div className="kpi-label">Usuarios Totales</div>
                <div className="kpi-value">{analytics.totalUsers}</div>
                <div className="kpi-mini">en la plataforma</div>
              </div>
              <div className="kpi-card kpi-purple">
                <div className="kpi-label">Tasa de Actividad</div>
                <div className="kpi-value">{analytics.clientGrowth}%</div>
                <div className="kpi-mini">de clínicas</div>
              </div>
            </section>
            <section className="admin-actions">
              <CreateTenantForm onCreate={fetchAnalytics} />
              <div className="callout-admin">
                <b>¿Cómo funciona?</b>
                Crea clínicas (tenants) únicos, cada uno con usuarios, historias y métricas propias. Todo aislado y seguro.
              </div>
            </section>
          </>
        )}
        
        {activeTab === 'clients' && (
          <>
            <ClientsManager onUpdate={fetchAnalytics} onSelectTenant={handleSelectTenant} />
            {selectedTenantId && (
              <BulkUserCreation tenantId={selectedTenantId} onSuccess={fetchAnalytics} />
            )}
          </>
        )}
        
        {activeTab === 'invitations' && <InvitationsManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard analytics={analytics} />}
        {activeTab === 'audit' && (
          <AuditLogsTab />
        )}
      </main>
    </div>
  );
}
