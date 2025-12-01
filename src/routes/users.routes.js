import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { hashPassword } from '../config/auth.js';
import { logAction } from '../services/auditService.js';

const router = express.Router();

const getUserLimitByPlan = (plan) => {
  const limits = { basic: 1, standard: 3, premium: 5, enterprise: 999999 };
  return limits[plan?.toLowerCase()] || 1;
};

// GET - LISTAR USUARIOS
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userMeta = await query('SELECT tenant_id FROM users WHERE id = $1', [req.userId]);
    if (userMeta.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });
    
    const users = await query(
      `SELECT id, full_name, username, email, role, phone, document_id, status 
       FROM users WHERE tenant_id = $1 ORDER BY created_date DESC`,
      [userMeta.rows[0].tenant_id]
    );
    res.json({ success: true, users: users.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST - CREAR USUARIO
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { full_name, email, role, document_id, phone } = req.body;
    const requestingUserId = req.userId;
    
    const requestorResult = await query('SELECT tenant_id, role FROM users WHERE id = $1', [requestingUserId]);
    const { tenant_id, role: requestorRole } = requestorResult.rows[0];

    if (requestorRole !== 'admin') return res.status(403).json({ error: 'Sin permisos' });

    // Validar Plan
    const tenantResult = await query('SELECT subscription_plan FROM tenants WHERE id = $1', [tenant_id]);
    const limit = getUserLimitByPlan(tenantResult.rows[0].subscription_plan);
    const countResult = await query("SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND status = 'active'", [tenant_id]);
    
    if (parseInt(countResult.rows[0].count) >= limit) {
      return res.status(403).json({ error: `Límite de usuarios alcanzado (${limit})`, code: 'PLAN_LIMIT_REACHED' });
    }

    // Validar Email
    const emailExists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) return res.status(400).json({ error: 'Email ya registrado' });

    // Crear Usuario
    const username = email;
    const nameParts = full_name.trim().split(/\s+/);
    const tempPassword = `${nameParts[0][0].toUpperCase()}${nameParts.length > 1 ? nameParts[nameParts.length-1][0].toUpperCase() : 'U'}${document_id.slice(-4)}!`;
    const hashedPassword = await hashPassword(tempPassword);

    const newUser = await query(
      `INSERT INTO users (tenant_id, username, email, full_name, password_hash, role, phone, document_id, status, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', true) RETURNING *`,
      [tenant_id, username, email, full_name, hashedPassword, role, phone, document_id]
    );

    await query('UPDATE tenants SET user_count = user_count + 1 WHERE id = $1', [tenant_id]);

    res.status(201).json({ success: true, user: newUser.rows[0], tempPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ✅ NUEVO: PUT - EDITAR USUARIO
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const { full_name, role, phone, document_id } = req.body;
    const targetUserId = req.params.userId;
    const requestorId = req.userId;

    // Verificar permisos y tenant
    const requestor = await query('SELECT tenant_id, role FROM users WHERE id = $1', [requestorId]);
    if (requestor.rows[0].role !== 'admin') return res.status(403).json({ error: 'Sin permisos' });

    // Verificar que el usuario a editar pertenece al mismo tenant
    const target = await query('SELECT tenant_id FROM users WHERE id = $1', [targetUserId]);
    if (target.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (target.rows[0].tenant_id !== requestor.rows[0].tenant_id) return res.status(403).json({ error: 'Acceso denegado' });

    await query(
      `UPDATE users SET full_name = $1, role = $2, phone = $3, document_id = $4 WHERE id = $5`,
      [full_name, role, phone, document_id, targetUserId]
    );

    res.json({ success: true, message: 'Usuario actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// ✅ NUEVO: POST - RESETEAR CONTRASEÑA (ADMIN CLÍNICA)
router.post('/:userId/reset-password', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const requestorId = req.userId;

    const requestor = await query('SELECT tenant_id, role FROM users WHERE id = $1', [requestorId]);
    if (requestor.rows[0].role !== 'admin') return res.status(403).json({ error: 'Sin permisos' });

    const target = await query('SELECT tenant_id, full_name, document_id FROM users WHERE id = $1', [targetUserId]);
    if (target.rows.length === 0 || target.rows[0].tenant_id !== requestor.rows[0].tenant_id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Generar nueva temporal
    const user = target.rows[0];
    const nameParts = user.full_name.trim().split(/\s+/);
    const tempPassword = `${nameParts[0][0].toUpperCase()}${nameParts.length > 1 ? nameParts[nameParts.length-1][0].toUpperCase() : 'U'}${user.document_id.slice(-4)}!`;
    const hashedPassword = await hashPassword(tempPassword);

    await query(
      `UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2`,
      [hashedPassword, targetUserId]
    );

    res.json({ success: true, message: 'Contraseña reseteada', tempPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al resetear' });
  }
});

// ✅ NUEVO: DELETE - ELIMINAR USUARIO
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const requestor = await query('SELECT tenant_id, role FROM users WHERE id = $1', [req.userId]);
    
    if (requestor.rows[0].role !== 'admin') return res.status(403).json({ error: 'Sin permisos' });
    if (targetUserId === req.userId) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });

    const result = await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id', [targetUserId, requestor.rows[0].tenant_id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    await query('UPDATE tenants SET user_count = user_count - 1 WHERE id = $1', [requestor.rows[0].tenant_id]);

    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

export default router;