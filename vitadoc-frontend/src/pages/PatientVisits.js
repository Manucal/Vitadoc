import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import '../styles/PatientVisits.css';


export default function PatientVisits() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // ✅ NUEVO - Estados para el modal de confirmación
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    step: 1, // paso 1 o 2
    visitId: null,
    visitDate: ''
  });

  const [formData, setFormData] = useState({
    reasonForVisit: ''
  });

  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    if (patientId) {
      fetchPatientInfo();
      fetchVisits();
    }
  }, [patientId]);

  const fetchPatientInfo = async () => {
    try {
      const response = await api.get(`/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.data.success) {
        setPatientName(response.data.patient.full_name);
      }
    } catch (err) {
      console.error('Error fetching patient info:', err);
    }
  };

  const fetchVisits = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching visits for patient:', patientId);
      
      const response = await api.get(`/medical-visits/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      
      console.log('Visits response:', response.data);
      
      if (response.data.success) {
        setVisits(response.data.visits || []);
      }
    } catch (err) {
      console.error('Error fetching visits:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al cargar consultas';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.reasonForVisit.trim()) {
      setError('El motivo de la consulta es requerido');
      return;
    }

    try {
      const payload = {
        patientId: patientId,
        reasonForVisit: formData.reasonForVisit
      };

      console.log('Creating visit with payload:', payload);

      const response = await api.post(`/medical-visits`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      console.log('Create visit response:', response.data);

      if (response.data.success) {
        setFormData({ reasonForVisit: '' });
        setShowForm(false);
        await fetchVisits();
      }
    } catch (err) {
      console.error('Error creating visit:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al guardar consulta';
      setError(errorMsg);
    }
  };

    const handleViewDetails = (visitId) => {
    navigate(`/visit-summary/${visitId}`);
  };


  // ✅ NUEVO - Abrir modal paso 1
  const openDeleteModal = (visitId, visitDate) => {
    setDeleteModal({
      isOpen: true,
      step: 1,
      visitId,
      visitDate: new Date(visitDate).toLocaleDateString('es-CO')
    });
  };

  // ✅ NUEVO - Confirmar paso 1 → ir a paso 2
  const handleDeleteConfirmStep1 = () => {
    setDeleteModal(prev => ({
      ...prev,
      step: 2
    }));
  };

  // ✅ NUEVO - Confirmar paso 2 → eliminar realmente
  const handleDeleteConfirmStep2 = async () => {
    try {
      const visitId = deleteModal.visitId;
      
      await api.delete(`/medical-visits/${visitId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      
      // Remover de la lista
      setVisits(visits.filter(v => v.id !== visitId));
      
      // Cerrar modal
      setDeleteModal({
        isOpen: false,
        step: 1,
        visitId: null,
        visitDate: ''
      });
      
      // Mostrar mensaje de éxito
      setError(''); // limpiar errores previos si hay
      console.log('Consulta eliminada exitosamente');
    } catch (err) {
      console.error('Error al eliminar consulta:', err);
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  // ✅ NUEVO - Cancelar modal en cualquier paso
  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      step: 1,
      visitId: null,
      visitDate: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ reasonForVisit: '' });
  };

  const handleBack = () => {
  navigate(-1); // Vuelve a la página anterior (SearchPatient)
};


  return (
    <div className="page-center">
      <div className="visits-container">
        <button className="back-button" onClick={handleBack}>
          ← Atrás
        </button>

        <div className="visits-header">
          <h2>Historias Clínicas</h2>
          <p className="visits-subtitle">Paciente: <strong>{patientName || 'Cargando...'}</strong></p>
          <p className="visits-count">Total de consultas: {visits.length}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showForm && (
          <div className="visit-form">
            <h3>Nueva Consulta Médica</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row-1">
                <div className="form-group">
                  <label>Motivo de la Consulta *</label>
                  <textarea
                    name="reasonForVisit"
                    className="input-field textarea-field"
                    placeholder="Describa el motivo de la consulta"
                    value={formData.reasonForVisit}
                    onChange={handleChange}
                    rows="4"
                    required
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  ✓ Crear Consulta
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                  ✕ Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Cargando historias clínicas...</div>
        ) : visits.length === 0 ? (
          <div className="no-visits">
            <p>No hay consultas registradas para este paciente</p>
          </div>
        ) : (
          <div className="visits-list">
            {visits.map((visit) => (
              <div key={visit.id} className="visit-card">
                <div className="visit-header">
                  <h4>Consulta del {new Date(visit.visit_date).toLocaleDateString('es-CO')}</h4>
                  <div className="visit-actions">
                    <button
                      className="btn btn-action btn-edit"
                      onClick={() => handleViewDetails(visit.id)}
                      title="Ver detalles"
                    >
                       Ver Historia  
                    </button>
                    <button
                      className="btn btn-action btn-delete"
                      onClick={() => openDeleteModal(visit.id, visit.visit_date)}
                      title="Eliminar"
                    >
                       Eliminar
                    </button>
                  </div>

                </div>

                <div className="visit-body">
                  <div className="visit-section">
                    <strong>Motivo de la Consulta:</strong>
                    <p>{visit.reason_for_visit}</p>
                  </div>

                  <div className="visit-section">
                    <strong>Estado:</strong>
                    <p>{visit.status}</p>
                  </div>

                  <div className="visit-section">
                    <strong>Fecha de Creación:</strong>
                    <p>{new Date(visit.created_date).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ NUEVO - Modal de confirmación doble */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        step={deleteModal.step}
        visitDate={deleteModal.visitDate}
        onConfirm={
          deleteModal.step === 1
            ? handleDeleteConfirmStep1
            : handleDeleteConfirmStep2
        }
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}