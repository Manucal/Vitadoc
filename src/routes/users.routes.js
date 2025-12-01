import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { hashPassword } from '../config/auth.js';
import { logAction } from '../services/auditService.js';

const router = express.Router();

// ==========================================
// HELPER: Límites del Plan (El Candado 🔒)
// ==========================================
const getUserLimitByPlan = (plan) => {
  const limits = {
    basic: 1,
    standard: 3,
    premium: 5,
    enterprise: 999999
  };
  return limits[plan?.toLowerCase()] || 1;
};

// ==========================================
// POST - CREAR NUEVO USUARIO (ADMIN DE CLÍNICA)
// ==========================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { full_name, email, role, document_id, phone } = req.body;
    
    // 1. Obtener datos del quien hace la petición
    const requestingUserId = req.userId;
    
    const requestorResult = await query(
      'SELECT tenant_id, role FROM users WHERE id = $1',
      [requestingUserId]
    );

    if (requestorResult.rows.length === 0) return res.status(403).json({ error: 'Usuario no autorizado' });
    
    const { tenant_id, role: requestorRole } = requestorResult.rows[0];

    // VALIDACIÓN: Solo admin puede crear
    if (requestorRole !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para crear usuarios.' });
    }

    // 🔒 VALIDACIÓN DEL PLAN
    const tenantResult = await query('SELECT subscription_plan, name FROM tenants WHERE id = $1', [tenant_id]);
    const plan = tenantResult.rows[0].subscription_plan;
    const limit = getUserLimitByPlan(plan);

    const countResult = await query("SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND status = 'active'", [tenant_id]);
    const currentUsers = parseInt(countResult.rows[0].count);

    if (currentUsers >= limit) {
      return res.status(403).json({ 
        error: `Has alcanzado el límite de usuarios de tu Plan ${plan.toUpperCase()} (${limit} usuarios).`,
        code: 'PLAN_LIMIT_REACHED'
      });
    }

    // Validaciones básicas
    if (!full_name || !email || !role || !document_id) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Verificar si el email ya existe
    const emailExists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });
    }

    // ============================================================
    // 🟢 LÓGICA SIMPLIFICADA: Usuario = Email
    // ============================================================
    // Usamos el email como nombre de usuario. Es único, fácil de recordar y estándar.
    const username = email; 

    // Verificar si ya existe este usuario (por seguridad, aunque el email check ya lo cubrió)
    const userCheck = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario (email) ya existe en el sistema.' });
    }
    // ============================================================

    // Generar contraseña temporal segura basada en el nombre y documento
    const nameParts = full_name.trim().split(/\s+/);
    const initial1 = nameParts[0] ? nameParts[0][0].toUpperCase() : 'U';
    const initial2 = nameParts.length > 1 ? nameParts[nameParts.length - 1][0].toUpperCase() : 'U';
    const docSuffix = document_id.slice(-4);
    const tempPassword = `${initial1}${initial2}${docSuffix}!`; // Ej: MC1234!
    
    const hashedPassword = await hashPassword(tempPassword);

    // Insertar en Base de Datos
    const newUser = await query(
      `INSERT INTO users (tenant_id, username, email, full_name, password_hash, role, phone, document_id, status, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', true)
       RETURNING id, full_name, email, role, username`,
      [tenant_id, username, email, full_name, hashedPassword, role, phone, document_id]
    );

    // Actualizar contador
    await query('UPDATE tenants SET user_count = user_count + 1 WHERE id = $1', [tenant_id]);

    // Auditoría
    await logAction({
      tenantId: tenant_id,
      actorId: requestingUserId,
      action: 'CREATE_USER',
      resourceType: 'USER',
      resourceId: newUser.rows[0].id,
      status: 'SUCCESS',
      changes: { new_user: newUser.rows[0].username },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser.rows[0],
      tempPassword: tempPassword
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - LISTAR USUARIOS
router.get('/', authenticateToken, async (req, res) => {
  try {
    const requestingUserId = req.userId;
    const userMeta = await query('SELECT tenant_id FROM users WHERE id = $1', [requestingUserId]);
    if (userMeta.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });
    const tenant_id = userMeta.rows[0].tenant_id;

    const users = await query(
      `SELECT id, full_name, username, email, role, phone, document_id, status 
       FROM users WHERE tenant_id = $1 ORDER BY created_date DESC`,
      [tenant_id]
    );

    res.json({ success: true, users: users.rows });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;