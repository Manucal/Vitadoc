import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import AddDiagnosis from './AddDiagnosis';
import AddTreatment from './AddTreatment';
import ConfirmModal from '../components/ConfirmModal';
import SuccessModal from '../components/SuccessModal';
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
  
  // NOTA: editingField ya no se usa para bloquear pestañas, pero lo mantenemos 
  // por si quieres usarlo en componentes futuros, aunque en este flujo "Always Edit" no es necesario.
  const [editingField, setEditingField] = useState(null); 
  
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);

  // Estados para editar diagnósticos y tratamientos
  const [editingDiagnosis, setEditingDiagnosis] = useState(null);
  const [editingTreatment, setEditingTreatment] = useState(null);

  // ESTADOS PARA KITS DE TRATAMIENTO
  const [kits, setKits] = useState([]);
  const [kitName, setKitName] = useState('');
  const [showSaveKitModal, setShowSaveKitModal] = useState(false);
  const [showManageKitsModal, setShowManageKitsModal] = useState(false);

  // Estado para el modal de confirmación
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDanger: false
  });

  // Estado para el modal de éxito
  const [successConfig, setSuccessConfig] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // ESTADO PARA NUEVA CONSULTA
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
    fetchKits();
  }, [visitId]);

  // --- LÓGICA DE KITS ---
  const fetchKits = async () => {
    try {
      const response = await api.get('/kits');
      setKits(response.data);
    } catch (err) {
      console.error("Error cargando kits:", err);
    }
  };

  const handleSaveKit = async () => {
    if (!kitName.trim()) return alert("Por favor, ponle un nombre al Kit.");
    if (!visit.treatments || visit.treatments.length === 0) return alert("No hay medicamentos para guardar.");

    try {
      await api.post('/kits', {
        name: kitName,
        medicines: visit.treatments
      });
      
      setSuccessConfig({
        isOpen: true,
        title: 'Kit Guardado',
        message: `El kit "${kitName}" se ha guardado correctamente.`
      });

      setKitName('');
      setShowSaveKitModal(false);
      fetchKits();
    } catch (err) {
      console.error(err);
      alert("Error al guardar el kit.");
    }
  };

  const handleApplyKit = async (kitId) => {
    const selectedKit = kits.find(k => k.id === kitId);
    if (!selectedKit) return;

    if (!window.confirm(`¿Deseas cargar el kit "${selectedKit.name}"?`)) return;

    setLoading(true);
    try {
      const promises = selectedKit.medicines.map(med => {
        const payload = {
          medicationName: med.medication_name || med.medicationName,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          route: med.route,
          quantity: med.quantity,
          instructions: med.instructions
        };
        return api.post(`/medical-visits/${visitId}/treatments`, payload);
      });

      await Promise.all(promises);
      
      setSuccessConfig({
        isOpen: true,
        title: 'Kit Aplicado',
        message: 'Los medicamentos del kit se han agregado a la receta exitosamente.'
      });

      fetchVisitDetails();
    } catch (err) {
      console.error(err);
      alert("Error al aplicar kit.");
    } finally {
      setLoading(false);
    }
  };
  
  const confirmDeleteKit = (kitId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Kit',
      message: '¿Estás seguro de eliminar este kit de tratamientos? Esta acción no se puede deshacer.',
      isDanger: true,
      action: () => executeDeleteKit(kitId)
    });
  };

  const executeDeleteKit = async (kitId) => {
    try {
        await api.delete(`/kits/${kitId}`);
        setSuccessConfig({
          isOpen: true,
          title: 'Kit Eliminado',
          message: 'El kit ha sido eliminado de tu lista correctamente.'
        });
        fetchKits(); 
    } catch (err) {
        alert("Error al eliminar kit");
    }
  };
  // -----------------------------

  const fetchVisitDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/medical-visits/${visitId}/details`);
      if (response.data.success) {
        setVisit(response.data.visit);
        // Llenamos el formulario con los datos existentes
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

  const onConfirmAction = () => {
    if (confirmConfig.action) {
      confirmConfig.action();
    }
    setConfirmConfig({ ...confirmConfig, isOpen: false });
  };

  const handleCopyLastPrescription = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Repetir Receta',
      message: '¿Deseas copiar automáticamente los medicamentos de la última consulta de este paciente?',
      isDanger: false,
      action: executeCopyPrescription
    });
  };

  const executeCopyPrescription = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/medical-visits/${visitId}/copy-last-prescription`, {});

      if (response.data.success) {
        setSuccessConfig({
          isOpen: true,
          title: 'Receta Copiada',
          message: response.data.message || 'Los medicamentos se han copiado correctamente.'
        });
        fetchVisitDetails();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo copiar la receta anterior');
      setLoading(false);
    }
  };

  const handleEditDiagnosis = (diagnosis) => {
    setEditingDiagnosis(diagnosis);
    setShowAddDiagnosis(true);
  };

  const handleDeleteDiagnosis = (diagnosisId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Diagnóstico',
      message: '¿Estás seguro de que deseas eliminar este diagnóstico? Esta acción no se puede deshacer.',
      isDanger: true,
      action: () => executeDeleteDiagnosis(diagnosisId)
    });
  };

  const executeDeleteDiagnosis = async (diagnosisId) => {
    try {
      const response = await api.delete(`/medical-visits/${visitId}/diagnoses/${diagnosisId}`);
      if (response.data.success) {
        setVisit(prev => ({
          ...prev,
          diagnoses: prev.diagnoses.filter(d => d.id !== diagnosisId)
        }));
      }
    } catch (err) {
      alert(`Error al eliminar diagnóstico: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEditTreatment = (treatment) => {
    setEditingTreatment(treatment);
    setShowAddTreatment(true);
  };

  const handleDeleteTreatment = (treatmentId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Medicamento',
      message: '¿Estás seguro de que deseas eliminar este medicamento de la receta?',
      isDanger: true,
      action: () => executeDeleteTreatment(treatmentId)
    });
  };

  const executeDeleteTreatment = async (treatmentId) => {
    try {
      const response = await api.delete(`/medical-visits/${visitId}/treatments/${treatmentId}`);
      if (response.data.success) {
        setVisit(prev => ({
          ...prev,
          treatments: prev.treatments.filter(t => t.id !== treatmentId)
        }));
      }
    } catch (err) {
      alert(`Error al eliminar medicamento: ${err.response?.data?.error || err.message}`);
    }
  };

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
      const response = await api.post(`/medical-visits`, payload);

      if (response.data.success) {
        setConsultationCode(response.data.visit.id);
        setActiveTab('anamnesis');
        navigate(`/visit-details/${patientId}/${response.data.visit.id}`);
      }
    } catch (err) {
      console.error('Error creating consultation:', err);
      setNewConsultationError(err.response?.data?.error || 'Error al guardar consulta');
    } finally {
      setNewConsultationLoading(false);
    }
  };

  const getSectionStatus = (section) => {
    if (!visit) return 'empty';
    switch (section) {
      case 'anamnesis': return visit.anamnesis?.current_illness?.trim() ? 'complete' : 'empty';
      case 'vitalSigns': return (visit.vitalSigns?.weight && visit.vitalSigns?.systolic_bp) ? 'complete' : 'empty';
      case 'systemReview': return (visit.systemReview?.head_neck) ? 'complete' : 'empty';
      case 'physicalExam': return visit.physicalExam?.general_appearance?.trim() ? 'complete' : 'empty';
      case 'diagnoses': return visit.diagnoses?.length > 0 ? 'complete' : 'empty';
      case 'recommendations': return visit.followUp?.follow_up_reason?.trim() ? 'complete' : 'empty';
      case 'treatments': return visit.treatments?.length > 0 ? 'complete' : 'empty';
      default: return 'empty';
    }
  };

  const allSectionsComplete = () => {
    if (!visit) return false;
    const sections = ['anamnesis', 'vitalSigns', 'systemReview', 'physicalExam', 'diagnoses', 'recommendations', 'treatments'];
    return sections.every(section => getSectionStatus(section) === 'complete');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete': return { icon: '✓', color: '#16a34a', label: 'Completo' };
      case 'partial': return { icon: '⊙', color: '#ea580c', label: 'Parcial' };
      case 'empty': return { icon: '✕', color: '#dc2626', label: 'Incompleto' };
      default: return { icon: '?', color: '#999', label: 'Desconocido' };
    }
  };

  const handleFinalizeConsultation = async () => {
    if (!allSectionsComplete()) {
      alert('⚠️ Por favor completa todos los campos de la historia clínica');
      return;
    }
    try {
      await api.put(`/medical-visits/${visitId}/status`, { status: 'completed' });
      setSuccessConfig({
        isOpen: true,
        title: 'Historia Finalizada',
        message: 'La historia clínica se ha cerrado y finalizado correctamente.'
      });
      setTimeout(() => { navigate(`/visit-summary/${visitId}`); }, 2000);
    } catch (err) {
      alert('Error al finalizar: ' + err.response?.data?.error);
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
      setEditingField(null); // Esto ya no es necesario pero no estorba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- FUNCIONES DE GUARDADO (Ahora guardan y pasan a la siguiente pestaña sin cerrar nada) ---
  const handleSaveAnamnesis = async () => {
    try {
      await api.put(`/medical-visits/${visitId}/anamnesis`, {
        currentIllness: editData.currentIllness,
        symptomDuration: editData.symptomDuration,
        symptomSeverity: editData.symptomSeverity
      });
      fetchVisitDetails();
      navigateToNextTab('anamnesis'); // Guarda y salta a la siguiente
    } catch (err) { alert('Error al guardar: ' + err.response?.data?.error); }
  };

  const handleSaveVitalSigns = async () => {
    try {
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

      await api.put(`/medical-visits/${visitId}/vital-signs`, {
        weight: parseFloat(editData.weight),
        height: parseInt(editData.height),
        systolicBp: parseInt(editData.systolicBp),
        diastolicBp: parseInt(editData.diastolicBp),
        heartRate: parseInt(editData.heartRate),
        respiratoryRate: parseInt(editData.respiratoryRate),
        bodyTemperature: parseFloat(editData.bodyTemperature)
      });
      fetchVisitDetails();
      navigateToNextTab('vital-signs');
    } catch (err) { alert('Error al guardar.'); }
  };

  const handleSaveSystemReview = async () => {
    try {
      await api.put(`/medical-visits/${visitId}/system-review`, { ...editData });
      fetchVisitDetails();
      navigateToNextTab('system-review');
    } catch (err) { alert('Error al guardar.'); }
  };

  const handleSavePhysicalExam = async () => {
    try {
      await api.put(`/medical-visits/${visitId}/physical-exam`, { ...editData });
      fetchVisitDetails();
      navigateToNextTab('physical-exam');
    } catch (err) { alert('Error al guardar.'); }
  };

  const handleSaveRecommendations = async () => {
    try {
      await api.put(`/medical-visits/${visitId}/follow-up`, { followUpReason: editData.recommendations });
      fetchVisitDetails();
      navigateToNextTab('recommendations');
    } catch (err) { alert('Error al guardar.'); }
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
        <button className="back-button" onClick={handleBack}>← Atrás</button>

        <div className="details-header">
          <h2>Detalle de Consulta</h2>
          <p className="details-subtitle">
            {visit ? (
              <>Paciente: <strong>{visit.patient.full_name}</strong> Fecha: <strong>{new Date(visit.visitDate).toLocaleDateString('es-CO')}</strong></>
            ) : (<strong>Nueva Consulta</strong>)}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="tabs-container">
          {TAB_SEQUENCE.filter(tab => tab.id !== 'summary').map((tab) => (
            <button key={tab.id} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)} disabled={!visit && tab.id !== 'new-consultation'}>
              {tab.icon} {tab.label}
            </button>
          ))}
          {visit && <button className={`tab-button ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>📋 Checklist</button>}
        </div>

        {activeTab === 'new-consultation' && (
          <div className="tab-content">
             <div className="section-card">
               <div className="new-consultation-container">
                 <h3>Nueva Consulta Médica</h3>
                 {newConsultationError && <div className="error-message">{newConsultationError}</div>}
                 {visit ? (
                   <div className="consultation-created">
                     <p>Consulta creada exitosamente.</p>
                   </div>
                 ) : (
                   <form onSubmit={handleCreateNewConsultation}>
                     <div className="form-group">
                       <label>Motivo de la Consulta *</label>
                       <textarea name="reasonForVisit" className="input-field textarea-field" placeholder="Describe el motivo..." value={newConsultationData.reasonForVisit} onChange={handleNewConsultationChange} rows="4" required />
                     </div>
                     <button type="submit" className="btn btn-primary" disabled={newConsultationLoading}>{newConsultationLoading ? '⏳ Guardando...' : '✓ Crear Consulta'}</button>
                   </form>
                 )}
               </div>
             </div>
          </div>
        )}

        {/* --- PESTAÑAS SIEMPRE EDITABLES (SIN BOTÓN EDITAR NI MODO LECTURA) --- */}
        
        {activeTab === 'anamnesis' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header"><h3>Historia de la Enfermedad Actual</h3></div>
              <div className="edit-form">
                <div className="form-group"><label>Enfermedad Actual</label><textarea name="currentIllness" value={editData.currentIllness} onChange={handleEditChange} rows="4" className="input-field" placeholder="Escribe aquí..." /></div>
                <div className="form-group"><label>Duración de Síntomas</label><input type="text" name="symptomDuration" value={editData.symptomDuration} onChange={handleEditChange} className="input-field" placeholder="Ej: 3 días" /></div>
                <div className="form-group"><label>Severidad</label><select name="symptomSeverity" value={editData.symptomSeverity} onChange={handleEditChange} className="input-field"><option value="">Selecciona</option><option value="leve">Leve</option><option value="moderada">Moderada</option><option value="severa">Severa</option></select></div>
                <button className="btn btn-primary" onClick={handleSaveAnamnesis}>✓ Guardar y continuar</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vital-signs' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header"><h3>Signos Vitales</h3></div>
              <div className="edit-form">
                <div className="form-row-2">
                    <div className="form-group"><label>Peso (kg)</label><input type="number" name="weight" value={editData.weight} onChange={handleEditChange} className="input-field" step="0.1" /></div>
                    <div className="form-group"><label>Altura (cm)</label><input type="number" name="height" value={editData.height} onChange={handleEditChange} className="input-field" /></div>
                </div>
                <div className="form-row-2">
                    <div className="form-group"><label>P.A. Sistólica (mmHg)</label><input type="number" name="systolicBp" value={editData.systolicBp} onChange={handleEditChange} className="input-field" /></div>
                    <div className="form-group"><label>P.A. Diastólica (mmHg)</label><input type="number" name="diastolicBp" value={editData.diastolicBp} onChange={handleEditChange} className="input-field" /></div>
                </div>
                <div className="form-row-2">
                    <div className="form-group"><label>Frecuencia Cardíaca (FC)</label><input type="number" name="heartRate" value={editData.heartRate} onChange={handleEditChange} className="input-field" /></div>
                    <div className="form-group"><label>Frecuencia Respiratoria (FR)</label><input type="number" name="respiratoryRate" value={editData.respiratoryRate} onChange={handleEditChange} className="input-field" /></div>
                </div>
                <div className="form-group"><label>Temperatura (°C)</label><input type="number" name="bodyTemperature" value={editData.bodyTemperature} onChange={handleEditChange} className="input-field" step="0.1" /></div>
                <button className="btn btn-primary" onClick={handleSaveVitalSigns}>✓ Guardar y continuar</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system-review' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header"><h3>Revisión por Sistemas</h3></div>
              <div className="edit-form">
                <div className="form-row-2"><div className="form-group"><label>Cabeza y Cuello</label><textarea name="headNeck" value={editData.headNeck} onChange={handleEditChange} className="input-field" rows="2" /></div><div className="form-group"><label>Oculares</label><textarea name="ocular" value={editData.ocular} onChange={handleEditChange} className="input-field" rows="2" /></div></div>
                <div className="form-row-2"><div className="form-group"><label>Oídos</label><textarea name="ears" value={editData.ears} onChange={handleEditChange} className="input-field" rows="2" /></div><div className="form-group"><label>Tórax y Abdomen</label><textarea name="thoraxAbdomen" value={editData.thoraxAbdomen} onChange={handleEditChange} className="input-field" rows="2" /></div></div>
                <div className="form-row-2"><div className="form-group"><label>Respiratorio</label><textarea name="respiratory" value={editData.respiratory} onChange={handleEditChange} className="input-field" rows="2" /></div><div className="form-group"><label>Cardiovascular</label><textarea name="cardiovascular" value={editData.cardiovascular} onChange={handleEditChange} className="input-field" rows="2" /></div></div>
                <div className="form-row-2"><div className="form-group"><label>Digestivo</label><textarea name="digestive" value={editData.digestive} onChange={handleEditChange} className="input-field" rows="2" /></div><div className="form-group"><label>Genitourinario</label><textarea name="genitourinary" value={editData.genitourinary} onChange={handleEditChange} className="input-field" rows="2" /></div></div>
                <div className="form-row-2"><div className="form-group"><label>Musculoesquelético</label><textarea name="musculoskeletal" value={editData.musculoskeletal} onChange={handleEditChange} className="input-field" rows="2" /></div><div className="form-group"><label>Piel</label><textarea name="skin" value={editData.skin} onChange={handleEditChange} className="input-field" rows="2" /></div></div>
                <div className="form-group"><label>Nervioso</label><textarea name="nervousSystem" value={editData.nervousSystem} onChange={handleEditChange} className="input-field" rows="2" /></div>
                <button className="btn btn-primary" onClick={handleSaveSystemReview}>✓ Guardar y continuar</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'physical-exam' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header"><h3>Examen Físico Detallado</h3></div>
              <div className="edit-form">
                <div className="form-group"><label>Estado General</label><textarea name="generalAppearance" value={editData.generalAppearance} onChange={handleEditChange} className="input-field" rows="3" /></div>
                <div className="form-group"><label>Estado Mental</label><textarea name="mentalStatus" value={editData.mentalStatus} onChange={handleEditChange} className="input-field" rows="3" /></div>
                <div className="form-group"><label>Hallazgos Detallados</label><textarea name="detailedFindings" value={editData.detailedFindings} onChange={handleEditChange} className="input-field" rows="3" /></div>
                <div className="form-group"><label>Hallazgos Anormales</label><textarea name="abnormalities" value={editData.abnormalities} onChange={handleEditChange} className="input-field" rows="3" /></div>
                <button className="btn btn-primary" onClick={handleSavePhysicalExam}>✓ Guardar y continuar</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diagnoses' && visit && (
           <div className="tab-content"><div className="section-card"><div className="section-header"><h3>Diagnósticos</h3><button className="btn-primary-small" onClick={() => setShowAddDiagnosis(true)}>➕ Agregar</button></div>{visit.diagnoses && visit.diagnoses.length > 0 ? (<div className="items-list">{visit.diagnoses.map((diagnosis) => (<div key={diagnosis.id} className="item-card"><div className="item-header"><div><p><strong>Código CIE10:</strong> {diagnosis.diagnosis_code_cie10}</p><p><strong>Descripción:</strong> {diagnosis.diagnosis_description}</p><p><strong>Tipo:</strong> {diagnosis.diagnosis_type}</p><p><strong>Severidad:</strong> {diagnosis.severity || '-'}</p></div><div className="item-actions"><button className="btn-edit" onClick={() => handleEditDiagnosis(diagnosis)}>✏️ Editar</button><button className="btn-delete" onClick={() => handleDeleteDiagnosis(diagnosis.id)}>🗑️ Eliminar</button></div></div></div>))}</div>) : (<p className="no-data-message">No hay diagnósticos registrados</p>)}</div></div>
        )}

        {activeTab === 'recommendations' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header"><h3>Recomendaciones</h3></div>
              <div className="edit-form">
                <div className="form-group"><label>Recomendaciones y Plan de Seguimiento</label><textarea name="recommendations" value={editData.recommendations} onChange={handleEditChange} className="input-field" rows="6" placeholder="Describe las recomendaciones y plan de manejo..." /></div>
                <button className="btn btn-primary" onClick={handleSaveRecommendations}>✓ Guardar y continuar</button>
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA MEDICAMENTOS --- */}
        {activeTab === 'treatments' && visit && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header">
                <h3>Medicamentos</h3>
                <div className="header-buttons">
                  <button className="btn-secondary-small" onClick={handleCopyLastPrescription} style={{marginRight: '10px', backgroundColor: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe'}}>🔄 Repetir Última</button>
                  <button className="btn-primary-small" onClick={() => setShowAddTreatment(true)}>➕ Agregar</button>
                </div>
              </div>

              {/* BARRA DE KITS */}
              <div className="kit-toolbar" style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                     <label style={{display:'block', fontSize:'0.85rem', color:'#666', marginBottom:'4px'}}>⚡ Kits Rápidos:</label>
                     <div style={{ display: 'flex', gap: '5px' }}>
                        <select className="input-field" style={{width:'100%', margin:0}} onChange={(e) => { if(e.target.value) handleApplyKit(e.target.value); e.target.value = ""; }}>
                            <option value="">-- Seleccionar un Kit guardado --</option>
                            {kits.map(kit => (<option key={kit.id} value={kit.id}>{kit.name} ({kit.medicines?.length || 0} meds)</option>))}
                        </select>
                        <button className="btn-secondary-small" onClick={() => setShowManageKitsModal(true)} title="Gestionar mis Kits" style={{ padding: '0 12px' }}>⚙️</button>
                     </div>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <button className="btn-secondary-small" onClick={() => setShowSaveKitModal(true)} disabled={!visit.treatments || visit.treatments.length === 0} title="Guarda los medicamentos actuales como un nuevo Kit">💾 Guardar como Kit</button>
                  </div>
                </div>

                {showSaveKitModal && (
                   <div style={{ marginTop: '10px', display:'flex', gap:'5px', alignItems:'center', background:'white', padding:'10px', border:'1px solid #ddd', borderRadius:'6px' }}>
                      <input type="text" placeholder="Nombre del Kit (Ej: Gripa Adulto)" value={kitName} onChange={e => setKitName(e.target.value)} className="input-field" style={{margin:0, flex:1}} autoFocus />
                      <button className="btn-primary-small" onClick={handleSaveKit}>Guardar</button>
                      <button className="btn-secondary-small" onClick={() => setShowSaveKitModal(false)}>✕</button>
                   </div>
                )}
              </div>

              {visit.treatments && visit.treatments.length > 0 ? (
                <div className="items-list">
                  {visit.treatments.map((treatment) => (
                    <div key={treatment.id} className="item-card">
                      <div className="item-header">
                        <div><p><strong>Medicamento:</strong> {treatment.medication_name}</p><p><strong>Dosis:</strong> {treatment.dosage}</p><p><strong>Vía:</strong> {treatment.route || '-'}</p><p><strong>Frecuencia:</strong> {treatment.frequency}</p><p><strong>Duración:</strong> {treatment.duration || '-'}</p><p><strong>Cantidad:</strong> {treatment.quantity || '-'}</p><p><strong>Instrucciones:</strong> {treatment.instructions || '-'}</p></div>
                        <div className="item-actions"><button className="btn-edit" onClick={() => handleEditTreatment(treatment)} title="Editar">✏️</button><button className="btn-delete" onClick={() => handleDeleteTreatment(treatment.id)} title="Eliminar">🗑️</button></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (<p className="no-data-message">No hay medicamentos registrados</p>)}
            </div>
          </div>
        )}

        {activeTab === 'checklist' && visit && (
          <div className="tab-content"><div className="section-card"><h3>📋 Checklist de Historia Clínica</h3><p className="checklist-subtitle">Verifica que todos los campos estén completos</p><div className="checklist-container"><ul className="checklist-list">{[{ id: 'anamnesis', label: 'Anamnesis', icon: '📝' }, { id: 'vitalSigns', label: 'Signos Vitales', icon: '❤️' }, { id: 'systemReview', label: 'Revisión Sistemas', icon: '🔍' }, { id: 'physicalExam', label: 'Examen Físico', icon: '👨‍⚕️' }, { id: 'diagnoses', label: 'Diagnósticos', icon: '📋' }, { id: 'recommendations', label: 'Recomendaciones', icon: '💊' }, { id: 'treatments', label: 'Medicamentos', icon: '🏥' }].map((section) => { const status = getSectionStatus(section.id); const statusIcon = getStatusIcon(status); return (<li key={section.id} className="checklist-item"><div className="item-left"><span className="section-icon">{section.icon}</span><span className="section-label">{section.label}</span></div><div className={`status-badge status-${status}`} style={{ color: statusIcon.color }} title={statusIcon.label}>{statusIcon.icon}</div></li>); })}</ul><div className="checklist-button-container"><button className={`btn-finalize ${allSectionsComplete() ? 'btn-enabled' : 'btn-disabled'}`} onClick={handleFinalizeConsultation} disabled={!allSectionsComplete()} title={allSectionsComplete() ? 'Finalizar historia clínica' : 'Completa todos los campos primero'}>{allSectionsComplete() ? '✓ Finalizar Historia' : '⚠️ Completa los campos faltantes'}</button></div></div></div></div>
        )}

        {/* COMPONENTES FLOTANTES */}
        {showAddDiagnosis && <AddDiagnosis visitId={visitId} editingDiagnosis={editingDiagnosis} onDiagnosisAdded={fetchVisitDetails} onClose={handleCloseAddDiagnosis} />}
        {showAddTreatment && <AddTreatment visitId={visitId} editingTreatment={editingTreatment} onTreatmentAdded={fetchVisitDetails} onClose={handleCloseAddTreatment} />}

        {showManageKitsModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="section-header" style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Gestionar mis Kits</h3>
                <button className="btn-secondary-small" onClick={() => setShowManageKitsModal(false)}>✕ Cerrar</button>
              </div>
              <div className="items-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {kits.length > 0 ? (
                   kits.map(kit => (
                     <div key={kit.id} className="item-card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: '10px' }}>
                        <div><span style={{ fontWeight: '600', display: 'block' }}>{kit.name}</span><span style={{ fontSize: '0.85rem', color: '#666' }}>{kit.medicines.length} medicamentos</span></div>
                        <button className="btn-delete" onClick={() => confirmDeleteKit(kit.id)} style={{ padding: '6px 12px' }} title="Eliminar este Kit">🗑️</button>
                     </div>
                   ))
                ) : (<p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No tienes kits guardados aún.</p>)}
              </div>
            </div>
          </div>
        )}

        <ConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} isDanger={confirmConfig.isDanger} onConfirm={onConfirmAction} onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} />
        <SuccessModal isOpen={successConfig.isOpen} title={successConfig.title} message={successConfig.message} onClose={() => setSuccessConfig({ ...successConfig, isOpen: false })} />
      </div>
    </div>
  );
}