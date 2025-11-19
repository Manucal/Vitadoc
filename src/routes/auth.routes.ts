import express, { Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { hashPassword, comparePasswords, generateToken } from '../config/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// ============================================
// LOGIN
// ============================================
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const result = await query(
      'SELECT id, tenant_id, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = result.rows[0];
    const passwordValid = await comparePasswords(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = generateToken(user.id, user.tenant_id);

    // ✅ AGREGAR isSuperAdmin
    const isSuperAdmin = user.role === 'admin' && user.tenant_id === null;

    res.json({
      success: true,
      token,
      userId: user.id,
      clientId: user.tenant_id,
      isSuperAdmin  // ✅ ESTA LÍNEA
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// VERIFICAR TOKEN
// ============================================
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, username, email, full_name, role, status, tenant_id FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    let tenant = null;
    if (user.tenant_id) {
      const tenantResult = await query(
        'SELECT id, name, type, contact_email, subscription_plan FROM tenants WHERE id = $1',
        [user.tenant_id]
      );
      tenant = tenantResult.rows[0] || null;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        tenant_id: user.tenant_id,
        tenant: tenant || null
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// LOGOUT (opcional - client-side)
// ============================================
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// 🆕 RESET PASSWORD - SUPER-ADMIN ONLY
// ============================================
router.post('/reset-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Verificar que quien ejecuta es SUPER-ADMIN
    const adminResult = await query(
      'SELECT id, role, tenant_id FROM users WHERE id = $1',
      [req.userId]
    );

    if (adminResult.rows.length === 0) {
      return res.status(403).json({ error: 'Admin no encontrado' });
    }

    const admin = adminResult.rows[0];
    const isSuperAdmin = admin.role === 'admin' && admin.tenant_id === null;

    if (!isSuperAdmin) {
      console.warn(`❌ [RESET-PASSWORD] Intento no autorizado desde usuario: ${req.userId}`);
      return res.status(403).json({ error: 'Solo SUPER-ADMIN puede resetear contraseñas' });
    }

    // Verificar que el usuario a resetear existe
    const targetUserResult = await query(
      'SELECT id, username, email, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const targetUser = targetUserResult.rows[0];

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña en base de datos
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    console.log(`✅ [RESET-PASSWORD] Contraseña reseteada para usuario: ${targetUser.username}`);

    res.json({
      success: true,
      message: `Contraseña reseteada para ${targetUser.full_name}`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        full_name: targetUser.full_name
      }
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


export default router;
