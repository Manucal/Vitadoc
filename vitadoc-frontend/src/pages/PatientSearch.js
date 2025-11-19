import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/PatientSearch.css';


export default function PatientSearch() {
  const navigate = useNavigate();
  const [documentId, setDocumentId] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setPatient(null);


    const trimmedDoc = documentId.trim();


    if (!trimmedDoc) {
      setError('Por favor ingresa un número de documento');
      return;
    }


    try {
      setLoading(true);
      console.log('Buscando paciente con documento:', trimmedDoc);
      
      const response = await api.get(`/patients/search/${trimmedDoc}`);
      console.log('Respuesta del servidor:', response.data);


      if (response.data.success) {
        setPatient(response.data.patient);
      }
    } catch (err) {
      console.error('Error completo:', err);
      setError(err.response?.data?.error || 'Paciente no encontrado');
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };


  const handleNewConsultation = () => {
  if (patient) {
    // Navegar con estado para saber que vino desde búsqueda
    navigate(`/visit-details/${patient.id}`, {
      state: { fromSearch: true }
    });
  }
};


  const handleViewDetails = () => {
    if (patient) {
      navigate(`/patient-details/${patient.id}`);
    }
  };


  const handleViewHistory = () => {
    if (patient) {
      navigate(`/patient-visits/${patient.id}`);
    }
  };


  const handleBack = () => {
    setDocumentId('');
    setPatient(null);
    setError('');
    navigate('/doctor-patient-action');
  };


  const handleNewSearch = () => {
    setDocumentId('');
    setPatient(null);
    setError('');
  };


    return (
    <div className="page-center">
      <div className="search-container">
        {/* HEADER - Solo la flecha de atrás */}
        <div className="search-header-top">
          <button className="back-button" onClick={handleBack}>
            ← Atrás
          </button>
        </div>


        {/* MOSTRAR BARRA DE BÚSQUEDA SOLO SI NO HAY PACIENTE */}
        {!patient ? (
          <>
            <div className="search-header">
              <h2>Buscar Paciente</h2>
              <p className="search-subtitle">
                Ingresa el número de documento para encontrar al paciente
              </p>
            </div>


            <form onSubmit={handleSearch} className="search-form">
              <div className="form-group">
                <label>Número de Documento</label>
                <input
                  type="text"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="input-field"
                  placeholder="Ej: 1113669285"
                  maxLength="12"
                />
                <small className="input-hint">Ingresa solo números (7-12 dígitos)</small>
              </div>


              <button 
                type="submit" 
                className="btn btn-search btn-search" 
                disabled={loading}
              >
                {loading ? ' Buscando...' : ' Buscar'}
              </button>
            </form>


            {error && <div className="error-message">{error}</div>}


            {loading && (
              <div className="loading-message">
                <p>Buscando paciente...</p>
              </div>
            )}
          </>
        ) : null}


        {/* INFORMACIÓN DEL PACIENTE ENCONTRADO */}
        {patient && (
          <div className="patient-found-container">
                        <div className="patient-card-header">
              <div className="patient-header-content">
                <h3 className="patient-name">{patient.fullName || patient.full_name}</h3>
                <p className="patient-age">
                  {(patient.birthDate || patient.birth_date)
                    ? `${new Date().getFullYear() - new Date(patient.birthDate || patient.birth_date).getFullYear()} años`
                    : 'Edad no disponible'
                  }
                </p>
              </div>

            </div>


            <div className="patient-info-detailed">
              <div className="info-row">
                <div className="info-item">
                  <label>Teléfono</label>
                  <p>{patient.phone || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Género</label>
                  <p>{patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : patient.gender || '-'}</p>
                </div>
              </div>


              <div className="info-row">
                <div className="info-item">
                  <label>Ciudad</label>
                  <p>{patient.city || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Departamento</label>
                  <p>{patient.department || '-'}</p>
                </div>
              </div>


                            <div className="info-row">
                <div className="info-item">
                  <label>Email</label>
                  <p>{patient.email || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Tipo Sangre</label>
                  <p>{patient.bloodtype || patient.bloodType || '-'}</p>
                </div>
              </div>
              
              

            </div>


            {/* BOTONES DE ACCIÓN - REORDENADOS */}
            <div className="action-buttons-vertical">
              <button
                className="btn btn-new-consultation btn-large"
                onClick={handleNewConsultation}
              >
                 Nueva Consulta
              </button>

              <button
                className="btn btn-historial btn-large"
                onClick={handleViewHistory}
              >
                 Ver Historial Clínico
              </button>


              <button
                className="btn btn-detalles btn-large"
                onClick={handleViewDetails}
              >
                 Ver Detalles Completos 
              </button>
             
            </div>
          </div>
        )}
      </div>
    </div>
  );
}