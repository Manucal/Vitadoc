import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DoctorPatientAction.css';

export default function DoctorPatientAction() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Recuperar datos del usuario guardados en el login
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserRole(parsedUser.role || ''); // Ej: 'admin', 'doctor'
      setUserName(parsedUser.fullName || 'Doctor');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('clientId'); // Si aplica
    localStorage.removeItem('doctorType');
    localStorage.removeItem('user'); // Limpiar datos del usuario
    navigate('/doctor-type-selection');
  };

  return (
    <div className="page-center">
      <div className="doctor-action-container">
        <div className="action-content">
          {/* SECCIÓN IZQUIERDA - LOGO */}
          <div className="action-header">
            <img src="/logotipo.png" alt="VitaDoc" className="logo" />
            <p className="action-subtitle">Bienvenido, {userName}</p>           
            <p className="role-badge">
              {userRole === 'admin' ? 'Administrador' : 'Profesional Médico'}
            </p>
          </div>

          {/* SECCIÓN DERECHA - BOTONES */}
          <div className="action-buttons-container">
            
            {/* 🔒 BOTÓN SOLO PARA ADMINS (Gestionar Usuarios) */}
            {userRole === 'admin' && (
              <button
                className="btn-manage-team"
                onClick={() => navigate('/tenant-users')}
                style={{ backgroundColor: '#7c3aed', color: 'white', marginBottom: '15px' }}
              >
                Gestionar Equipo
              </button>
            )}

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