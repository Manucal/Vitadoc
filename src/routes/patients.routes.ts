import express, { Response, Request } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// =============== CREATE - REGISTRAR NUEVO PACIENTE ===============
router.post('/register', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      document_type, document_id, full_name, birth_date, gender, bloodtype,
      phone, email, address, city, department, occupation, marital_status,
      education_level, eps_name, eps_number, companion_name, companion_phone
    } = req.body;

    // Validar requeridos
    if (!document_type || !document_id || !full_name || !birth_date) {
      return res.status(400).json({ error: 'Campos requeridos: document_type, document_id, full_name, birth_date' });
    }

    // Validar formato de documento compatible
    if (typeof document_id !== "string" || document_id.length < 6) {
      return res.status(400).json({ error: 'El documento debe tener al menos 6 caracteres' });
    }

    // Verificar que no exista el paciente
    const existsResult = await query(
      'SELECT id FROM patients WHERE tenant_id = $1 AND document_type = $2 AND document_id = $3',
      [req.clientId, document_type, document_id]
    );
    if (existsResult.rows.length > 0) {
      return res.status(409).json({ error: 'El paciente ya existe en el sistema' });
    }

    // Crear paciente
    const result = await query(
      `INSERT INTO patients (
        tenant_id, document_type, document_id, full_name, birth_date, gender, bloodtype, phone, email,
        address, city, department, occupation, marital_status, education_level, eps_name, eps_number,
        companion_name, companion_phone, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING id, full_name, document_id, created_date`,
      [
        req.clientId, document_type, document_id, full_name, birth_date, gender,
        bloodtype, phone, email, address, city, department, occupation, marital_status,
        education_level, eps_name, eps_number, companion_name, companion_phone, req.userId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Paciente registrado exitosamente',
      patient: {
        id: result.rows[0].id,
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

// =============== SEARCH - BUSCAR PACIENTE POR DOCUMENTO (por query param) ===============
router.get('/search', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.query.documentId;
    if (!documentId) {
      return res.status(400).json({ error: 'Falta el parámetro documentId' });
    }
    const result = await query(
      'SELECT * FROM patients WHERE tenant_id = $1 AND document_id = $2',
      [req.clientId, documentId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json({ success: true, patient: result.rows[0] });
  } catch (error) {
    console.error('Error en búsqueda de paciente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// =============== SEARCH - BUSCAR PACIENTE POR DOCUMENTO (por URL param) ===============
router.get('/search/:documentId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({ 
        success: false,
        error: 'El parámetro documentId es requerido' 
      });
    }

    const result = await query(
      `SELECT id, document_type, document_id, full_name, birth_date, gender, 
              bloodtype, phone, email, address, city, department, tenant_id
       FROM patients 
       WHERE document_id = $1 AND tenant_id = $2
       LIMIT 1`,
      [documentId, req.clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Paciente no encontrado con ese documento' 
      });
    }

    const patient = result.rows[0];

    res.json({
      success: true,
      patient: {
        id: patient.id,
        document_type: patient.document_type,
        document_id: patient.document_id,
        full_name: patient.full_name,
        birth_date: patient.birth_date,
        gender: patient.gender,
        bloodtype: patient.bloodtype,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        department: patient.department
      }
    });
  } catch (error) {
    console.error('Error al buscar paciente por documento:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error en el servidor' 
    });
  }
});

// =============== READ - OBTENER TODOS LOS PACIENTES ===============
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, full_name, document_type, document_id, birth_date, phone, email, gender, bloodtype, created_date
       FROM patients WHERE tenant_id = $1 ORDER BY created_date DESC`,
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

// =============== READ - OBTENER PACIENTE POR ID ===============
// NOTA: Este debe ser el ÚLTIMO GET para evitar conflicto con /search/:documentId
router.get('/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await query(
      `SELECT * FROM patients WHERE id = $1 AND tenant_id = $2`,
      [patientId, req.clientId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    const p = result.rows[0];
    
    res.json({
      success: true,
      patient: {
        id: p.id,
        document_type: p.document_type,
        document_id: p.document_id,
        full_name: p.full_name,
        birth_date: p.birth_date,
        gender: p.gender,
        bloodtype: p.bloodtype,
        phone: p.phone,
        email: p.email,
        address: p.address,
        city: p.city,
        department: p.department,
        occupation: p.occupation,
        marital_status: p.marital_status,
        education_level: p.education_level,
        eps_name: p.eps_name,
        eps_number: p.eps_number,
        companion_name: p.companion_name,
        companion_phone: p.companion_phone
      }
    });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


// =============== UPDATE - ACTUALIZAR PACIENTE ===============
router.put('/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const { document_type, document_id, full_name, birth_date, gender, bloodtype, phone, email, address, city, department, occupation, marital_status, education_level } = req.body;

    // Verificar que el paciente existe
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
       SET document_type = COALESCE($1, document_type),
           document_id = COALESCE($2, document_id),
           full_name = COALESCE($3, full_name),
           birth_date = COALESCE($4, birth_date),
           gender = COALESCE($5, gender),
           bloodtype = COALESCE($6, bloodtype),
           phone = COALESCE($7, phone),
           email = COALESCE($8, email),
           address = COALESCE($9, address),
           city = COALESCE($10, city),
           department = COALESCE($11, department),
           occupation = COALESCE($12, occupation),
           marital_status = COALESCE($13, marital_status),
           education_level = COALESCE($14, education_level)
       WHERE id = $15 AND tenant_id = $16`,
      [document_type, document_id, full_name, birth_date, gender, bloodtype, phone, email, address, city, department, occupation, marital_status, education_level, patientId, req.clientId]
    );

    res.json({ success: true, message: 'Paciente actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// =============== DELETE - ELIMINAR PACIENTE ===============
router.delete('/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const existsResult = await query(
      'SELECT id FROM patients WHERE id = $1 AND tenant_id = $2',
      [patientId, req.clientId]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    await query(
      'DELETE FROM patients WHERE id = $1 AND tenant_id = $2',
      [patientId, req.clientId]
    );
    res.json({ success: true, message: 'Paciente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
