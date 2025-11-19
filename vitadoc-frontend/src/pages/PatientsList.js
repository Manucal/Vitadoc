import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/PatientsList.css';

export default function PatientsList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.data.success) {
        setPatients(response.data.patients);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar pacientes');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patientId) => {
    try {
      await api.delete(`/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setPatients(patients.filter(p => p.id !== patientId));
      setDeleteConfirm(null);
    } catch (err) {
      alert('Error al eliminar paciente');
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.document_id.includes(searchTerm)
  );

  const handleBack = () => {
    navigate('/doctor-patient-action');
  };

  return (
    <div className="page-center-list">
      <div className="patients-list-container">
        <button className="back-button" onClick={handleBack}>
          ← Atrás
        </button>

        <div className="list-header">
          <h2>Todos los Pacientes</h2>
          <p className="list-subtitle">Total: {patients.length} pacientes registrados</p>
        </div>

        <div className="list-search">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Cargando pacientes...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="no-patients">
            <p>No hay pacientes registrados</p>
          </div>
        ) : (
          <div className="patients-table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Tipo Doc.</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Género</th>
                  <th>Fecha Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.full_name}</td>
                    <td>{patient.document_id}</td>
                    <td>{patient.document_type}</td>
                    <td>{patient.phone || '-'}</td>
                    <td>{patient.email || '-'}</td>
                    <td>{patient.gender || '-'}</td>
                    <td>{new Date(patient.created_date).toLocaleDateString('es-CO')}</td>
                    <td className="actions-cell">
                      <button
                        className="table-btn-action btn-view"
                        onClick={() => navigate(`/patient-details/${patient.id}`)}
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                      {deleteConfirm === patient.id ? (
                        <>
                          <button
                            className="table-btn-action btn-confirm"
                            onClick={() => handleDelete(patient.id)}
                            title="Confirmar eliminación"
                          >
                            ✓
                          </button>
                          <button
                            className="table-btn-action btn-cancel"
                            onClick={() => setDeleteConfirm(null)}
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          className="table-btn-action btn-delete"
                          onClick={() => setDeleteConfirm(patient.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
