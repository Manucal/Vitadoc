import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/theme.css';
import '../styles/DoctorTypeSelection.css';

export default function DoctorTypeSelection() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);

  const handleSelection = (type) => {
    setSelectedType(type);
    // Guardar el tipo de médico en localStorage para usarlo después
    localStorage.setItem('doctorType', type);
    // Ir a la página de login
    navigate('/doctor-login');
  };

  return (
    <div className="page-center">
      <div className="doctor-selection-container">
        <div className="selection-header">
          <img src="/logotipo.png" alt="VitaDoc" className="logo" />
            <p className="subtitle">Selecciona tu tipo de servicio</p>
        </div>

        <div className="selection-options">
          <div
            className={`option-card ${selectedType === 'clinic' ? 'selected' : ''}`}
            onClick={() => handleSelection('clinic')}
          >
            <div className="option-icon"></div>
            <h2>Clínica o IPS</h2>
            <p>Médico de una institución de salud</p>
            <button className="btn btn-clinica">Seleccionar</button>
          </div>

          <div
            className={`option-card ${selectedType === 'private' ? 'selected' : ''}`}
            onClick={() => handleSelection('private')}
          >
            <div className="option-icon"></div>
            <h2>Médico Privado</h2>
            <p>Consultorio o práctica privada</p>
            <button className="btn btn-medico">Seleccionar</button>
          </div>
        </div>

        <p className="help-text">
          Esto determinará cómo se asignan tus pacientes en el sistema
        </p>
      </div>
    </div>
  );
}
