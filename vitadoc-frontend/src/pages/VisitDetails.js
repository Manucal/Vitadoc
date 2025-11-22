import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import AddDiagnosis from './AddDiagnosis';
import AddTreatment from './AddTreatment';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { getNextTabAfterSave, TAB_SEQUENCE } from '../config/tabSequence-config';
import { validateVitalSigns } from '../utils/visitDetailsHelpers';
import '../styles/VisitDetails.css';


export default function VisitDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId, visitId } = useParams();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('new-consultation');
  const [editingField, setEditingField] = useState(null);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);

  // ✅ NUEVO: Estados para editar diagnósticos y tratamientos
  const [editingDiagnosis, setEditingDiagnosis] = useState(null);
  const [editingTreatment, setEditingTreatment] = useState(null);

  // ✅ ESTADO PARA NUEVA CONSULTA
  const [newConsultationData, setNewConsultationData] = useState({
    reasonForVisit: ''
  });
  const [newConsultationLoading, setNewConsultationLoading] = useState(false);
  const [newConsultationError, setNewConsultationError] = useState('');
  const [consultationCode, setConsultationCode] = useState('');

  const [editData, setEditData] = useState({
    currentIllness: '',
    symptomDuration: '',
    symptomSeverity: '',
    weight: '',
    height: '',
    systolicBp: '',
    diastolicBp: '',
    heartRate: '',
    respiratoryRate: '',
    bodyTemperature: '',
    headNeck: '',
    ocular: '',
    ears: '',
    thoraxAbdomen: '',
    respiratory: '',
    cardiovascular: '',
    digestive: '',
    genitourinary: '',
    musculoskeletal: '',
    skin: '',
    nervousSystem: '',
    generalAppearance: '',
    mentalStatus: '',
    detailedFindings: '',
    abnormalities: '',
    recommendations: ''
  });

  useEffect(() => {
    if (visitId) {
      fetchVisitDetails();
    } else {
      setLoading(false);
      setActiveTab('new-consultation');
    }
  }, [visitId]);

  const fetchVisitDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/medical-visits/${visitId}/details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.data.success) {
        setVisit(response.data.visit);
        setEditData({
          currentIllness: response.data.visit.anamnesis?.current_illness || '',
          symptomDuration: response.data.visit.anamnesis?.symptom_duration || '',
          symptomSeverity: response.data.visit.anamnesis?.symptom_severity || '',
          weight: response.data.visit.vitalSigns?.weight || '',
          height: response.data.visit.vitalSigns?.height || '',
          systolicBp: response.data.visit.vitalSigns?.systolic_bp || '',
          diastolicBp: response.data.visit.vitalSigns?.diastolic_bp || '',
          heartRate: response.data.visit.vitalSigns?.heart_rate || '',
          respiratoryRate: response.data.visit.vitalSigns?.respiratory_rate || '',
          bodyTemperature: response.data.visit.vitalSigns?.body_temperature || '',
          headNeck: response.data.visit.systemReview?.head_neck || '',
          ocular: response.data.visit.systemReview?.ocular || '',
          ears: response.data.visit.systemReview?.ears || '',
          thoraxAbdomen: response.data.visit.systemReview?.thorax_abdomen || '',
          respiratory: response.data.visit.systemReview?.respiratory || '',
          cardiovascular: response.data.visit.systemReview?.cardiovascular || '',
          digestive: response.data.visit.systemReview?.digestive || '',
          genitourinary: response.data.visit.systemReview?.genitourinary || '',
          musculoskeletal: response.data.visit.systemReview?.musculoskeletal || '',
          skin: response.data.visit.systemReview?.skin || '',
          nervousSystem: response.data.visit.systemReview?.nervous_system || '',
          generalAppearance: response.data.visit.physicalExam?.general_appearance || '',
          mentalStatus: response.data.visit.physicalExam?.mental_status || '',
          detailedFindings: response.data.visit.physicalExam?.detailed_findings || '',
          abnormalities: response.data.visit.physicalExam?.abnormalities || '',
          recommendations: response.data.visit.followUp?.follow_up_reason || ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar consulta');
    } finally {
      setLoading(false);
    }
  };

  // ✅ EDITAR DIAGNÓSTICO
  const handleEditDiagnosis = (diagnosis) => {
    setEditingDiagnosis(diagnosis);
    setShowAddDiagnosis(true);
  };

  // ✅ ELIMINAR DIAGNÓSTICO
  const handleDeleteDiagnosis = async (diagnosisId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este diagnóstico?')) {
      try {
        const response = await api.delete(
          `/medical-visits/${visitId}/diagnoses/${diagnosisId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
        );

        if (response.data.success) {
          setVisit(prev => ({
            ...prev,
            diagnoses: prev.diagnoses.filter(d => d.id !== diagnosisId)
          }));
          alert('✓ Diagnóstico eliminado exitosamente');
        }
      } catch (err) {
        alert(`Error al eliminar diagnóstico: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  // ✅ EDITAR TRATAMIENTO
  const handleEditTreatment = (treatment) => {
    setEditingTreatment(treatment);
    setShowAddTreatment(true);
  };

  // ✅ ELIMINAR TRATAMIENTO
  const handleDeleteTreatment = async (treatmentId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este medicamento?')) {
      try {
        const response = await api.delete(
          `/medical-visits/${visitId}/treatments/${treatmentId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
        );

        if (response.data.success) {
          setVisit(prev => ({
            ...prev,
            treatments: prev.treatments.filter(t => t.id !== treatmentId)
          }));
          alert('✓ Medicamento eliminado exitosamente');
        }
      } catch (err) {
        alert(`Error al eliminar medicamento: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  // ✅ CERRAR MODALES Y LIMPIAR ESTADO DE EDICIÓN
  const handleCloseAddDiagnosis = () => {
    setShowAddDiagnosis(false);
    setEditingDiagnosis(null);
  };

  const handleCloseAddTreatment = () => {
    setShowAddTreatment(false);
    setEditingTreatment(null);
  };

  const handleNewConsultationChange = (e) => {
    const { name, value } = e.target;
    setNewConsultationData({ ...newConsultationData, [name]: value });
  };

  const handleCreateNewConsultation = async (e) => {
    e.preventDefault();
    setNewConsultationError('');

    if (!newConsultationData.reasonForVisit.trim()) {
      setNewConsultationError('El motivo de la consulta es requerido');
      return;
    }

    try {
      setNewConsultationLoading(true);

      const payload = {
        patientId: patientId,
        reasonForVisit: newConsultationData.reasonForVisit
      };

      const response = await api.post(`/medical-visits`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.data.success) {
        setConsultationCode(response.data.visit.id);
        setActiveTab('anamnesis');
        navigate(`/visit-details/${patientId}/${response.data.visit.id}`);
      }
    } catch (err) {
      console.error('Error creating consultation:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al guardar consulta';
      setNewConsultationError(errorMsg);
    } finally {
      setNewConsultationLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA OBTENER ESTADO DE CADA SECCIÓN
  const getSectionStatus = (section) => {
    if (!visit) return 'empty';

    switch (section) {
      case 'anamnesis':
        return visit.anamnesis?.current_illness?.trim() ? 'complete' : 'empty';
      
      case 'vitalSigns':
        const hasWeight = visit.vitalSigns?.weight;
        const hasHeight = visit.vitalSigns?.height;
        const hasBP = visit.vitalSigns?.systolic_bp;
        if (hasWeight && hasHeight && hasBP) return 'complete';
        if (hasWeight || hasHeight || hasBP) return 'partial';
        return 'empty';
      
      case 'systemReview':
        const systemFields = [
          visit.systemReview?.head_neck,
          visit.systemReview?.respiratory,
          visit.systemReview?.cardiovascular
        ];
        const filledFields = systemFields.filter(f => f?.trim()).length;
        if (filledFields === 3) return 'complete';
        if (filledFields > 0) return 'partial';
        return 'empty';
      
      case 'physicalExam':
        return visit.physicalExam?.general_appearance?.trim() ? 'complete' : 'empty';
      
      case 'diagnoses':
        if (visit.diagnoses?.length > 0) return 'complete';
        return 'empty';
      
      case 'recommendations':
        return visit.followUp?.follow_up_reason?.trim() ? 'complete' : 'empty';
      
      case 'treatments':
        if (visit.treatments?.length > 0) return 'complete';
        return 'empty';
      
      default:
        return 'empty';
    }
  };

  // ✅ VERIFICAR SI TODO ESTÁ COMPLETO
  const allSectionsComplete = () => {
    if (!visit) return false;
    const sections = ['anamnesis', 'vitalSigns', 'systemReview', 'physicalExam', 'diagnoses', 'recommendations', 'treatments'];
    return sections.every(section => getSectionStatus(section) === 'complete');
  };

  // ✅ OBTENER ÍCONO Y COLOR PARA EL ESTADO
  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return { icon: '✓', color: '#16a34a', label: 'Completo' };
      case 'partial':
        return { icon: '⊙', color: '#ea580c', label: 'Parcial' };
      case 'empty':
        return { icon: '✕', color: '#dc2626', label: 'Incompleto' };
      default:
        return { icon: '?', color: '#999', label: 'Desconocido' };
    }
  };

  // ✅ FINALIZAR CONSULTA - CON VALIDACIÓN
  const handleFinalizeConsultation = async () => {
    if (!allSectionsComplete()) {
      alert('⚠️ Por favor completa todos los campos de la historia clínica');
      return;
    }

    try {
      await api.put(
        `/medical-visits/${visitId}/status`,
        { status: 'completed' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      alert('✅ Historia clínica finalizada correctamente');
      navigate(`/visit-summary/${visitId}`);
    } catch (err) {
      alert('❌ Error al finalizar: ' + err.response?.data?.error);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const navigateToNextTab = (currentTabId) => {
    const nextTabId = getNextTabAfterSave(currentTabId);
    if (nextTabId) {
      setActiveTab(nextTabId);
      setEditingField(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveAnamnesis = async () => {
    try {
      await api.put(
        `/medical-visits/${visitId}/anamnesis`,
        {
          currentIllness: editData.currentIllness,
          symptomDuration: editData.symptomDuration,
          symptomSeverity: editData.symptomSeverity
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setEditingField(null);
      fetchVisitDetails();
      navigateToNextTab('anamnesis');
    } catch (err) {
      alert('Error al guardar: ' + err.response?.data?.error);
    }
  };

  // ✅ AQUÍ AGREGAMOS VALIDACIONES
  const handleSaveVitalSigns = async () => {
    try {
      // ✅ VALIDAR ANTES DE GUARDAR
      const validationErrors = validateVitalSigns({
        weight: editData.weight,
        height: editData.height,
        systolicBp: editData.systolicBp,
        diastolicBp: editData.diastolicBp,
        heartRate: editData.heartRate,
        respiratoryRate: editData.respiratoryRate,
        bodyTemperature: editData.bodyTemperature
      });

      if (validationErrors.length > 0) {
        alert('⚠️ Errores en los datos:\n\n' + validationErrors.join('\n'));
        return;
      }

      // ✅ Si valida OK, guardar normalmente
      await api.put(
        `/medical-visits/${visitId}/vital-signs`,
        {
          weight: parseFloat(editData.weight),
          height: parseInt(editData.height),
          systolicBp: parseInt(editData.systolicBp),
          diastolicBp: parseInt(editData.diastolicBp),
          heartRate: parseInt(editData.heartRate),
          respiratoryRate: parseInt(editData.respiratoryRate),
          bodyTemperature: parseFloat(editData.bodyTemperature)
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setEditingField(null);
      fetchVisitDetails();
      navigateToNextTab('vital-signs');
    } catch (err) {
      alert('Error al guardar signos vitales');
    }
  };

  const handleSaveSystemReview = async () => {
    try {
      await api.put(
        `/medical-visits/${visitId}/system-review`,
        {
          headNeck: editData.headNeck,
          ocular: editData.ocular,
          ears: editData.ears,
          thoraxAbdomen: editData.thoraxAbdomen,
          respiratory: editData.respiratory,
          cardiovascular: editData.cardiovascular,
          digestive: editData.digestive,
          genitourinary: editData.genitourinary,
          musculoskeletal: editData.musculoskeletal,
          skin: editData.skin,
          nervousSystem: editData.nervousSystem
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setEditingField(null);
      fetchVisitDetails();
      navigateToNextTab('system-review');
    } catch (err) {
      alert('Error al guardar revisión por sistemas');
    }
  };

  const handleSavePhysicalExam = async () => {
    try {
      await api.put(
        `/medical-visits/${visitId}/physical-exam`,
        {
          generalAppearance: editData.generalAppearance,
          mentalStatus: editData.mentalStatus,
          detailedFindings: editData.detailedFindings,
          abnormalities: editData.abnormalities
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setEditingField(null);
      fetchVisitDetails();
      navigateToNextTab('physical-exam');
    } catch (err) {
      alert('Error al guardar examen físico');
    }
  };

  const handleSaveRecommendations = async () => {
    try {
      await api.put(
        `/medical-visits/${visitId}/follow-up`,
        {
          followUpReason: editData.recommendations
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setEditingField(null);
      fetchVisitDetails();
      navigateToNextTab('recommendations');
    } catch (err) {
      alert('Error al guardar recomendaciones');
    }
  };

  const handleBack = () => {
    if (location.state?.fromSearch) {
      navigate('/search-patient', { replace: true });
    } else {
      navigate(`/patient-visits/${patientId}`);
    }
  };

  if (loading && visitId) {
    return <div className="page-center"><div className="loading-container">Cargando consulta...</div></div>;
  }

  return (
    <div className="page-center">
      <div className="visit-details-container">
        <button className="back-button" onClick={handleBack}>
          ← Atrás
        </button>

        <div className="details-header">
          <h2>Detalle de Consulta</h2>
          <p className="details-subtitle">
            {visit ? (
              <>
                Paciente: <strong>{visit.patient.full_name}</strong>
                Fecha: <strong>{new Date(visit.visitDate).toLocaleDateString('es-CO')}</strong>
              </>
            ) : (
              <strong>Nueva Consulta</strong>
            )}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="tabs-container">
          {TAB_SEQUENCE
            .filter(tab => tab.id !== 'summary')
            .map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              disabled={!visit && tab.id !== 'new-consultation'}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          {visit && (
            <button
              className={`tab-button ${activeTab === 'checklist' ? 'active' : ''}`}
              onClick={() => setActiveTab('checklist')}
            >
              📋 Checklist
            </button>
          )}
        </div>

        {/* NUEVA CONSULTA TAB */}
        {activeTab === 'new-consultation' && (
          <div className="tab-content">
            <div className="section-card">
              <div className="new-consultation-container">
                <h3>Nueva Consulta Médica</h3>
                
                {newConsultationError && <div className="error-message">{newConsultationError}</div>}

                {visit ? (
                  <div className="consultation-created">
                    <div className="info-box">
                      <p><strong>Código de Consulta:</strong> <span className="code">{visitId}</span></p>
                      <p><strong>Razón de la Consulta:</strong></p>
                      <p className="reason-text">{visit.reasonForVisit || '-'}</p>
                    </div>
                    
                    <div className="consultation-info">
                      <p><strong>Estado:</strong> <span className="status-badge">{visit.status}</span></p>
                      <p><strong>Paciente:</strong> {visit.patient?.fullName}</p>
                      <p><strong>Fecha:</strong> {new Date(visit.visitDate).toLocaleDateString('es-CO')}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateNewConsultation}>
                    <div className="form-group">
                      <label>Motivo de la Consulta *</label>
                      <textarea
                        name="reasonForVisit"
                        className="input-field textarea-field"
                        placeholder="Describe el motivo de la consulta"
                        value={newConsultationData.reasonForVisit}
                        onChange={handleNewConsultationChange}
                        rows="4"
                        required
                      />
                    </div>

                    <div className="form-buttons">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={newConsultationLoading}
                      >
                        {newConsultationLoading ? '⏳ Guardando...' : '✓ Crear Consulta'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ANAMNESIS TAB */}
        {activeTab === 'anamnesis' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header">
                <h3>Historia de la Enfermedad Actual</h3>
                <button
                  className={"btn-primary-small"}
                  onClick={() => setEditingField(editingField === 'anamnesis' ? null : 'anamnesis')}
                >
                  {editingField === 'anamnesis' ? '✕ Cancelar' : ' Editar'}
                </button>
              </div>

              {editingField === 'anamnesis' ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Enfermedad Actual</label>
                    <textarea
                      name="currentIllness"
                      value={editData.currentIllness}
                      onChange={handleEditChange}
                      rows="4"
                      className="input-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duración de Síntomas</label>
                    <input
                      type="text"
                      name="symptomDuration"
                      value={editData.symptomDuration}
                      onChange={handleEditChange}
                      className="input-field"
                      placeholder="Ej: 3 días"
                    />
                  </div>
                  <div className="form-group">
                    <label>Severidad</label>
                    <select
                      name="symptomSeverity"
                      value={editData.symptomSeverity}
                      onChange={handleEditChange}
                      className="input-field"
                    >
                      <option value="">Selecciona</option>
                      <option value="leve">Leve</option>
                      <option value="moderada">Moderada</option>
                      <option value="severa">Severa</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveAnamnesis}>
                    ✓ Guardar y continuar
                  </button>
                </div>
              ) : (
                <div className="view-form">
                  <p><strong>Enfermedad Actual:</strong></p>
                  <p>{visit.anamnesis?.current_illness || 'No registrada'}</p>
                  <p><strong>Duración:</strong></p>
                  <p>{visit.anamnesis?.symptom_duration || '-'}</p>
                  <p><strong>Severidad:</strong></p>
                  <p>{visit.anamnesis?.symptom_severity || '-'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VITAL SIGNS TAB */}
        {activeTab === 'vital-signs' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header">
                <h3>Signos Vitales</h3>
                <button
                  className={"btn-primary-small"}
                  onClick={() => setEditingField(editingField === 'vital-signs' ? null : 'vital-signs')}
                >
                  {editingField === 'vital-signs' ? '✕ Cancelar' : ' Editar'}
                </button>
              </div>

              {editingField === 'vital-signs' ? (
                <div className="edit-form">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Peso (kg)</label>
                      <input type="number" name="weight" value={editData.weight} onChange={handleEditChange} className="input-field" step="0.1" />
                    </div>
                    <div className="form-group">
                      <label>Altura (cm)</label>
                      <input type="number" name="height" value={editData.height} onChange={handleEditChange} className="input-field" />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>P.A. Sistólica (mmHg)</label>
                      <input type="number" name="systolicBp" value={editData.systolicBp} onChange={handleEditChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>P.A. Diastólica (mmHg)</label>
                      <input type="number" name="diastolicBp" value={editData.diastolicBp} onChange={handleEditChange} className="input-field" />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Frecuencia Cardíaca (FC)</label>
                      <input type="number" name="heartRate" value={editData.heartRate} onChange={handleEditChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Frecuencia Respiratoria (FR)</label>
                      <input type="number" name="respiratoryRate" value={editData.respiratoryRate} onChange={handleEditChange} className="input-field" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Temperatura (°C)</label>
                    <input type="number" name="bodyTemperature" value={editData.bodyTemperature} onChange={handleEditChange} className="input-field" step="0.1" />
                  </div>

                  <button className="btn btn-primary" onClick={handleSaveVitalSigns}>
                    ✓ Guardar y continuar
                  </button>
                </div>
              ) : (
                <div className="view-form vital-signs-grid">
                  <div className="vital-item"><strong>Peso:</strong> {visit.vitalSigns?.weight || '-'} kg</div>
                  <div className="vital-item"><strong>Altura:</strong> {visit.vitalSigns?.height || '-'} cm</div>
                  <div className="vital-item"><strong>IMC:</strong> {visit.vitalSigns?.imc ? Number(visit.vitalSigns.imc).toFixed(2) : '-'}</div>
                  <div className="vital-item"><strong>P.A.:</strong> {visit.vitalSigns?.systolic_bp || '-'}/{visit.vitalSigns?.diastolic_bp || '-'} mmHg</div>
                  <div className="vital-item"><strong>F.C.:</strong> {visit.vitalSigns?.heart_rate || '-'} bpm</div>
                  <div className="vital-item"><strong>F.R.:</strong> {visit.vitalSigns?.respiratory_rate || '-'} rpm</div>
                  <div className="vital-item"><strong>Temperatura:</strong> {visit.vitalSigns?.body_temperature || '-'} °C</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVISIÓN POR SISTEMAS TAB */}
        {activeTab === 'system-review' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header">
                <h3>Revisión por Sistemas</h3>
                <button
                  className={"btn-primary-small"}
                  onClick={() => setEditingField(editingField === 'system-review' ? null : 'system-review')}
                >
                  {editingField === 'system-review' ? '✕ Cancelar' : ' Editar'}
                </button>
              </div>

              {editingField === 'system-review' ? (
                <div className="edit-form">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Cabeza y Cuello</label>
                      <textarea name="headNeck" value={editData.headNeck} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                    <div className="form-group">
                      <label>Oculares</label>
                      <textarea name="ocular" value={editData.ocular} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Oídos</label>
                      <textarea name="ears" value={editData.ears} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                    <div className="form-group">
                      <label>Tórax y Abdomen</label>
                      <textarea name="thoraxAbdomen" value={editData.thoraxAbdomen} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Respiratorio</label>
                      <textarea name="respiratory" value={editData.respiratory} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                    <div className="form-group">
                      <label>Cardiovascular</label>
                      <textarea name="cardiovascular" value={editData.cardiovascular} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Digestivo</label>
                      <textarea name="digestive" value={editData.digestive} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                    <div className="form-group">
                      <label>Genitourinario</label>
                      <textarea name="genitourinary" value={editData.genitourinary} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Musculoesquelético</label>
                      <textarea name="musculoskeletal" value={editData.musculoskeletal} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                    <div className="form-group">
                      <label>Piel</label>
                      <textarea name="skin" value={editData.skin} onChange={handleEditChange} className="input-field" rows="2" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Nervioso</label>
                    <textarea name="nervousSystem" value={editData.nervousSystem} onChange={handleEditChange} className="input-field" rows="2" />
                  </div>

                  <button className="btn btn-primary" onClick={handleSaveSystemReview}>
                    ✓ Guardar y continuar
                  </button>
                </div>
              ) : (
                <div className="view-form">
                  <div className="systems-grid">
                    <div className="system-item"><strong>Cabeza/Cuello:</strong> {visit.systemReview?.head_neck || '-'}</div>
                    <div className="system-item"><strong>Oculares:</strong> {visit.systemReview?.ocular || '-'}</div>
                    <div className="system-item"><strong>Oídos:</strong> {visit.systemReview?.ears || '-'}</div>
                    <div className="system-item"><strong>Tórax/Abdomen:</strong> {visit.systemReview?.thorax_abdomen || '-'}</div>
                    <div className="system-item"><strong>Respiratorio:</strong> {visit.systemReview?.respiratory || '-'}</div>
                    <div className="system-item"><strong>Cardiovascular:</strong> {visit.systemReview?.cardiovascular || '-'}</div>
                    <div className="system-item"><strong>Digestivo:</strong> {visit.systemReview?.digestive || '-'}</div>
                    <div className="system-item"><strong>Genitourinario:</strong> {visit.systemReview?.genitourinary || '-'}</div>
                    <div className="system-item"><strong>Musculoesquelético:</strong> {visit.systemReview?.musculoskeletal || '-'}</div>
                    <div className="system-item"><strong>Piel:</strong> {visit.systemReview?.skin || '-'}</div>
                    <div className="system-item"><strong>Nervioso:</strong> {visit.systemReview?.nervous_system || '-'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXAMEN FÍSICO TAB */}
        {activeTab === 'physical-exam' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header">
                <h3>Examen Físico Detallado</h3>
                <button
                  className={"btn-primary-small"}
                  onClick={() => setEditingField(editingField === 'physical-exam' ? null : 'physical-exam')}
                >
                  {editingField === 'physical-exam' ? '✕ Cancelar' : ' Editar'}
                </button>
              </div>

              {editingField === 'physical-exam' ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Estado General</label>
                    <textarea name="generalAppearance" value={editData.generalAppearance} onChange={handleEditChange} className="input-field" rows="3" />
                  </div>
                  <div className="form-group">
                    <label>Estado Mental</label>
                    <textarea name="mentalStatus" value={editData.mentalStatus} onChange={handleEditChange} className="input-field" rows="3" />
                  </div>
                  <div className="form-group">
                    <label>Hallazgos Detallados</label>
                    <textarea name="detailedFindings" value={editData.detailedFindings} onChange={handleEditChange} className="input-field" rows="3" />
                  </div>
                  <div className="form-group">
                    <label>Hallazgos Anormales</label>
                    <textarea name="abnormalities" value={editData.abnormalities} onChange={handleEditChange} className="input-field" rows="3" />
                  </div>
                  <button className="btn btn-primary" onClick={handleSavePhysicalExam}>
                    ✓ Guardar y continuar
                  </button>
                </div>
              ) : (
                <div className="view-form">
                  <p><strong>Estado General:</strong></p>
                  <p>{visit.physicalExam?.general_appearance || '-'}</p>
                  <p><strong>Estado Mental:</strong></p>
                  <p>{visit.physicalExam?.mental_status || '-'}</p>
                  <p><strong>Hallazgos Detallados:</strong></p>
                  <p>{visit.physicalExam?.detailed_findings || '-'}</p>
                  <p><strong>Hallazgos Anormales:</strong></p>
                  <p>{visit.physicalExam?.abnormalities || '-'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DIAGNOSES TAB */}
        {activeTab === 'diagnoses' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header">
                <h3>Diagnósticos</h3>
                <button
                  className="btn-primary-small"
                  onClick={() => setShowAddDiagnosis(true)}
                >
                  ➕ Agregar
                </button>
              </div>
              {visit.diagnoses && visit.diagnoses.length > 0 ? (
                <div className="items-list">
                  {visit.diagnoses.map((diagnosis) => (
                    <div key={diagnosis.id} className="item-card">
                      <div className="item-header">
                        <div>
                          <p><strong>Código CIE10:</strong> {diagnosis.diagnosis_code_cie10}</p>
                          <p><strong>Descripción:</strong> {diagnosis.diagnosis_description}</p>
                          <p><strong>Tipo:</strong> {diagnosis.diagnosis_type}</p>
                          <p><strong>Severidad:</strong> {diagnosis.severity || '-'}</p>
                        </div>
                        <div className="item-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditDiagnosis(diagnosis)}
                            title="Editar diagnóstico"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteDiagnosis(diagnosis.id)}
                            title="Eliminar diagnóstico"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data-message">No hay diagnósticos registrados</p>
              )}
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS TAB */}
        {activeTab === 'recommendations' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header">
                <h3>Recomendaciones</h3>
                <button
                  className={"btn-primary-small"}
                  onClick={() => setEditingField(editingField === 'recommendations' ? null : 'recommendations')}
                >
                  {editingField === 'recommendations' ? '✕ Cancelar' : ' Editar'}
                </button>
              </div>

              {editingField === 'recommendations' ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Recomendaciones y Plan de Seguimiento</label>
                    <textarea
                      name="recommendations"
                      value={editData.recommendations}
                      onChange={handleEditChange}
                      className="input-field"
                      rows="6"
                      placeholder="Describe las recomendaciones y plan de manejo..."
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveRecommendations}>
                    ✓ Guardar y continuar
                  </button>
                </div>
              ) : (
                <div className="view-form">
                  <p>{visit.followUp?.follow_up_reason || 'Sin recomendaciones registradas'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TREATMENTS TAB */}
        {activeTab === 'treatments' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header">
                <h3>Medicamentos</h3>
                <div className="header-buttons">
                  <button
                    className="btn-primary-small"
                    onClick={() => setShowAddTreatment(true)}
                  >
                    ➕ Agregar
                  </button>
                </div>
              </div>
              {visit.treatments && visit.treatments.length > 0 ? (
                <div className="items-list">
                  {visit.treatments.map((treatment) => (
                    <div key={treatment.id} className="item-card">
                      <div className="item-header">
                        <div>
                          <p><strong>Medicamento:</strong> {treatment.medication_name}</p>
                          <p><strong>Dosis:</strong> {treatment.dosage}</p>
                          <p><strong>Vía:</strong> {treatment.route || '-'}</p>
                          <p><strong>Frecuencia:</strong> {treatment.frequency}</p>
                          <p><strong>Duración:</strong> {treatment.duration || '-'}</p>
                          <p><strong>Cantidad:</strong> {treatment.quantity || '-'}</p>
                          <p><strong>Instrucciones:</strong> {treatment.instructions || '-'}</p>
                        </div>
                        <div className="item-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditTreatment(treatment)}
                            title="Editar medicamento"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteTreatment(treatment.id)}
                            title="Eliminar medicamento"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data-message">No hay medicamentos registrados</p>
              )}
            </div>
          </div>
        )}

        {/* ✅ CHECKLIST TAB */}
        {activeTab === 'checklist' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <h3>📋 Checklist de Historia Clínica</h3>
              <p className="checklist-subtitle">Verifica que todos los campos estén completos</p>

              <div className="checklist-container">
                <ul className="checklist-list">
                  {[
                    { id: 'anamnesis', label: 'Anamnesis', icon: '📝' },
                    { id: 'vitalSigns', label: 'Signos Vitales', icon: '❤️' },
                    { id: 'systemReview', label: 'Revisión Sistemas', icon: '🔍' },
                    { id: 'physicalExam', label: 'Examen Físico', icon: '👨‍⚕️' },
                    { id: 'diagnoses', label: 'Diagnósticos', icon: '📋' },
                    { id: 'recommendations', label: 'Recomendaciones', icon: '💊' },
                    { id: 'treatments', label: 'Medicamentos', icon: '🏥' }
                  ].map((section) => {
                    const status = getSectionStatus(section.id);
                    const statusIcon = getStatusIcon(status);
                    return (
                      <li key={section.id} className="checklist-item">
                        <div className="item-left">
                          <span className="section-icon">{section.icon}</span>
                          <span className="section-label">{section.label}</span>
                        </div>
                        <div 
                          className={`status-badge status-${status}`}
                          style={{ color: statusIcon.color }}
                          title={statusIcon.label}
                        >
                          {statusIcon.icon}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Botón Finalizar */}
                <div className="checklist-button-container">
                  <button
                    className={`btn-finalize ${allSectionsComplete() ? 'btn-enabled' : 'btn-disabled'}`}
                    onClick={handleFinalizeConsultation}
                    disabled={!allSectionsComplete()}
                    title={allSectionsComplete() ? 'Finalizar historia clínica' : 'Completa todos los campos primero'}
                  >
                    {allSectionsComplete() ? '✓ Finalizar Historia' : '⚠️ Completa los campos faltantes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODALES - ✅ ACTUALIZADO CON PROPS PARA EDICIÓN */}
        {showAddDiagnosis && (
          <AddDiagnosis
            visitId={visitId}
            editingDiagnosis={editingDiagnosis}
            onDiagnosisAdded={fetchVisitDetails}
            onClose={handleCloseAddDiagnosis}
          />
        )}

        {showAddTreatment && (
          <AddTreatment
            visitId={visitId}
            editingTreatment={editingTreatment}
            onTreatmentAdded={fetchVisitDetails}
            onClose={handleCloseAddTreatment}
          />
        )}
      </div>
    </div>
  );
  }
