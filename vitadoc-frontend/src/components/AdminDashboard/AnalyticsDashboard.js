import React from 'react';
import '../../styles/AnalyticsDashboard.css';

export default function AnalyticsDashboard({ analytics }) {
  return (
    <div className="analytics-dashboard">
      <h2>📈 Analytics de VitaDoc</h2>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Crecimiento de Clientes</h3>
          <div className="metric">
            <span className="label">Total:</span>
            <span className="value">{analytics.totalClients}</span>
          </div>
          <div className="metric">
            <span className="label">Activos:</span>
            <span className="value green">{analytics.activeClients}</span>
          </div>
          <div className="metric">
            <span className="label">Tasa activa:</span>
            <span className="value">{analytics.clientGrowth}%</span>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Ingresos Recurrentes (MRR)</h3>
          <div className="metric big">
            <span className="currency">$</span>
            <span className="value">{analytics.mrr.toLocaleString()}</span>
          </div>
          <p className="info">Ingresos mensuales estimados de suscripciones activas</p>
        </div>

        <div className="analytics-card">
          <h3>Usuarios Totales</h3>
          <div className="metric big">
            <span className="value">{analytics.totalUsers}</span>
          </div>
          <p className="info">Doctores, enfermeras y staff en toda la plataforma</p>
        </div>
      </div>

      <div className="recommendations">
        <h3>💡 Recomendaciones</h3>
        <ul>
          <li>✅ Envía emails a clientes inactivos para aumentar la retención</li>
          <li>✅ Ofrece planes Enterprise a clínicas con muchos usuarios</li>
          <li>✅ Monitorea el uso semanal para detectar clientes problemáticos</li>
          <li>✅ Crea webinars de capacitación para usuarios nuevos</li>
        </ul>
      </div>
    </div>
  );
}
