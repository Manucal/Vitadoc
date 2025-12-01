import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { hashPassword, comparePasswords, generateToken } from '../config/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// ============================================
// LOGIN
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`\n[LOGIN] === INICIANDO LOGIN ===`);
    console.log(`[LOGIN] 1. Intento de login con username: "${username}"`);

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    // Buscamos usuario (incluyendo full_name y email para el frontend)
    const result = await query(
      'SELECT id, tenant_id, password_hash, role, full_name, email, must_change_password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      console.log(`[LOGIN] ✗ ERROR: Usuario no encontrado`);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = result.rows[0];

    const passwordValid = await comparePasswords(password, user.password_hash);
    
    if (!passwordValid) {
      console.log(`[LOGIN] ✗ ERROR: Password incorrecto`);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = generateToken(user.id, user.tenant_id);
    const isSuperAdmin = user.role === 'admin' && user.tenant_id === null;

    console.log(`[LOGIN] ✓ LOGIN EXITOSO: ${username}`);

    res.json({
      success: true,
      token,
      userId: user.id,
      clientId: user.tenant_id,
      isSuperAdmin,
      role: user.role,
      user: {
        id: user.id,
        username: username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        isSuperAdmin,
        must_change_password: user.must_change_password // ✅ IMPORTANTE: Enviamos esto al front
      }
    });
  } catch (error) {
    console.error(`[LOGIN] ✗ ERROR CRÍTICO:`, error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// CAMBIAR CONTRASEÑA (CUALQUIER USUARIO) 
// ============================================

router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // ✅ VALIDACIÓN DE SEGURIDAD FUERTE
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.' 
      });
    }

    // 1. Obtener contraseña actual de la BD
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    const user = userResult.rows[0];

    // 2. Verificar que la contraseña actual sea correcta
    const isMatch = await comparePasswords(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    // 3. Hashear la nueva contraseña
    const newHashedPassword = await hashPassword(newPassword);

    // 4. Actualizar y quitar la bandera 'must_change_password'
    await query(
      `UPDATE users 
       SET password_hash = $1, must_change_password = false 
       WHERE id = $2`,
      [newHashedPassword, userId]
    );

    console.log(`[AUTH] Password cambiado exitosamente para usuario ID: ${userId}`);

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================================
// VERIFICAR TOKEN
// ============================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, full_name, role, status, tenant_id, must_change_password FROM users WHERE id = $1',
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
        must_change_password: user.must_change_password, // ✅ Enviamos estado
        tenant: tenant || null
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// LOGOUT
// ============================================
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// RESET PASSWORD (SUPER-ADMIN ONLY)
// ============================================
router.post('/reset-password', authenticateToken, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) return res.status(400).json({ error: 'Faltan datos' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' });

    const adminResult = await query('SELECT role, tenant_id FROM users WHERE id = $1', [req.userId]);
    if (adminResult.rows.length === 0) return res.status(403).json({ error: 'Admin no encontrado' });
    
    const admin = adminResult.rows[0];
    if (admin.role !== 'admin' || admin.tenant_id !== null) {
      return res.status(403).json({ error: 'Solo SUPER-ADMIN puede resetear contraseñas' });
    }

    const hashedPassword = await hashPassword(newPassword);
    // Al resetear, obligamos a cambiar de nuevo por seguridad
    await query('UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2', [hashedPassword, userId]);

    res.json({ success: true, message: 'Contraseña reseteada exitosamente' });
  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;