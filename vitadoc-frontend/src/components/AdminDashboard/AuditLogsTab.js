// src/components/AdminDashboard/AuditLogsTab.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../../styles/AuditLogsTab.css';




export default function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 50;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * logsPerPage;
      const response = await api.get('/audit/logs', {
        params: {
          limit: logsPerPage,
          offset,
          action: actionFilter || undefined
        }
      });

      setLogs(response.data.data || []);
      setTotalLogs(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Error al cargar logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      SUCCESS: '#2DA880',
      FAILED: '#f36565',
      DENIED: '#ff9800'
    };
    return colors[status] || '#666';
  };

  const getActionColor = (action) => {
    const colors = {
      BULK_USERS: '#1E5A96',
      UPDATE_USER: '#ff9800',
      DELETE_USER: '#f36565',
      CREATE_TENANT: '#2DA880',
      UPDATE_TENANT: '#1E5A96',
      DELETE_TENANT: '#f36565',
      DEACTIVATE_TENANT: '#ff9800',
      REACTIVATE_TENANT: '#2DA880'
    };
    return colors[action] || '#666';
  };

  const filteredLogs = filter
    ? logs.filter(log =>
        log.action.toLowerCase().includes(filter.toLowerCase()) ||
        log.resource_id?.toLowerCase().includes(filter.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(totalLogs / logsPerPage);

  return (
    <div className="audit-logs-tab">
      <div className="audit-header">
        <div>
          <h2>📋 Historial de Auditoría</h2>
          <p className="audit-subtitle">Registro completo de todas las acciones en la plataforma</p>
        </div>
        <div className="audit-stats">
          <span className="audit-total">Total: {totalLogs} logs</span>
        </div>
      </div>

      {/* Controles */}
      <div className="audit-controls">
        <div className="audit-search-group">
          <input
            type="text"
            placeholder="🔍 Buscar por acción o recurso..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="audit-search"
          />
        </div>

        <div className="audit-filter-group">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="audit-filter-select"
          >
            <option value="">Todas las acciones</option>
            <option value="BULK_USERS">➕ Crear usuarios</option>
            <option value="UPDATE_USER">✏️ Actualizar usuario</option>
            <option value="DELETE_USER">🗑️ Eliminar usuario</option>
            <option value="CREATE_TENANT">🏢 Crear clínica</option>
            <option value="UPDATE_TENANT">📝 Actualizar clínica</option>
            <option value="DEACTIVATE_TENANT">⏸️ Desactivar clínica</option>
            <option value="REACTIVATE_TENANT">▶️ Reactivar clínica</option>
            <option value="DELETE_TENANT">❌ Eliminar clínica</option>
          </select>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="audit-refresh-btn"
        >
          {loading ? '⏳' : '🔄'} Actualizar
        </button>
      </div>

      {/* Tabla de logs */}
      {filteredLogs.length > 0 ? (
        <>
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Fecha & Hora</th>
                  <th>Acción</th>
                  <th>Recurso</th>
                  <th>Estado</th>
                  <th>Detalles</th>
                  <th>IP/Usuario-Agent</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className={`audit-row status-${log.status.toLowerCase()}`}>
                    <td className="audit-date">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="audit-action">
                      <span
                        className="audit-badge"
                        style={{ backgroundColor: getActionColor(log.action), color: 'white' }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="audit-resource">
                      {log.resource_type}
                      {log.resource_id && ` #${log.resource_id.substring(0, 8)}`}
                    </td>
                    <td className="audit-status">
                      <span
                        className="audit-status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(log.status),
                          color: 'white'
                        }}
                      >
                        {log.status === 'SUCCESS' && '✅'}
                        {log.status === 'FAILED' && '❌'}
                        {log.status === 'DENIED' && '⛔'}
                        {' '}{log.status}
                      </span>
                    </td>
                    <td className="audit-details">
                      {log.error_message ? (
                        <span title={log.error_message} className="audit-error">
                          ⚠️ {log.error_message.substring(0, 40)}...
                        </span>
                      ) : log.changes ? (
                         <span className="audit-changes">
                            📝 {Object.keys(typeof log.changes === 'string' ? JSON.parse(log.changes || '{}') : log.changes).length} cambios
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="audit-ip">
                      <small>
                        {log.ip_address}
                        {log.user_agent && <br />}
                        {log.user_agent && (
                          <span className="audit-agent">
                            {log.user_agent.substring(0, 30)}...
                          </span>
                        )}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="audit-pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="audit-page-btn"
              >
                ← Anterior
              </button>

              <div className="audit-page-info">
                Página {page} de {totalPages}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="audit-page-btn"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      ) : loading ? (
        <div className="audit-loading">⏳ Cargando logs...</div>
      ) : (
        <div className="audit-empty">
          <div className="audit-empty-icon">📋</div>
          <h3>Sin logs de auditoría</h3>
          <p>
            {filter
              ? 'No hay logs que coincidan con tu búsqueda'
              : 'No hay acciones registradas aún. Las acciones aparecerán aquí automáticamente.'}
          </p>
        </div>
      )}
    </div>
  );
}