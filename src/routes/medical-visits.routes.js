import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// ============================================
// CREATE - CREAR NUEVA CONSULTA MÉDICA
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patientId, reasonForVisit } = req.body;

    if (!patientId || !reasonForVisit) {
      return res.status(400).json({ error: 'patientId y reasonForVisit son requeridos' });
    }

    const patientResult = await query(
      'SELECT id FROM patients WHERE id = $1 AND tenant_id = $2',
      [patientId, req.clientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const visitResult = await query(
      `INSERT INTO medical_visits (
        tenant_id, patient_id, doctor_id, reason_for_visit, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, visit_date`,
      [req.clientId, patientId, req.userId, reasonForVisit, 'draft', req.userId]
    );

    const visitId = visitResult.rows[0].id;

    await query('INSERT INTO anamnesis (visit_id) VALUES ($1)', [visitId]);
    await query('INSERT INTO personal_history (visit_id) VALUES ($1)', [visitId]);
    await query('INSERT INTO family_history (visit_id) VALUES ($1)', [visitId]);
    await query('INSERT INTO vital_signs (visit_id) VALUES ($1)', [visitId]);
    await query('INSERT INTO system_review (visit_id) VALUES ($1)', [visitId]);
    await query('INSERT INTO physical_exam (visit_id) VALUES ($1)', [visitId]);
    await query('INSERT INTO follow_up (visit_id) VALUES ($1)', [visitId]);

    res.status(201).json({
      success: true,
      message: 'Consulta médica creada exitosamente',
      visit: {
        id: visitId,
        patientId,
        reasonForVisit,
        status: 'draft',
        visitDate: visitResult.rows[0].visit_date
      }
    });
  } catch (error) {
    console.error('Error al crear consulta:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// READ - OBTENER TODAS LAS CONSULTAS DEL PACIENTE
// ============================================
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const patientResult = await query(
      'SELECT id FROM patients WHERE id = $1 AND tenant_id = $2',
      [patientId, req.clientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const result = await query(
      `SELECT id, visit_date, reason_for_visit, status, created_date 
       FROM medical_visits 
       WHERE patient_id = $1 AND tenant_id = $2 
       ORDER BY visit_date DESC`,
      [patientId, req.clientId]
    );

    res.json({
      success: true,
      visits: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener consultas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// READ - OBTENER DETALLE COMPLETO DE UNA CONSULTA
// ============================================
router.get('/:visitId/details', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;

    const visitResult = await query(
      `SELECT mv.id, mv.visit_date, mv.reason_for_visit, mv.status,
              p.id as patient_id, 
              p.full_name, 
              p.document_type,
              p.document_id,
              p.birth_date,
              p.gender,
              p.bloodtype,
              p.phone,
              p.email,
              p.address,
              p.city,
              p.department,
              u.full_name as doctor_name
       FROM medical_visits mv
       JOIN patients p ON mv.patient_id = p.id
       JOIN users u ON mv.doctor_id = u.id
       WHERE mv.id = $1 AND mv.tenant_id = $2`,
      [visitId, req.clientId]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    const visit = visitResult.rows[0];

    const anamnesisResult = await query('SELECT * FROM anamnesis WHERE visit_id = $1', [visitId]);
    const personalHistoryResult = await query('SELECT * FROM personal_history WHERE visit_id = $1', [visitId]);
    const familyHistoryResult = await query('SELECT * FROM family_history WHERE visit_id = $1', [visitId]);
    const vitalSignsResult = await query('SELECT * FROM vital_signs WHERE visit_id = $1', [visitId]);
    const systemReviewResult = await query('SELECT * FROM system_review WHERE visit_id = $1', [visitId]);
    const physicalExamResult = await query('SELECT * FROM physical_exam WHERE visit_id = $1', [visitId]);
    const followUpResult = await query('SELECT * FROM follow_up WHERE visit_id = $1', [visitId]);
    const diagnosesResult = await query('SELECT * FROM diagnoses WHERE visit_id = $1 ORDER BY created_date', [visitId]);
    const treatmentsResult = await query('SELECT * FROM treatments WHERE visit_id = $1 ORDER BY prescribed_date', [visitId]);

    res.json({
      success: true,
      visit: {
        id: visit.id,
        visitDate: visit.visit_date,
        reasonForVisit: visit.reason_for_visit,
        status: visit.status,
        patient: {
          id: visit.patient_id,
          full_name: visit.full_name,
          document_type: visit.document_type,
          document_id: visit.document_id,
          birth_date: visit.birth_date,
          gender: visit.gender,
          bloodtype: visit.bloodtype,
          phone: visit.phone,
          email: visit.email,
          address: visit.address,
          city: visit.city,
          department: visit.department
        },
        doctor: { name: visit.doctor_name },
        anamnesis: anamnesisResult.rows[0] || null,
        personalHistory: personalHistoryResult.rows[0] || null,
        familyHistory: familyHistoryResult.rows[0] || null,
        vitalSigns: vitalSignsResult.rows[0] || null,
        systemReview: systemReviewResult.rows[0] || null,
        physicalExam: physicalExamResult.rows[0] || null,
        followUp: followUpResult.rows[0] || null,
        diagnoses: diagnosesResult.rows,
        treatments: treatmentsResult.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener detalle de consulta:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// UPDATE - ACTUALIZAR SECCIONES
// ============================================
router.put('/:visitId/anamnesis', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { currentIllness, symptomDuration, symptomSeverity, associatedSymptoms, relevantHistory } = req.body;

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    await query(
      `UPDATE anamnesis 
       SET current_illness = COALESCE($1, current_illness),
           symptom_duration = COALESCE($2, symptom_duration),
           symptom_severity = COALESCE($3, symptom_severity),
           associated_symptoms = COALESCE($4, associated_symptoms),
           relevant_history = COALESCE($5, relevant_history)
       WHERE visit_id = $6`,
      [currentIllness, symptomDuration, symptomSeverity, associatedSymptoms, relevantHistory, visitId]
    );

    res.json({ success: true, message: 'Anamnesis actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.put('/:visitId/vital-signs', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { weight, height, systolicBp, diastolicBp, heartRate, respiratoryRate, bodyTemperature } = req.body;

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    let imc = null;
    if (weight && height) {
      const heightInMeters = height / 100;
      imc = weight / (heightInMeters * heightInMeters);
    }

    await query(
      `UPDATE vital_signs 
       SET weight = COALESCE($1, weight),
           height = COALESCE($2, height),
           systolic_bp = COALESCE($3, systolic_bp),
           diastolic_bp = COALESCE($4, diastolic_bp),
           heart_rate = COALESCE($5, heart_rate),
           respiratory_rate = COALESCE($6, respiratory_rate),
           body_temperature = COALESCE($7, body_temperature),
           imc = COALESCE($8, imc),
           recorded_date = NOW()
       WHERE visit_id = $9`,
      [weight, height, systolicBp, diastolicBp, heartRate, respiratoryRate, bodyTemperature, imc, visitId]
    );

    res.json({ success: true, message: 'Signos vitales actualizados exitosamente', imc: imc ? imc.toFixed(2) : null });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.put('/:visitId/system-review', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { headNeck, ocular, ears, thoraxAbdomen, respiratory, cardiovascular, digestive, genitourinary, musculoskeletal, skin, nervousSystem } = req.body;

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    await query(
      `UPDATE system_review 
       SET head_neck = COALESCE($1, head_neck),
           ocular = COALESCE($2, ocular),
           ears = COALESCE($3, ears),
           thorax_abdomen = COALESCE($4, thorax_abdomen),
           respiratory = COALESCE($5, respiratory),
           cardiovascular = COALESCE($6, cardiovascular),
           digestive = COALESCE($7, digestive),
           genitourinary = COALESCE($8, genitourinary),
           musculoskeletal = COALESCE($9, musculoskeletal),
           skin = COALESCE($10, skin),
           nervous_system = COALESCE($11, nervous_system)
       WHERE visit_id = $12`,
      [headNeck, ocular, ears, thoraxAbdomen, respiratory, cardiovascular, digestive, genitourinary, musculoskeletal, skin, nervousSystem, visitId]
    );

    res.json({ success: true, message: 'Revisión por sistemas actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.put('/:visitId/physical-exam', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { generalAppearance, mentalStatus, detailedFindings, abnormalities } = req.body;

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    await query(
      `UPDATE physical_exam 
       SET general_appearance = COALESCE($1, general_appearance),
           mental_status = COALESCE($2, mental_status),
           detailed_findings = COALESCE($3, detailed_findings),
           abnormalities = COALESCE($4, abnormalities),
           exam_date = NOW()
       WHERE visit_id = $5`,
      [generalAppearance, mentalStatus, detailedFindings, abnormalities, visitId]
    );

    res.json({ success: true, message: 'Examen físico actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.put('/:visitId/follow-up', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { followUpReason } = req.body;

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    await query(`UPDATE follow_up SET follow_up_reason = COALESCE($1, follow_up_reason) WHERE visit_id = $2`, [followUpReason, visitId]);

    res.json({ success: true, message: 'Recomendaciones actualizadas exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.put('/:visitId/status', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { status } = req.body;
    const validStatuses = ['draft', 'completed', 'signed', 'archived'];
    if (!status || !validStatuses.includes(status)) return res.status(400).json({ error: 'Status inválido' });

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    await query(`UPDATE medical_visits SET status = $1, last_modified_date = NOW(), last_modified_by = $2 WHERE id = $3`, [status, req.userId, visitId]);

    res.json({ success: true, message: `Consulta actualizada a estado: ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// DIAGNÓSTICOS (CRUD)
// ============================================
router.post('/:visitId/diagnoses', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { diagnosisCodeCie10, diagnosisDescription, diagnosisType, severity } = req.body;

    if (!diagnosisCodeCie10 || !diagnosisDescription) return res.status(400).json({ error: 'Faltan datos' });

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    const result = await query(
      `INSERT INTO diagnoses (visit_id, diagnosis_code_cie10, diagnosis_description, diagnosis_type, severity)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, diagnosis_code_cie10, diagnosis_description`,
      [visitId, diagnosisCodeCie10, diagnosisDescription, diagnosisType || 'principal', severity]
    );

    res.status(201).json({ success: true, message: 'Diagnóstico agregado', diagnosis: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.put('/:visitId/diagnoses/:diagnosisId', authenticateToken, async (req, res) => {
  try {
    const { visitId, diagnosisId } = req.params;
    const { diagnosisCodeCie10, diagnosisDescription, diagnosisType, severity } = req.body;

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    const result = await query(
      `UPDATE diagnoses SET diagnosis_code_cie10 = COALESCE($1, diagnosis_code_cie10),
           diagnosis_description = COALESCE($2, diagnosis_description),
           diagnosis_type = COALESCE($3, diagnosis_type),
           severity = COALESCE($4, severity)
       WHERE id = $5 RETURNING id`,
      [diagnosisCodeCie10, diagnosisDescription, diagnosisType, severity, diagnosisId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    res.json({ success: true, message: 'Diagnóstico actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.delete('/:visitId/diagnoses/:diagnosisId', authenticateToken, async (req, res) => {
  try {
    const { visitId, diagnosisId } = req.params;
    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    await query('DELETE FROM diagnoses WHERE id = $1', [diagnosisId]);
    res.json({ success: true, message: 'Diagnóstico eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// MEDICAMENTOS (CRUD)
// ============================================
router.post('/:visitId/treatments', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { medicationName, dosage, frequency, duration, route, quantity, instructions } = req.body;

    if (!medicationName || !dosage || !frequency) return res.status(400).json({ error: 'Faltan datos' });

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    const result = await query(
      `INSERT INTO treatments (visit_id, medication_name, dosage, frequency, duration, route, quantity, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [visitId, medicationName.trim(), dosage.trim(), frequency.trim(), duration, route || 'oral', quantity, instructions]
    );

    res.status(201).json({ success: true, message: 'Medicamento agregado', treatment: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.put('/:visitId/treatments/:treatmentId', authenticateToken, async (req, res) => {
  try {
    const { visitId, treatmentId } = req.params;
    const { medicationName, dosage, frequency, duration, route, quantity, instructions } = req.body;

    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    const result = await query(
      `UPDATE treatments SET medication_name = COALESCE($1, medication_name),
           dosage = COALESCE($2, dosage),
           frequency = COALESCE($3, frequency),
           duration = COALESCE($4, duration),
           route = COALESCE($5, route),
           quantity = COALESCE($6, quantity),
           instructions = COALESCE($7, instructions)
       WHERE id = $8 RETURNING id`,
      [medicationName, dosage, frequency, duration, route, quantity, instructions, treatmentId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Medicamento no encontrado' });
    res.json({ success: true, message: 'Medicamento actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.delete('/:visitId/treatments/:treatmentId', authenticateToken, async (req, res) => {
  try {
    const { visitId, treatmentId } = req.params;
    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    await query('DELETE FROM treatments WHERE id = $1', [treatmentId]);
    res.json({ success: true, message: 'Medicamento eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// 🚀 NUEVO: COPIAR ÚLTIMA RECETA
// ============================================
router.post('/:visitId/copy-last-prescription', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;

    // 1. Obtener info de la consulta actual para saber quién es el paciente
    const currentVisit = await query(
      'SELECT patient_id FROM medical_visits WHERE id = $1 AND tenant_id = $2',
      [visitId, req.clientId]
    );

    if (currentVisit.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
    const patientId = currentVisit.rows[0].patient_id;

    // 2. Buscar la última consulta DIFERENTE a esta que tenga medicamentos
    const lastVisit = await query(
      `SELECT id FROM medical_visits 
       WHERE patient_id = $1 AND id != $2 
       AND id IN (SELECT visit_id FROM treatments)
       ORDER BY visit_date DESC LIMIT 1`,
      [patientId, visitId]
    );

    if (lastVisit.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron recetas anteriores para este paciente' });
    }

    const lastVisitId = lastVisit.rows[0].id;

    // 3. Copiar medicamentos de la última visita a la actual
    const copyResult = await query(
      `INSERT INTO treatments (visit_id, medication_name, dosage, frequency, duration, route, quantity, instructions, prescribed_date)
       SELECT $1, medication_name, dosage, frequency, duration, route, quantity, instructions, NOW()
       FROM treatments WHERE visit_id = $2
       RETURNING id`,
      [visitId, lastVisitId]
    );

    res.json({ 
      success: true, 
      message: `Se copiaron ${copyResult.rowCount} medicamentos exitosamente`
    });

  } catch (error) {
    console.error('Error copiando receta:', error);
    res.status(500).json({ error: 'Error al copiar receta' });
  }
});

// ============================================
// DELETE - ELIMINAR CONSULTA
// ============================================
router.delete('/:visitId', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const visitResult = await query('SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2', [visitId, req.clientId]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });

    // Limpieza en cascada manual por seguridad
    await query('DELETE FROM diagnoses WHERE visit_id = $1', [visitId]);
    await query('DELETE FROM treatments WHERE visit_id = $1', [visitId]);
    await query('DELETE FROM anamnesis WHERE visit_id = $1', [visitId]);
    await query('DELETE FROM personal_history WHERE visit_id = $1', [visitId]);
    await query('DELETE FROM family_history WHERE visit_id = $1', [visitId]);
    await query('DELETE FROM vital_signs WHERE visit_id = $1', [visitId]);
    await query('DELETE FROM system_review WHERE visit_id = $1', [visitId]);
    await query('DELETE FROM physical_exam WHERE visit_id = $1', [visitId]);
    await query('DELETE FROM follow_up WHERE visit_id = $1', [visitId]);
    await query('DELETE FROM medical_visits WHERE id = $1', [visitId]);

    res.json({ success: true, message: 'Consulta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;