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
    basic: 1,       // Solo el dueño
    standard: 3,    // Dueño + 2 empleados
    premium: 5,     // Dueño + 4 empleados
    enterprise: 999999 // Ilimitado
  };
  return limits[plan?.toLowerCase()] || 1;
};

// ==========================================
// POST - CREAR NUEVO USUARIO (ADMIN DE CLÍNICA)
// ==========================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { full_name, email, role, document_id, phone } = req.body;
    
    // 1. Obtener datos del quien hace la petición (el admin de la clínica)
    const requestingUserId = req.userId;
    
    // Buscamos al usuario que hace la petición para saber su tenant_id y rol
    const requestorResult = await query(
      'SELECT tenant_id, role FROM users WHERE id = $1',
      [requestingUserId]
    );

    if (requestorResult.rows.length === 0) return res.status(403).json({ error: 'Usuario no autorizado' });
    
    const { tenant_id, role: requestorRole } = requestorResult.rows[0];

    // VALIDACIÓN DE SEGURIDAD: Solo 'admin' de la clínica puede crear usuarios
    if (requestorRole !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para crear usuarios. Contacta al administrador.' });
    }

    // ======================================================
    // 🔒 EL CANDADO: VALIDACIÓN DEL PLAN DE SUSCRIPCIÓN
    // ======================================================
    
    // A. Obtener el plan actual de la clínica
    const tenantResult = await query(
      'SELECT subscription_plan, name FROM tenants WHERE id = $1',
      [tenant_id]
    );
    const plan = tenantResult.rows[0].subscription_plan;
    const limit = getUserLimitByPlan(plan);

    // B. Contar cuántos usuarios activos tiene YA la clínica
    const countResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND status = 'active'",
      [tenant_id]
    );
    const currentUsers = parseInt(countResult.rows[0].count);

    console.log(`[USER CREATE] Clínica: ${tenantResult.rows[0].name} | Plan: ${plan} | Actuales: ${currentUsers} | Límite: ${limit}`);

    // C. BLOQUEAR si se pasa del límite
    if (currentUsers >= limit) {
      return res.status(403).json({ 
        error: `Has alcanzado el límite de usuarios de tu Plan ${plan.toUpperCase()} (${limit} usuarios).`,
        code: 'PLAN_LIMIT_REACHED',
        upgrade_required: true
      });
    }

    // ======================================================
    // FIN DEL CANDADO - Si pasa, creamos el usuario
    // ======================================================

    // Validaciones básicas
    if (!full_name || !email || !role || !document_id) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Verificar si el email ya existe
    const emailExists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado en el sistema.' });
    }

    // Generar contraseña temporal segura
    // Patrón: Inicial nombre + Inicial apellido + Últimos 4 doc + !
    // Ej: Juan Perez, 12345678 -> JP5678!
    const nameParts = full_name.split(' ');
    const initial1 = nameParts[0] ? nameParts[0][0].toUpperCase() : 'U';
    const initial2 = nameParts.length > 1 ? nameParts[nameParts.length - 1][0].toUpperCase() : 'U';
    const docSuffix = document_id.slice(-4);
    const tempPassword = `${initial1}${initial2}${docSuffix}!`;
    
    const hashedPassword = await hashPassword(tempPassword);

    // Generar username único
    const username = email.split('@')[0].substring(0, 15);

    // Insertar en Base de Datos
    const newUser = await query(
      `INSERT INTO users (tenant_id, username, email, full_name, password_hash, role, phone, document_id, status, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', true)
       RETURNING id, full_name, email, role, username`,
      [tenant_id, username, email, full_name, hashedPassword, role, phone, document_id]
    );

    // Actualizar contador en tabla tenants (para performance)
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
      tempPassword: tempPassword // Se devuelve para mostrarla una sola vez al admin
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// GET - LISTAR USUARIOS DE MI CLÍNICA
// ==========================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const requestingUserId = req.userId;
    
    // Obtener tenant_id del usuario
    const userMeta = await query('SELECT tenant_id FROM users WHERE id = $1', [requestingUserId]);
    if (userMeta.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });
    
    const tenant_id = userMeta.rows[0].tenant_id;

    const users = await query(
      `SELECT id, full_name, email, role, phone, document_id, status, last_login 
       FROM users 
       WHERE tenant_id = $1 
       ORDER BY created_date DESC`,
      [tenant_id]
    );

    res.json({ success: true, users: users.rows });

  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;