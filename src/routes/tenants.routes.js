import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { hashPassword } from '../config/auth.js';
import { logAction } from '../services/auditService.js';

// ✅ HELPER: Validar SUPER-ADMIN
const validateSuperAdmin = async (userId) => {
  try {
    if (!userId) {
      console.warn('⚠️ userId es undefined');
      return false;
    }

    const result = await query(
      'SELECT role, tenant_id FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) return false;

    const user = result.rows[0];
    const isSuperAdmin = user.role === 'admin' && user.tenant_id === null;

    return isSuperAdmin;
  } catch (error) {
    console.error('Error validating super-admin:', error);
    return false;
  }
};

// ============================================
// HELPER: Obtener límite de usuarios por plan
// ============================================
const getUserLimitByPlan = (plan) => {
  const limits = {
    basic: 1,
    standard: 3,
    premium: 5,
    enterprise: 999999
  };
  return limits[plan?.toLowerCase()] || 1;
};

// ============================================
// HELPER: Contar usuarios activos de un tenant
// ============================================
const getActiveUserCount = async (tenantId) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    );
    return parseInt(result.rows[0].count, 10) || 0;
  } catch (error) {
    console.error('Error counting active users:', error);
    return 0;
  }
};

const router = express.Router();

// ============================================
// POST - CREAR SUPER-ADMIN DE EMERGENCIA
// ============================================
router.post('/admin/emergency-reset', async (req, res) => {
  try {
    const { secret_key, clinic_name, admin_email, admin_password } = req.body;

    const EMERGENCY_SECRET = process.env.EMERGENCY_SECRET_KEY || 'vitadoc-emergency-2024';
    
    if (secret_key !== EMERGENCY_SECRET) {
      console.warn(`[EMERGENCY RESET] ⚠️ Intento fallido con secret_key incorrecta`);
      return res.status(403).json({ error: 'Secret key inválida' });
    }

    if (!clinic_name || !admin_email || !admin_password) {
      return res.status(400).json({ error: 'Parámetros incompletos: clinic_name, admin_email, admin_password' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin_email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (admin_password.length < 8) {
      return res.status(400).json({ error: 'Contraseña debe tener mínimo 8 caracteres' });
    }

    console.log(`\n[EMERGENCY RESET] === CREANDO SUPER-ADMIN ===`);
    const hashedPassword = await hashPassword(admin_password);

    const userResult = await query(
      `INSERT INTO users (tenant_id, username, email, full_name, password_hash, role, status, document_id, created_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, username, email, role, tenant_id`,
      [
        null,
        admin_email, // Username = Email
        admin_email,
        'Admin Super',
        hashedPassword,
        'admin',
        'active',
        null
      ]
    );

    res.status(201).json({
      success: true,
      message: '✓ Super-admin creado exitosamente.',
      data: { admin: userResult.rows[0] }
    });
  } catch (error) {
    console.error('[EMERGENCY RESET] ✗ ERROR:', error);
    res.status(500).json({ error: 'Error en el servidor', details: error.message });
  }
});

// ============================================
// GET - OBTENER TODOS LOS TENANTS (SUPER-ADMIN)
// ============================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede acceder' });

    const result = await query(
      `SELECT id, name, type, contact_email, subscription_plan, status, created_date, user_count
       FROM tenants ORDER BY created_date DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener tenants:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// POST - CREAR NUEVO TENANT (SUPER-ADMIN)
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede crear clínicas' });

    const { clinic_name, clinic_email, admin_full_name, admin_email, admin_password } = req.body;

    if (!clinic_name || !admin_email || !admin_password || !admin_full_name) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    if (admin_password.length < 8) return res.status(400).json({ error: 'Contraseña debe tener mínimo 8 caracteres' });

    // 1. Crear Tenant
    const tenantResult = await query(
      `INSERT INTO tenants (name, type, contact_email, subscription_plan, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, contact_email`,
      [clinic_name, 'clinic', clinic_email, 'basic', 'active']
    );

    const tenantId = tenantResult.rows[0].id;
    const hashedPassword = await hashPassword(admin_password);

    // ✅ CAMBIO: Username es el mismo Email
    const username = admin_email;

    // 2. Crear Usuario Admin
    const userResult = await query(
      `INSERT INTO users (tenant_id, username, email, full_name, password_hash, role, status, document_id, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, username, email`,
      [tenantId, username, admin_email, admin_full_name, hashedPassword, 'admin', 'active', null, false]
    );

    res.status(201).json({
      success: true,
      message: 'Clínica y usuario admin creados exitosamente',
      data: { tenant: tenantResult.rows[0], admin: userResult.rows[0] }
    });
  } catch (error) {
    console.error('Error al crear tenant:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// PUT - ACTUALIZAR TENANT (SUPER-ADMIN)
// ============================================
router.put('/:tenantId', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, contact_email, contact_phone, type, subscription_plan } = req.body;

    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede actualizar clínicas' });

    if (!subscription_plan && !name && !contact_email && !type && !contact_phone) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo' });
    }

    const tenantExists = await query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (tenantExists.rows.length === 0) return res.status(404).json({ error: 'Clínica no encontrada' });

    const oldTenant = tenantExists.rows[0];
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (subscription_plan) { updateFields.push(`subscription_plan = $${paramCount++}`); updateValues.push(subscription_plan); }
    if (name) { updateFields.push(`name = $${paramCount++}`); updateValues.push(name); }
    if (contact_email) { updateFields.push(`contact_email = $${paramCount++}`); updateValues.push(contact_email); }
    if (contact_phone) { updateFields.push(`contact_phone = $${paramCount++}`); updateValues.push(contact_phone); }
    if (type) { updateFields.push(`type = $${paramCount++}`); updateValues.push(type); }

    updateValues.push(tenantId);

    const result = await query(
      `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    // Auditoría
    try {
      await logAction({
        tenantId,
        actorId: req.userId || 'unknown',
        action: 'UPDATE_TENANT',
        resourceType: 'TENANT',
        resourceId: tenantId,
        status: 'SUCCESS',
        changes: { plan: { old: oldTenant.subscription_plan, new: subscription_plan } },
        req
      });
    } catch (e) { console.error('Audit Error', e); }

    res.json({ success: true, message: 'Clínica actualizada', data: result.rows[0] });
  } catch (error) {
    console.error(`Error updating tenant:`, error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// GET - OBTENER USUARIOS DE UN TENANT
// ============================================
router.get('/:tenantId/users', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede acceder' });

    const result = await query(
      `SELECT id, username, email, full_name, phone, role, status, document_id, created_date
       FROM users WHERE tenant_id = $1 ORDER BY created_date DESC`,
      [tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// POST - CREAR MÚLTIPLES USUARIOS (BULK)
// ============================================
router.post('/:tenantId/bulk-users', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { users } = req.body;

    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede crear usuarios' });

    if (!users || !Array.isArray(users) || users.length === 0) return res.status(400).json({ error: 'Datos incompletos' });
    if (users.length > 100) return res.status(400).json({ error: 'Máximo 100 usuarios por importación' });

    const tenantResult = await query('SELECT subscription_plan FROM tenants WHERE id = $1', [tenantId]);
    if (tenantResult.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });

    const plan = tenantResult.rows[0].subscription_plan;
    const userLimit = getUserLimitByPlan(plan);
    const currentUserCount = await getActiveUserCount(tenantId);
    
    if (currentUserCount + users.length > userLimit) {
      return res.status(400).json({ error: `Límite de usuarios excedido para el plan ${plan.toUpperCase()}` });
    }

    const createdUsers = [];
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const VALID_ROLES = ['doctor', 'nurse', 'secretary', 'admin'];

    for (const user of users) {
      try {
        const { full_name, document_id, role, phone, email } = user;

        // ✅ CAMBIO: Email ahora es obligatorio porque será el username
        if (!full_name || !document_id || !role || !email) {
          errors.push({ user: full_name || 'Sin nombre', error: 'Falta email o datos obligatorios' });
          continue;
        }

        if (!VALID_ROLES.includes(role.toLowerCase())) {
          errors.push({ user: full_name, error: `Rol '${role}' no válido` });
          continue;
        }

        if (!emailRegex.test(email)) {
          errors.push({ user: full_name, error: 'Email inválido' });
          continue;
        }

        // Validar duplicados (Email o Documento)
        const exists = await query(
          'SELECT id FROM users WHERE email = $1 OR document_id = $2',
          [email, document_id]
        );

        if (exists.rows.length > 0) {
          errors.push({ user: full_name, error: 'Email o documento ya existe' });
          continue;
        }

        // ✅ CAMBIO: Username = Email
        const username = email;

        // Contraseña Temporal: Inicial + apellido + ultimos 6 cedula
        const passwordNameParts = full_name.split(' ').filter(p => p.length > 0);
        const firstNameLetter = passwordNameParts[0]?.[0].toUpperCase() || 'U';
        const lastNameLetter = passwordNameParts[passwordNameParts.length - 1]?.[0].toLowerCase() || 'u';
        const cedularDigits = document_id.slice(-6);
        const tempPassword = `${firstNameLetter}${lastNameLetter}${cedularDigits}`;

        const hashedPassword = await hashPassword(tempPassword);

        const result = await query(
          `INSERT INTO users (tenant_id, username, email, full_name, password_hash, role, phone, document_id, status, must_change_password)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, username, email, role`,
          [
            tenantId,
            username,
            email,
            full_name,
            hashedPassword,
            role.toLowerCase(),
            phone || null,
            document_id,
            'active',
            true
          ]
        );

        createdUsers.push({
          full_name,
          username,
          temporary_password: tempPassword,
          email: result.rows[0].email,
          role: result.rows[0].role
        });
      } catch (err) {
        errors.push({ user: user.full_name || 'Sin nombre', error: err.message });
      }
    }

    await query('UPDATE tenants SET user_count = (SELECT COUNT(*) FROM users WHERE tenant_id = $1) WHERE id = $1', [tenantId]);

    // Log de auditoría simplificado para no llenar logs
    if (createdUsers.length > 0) {
      try {
        await logAction({
          tenantId,
          actorId: req.userId || 'unknown',
          action: 'BULK_USERS',
          resourceType: 'USER',
          status: 'SUCCESS',
          changes: { total_created: createdUsers.length },
          req
        });
      } catch (e) { console.error('Audit Error', e); }
    }

    res.json({
      success: true,
      message: `${createdUsers.length} usuarios creados exitosamente`,
      data: {
        created_users: createdUsers,
        errors: errors.length > 0 ? errors : null
      }
    });
  } catch (error) {
    console.error('Error en bulk creation:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// PUT - ACTUALIZAR USUARIO
// ============================================
router.put('/:tenantId/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { tenantId, userId } = req.params;
    const { full_name, email, phone, role } = req.body;

    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede editar' });

    const VALID_ROLES = ['doctor', 'nurse', 'secretary', 'admin'];
    if (role && !VALID_ROLES.includes(role.toLowerCase())) return res.status(400).json({ error: `Rol no válido` });

    if (email) {
      const emailExists = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (emailExists.rows.length > 0) return res.status(400).json({ error: 'Email ya existe' });
    }

    await query(
      `UPDATE users SET full_name = $1, email = $2, phone = $3, role = $4 WHERE id = $5 AND tenant_id = $6`,
      [full_name, email, phone, role ? role.toLowerCase() : undefined, userId, tenantId]
    );

    res.json({ success: true, message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// DELETE - ELIMINAR USUARIO
// ============================================
router.delete('/:tenantId/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { tenantId, userId } = req.params;
    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede eliminar' });

    await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
    await query('UPDATE tenants SET user_count = (SELECT COUNT(*) FROM users WHERE tenant_id = $1) WHERE id = $1', [tenantId]);

    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// PATCH - DESACTIVAR TENANT
// ============================================
router.patch('/:tenantId/deactivate', authenticateToken, async (req, res) => {
  const tenantId = req.params.tenantId;
  try {
    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede desactivar' });

    await query(`UPDATE tenants SET status = 'inactive' WHERE id = $1`, [tenantId]);
    await query(`UPDATE users SET status = 'inactive' WHERE tenant_id = $1`, [tenantId]);

    res.json({ success: true, message: 'Clínica desactivada exitosamente' });
  } catch (error) {
    console.error('Error deactivate tenant:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// PATCH - REACTIVAR TENANT
// ============================================
router.patch('/:tenantId/reactivate', authenticateToken, async (req, res) => {
  const tenantId = req.params.tenantId;
  try {
    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede reactivar' });

    await query(`UPDATE tenants SET status = 'active' WHERE id = $1`, [tenantId]);
    await query(`UPDATE users SET status = 'active' WHERE tenant_id = $1`, [tenantId]);

    res.json({ success: true, message: 'Clínica reactivada exitosamente' });
  } catch (error) {
    console.error('Error reactivate tenant:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// DELETE - ELIMINAR TENANT
// ============================================
router.delete('/:tenantId', authenticateToken, async (req, res) => {
  const tenantId = req.params.tenantId;
  try {
    const isSuperAdmin = await validateSuperAdmin(req.userId);
    if (!isSuperAdmin) return res.status(403).json({ error: 'Solo super-admin puede eliminar' });

    await query(`DELETE FROM medical_visits WHERE patient_id IN (SELECT id FROM patients WHERE tenant_id = $1)`, [tenantId]);
    await query('DELETE FROM patients WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    const deleteResult = await query('DELETE FROM tenants WHERE id = $1', [tenantId]);

    if (deleteResult.rowCount === 0) return res.status(404).json({ error: 'Tenant no encontrado' });

    res.json({ success: true, message: 'Clínica eliminada exitosamente' });
  } catch (error) {
    console.error(`Error deleting tenant:`, error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;