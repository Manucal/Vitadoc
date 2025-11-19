import express, { Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { hashPassword } from '../config/auth.js';
import { logAction } from '../services/auditService.js';

// ✅ HELPER: Validar SUPER-ADMIN (CORREGIDO - Sin error TypeScript)
const validateSuperAdmin = async (userId: string | undefined): Promise<boolean> => {
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
const getUserLimitByPlan = (plan: string): number => {
  const limits: Record<string, number> = {
    basic: 1,
    standard: 3,
    premium: 5,
    enterprise: 999999
  };
  return limits[plan.toLowerCase()] || 1;
};

// ============================================
// HELPER: Obtener plan de un tenant
// ============================================
const getTenantPlan = async (tenantId: string): Promise<string> => {
  try {
    const result = await query(
      'SELECT subscription_plan FROM tenants WHERE id = $1',
      [tenantId]
    );
    if (result.rows.length === 0) return 'basic';
    return result.rows[0].subscription_plan;
  } catch (error) {
    console.error('Error getting tenant plan:', error);
    return 'basic';
  }
};

// ============================================
// HELPER: Contar usuarios activos de un tenant
// ============================================
const getActiveUserCount = async (tenantId: string): Promise<number> => {
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
// (FUNCIONA EN PRODUCCIÓN - SEGURO)
// ============================================
router.post('/admin/emergency-reset', async (req: AuthRequest, res: Response) => {
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
    console.log(`[EMERGENCY RESET] Clínica: ${clinic_name}`);
    console.log(`[EMERGENCY RESET] Email: ${admin_email}`);

    console.log(`[EMERGENCY RESET] 1. Creando usuario SUPER-ADMIN (sin tenant)...`);

    console.log(`[EMERGENCY RESET] 2. Generando hash de contraseña...`);
    const hashedPassword = await hashPassword(admin_password);
    console.log(`[EMERGENCY RESET] ✓ Hash generado`);

    console.log(`[EMERGENCY RESET] 3. Insertando usuario SUPER-ADMIN...`);
    const userResult = await query(
      `INSERT INTO users (tenant_id, username, email, full_name, password_hash, role, status, document_id, created_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, username, email, role, tenant_id`,
      [
        null,
        admin_email.split('@')[0],
        admin_email,
        'Admin Super',
        hashedPassword,
        'admin',
        'active',
        null
      ]
    );

    console.log(`[EMERGENCY RESET] ✓ Usuario SUPER-ADMIN creado`);
    console.log(`[EMERGENCY RESET] === ✓ SUPER-ADMIN CREADO EXITOSAMENTE ===\n`);

    res.status(201).json({
      success: true,
      message: '✓ Super-admin creado exitosamente. Puedes acceder inmediatamente.',
      data: {
        admin: {
          id: userResult.rows[0].id,
          username: userResult.rows[0].username,
          email: userResult.rows[0].email,
          role: userResult.rows[0].role,
          tenant_id: userResult.rows[0].tenant_id
        },
        login_credentials: {
          email: admin_email,
          password: admin_password
        }
      }
    });
  } catch (error) {
    console.error('[EMERGENCY RESET] ✗ ERROR:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      details: (error as any).message 
    });
  }
});

// ============================================
// GET - OBTENER TODOS LOS TENANTS (SUPER-ADMIN)
// ============================================
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = await validateSuperAdmin(req.userId);

    if (!isSuperAdmin) {
      console.warn(`[TENANTS] ⚠️ Intento de acceso no autorizado por usuario: ${req.userId}`);
      return res.status(403).json({ error: 'Solo super-admin puede acceder' });
    }

    const result = await query(
      `SELECT id, name, type, contact_email, subscription_plan, status, created_date, user_count
       FROM tenants
       ORDER BY created_date DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener tenants:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// POST - CREAR NUEVO TENANT (SUPER-ADMIN)
// ============================================
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = await validateSuperAdmin(req.userId);

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Solo super-admin puede crear clínicas' });
    }

    const { clinic_name, clinic_email, admin_full_name, admin_email, admin_password } = req.body;

    if (!clinic_name || !admin_email || !admin_password || !admin_full_name) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    if (admin_password.length < 8) {
      return res.status(400).json({ error: 'Contraseña debe tener mínimo 8 caracteres' });
    }

    const tenantResult = await query(
      `INSERT INTO tenants (name, type, contact_email, subscription_plan, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, contact_email`,
      [clinic_name, 'clinic', clinic_email, 'basic', 'active']
    );

    const tenantId = tenantResult.rows[0].id;
    const hashedPassword = await hashPassword(admin_password);

    const userResult = await query(
      `INSERT INTO users (tenant_id, username, email, full_name, password_hash, role, status, document_id, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, username, email`,
      [
        tenantId,
        admin_email.split('@')[0],
        admin_email,
        admin_full_name,
        hashedPassword,
        'admin',
        'active',
        null,
        false
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Clínica y usuario admin creados exitosamente',
      data: {
        tenant: tenantResult.rows[0],
        admin: userResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Error al crear tenant:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// GET - OBTENER USUARIOS DE UN TENANT
// ============================================
router.get('/:tenantId/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;

    const isSuperAdmin = await validateSuperAdmin(req.userId);

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Solo super-admin puede acceder' });
    }

    const tenantExists = await query(
      'SELECT id FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantExists.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    const result = await query(
      `SELECT id, username, email, full_name, phone, role, status, document_id, created_date
       FROM users
       WHERE tenant_id = $1
       ORDER BY created_date DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// POST - CREAR MÚLTIPLES USUARIOS (BULK)
// ✨ VALIDACIÓN DE LÍMITES POR PLAN AGREGADA
// ============================================
router.post('/:tenantId/bulk-users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { users } = req.body;

    const isSuperAdmin = await validateSuperAdmin(req.userId);

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Solo super-admin puede crear usuarios' });
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    if (users.length > 100) {
      return res.status(400).json({ error: 'Máximo 100 usuarios por importación' });
    }

    const tenantResult = await query(
      'SELECT id, subscription_plan FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    const plan = tenantResult.rows[0].subscription_plan;
    const userLimit = getUserLimitByPlan(plan);
    const currentUserCount = await getActiveUserCount(tenantId);
    const usersToAdd = users.length;
    
    console.log(`[BULK USERS] Plan: ${plan}, Límite: ${userLimit}, Usuarios actuales: ${currentUserCount}, Intentando agregar: ${usersToAdd}`);

    if (currentUserCount + usersToAdd > userLimit) {
      return res.status(400).json({
        error: `Límite de usuarios excedido para el plan ${plan.toUpperCase()}`,
        details: {
          plan: plan,
          limit: userLimit,
          current_users: currentUserCount,
          trying_to_add: usersToAdd,
          available_slots: userLimit - currentUserCount
        }
      });
    }

    console.log(`[BULK USERS] ✓ Validación de límite pasada. Disponibles: ${userLimit - currentUserCount} slots`);

    const createdUsers = [];
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const VALID_ROLES = ['doctor', 'nurse', 'secretary', 'admin'];

    for (const user of users) {
      try {
        const { full_name, document_id, role, phone, email } = user;

        if (!full_name || !document_id || !role) {
          errors.push({ user: full_name || 'Sin nombre', error: 'Datos incompletos' });
          continue;
        }

        if (!VALID_ROLES.includes(role.toLowerCase())) {
          errors.push({ user: full_name, error: `Rol '${role}' no válido` });
          continue;
        }

        if (email && !emailRegex.test(email)) {
          errors.push({ user: full_name, error: 'Email inválido' });
          continue;
        }

        const docExists = await query(
          'SELECT id FROM users WHERE document_id = $1 AND tenant_id = $2',
          [document_id, tenantId]
        );

        if (docExists.rows.length > 0) {
          errors.push({ user: full_name, error: 'Documento ya existe en esta clínica' });
          continue;
        }

        if (email) {
          const emailExists = await query(
            'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
            [email, tenantId]
          );

          if (emailExists.rows.length > 0) {
            errors.push({ user: full_name, error: 'Email ya existe en esta clínica' });
            continue;
          }
        }

        const nameParts = full_name.split(' ').filter((p: string) => p.length > 0);
        const username = nameParts
          .map((p: string) => p.substring(0, 2).toUpperCase())
          .join('')
          .substring(0, 12);

        const userExists = await query(
          'SELECT id FROM users WHERE username = $1',
          [username]
        );

        if (userExists.rows.length > 0) {
          errors.push({ user: full_name, error: `Usuario ${username} ya existe` });
          continue;
        }

        const passwordNameParts = full_name.split(' ').filter((p: string) => p.length > 0);
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
            email || `${username.toLowerCase()}@vitadoc.local`,
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
        errors.push({ user: user.full_name || 'Sin nombre', error: (err as any).message });
      }
    }

    await query(
      'UPDATE tenants SET user_count = (SELECT COUNT(*) FROM users WHERE tenant_id = $1) WHERE id = $1',
      [tenantId]
    );

    // ✨ FIX: Log de auditoría con fallback para userId
    if (createdUsers.length > 0) {
      try {
        await logAction({
          tenantId,
          actorId: req.userId || 'unknown',
          action: 'BULK_USERS',
          resourceType: 'USER',
          status: 'SUCCESS',
          changes: {
            total_created: createdUsers.length,
            users: createdUsers.map(u => u.username)
          },
          metadata: {
            plan: plan,
            limit: userLimit
          },
          req
        });
      } catch (auditErr) {
        console.error('Error logging BULK_USERS action:', auditErr);
      }
    }

    res.json({
      success: true,
      message: `${createdUsers.length} usuarios creados exitosamente`,
      data: {
        created_users: createdUsers,
        errors: errors.length > 0 ? errors : null,
        total_created: createdUsers.length,
        total_errors: errors.length
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
router.put('/:tenantId/users/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, userId } = req.params;
    const { full_name, email, phone, role } = req.body;

    const isSuperAdmin = await validateSuperAdmin(req.userId);

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Solo super-admin puede editar usuarios' });
    }

    const VALID_ROLES = ['doctor', 'nurse', 'secretary', 'admin'];

    if (role && !VALID_ROLES.includes(role.toLowerCase())) {
      return res.status(400).json({ error: `Rol '${role}' no válido` });
    }

    const userExists = await query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (email) {
      const emailExists = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2 AND tenant_id = $3',
        [email, userId, tenantId]
      );

      if (emailExists.rows.length > 0) {
        return res.status(400).json({ error: 'Email ya existe en esta clínica' });
      }
    }

    const oldUserResult = await query(
      'SELECT full_name, email, phone, role FROM users WHERE id = $1',
      [userId]
    );
    const oldUser = oldUserResult.rows[0];

    await query(
      `UPDATE users SET full_name = $1, email = $2, phone = $3, role = $4
       WHERE id = $5 AND tenant_id = $6`,
      [full_name, email, phone, role ? role.toLowerCase() : undefined, userId, tenantId]
    );

    const changes: any = {};
    if (full_name !== oldUser.full_name) changes.full_name = { old: oldUser.full_name, new: full_name };
    if (email !== oldUser.email) changes.email = { old: oldUser.email, new: email };
    if (phone !== oldUser.phone) changes.phone = { old: oldUser.phone, new: phone };
    if (role && role.toLowerCase() !== oldUser.role) changes.role = { old: oldUser.role, new: role.toLowerCase() };

    if (Object.keys(changes).length > 0) {
      try {
        await logAction({
          tenantId,
          actorId: req.userId || 'unknown',
          action: 'UPDATE_USER',
          resourceType: 'USER',
          resourceId: userId,
          status: 'SUCCESS',
          changes,
          req
        });
      } catch (auditErr) {
        console.error('Error logging UPDATE_USER action:', auditErr);
      }
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// DELETE - ELIMINAR USUARIO
// ============================================
router.delete('/:tenantId/users/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, userId } = req.params;

    const isSuperAdmin = await validateSuperAdmin(req.userId);

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Solo super-admin puede eliminar usuarios' });
    }

    const userExists = await query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userToDeleteResult = await query(
      'SELECT username, email, full_name FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
    const userToDelete = userToDeleteResult.rows[0];

    await query(
      `DELETE FROM users WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    await query(
      `UPDATE tenants SET user_count = (SELECT COUNT(*) FROM users WHERE tenant_id = $1) WHERE id = $1`,
      [tenantId]
    );

    try {
      await logAction({
        tenantId,
        actorId: req.userId || 'unknown',
        action: 'DELETE_USER',
        resourceType: 'USER',
        resourceId: userId,
        status: 'SUCCESS',
        changes: {
          username: { deleted: userToDelete.username },
          email: { deleted: userToDelete.email },
          full_name: { deleted: userToDelete.full_name }
        },
        req
      });
    } catch (auditErr) {
      console.error('Error logging DELETE_USER action:', auditErr);
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// PATCH - DESACTIVAR TENANT (SUPER-ADMIN)
// ============================================
router.patch('/:tenantId/deactivate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  
  console.log(`\n[DEACTIVATE TENANT] === DESACTIVANDO TENANT: ${tenantId} ===`);

  try {
    console.log(`[DEACTIVATE TENANT] 1. Verificando si es SUPER-ADMIN...`);
    const isSuperAdmin = await validateSuperAdmin(req.userId);

    if (!isSuperAdmin) {
      console.log(`[DEACTIVATE TENANT] ✗ NO es SUPER-ADMIN`);
      return res.status(403).json({ error: 'Solo super-admin puede desactivar clínicas' });
    }
    console.log(`[DEACTIVATE TENANT] ✓ Es SUPER-ADMIN`);

    console.log(`[DEACTIVATE TENANT] 2. Verificando si tenant existe...`);
    const tenantResult = await query(
      'SELECT id, status FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.log(`[DEACTIVATE TENANT] ✗ Tenant NO encontrado`);
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    const tenant = tenantResult.rows[0];
    console.log(`[DEACTIVATE TENANT] ✓ Tenant encontrado. Estado actual: ${tenant.status}`);

    console.log(`[DEACTIVATE TENANT] 3. Actualizando status a 'inactive'...`);
    await query(
      `UPDATE tenants SET status = $1 WHERE id = $2`,
      ['inactive', tenantId]
    );
    console.log(`[DEACTIVATE TENANT] ✓ Status actualizado`);

    console.log(`[DEACTIVATE TENANT] 4. Deactivando usuarios de la clínica...`);
    const deactivateUsersResult = await query(
      `UPDATE users SET status = $1 WHERE tenant_id = $2`,
      ['inactive', tenantId]
    );
    console.log(`[DEACTIVATE TENANT] ✓ Usuarios deactivados: ${deactivateUsersResult.rowCount} usuarios`);

    // ✨ FIX: Log de auditoría con fallback para userId
    try {
      await logAction({
        tenantId,
        actorId: req.userId || 'unknown',
        action: 'DEACTIVATE_TENANT',
        resourceType: 'TENANT',
        resourceId: tenantId,
        status: 'SUCCESS',
        changes: {
          status: { old: 'active', new: 'inactive' },
          users_affected: deactivateUsersResult.rowCount
        },
        req
      });
    } catch (auditErr) {
      console.error('Error logging DEACTIVATE_TENANT action:', auditErr);
    }

    console.log(`[DEACTIVATE TENANT] === ✓ DESACTIVACIÓN COMPLETADA EXITOSAMENTE ===\n`);

    res.json({
      success: true,
      message: 'Clínica desactivada exitosamente. Los usuarios no podrán acceder.',
      data: {
        tenant_id: tenantId,
        new_status: 'inactive',
        users_deactivated: deactivateUsersResult.rowCount
      }
    });
  } catch (error) {
    console.error(`[DEACTIVATE TENANT] ✗ ERROR:`, error);
    console.log(`[DEACTIVATE TENANT] === ✗ DESACTIVACIÓN FALLIDA ===\n`);
    res.status(500).json({ 
      error: 'Error en el servidor',
      details: (error as any).message 
    });
  }
});

// ============================================
// PATCH - REACTIVAR TENANT (SUPER-ADMIN)
// ============================================
router.patch('/:tenantId/reactivate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  
  console.log(`\n[REACTIVATE TENANT] === REACTIVANDO TENANT: ${tenantId} ===`);

  try {
    console.log(`[REACTIVATE TENANT] 1. Verificando si es SUPER-ADMIN...`);
    const isSuperAdmin = await validateSuperAdmin(req.userId);

    if (!isSuperAdmin) {
      console.log(`[REACTIVATE TENANT] ✗ NO es SUPER-ADMIN`);
      return res.status(403).json({ error: 'Solo super-admin puede reactivar clínicas' });
    }
    console.log(`[REACTIVATE TENANT] ✓ Es SUPER-ADMIN`);

    console.log(`[REACTIVATE TENANT] 2. Verificando si tenant existe...`);
    const tenantResult = await query(
      'SELECT id, status FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.log(`[REACTIVATE TENANT] ✗ Tenant NO encontrado`);
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    const tenant = tenantResult.rows[0];
    console.log(`[REACTIVATE TENANT] ✓ Tenant encontrado. Estado actual: ${tenant.status}`);

    console.log(`[REACTIVATE TENANT] 3. Actualizando status a 'active'...`);
    await query(
      `UPDATE tenants SET status = $1 WHERE id = $2`,
      ['active', tenantId]
    );
    console.log(`[REACTIVATE TENANT] ✓ Status actualizado`);

    console.log(`[REACTIVATE TENANT] 4. Reactivando usuarios de la clínica...`);
    const reactivateUsersResult = await query(
      `UPDATE users SET status = $1 WHERE tenant_id = $2`,
      ['active', tenantId]
    );
    console.log(`[REACTIVATE TENANT] ✓ Usuarios reactivados: ${reactivateUsersResult.rowCount} usuarios`);

    // ✨ FIX: Log de auditoría con fallback para userId
    try {
      await logAction({
        tenantId,
        actorId: req.userId || 'unknown',
        action: 'REACTIVATE_TENANT',
        resourceType: 'TENANT',
        resourceId: tenantId,
        status: 'SUCCESS',
        changes: {
          status: { old: 'inactive', new: 'active' },
          users_affected: reactivateUsersResult.rowCount
        },
        req
      });
    } catch (auditErr) {
      console.error('Error logging REACTIVATE_TENANT action:', auditErr);
    }

    console.log(`[REACTIVATE TENANT] === ✓ REACTIVACIÓN COMPLETADA EXITOSAMENTE ===\n`);

    res.json({
      success: true,
      message: 'Clínica reactivada exitosamente. Los usuarios pueden acceder nuevamente.',
      data: {
        tenant_id: tenantId,
        new_status: 'active',
        users_reactivated: reactivateUsersResult.rowCount
      }
    });
  } catch (error) {
    console.error(`[REACTIVATE TENANT] ✗ ERROR:`, error);
    console.log(`[REACTIVATE TENANT] === ✗ REACTIVACIÓN FALLIDA ===\n`);
    res.status(500).json({ 
      error: 'Error en el servidor',
      details: (error as any).message 
    });
  }
});

// ============================================
// DELETE - ELIMINAR TENANT (SUPER-ADMIN)
// ============================================
router.delete('/:tenantId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  
  console.log(`\n[DELETE TENANT] === INICIANDO ELIMINACIÓN DEL TENANT: ${tenantId} ===`);

  try {
    console.log(`[DELETE TENANT] 1. Verificando si es SUPER-ADMIN...`);
    const isSuperAdmin = await validateSuperAdmin(req.userId);

    if (!isSuperAdmin) {
      console.log(`[DELETE TENANT] ✗ NO es SUPER-ADMIN`);
      return res.status(403).json({ error: 'Solo super-admin puede eliminar clínicas' });
    }
    console.log(`[DELETE TENANT] ✓ Es SUPER-ADMIN`);

    console.log(`[DELETE TENANT] 2. Verificando si tenant existe...`);
    const tenantExists = await query(
      'SELECT id FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantExists.rows.length === 0) {
      console.log(`[DELETE TENANT] ✗ Tenant NO encontrado`);
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }
    console.log(`[DELETE TENANT] ✓ Tenant encontrado`);

    console.log(`[DELETE TENANT] 3. Iniciando eliminación en cascada...`);

    console.log(`[DELETE TENANT] 3a. Eliminando visitas médicas...`);
    await query(
      `DELETE FROM medical_visits 
       WHERE patient_id IN (
         SELECT id FROM patients WHERE tenant_id = $1
       )`,
      [tenantId]
    );
    console.log(`[DELETE TENANT] ✓ Visitas eliminadas`);

    console.log(`[DELETE TENANT] 3b. Limpiando referencias de pacientes...`);
    await query(
      `UPDATE patients SET created_by = NULL 
       WHERE tenant_id = $1`,
      [tenantId]
    );
    console.log(`[DELETE TENANT] ✓ Referencias limpiadas`);

    console.log(`[DELETE TENANT] 3c. Eliminando pacientes...`);
    await query(
      'DELETE FROM patients WHERE tenant_id = $1',
      [tenantId]
    );
    console.log(`[DELETE TENANT] ✓ Pacientes eliminados`);

    console.log(`[DELETE TENANT] 3d. Eliminando usuarios...`);
    const deleteUsersResult = await query(
      'DELETE FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    console.log(`[DELETE TENANT] ✓ Usuarios eliminados: ${deleteUsersResult.rowCount} filas`);

    console.log(`[DELETE TENANT] 4. Eliminando tenant...`);
    const deleteTenantResult = await query(
      'DELETE FROM tenants WHERE id = $1',
      [tenantId]
    );
    console.log(`[DELETE TENANT] ✓ Tenant eliminado: ${deleteTenantResult.rowCount} filas`);

    if (deleteTenantResult.rowCount === 0) {
      console.log(`[DELETE TENANT] ✗ No se eliminó ningún tenant`);
      return res.status(400).json({ error: 'No se pudo eliminar el tenant' });
    }

    // ✨ FIX: Log de auditoría con fallback para userId
    try {
      await logAction({
        tenantId,
        actorId: req.userId || 'unknown',
        action: 'DELETE_TENANT',
        resourceType: 'TENANT',
        resourceId: tenantId,
        status: 'SUCCESS',
        changes: {
          users_deleted: deleteUsersResult.rowCount,
          patients_deleted: true
        },
        req
      });
    } catch (auditErr) {
      console.error('Error logging DELETE_TENANT action:', auditErr);
    }

    console.log(`[DELETE TENANT] === ✓ ELIMINACIÓN COMPLETADA EXITOSAMENTE ===\n`);

    res.json({
      success: true,
      message: 'Clínica eliminada exitosamente'
    });
  } catch (error) {
    console.error(`[DELETE TENANT] ✗ ERROR:`, error);
    console.log(`[DELETE TENANT] === ✗ ELIMINACIÓN FALLIDA ===\n`);
    res.status(500).json({ 
      error: 'Error en el servidor',
      details: (error as any).message 
    });
  }
});

export default router;