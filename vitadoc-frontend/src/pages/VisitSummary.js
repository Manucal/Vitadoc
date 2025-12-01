import React, { useRef, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import api from '../services/api';
import '../styles/VisitSummaryPage.css';

export default function VisitSummary() {
  const navigate = useNavigate();
  const { visitId } = useParams();
  const [visit, setVisit] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Refs para los PDFs
  const contentRef = useRef(null);      // Para la Historia Completa
  const prescriptionRef = useRef(null); // Para la Receta Médica
  
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

  React.useEffect(() => {
    if (visitId) {
      fetchVisitDetails();
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
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setDoctor(storedUser);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar consulta');
    } finally {
      setLoading(false);
    }
  };

  const getValue = (value, defaultValue = 'No registrado') => value || defaultValue;

  // Dividir contenido en páginas A4 (Para la historia completa)
  const dividirEnPaginas = () => {
    if (!visit) return [];
    const pages = [];
    
    // Página 1: Header + Info Paciente
    pages.push({ page: 1, sections: ['header', 'patient-info', 'date-time', 'reason'] });
    // Página 2: Anamnesis, Sistemas, Vitales
    pages.push({ page: 2, sections: ['anamnesis', 'systems', 'vitals'] });
    // Página 3: Examen Físico + Diagnósticos
    pages.push({ page: 3, sections: ['physical-exam', 'diagnoses'] });
    // Página 4: Recomendaciones + Medicamentos
    pages.push({ page: 4, sections: ['follow-up', 'treatments'] });

    return pages;
  };

  const pages = useMemo(() => dividirEnPaginas(), [visit]);

  // RENDERIZADOR DE SECCIONES (Historia Completa)
  const renderSection = (sectionType) => {
    switch (sectionType) {
      case 'header':
        return (
          <div className="summary-page-header" key="header">
            <div className="header-content">
              <div className="clinic-info">
                <h1>VitaDoc - Resumen de Consulta Médica</h1>
                <p className="clinic-details">Sistema de Gestión Médica</p>
              </div>
              <div className="doctor-info">
                <h3>Médico Tratante</h3>
                <p><strong>{getValue(doctor?.fullName)}</strong></p>
                <p>Especialidad: {getValue(doctor?.specialization)}</p>
                {doctor?.licenseNumber && <p>Número de Cédula: {doctor.licenseNumber}</p>}
              </div>
            </div>
          </div>
        );
      case 'patient-info':
        return (
          <section className="summary-section patient-info-section" key="patient-info">
            <h2>Información del Paciente</h2>
            <div className="patient-info-grid">
              <div className="info-box"><label>Nombre Completo</label><p className="info-value">{getValue(visit.patient?.full_name)}</p></div>
              <div className="info-box"><label>Documento</label><p className="info-value">{getValue(visit.patient?.document_type)}: {getValue(visit.patient?.document_id)}</p></div>
              <div className="info-box"><label>Edad</label><p className="info-value">{visit.patient?.birth_date ? new Date().getFullYear() - new Date(visit.patient.birth_date).getFullYear() + ' años' : 'No registrada'}</p></div>
              <div className="info-box"><label>Fecha Nac.</label><p className="info-value">{visit.patient?.birth_date ? new Date(visit.patient.birth_date).toLocaleDateString('es-CO') : 'No registrada'}</p></div>
              <div className="info-box"><label>Género</label><p className="info-value">{visit.patient?.gender === 'M' ? 'Masculino' : visit.patient?.gender === 'F' ? 'Femenino' : 'No registrado'}</p></div>
              <div className="info-box"><label>Tipo Sangre</label><p className="info-value">{getValue(visit.patient?.bloodtype)}</p></div>
              <div className="info-box"><label>Teléfono</label><p className="info-value">{getValue(visit.patient?.phone)}</p></div>
              <div className="info-box"><label>Ciudad</label><p className="info-value">{getValue(visit.patient?.city)}</p></div>
            </div>
          </section>
        );
      case 'date-time':
        return (
          <section className="summary-section date-section" key="date-time">
            <h2>Fecha y Hora de la Consulta</h2>
            <div className="date-box">
              <p className="date-value">{new Date(visit.visitDate).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="time-value">{new Date(visit.visitDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </section>
        );
      case 'reason':
        return visit.reasonForVisit ? (<section className="summary-section" key="reason"><h2>Motivo de la Consulta</h2><div className="content-box"><p>{visit.reasonForVisit}</p></div></section>) : null;
      case 'anamnesis':
        return (visit.anamnesis?.current_illness) ? (<section className="summary-section" key="anamnesis"><h2>Historia de la Enfermedad Actual</h2><div className="details-grid"><div className="detail-box"><label>Enfermedad Actual</label><p>{visit.anamnesis.current_illness}</p></div></div></section>) : null;
      case 'systems':
        return visit.systemReview && Object.keys(visit.systemReview).some(key => visit.systemReview[key]) ? (<section className="summary-section" key="systems"><h2>Revisión por Sistemas</h2><div className="systems-grid">{Object.entries(visit.systemReview).map(([key, value]) => value && <div key={key} className="system-box"><strong>{key}:</strong> {value}</div>)}</div></section>) : null;
      case 'vitals':
        return visit.vitalSigns ? (<section className="summary-section" key="vitals"><h2>Signos Vitales</h2><div className="vitals-grid-compact"><div className="vital-box"><label>PA</label><p>{visit.vitalSigns.systolic_bp}/{visit.vitalSigns.diastolic_bp}</p></div><div className="vital-box"><label>FC</label><p>{visit.vitalSigns.heart_rate}</p></div><div className="vital-box"><label>Temp</label><p>{visit.vitalSigns.body_temperature}°C</p></div></div></section>) : null;
      case 'physical-exam':
        return (visit.physicalExam?.detailed_findings) ? (<section className="summary-section" key="physical-exam"><h2>Examen Físico</h2><div className="exam-grid"><div className="exam-box full-width"><p>{visit.physicalExam.detailed_findings}</p></div></div></section>) : null;
      case 'diagnoses':
        return visit.diagnoses && visit.diagnoses.length > 0 ? (
          <section className="summary-section" key="diagnoses">
            <h2>Diagnósticos</h2>
            <div className="diagnoses-list-detailed">
              {visit.diagnoses.map((diagnosis, index) => (
                <div key={index} className="diagnosis-card-detailed">
                  <span className="code-badge">{diagnosis.diagnosis_code_cie10}</span> - {diagnosis.diagnosis_description}
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case 'follow-up':
        return visit.followUp?.follow_up_reason ? (<section className="summary-section" key="follow-up"><h2>Recomendaciones</h2><div className="content-box"><p>{visit.followUp.follow_up_reason}</p></div></section>) : null;
      case 'treatments':
        return visit.treatments && visit.treatments.length > 0 ? (
          <section className="summary-section" key="treatments">
            <h2>Medicamentos Prescritos</h2>
            <div className="treatments-list-detailed">
              {visit.treatments.map((treatment, index) => (
                <div key={index} className="treatment-card-detailed">
                  <h3>{treatment.medication_name}</h3>
                  <p>{treatment.dosage} - {treatment.frequency} durante {treatment.duration}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      default: return null;
    }
  };

  const handlePrint = () => { window.print(); };

  // 📄 DESCARGAR HISTORIA COMPLETA
  const downloadPDF = async () => {
    if (!contentRef.current) return;
    try {
      setGeneratingPDF(true);
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Historia_${visit.patient?.full_name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(contentRef.current).save();
    } catch (err) { alert('Error al generar PDF'); } finally { setGeneratingPDF(false); }
  };

  // 💊 NUEVA FUNCIÓN: DESCARGAR SOLO RECETA
  const downloadPrescription = async () => {
    if (!prescriptionRef.current) return;
    try {
      setGeneratingRecipe(true);
      const opt = {
        margin: [15, 15, 15, 15], // Márgenes un poco más amplios para receta formal
        filename: `Receta_${visit.patient?.full_name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false }, // Mayor escala para texto nítido
        jsPDF: { unit: 'mm', format: 'half-letter', orientation: 'portrait' } // Formato media carta (opcional) o 'a4'
      };
      await html2pdf().set(opt).from(prescriptionRef.current).save();
    } catch (err) { 
      console.error(err);
      alert('Error al generar la receta'); 
    } finally { 
      setGeneratingRecipe(false); 
    }
  };

  const handleBack = () => { navigate(-1); };
  const handleFinalizarConsulta = () => { navigate('/search-patient', { replace: true }); };

  if (loading) return <div className="page-center"><div className="loading-container">Cargando resumen...</div></div>;
  if (error || !visit) return <div className="page-center"><div className="error-container"><p>{error || 'Error al cargar'}</p><button className="btn btn-primary" onClick={handleBack}>← Atrás</button></div></div>;

  return (
    <div className="visit-summary-page">
      {/* BARRA DE ACCIONES */}
      <div className="summary-page-actions no-print">
        <button className="btn-action print" onClick={handlePrint} title="Imprimir pantalla">🖨️ Imprimir</button>
        
        {/* BOTÓN NUEVO: RECETA MÉDICA */}
        <button 
          className="btn-action recipe" 
          onClick={downloadPrescription}
          disabled={generatingRecipe || (!visit.treatments || visit.treatments.length === 0)}
          title="Descargar solo receta médica"
          style={{ backgroundColor: '#7c3aed', color: 'white' }} // Color morado distintivo
        >
          {generatingRecipe ? '⏳ Generando...' : '💊 Descargar Receta'}
        </button>

        <button 
          className="btn-action pdf" 
          onClick={downloadPDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? '⏳ Generando...' : '📄 Historia Completa'}
        </button>
        <button className="btn-action back" onClick={handleBack}>← Atrás</button>
      </div>

      {/* ================================================================================= */}
      {/* VISUALIZACIÓN EN PANTALLA (Historia Clínica Completa) */}
      <div ref={contentRef}>
        {pages.map((page) => (
          <div key={page.page} className="page-container">
            <div className="page-content">
              {page.sections.map((section) => renderSection(section))}
            </div>
          </div>
        ))}
        <div className="summary-page-footer">
          <p>Documento generado por VitaDoc - {new Date().toLocaleDateString('es-CO')}</p>
        </div>
      </div>

      {/* ================================================================================= */}
      {/* TEMPLATE OCULTO PARA LA RECETA MÉDICA (Solo visible para el PDF Generator) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={prescriptionRef} className="prescription-template" style={{ 
            width: '180mm', 
            padding: '20px', 
            fontFamily: 'Arial, sans-serif', 
            color: '#000',
            backgroundColor: '#fff'
          }}>
          
          {/* Encabezado Receta */}
          <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>VitaDoc</h1>
            <p style={{ margin: '5px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Fórmula Médica</p>
          </div>

          {/* Datos del Paciente y Fecha */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '14px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '5px 0' }}><strong>Paciente:</strong> {visit.patient?.full_name}</p>
              <p style={{ margin: '5px 0' }}><strong>Identificación:</strong> {visit.patient?.document_id}</p>
              {visit.patient?.address && <p style={{ margin: '5px 0' }}><strong>Dirección:</strong> {visit.patient.address}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '5px 0' }}><strong>Fecha:</strong> {new Date(visit.visitDate).toLocaleDateString('es-CO')}</p>
              <p style={{ margin: '5px 0' }}><strong>Ciudad:</strong> {visit.patient?.city || 'Colombia'}</p>
              <p style={{ margin: '5px 0' }}><strong>Consulta #</strong> {visit.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Cuerpo de la Receta (Medicamentos) */}
          <div style={{ minHeight: '400px' }}>
            <h3 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '15px' }}>Rp/</h3>
            
            {visit.treatments && visit.treatments.length > 0 ? (
              visit.treatments.map((t, i) => (
                <div key={i} style={{ marginBottom: '20px', paddingLeft: '10px' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    {i + 1}. {t.medication_name} {t.dosage}
                  </p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                    <strong>Cantidad:</strong> {t.quantity || 'Según tratamiento'}
                  </p>
                  <p style={{ margin: '0', fontSize: '14px', fontStyle: 'italic', color: '#444' }}>
                    <strong>Indicaciones:</strong> {t.instructions} ({t.frequency} por {t.duration})
                  </p>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>No se formularon medicamentos en esta consulta.</p>
            )}

            {/* Recomendaciones adicionales si existen */}
            {visit.followUp?.follow_up_reason && (
              <div style={{ marginTop: '40px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                <p><strong>Recomendaciones / Observaciones:</strong></p>
                <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{visit.followUp.follow_up_reason}</p>
              </div>
            )}
          </div>

          {/* Firma del Médico */}
          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '10px', textAlign: 'center', width: '250px' }}>
              {/* Espacio para firma */}
              <div style={{ height: '40px' }}></div> 
              <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{doctor?.fullName || 'Firma Médico'}</p>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>Reg. Médico: {doctor?.licenseNumber || 'Pendiente'}</p>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>{doctor?.specialization || 'Medicina General'}</p>
            </div>
          </div>

          <div style={{ marginTop: '30px', fontSize: '10px', color: '#999', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '5px' }}>
            Generado electrónicamente por VitaDoc - Validez legal sujeta a normatividad vigente.
          </div>
        </div>
      </div>
      {/* FIN TEMPLATE OCULTO */}

      <div className="summary-page-finalize-section no-print">
        <button className="btn btn-finalize" onClick={handleFinalizarConsulta}>
          ✓ Finalizar Consulta y Buscar Nuevo Paciente
        </button>
      </div>
    </div>
  );
}