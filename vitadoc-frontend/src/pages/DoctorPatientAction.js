import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DoctorPatientAction.css';

export default function DoctorPatientAction() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('clientId');
    localStorage.removeItem('doctorType');
    navigate('/doctor-type-selection');
  };

  return (
    <div className="page-center">
      <div className="doctor-action-container">
        <div className="action-content">
          {/* SECCIÓN IZQUIERDA - LOGO */}
          <div className="action-header">
            <img src="/logotipo.png" alt="VitaDoc" className="logo" />
            <p className="action-subtitle">La gestión de pacientes, simplificada.</p>
          </div>

          {/* SECCIÓN DERECHA - BOTONES */}
          <div className="action-buttons-container">
            <button
              className="btn-search-patient"
              onClick={() => navigate('/search-patient')}
            >
              Buscar Paciente
            </button>

            <button
              className="btn-register-patient"
              onClick={() => navigate('/create-patient')}
            >
              Registrar Paciente Nuevo
            </button>

            <button
              className="btn-view-all-patients"
              onClick={() => navigate('/patients-list')}
            >
              Ver Todos los Pacientes
            </button>

            <button
              className="btn-logout"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
