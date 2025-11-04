import express, { Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { query } from '../config/database';

const router = express.Router();

// ============================================
// CREATE - CREAR NUEVA CONSULTA MÉDICA
// ============================================
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, reasonForVisit } = req.body;

    if (!patientId || !reasonForVisit) {
      return res.status(400).json({ error: 'patientId y reasonForVisit son requeridos' });
    }

    // Verificar que el paciente existe y pertenece al tenant
    const patientResult = await query(
      'SELECT id FROM patients WHERE id = $1 AND tenant_id = $2',
      [patientId, req.clientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Crear consulta médica
    const visitResult = await query(
      `INSERT INTO medical_visits (
        tenant_id, patient_id, doctor_id, reason_for_visit, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, visit_date`,
      [req.clientId, patientId, req.userId, reasonForVisit, 'draft', req.userId]
    );

    const visitId = visitResult.rows[0].id;

    // Crear registros vacíos para las secciones de la historia
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
router.get('/patient/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;

    // Verificar que el paciente existe y pertenece al tenant
    const patientResult = await query(
      'SELECT id FROM patients WHERE id = $1 AND tenant_id = $2',
      [patientId, req.clientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Obtener consultas
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
router.get('/:visitId/details', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { visitId } = req.params;

    // Obtener datos principales de la consulta
    const visitResult = await query(
      `SELECT mv.id, mv.visit_date, mv.reason_for_visit, mv.status,
              p.id as patient_id, p.full_name, p.document_id,
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

    // Obtener anamnesis
    const anamnesisResult = await query(
      'SELECT * FROM anamnesis WHERE visit_id = $1',
      [visitId]
    );

    // Obtener antecedentes personales
    const personalHistoryResult = await query(
      'SELECT * FROM personal_history WHERE visit_id = $1',
      [visitId]
    );

    // Obtener antecedentes familiares
    const familyHistoryResult = await query(
      'SELECT * FROM family_history WHERE visit_id = $1',
      [visitId]
    );

    // Obtener signos vitales
    const vitalSignsResult = await query(
      'SELECT * FROM vital_signs WHERE visit_id = $1',
      [visitId]
    );

    // Obtener diagnósticos
    const diagnosesResult = await query(
      'SELECT * FROM diagnoses WHERE visit_id = $1 ORDER BY created_date',
      [visitId]
    );

    // Obtener tratamientos
    const treatmentsResult = await query(
      'SELECT * FROM treatments WHERE visit_id = $1 ORDER BY prescribed_date',
      [visitId]
    );

    res.json({
      success: true,
      visit: {
        id: visit.id,
        visitDate: visit.visit_date,
        reasonForVisit: visit.reason_for_visit,
        status: visit.status,
        patient: {
          id: visit.patient_id,
          fullName: visit.full_name,
          documentId: visit.document_id
        },
        doctor: {
          name: visit.doctor_name
        },
        anamnesis: anamnesisResult.rows[0] || null,
        personalHistory: personalHistoryResult.rows[0] || null,
        familyHistory: familyHistoryResult.rows[0] || null,
        vitalSigns: vitalSignsResult.rows[0] || null,
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
// UPDATE - ACTUALIZAR ANAMNESIS
// ============================================
router.put('/:visitId/anamnesis', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { visitId } = req.params;
    const { currentIllness, symptomDuration, symptomSeverity, associatedSymptoms, relevantHistory } = req.body;

    // Verificar que la consulta existe
    const visitResult = await query(
      'SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2',
      [visitId, req.clientId]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    // Actualizar anamnesis
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

    res.json({
      success: true,
      message: 'Anamnesis actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar anamnesis:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// UPDATE - ACTUALIZAR SIGNOS VITALES
// ============================================
router.put('/:visitId/vital-signs', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { visitId } = req.params;
    const { weight, height, systolicBp, diastolicBp, heartRate, respiratoryRate, bodyTemperature } = req.body;

    // Verificar que la consulta existe
    const visitResult = await query(
      'SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2',
      [visitId, req.clientId]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    // Calcular IMC si hay peso y altura
    let imc = null;
    if (weight && height) {
      const heightInMeters = height / 100;
      imc = weight / (heightInMeters * heightInMeters);
    }

    // Actualizar signos vitales
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

    res.json({
      success: true,
      message: 'Signos vitales actualizados exitosamente',
      imc: imc ? imc.toFixed(2) : null
    });
  } catch (error) {
    console.error('Error al actualizar signos vitales:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// CREATE - AGREGAR DIAGNÓSTICO
// ============================================
router.post('/:visitId/diagnoses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { visitId } = req.params;
    const { diagnosisCodeCie10, diagnosisDescription, diagnosisType, severity } = req.body;

    if (!diagnosisCodeCie10 || !diagnosisDescription) {
      return res.status(400).json({ error: 'diagnosisCodeCie10 y diagnosisDescription son requeridos' });
    }

    // Verificar que la consulta existe
    const visitResult = await query(
      'SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2',
      [visitId, req.clientId]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    // Crear diagnóstico
    const result = await query(
      `INSERT INTO diagnoses (visit_id, diagnosis_code_cie10, diagnosis_description, diagnosis_type, severity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, diagnosis_code_cie10, diagnosis_description`,
      [visitId, diagnosisCodeCie10, diagnosisDescription, diagnosisType || 'principal', severity]
    );

    res.status(201).json({
      success: true,
      message: 'Diagnóstico agregado exitosamente',
      diagnosis: result.rows[0]
    });
  } catch (error) {
    console.error('Error al agregar diagnóstico:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// CREATE - AGREGAR MEDICAMENTO/TRATAMIENTO
// ============================================
router.post('/:visitId/treatments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { visitId } = req.params;
    const { medicationName, dosage, frequency, duration, route, quantity, instructions } = req.body;

    if (!medicationName || !dosage || !frequency) {
      return res.status(400).json({ error: 'medicationName, dosage y frequency son requeridos' });
    }

    // Verificar que la consulta existe
    const visitResult = await query(
      'SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2',
      [visitId, req.clientId]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    // Crear tratamiento
    const result = await query(
      `INSERT INTO treatments (visit_id, medication_name, dosage, frequency, duration, route, quantity, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, medication_name, dosage, frequency`,
      [visitId, medicationName, dosage, frequency, duration, route, quantity, instructions]
    );

    res.status(201).json({
      success: true,
      message: 'Medicamento agregado exitosamente',
      treatment: result.rows[0]
    });
  } catch (error) {
    console.error('Error al agregar medicamento:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// UPDATE - CAMBIAR ESTADO DE CONSULTA
// ============================================
router.put('/:visitId/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { visitId } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'completed', 'signed', 'archived'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status debe ser uno de: ${validStatuses.join(', ')}` });
    }

    // Verificar que la consulta existe
    const visitResult = await query(
      'SELECT id FROM medical_visits WHERE id = $1 AND tenant_id = $2',
      [visitId, req.clientId]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    // Actualizar estado
    await query(
      `UPDATE medical_visits 
       SET status = $1, last_modified_date = NOW(), last_modified_by = $2
       WHERE id = $3`,
      [status, req.userId, visitId]
    );

    res.json({
      success: true,
      message: `Consulta actualizada a estado: ${status}`
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
