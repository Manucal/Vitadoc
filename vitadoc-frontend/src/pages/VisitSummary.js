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
  const contentRef = useRef(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

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

  // ✅ NUEVA FUNCIÓN: Dividir contenido en páginas A4
  const dividirEnPaginas = () => {
    if (!visit) return [];
    
    const pages = [];
    
    // Página 1: Header + Info Paciente
    pages.push({
      page: 1,
      sections: ['header', 'patient-info', 'date-time', 'reason']
    });

    // Página 2: Anamnesis, Sistemas, Vitales
    pages.push({
      page: 2,
      sections: ['anamnesis', 'systems', 'vitals']
    });

    // Página 3: Examen Físico + Diagnósticos
    pages.push({
      page: 3,
      sections: ['physical-exam', 'diagnoses']
    });

    // Página 4: Recomendaciones + Medicamentos
    pages.push({
      page: 4,
      sections: ['follow-up', 'treatments']
    });

    return pages;
  };

  const pages = useMemo(() => dividirEnPaginas(), [visit]);

  // ✅ FUNCIÓN PARA RENDERIZAR CADA SECCIÓN
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
              <div className="info-box">
                <label>Nombre Completo</label>
                <p className="info-value">{getValue(visit.patient?.full_name)}</p>
              </div>
              <div className="info-box">
                <label>Documento</label>
                <p className="info-value">{getValue(visit.patient?.document_type)}: {getValue(visit.patient?.document_id)}</p>
              </div>
              <div className="info-box">
                <label>Edad</label>
                <p className="info-value">
                  {visit.patient?.birth_date 
                    ? new Date().getFullYear() - new Date(visit.patient.birth_date).getFullYear() + ' años'
                    : 'No registrada'}
                </p>
              </div>
              <div className="info-box">
                <label>Fecha de Nacimiento</label>
                <p className="info-value">
                  {visit.patient?.birth_date 
                    ? new Date(visit.patient.birth_date).toLocaleDateString('es-CO')
                    : 'No registrada'}
                </p>
              </div>
              <div className="info-box">
                <label>Género</label>
                <p className="info-value">
                  {visit.patient?.gender === 'M' ? 'Masculino' : visit.patient?.gender === 'F' ? 'Femenino' : 'No registrado'}
                </p>
              </div>
              <div className="info-box">
                <label>Tipo de Sangre</label>
                <p className="info-value">{getValue(visit.patient?.bloodtype)}</p>
              </div>
              <div className="info-box">
                <label>Teléfono</label>
                <p className="info-value">{getValue(visit.patient?.phone)}</p>
              </div>
              <div className="info-box">
                <label>Email</label>
                <p className="info-value">{getValue(visit.patient?.email)}</p>
              </div>
              <div className="info-box">
                <label>Dirección</label>
                <p className="info-value">{getValue(visit.patient?.address)}</p>
              </div>
              <div className="info-box">
                <label>Ciudad</label>
                <p className="info-value">{getValue(visit.patient?.city)}</p>
              </div>
            </div>
          </section>
        );

      case 'date-time':
        return (
          <section className="summary-section date-section" key="date-time">
            <h2>Fecha y Hora de la Consulta</h2>
            <div className="date-box">
              <p className="date-value">
                {new Date(visit.visitDate).toLocaleDateString('es-CO', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="time-value">
                {new Date(visit.visitDate).toLocaleTimeString('es-CO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </section>
        );

      case 'reason':
        return visit.reasonForVisit ? (
          <section className="summary-section" key="reason">
            <h2>Motivo de la Consulta</h2>
            <div className="content-box">
              <p>{visit.reasonForVisit}</p>
            </div>
          </section>
        ) : null;

      case 'anamnesis':
        return (visit.anamnesis?.current_illness || visit.anamnesis?.symptom_duration || visit.anamnesis?.symptom_severity) ? (
          <section className="summary-section" key="anamnesis">
            <h2>Historia de la Enfermedad Actual</h2>
            <div className="details-grid">
              {visit.anamnesis?.current_illness && (
                <div className="detail-box">
                  <label>Enfermedad Actual</label>
                  <p>{visit.anamnesis.current_illness}</p>
                </div>
              )}
              {visit.anamnesis?.symptom_duration && (
                <div className="detail-box">
                  <label>Duración de Síntomas</label>
                  <p>{visit.anamnesis.symptom_duration}</p>
                </div>
              )}
              {visit.anamnesis?.symptom_severity && (
                <div className="detail-box">
                  <label>Severidad</label>
                  <p>{visit.anamnesis.symptom_severity}</p>
                </div>
              )}
            </div>
          </section>
        ) : null;

      case 'systems':
        return visit.systemReview && Object.keys(visit.systemReview).some(key => visit.systemReview[key]) ? (
          <section className="summary-section" key="systems">
            <h2>Revisión por Sistemas</h2>
            <div className="systems-grid">
              {visit.systemReview?.head_neck && <div className="system-box"><strong>Cabeza/Cuello:</strong> {visit.systemReview.head_neck}</div>}
              {visit.systemReview?.ocular && <div className="system-box"><strong>Oculares:</strong> {visit.systemReview.ocular}</div>}
              {visit.systemReview?.ears && <div className="system-box"><strong>Oídos:</strong> {visit.systemReview.ears}</div>}
              {visit.systemReview?.thorax_abdomen && <div className="system-box"><strong>Tórax/Abdomen:</strong> {visit.systemReview.thorax_abdomen}</div>}
              {visit.systemReview?.respiratory && <div className="system-box"><strong>Respiratorio:</strong> {visit.systemReview.respiratory}</div>}
              {visit.systemReview?.cardiovascular && <div className="system-box"><strong>Cardiovascular:</strong> {visit.systemReview.cardiovascular}</div>}
              {visit.systemReview?.digestive && <div className="system-box"><strong>Digestivo:</strong> {visit.systemReview.digestive}</div>}
              {visit.systemReview?.genitourinary && <div className="system-box"><strong>Genitourinario:</strong> {visit.systemReview.genitourinary}</div>}
              {visit.systemReview?.musculoskeletal && <div className="system-box"><strong>Musculoesquelético:</strong> {visit.systemReview.musculoskeletal}</div>}
              {visit.systemReview?.skin && <div className="system-box"><strong>Piel:</strong> {visit.systemReview.skin}</div>}
              {visit.systemReview?.nervous_system && <div className="system-box"><strong>Nervioso:</strong> {visit.systemReview.nervous_system}</div>}
            </div>
          </section>
        ) : null;

      case 'vitals':
        return visit.vitalSigns ? (
          <section className="summary-section" key="vitals">
            <h2>Signos Vitales</h2>
            <div className="vitals-grid-compact">
              {visit.vitalSigns?.weight && (
                <div className="vital-box">
                  <label>Peso</label>
                  <p className="vital-value">{visit.vitalSigns.weight} <span>kg</span></p>
                </div>
              )}
              {visit.vitalSigns?.height && (
                <div className="vital-box">
                  <label>Altura</label>
                  <p className="vital-value">{visit.vitalSigns.height} <span>cm</span></p>
                </div>
              )}
              {visit.vitalSigns?.imc && (
                <div className="vital-box">
                  <label>IMC</label>
                  <p className="vital-value">{Number(visit.vitalSigns.imc).toFixed(2)}</p>
                </div>
              )}
              {visit.vitalSigns?.systolic_bp && (
                <div className="vital-box">
                  <label>Presión Arterial</label>
                  <p className="vital-value">{visit.vitalSigns.systolic_bp}/{visit.vitalSigns.diastolic_bp} <span>mmHg</span></p>
                </div>
              )}
              {visit.vitalSigns?.heart_rate && (
                <div className="vital-box">
                  <label>Frecuencia Cardíaca</label>
                  <p className="vital-value">{visit.vitalSigns.heart_rate} <span>bpm</span></p>
                </div>
              )}
              {visit.vitalSigns?.respiratory_rate && (
                <div className="vital-box">
                  <label>Frecuencia Respiratoria</label>
                  <p className="vital-value">{visit.vitalSigns.respiratory_rate} <span>rpm</span></p>
                </div>
              )}
              {visit.vitalSigns?.body_temperature && (
                <div className="vital-box">
                  <label>Temperatura</label>
                  <p className="vital-value">{visit.vitalSigns.body_temperature} <span>°C</span></p>
                </div>
              )}
            </div>
          </section>
        ) : null;

      case 'physical-exam':
        return (visit.physicalExam?.general_appearance || visit.physicalExam?.mental_status || visit.physicalExam?.detailed_findings || visit.physicalExam?.abnormalities) ? (
          <section className="summary-section" key="physical-exam">
            <h2>Examen Físico Detallado</h2>
            <div className="exam-grid">
              {visit.physicalExam?.general_appearance && (
                <div className="exam-box">
                  <label>Estado General</label>
                  <p>{visit.physicalExam.general_appearance}</p>
                </div>
              )}
              {visit.physicalExam?.mental_status && (
                <div className="exam-box">
                  <label>Estado Mental</label>
                  <p>{visit.physicalExam.mental_status}</p>
                </div>
              )}
              {visit.physicalExam?.detailed_findings && (
                <div className="exam-box full-width">
                  <label>Hallazgos Detallados</label>
                  <p>{visit.physicalExam.detailed_findings}</p>
                </div>
              )}
              {visit.physicalExam?.abnormalities && (
                <div className="exam-box full-width">
                  <label>Hallazgos Anormales</label>
                  <p>{visit.physicalExam.abnormalities}</p>
                </div>
              )}
            </div>
          </section>
        ) : null;

      case 'diagnoses':
        return visit.diagnoses && visit.diagnoses.length > 0 ? (
          <section className="summary-section" key="diagnoses">
            <h2>Diagnósticos</h2>
            <div className="diagnoses-list-detailed">
              {visit.diagnoses.map((diagnosis, index) => (
                <div key={index} className="diagnosis-card-detailed">
                  <div className="diagnosis-header-detailed">
                    <span className="code-badge">{diagnosis.diagnosis_code_cie10}</span>
                    <span className="type-badge">{diagnosis.diagnosis_type}</span>
                  </div>
                  <p className="diagnosis-desc">{diagnosis.diagnosis_description}</p>
                  {diagnosis.severity && (
                    <p className="severity-badge">Severidad: <strong>{diagnosis.severity}</strong></p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null;

      case 'follow-up':
        return visit.followUp?.follow_up_reason ? (
          <section className="summary-section" key="follow-up">
            <h2>Recomendaciones y Plan de Seguimiento</h2>
            <div className="content-box">
              <p>{visit.followUp.follow_up_reason}</p>
            </div>
          </section>
        ) : null;

      case 'treatments':
        return visit.treatments && visit.treatments.length > 0 ? (
          <section className="summary-section" key="treatments">
            <h2>Medicamentos Prescritos</h2>
            <div className="treatments-list-detailed">
              {visit.treatments.map((treatment, index) => (
                <div key={index} className="treatment-card-detailed">
                  <div className="treatment-header-detailed">
                    <h3>{treatment.medication_name}</h3>
                  </div>
                  <div className="treatment-body">
                    <div className="treatment-row">
                      <label>Dosis:</label>
                      <p>{treatment.dosage}</p>
                    </div>
                    {treatment.route && (
                      <div className="treatment-row">
                        <label>Vía:</label>
                        <p>{treatment.route}</p>
                      </div>
                    )}
                    <div className="treatment-row">
                      <label>Frecuencia:</label>
                      <p>{treatment.frequency}</p>
                    </div>
                    {treatment.duration && (
                      <div className="treatment-row">
                        <label>Duración:</label>
                        <p>{treatment.duration}</p>
                      </div>
                    )}
                    {treatment.quantity && (
                      <div className="treatment-row">
                        <label>Cantidad:</label>
                        <p>{treatment.quantity}</p>
                      </div>
                    )}
                    {treatment.instructions && (
                      <div className="treatment-row">
                        <label>Instrucciones:</label>
                        <p>{treatment.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null;

      default:
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ✅ FUNCIÓN MEJORADA PARA DESCARGAR PDF
  const downloadPDF = async () => {
    if (!contentRef.current) return;
    
    try {
      setGeneratingPDF(true);
      
      const element = contentRef.current;
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Historia_Clinica_${visit.patient?.full_name}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 0.98 
        },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true
        },
        jsPDF: { 
          orientation: 'portrait', 
          unit: 'mm', 
          format: 'a4',
          hotfixes: ['px_scaling']
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['.no-break', '.summary-section']
        }
      };
      
      const pdf = html2pdf().set(opt);
      pdf.from(element).save();
      
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar PDF. Intenta nuevamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleFinalizarConsulta = () => {
    navigate('/search-patient', { replace: true });
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-container">Cargando resumen...</div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="page-center">
        <div className="error-container">
          <p>{error || 'Error al cargar la consulta'}</p>
          <button className="btn btn-primary" onClick={handleBack}>
            ← Atrás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="visit-summary-page">
      {/* BARRA DE ACCIONES (NO se imprime) */}
      <div className="summary-page-actions no-print">
        <button className="btn-action print" onClick={handlePrint} title="Imprimir">
          Imprimir
        </button>
        <button 
          className="btn-action pdf" 
          onClick={downloadPDF}
          disabled={generatingPDF}
          title={generatingPDF ? 'Generando PDF...' : 'Descargar PDF'}
        >
          {generatingPDF ? '⏳ Generando...' : 'Descargar PDF'}
        </button>
        <button className="btn-action back" onClick={handleBack} title="Atrás">
          ← Atrás
        </button>
      </div>

      {/* CONTENIDO EN PÁGINAS A4 */}
      <div ref={contentRef}>
        {pages.map((page) => (
          <div key={page.page} className="page-container">
            <div className="page-content">
              {page.sections.map((section) => renderSection(section))}
            </div>
          </div>
        ))}

        {/* FOOTER (Última página) */}
        <div className="summary-page-footer">
          <p>Documento generado automáticamente por VitaDoc</p>
          <p className="print-only">Fecha de impresión: {new Date().toLocaleDateString('es-CO')} - {new Date().toLocaleTimeString('es-CO')}</p>
        </div>
      </div>

      {/* BOTÓN FINALIZAR (NO se imprime) */}
      <div className="summary-page-finalize-section no-print">
        <button 
          className="btn btn-finalize" 
          onClick={handleFinalizarConsulta}
        >
          ✓ Finalizar Consulta y Buscar Nuevo Paciente
        </button>
      </div>
    </div>
  );
}
