import express, { Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { query } from '../config/database';

const router = express.Router();

// ============================================
// CREATE - REGISTRAR NUEVO PACIENTE
// ============================================
router.post('/register', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      documentType,
      documentId,
      fullName,
      birthDate,
      gender,
      bloodType,
      phone,
      email,
      address,
      city,
      department,
      occupation,
      maritalStatus,
      educationLevel,
      epsName,
      epsNumber,
      companionName,
      companionPhone
    } = req.body;

    // Validar campos requeridos
    if (!documentType || !documentId || !fullName || !birthDate) {
      return res.status(400).json({ error: 'Campos requeridos: documentType, documentId, fullName, birthDate' });
    }

    // Verificar que el paciente no exista ya
    const existsResult = await query(
      'SELECT id FROM patients WHERE tenant_id = $1 AND document_type = $2 AND document_id = $3',
      [req.clientId, documentType, documentId]
    );

    if (existsResult.rows.length > 0) {
      return res.status(409).json({ error: 'El paciente ya existe en el sistema' });
    }

    // Crear paciente
    const result = await query(
      `INSERT INTO patients (
        tenant_id, document_type, document_id, full_name, birth_date, gender, 
        bloodtype, phone, email, address, city, department, occupation, 
        marital_status, education_level, eps_name, eps_number, companion_name, 
        companion_phone, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id, full_name, document_id, created_date`,
      [
        req.clientId, documentType, documentId, fullName, birthDate, gender,
        bloodType, phone, email, address, city, department, occupation,
        maritalStatus, educationLevel, epsName, epsNumber, companionName,
        companionPhone, req.userId
      ]
    );

    const patientId = result.rows[0].id;

    res.status(201).json({
      success: true,
      message: 'Paciente registrado exitosamente',
      patient: {
        id: patientId,
        fullName: result.rows[0].full_name,
        documentId: result.rows[0].document_id,
        createdDate: result.rows[0].created_date
      }
    });
  } catch (error) {
    console.error('Error al registrar paciente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// READ - OBTENER TODOS LOS PACIENTES
// ============================================
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, full_name, document_type, document_id, birth_date, 
              phone, email, gender, bloodtype, created_date 
       FROM patients 
       WHERE tenant_id = $1 
       ORDER BY created_date DESC`,
      [req.clientId]
    );

    res.json({
      success: true,
      patients: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// READ - OBTENER PACIENTE POR ID
// ============================================
router.get('/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;

    const result = await query(
      `SELECT * FROM patients 
       WHERE id = $1 AND tenant_id = $2`,
      [patientId, req.clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json({
      success: true,
      patient: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// UPDATE - ACTUALIZAR PACIENTE
// ============================================
router.put('/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const { fullName, phone, email, address, city, occupation, maritalStatus } = req.body;

    // Verificar que el paciente exista
    const existsResult = await query(
      'SELECT id FROM patients WHERE id = $1 AND tenant_id = $2',
      [patientId, req.clientId]
    );

    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Actualizar paciente
    await query(
      `UPDATE patients 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           occupation = COALESCE($6, occupation),
           marital_status = COALESCE($7, marital_status)
       WHERE id = $8 AND tenant_id = $9`,
      [fullName, phone, email, address, city, occupation, maritalStatus, patientId, req.clientId]
    );

    res.json({
      success: true,
      message: 'Paciente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// DELETE - ELIMINAR PACIENTE
// ============================================
router.delete('/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;

    // Verificar que el paciente exista
    const existsResult = await query(
      'SELECT id FROM patients WHERE id = $1 AND tenant_id = $2',
      [patientId, req.clientId]
    );

    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Eliminar paciente (cascada elimina consultas asociadas)
    await query(
      'DELETE FROM patients WHERE id = $1 AND tenant_id = $2',
      [patientId, req.clientId]
    );

    res.json({
      success: true,
      message: 'Paciente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
