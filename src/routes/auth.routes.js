import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { hashPassword, comparePasswords, generateToken } from '../config/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// ============================================
// LOGIN CON LOGS DETALLADOS
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`\n[LOGIN] === INICIANDO LOGIN ===`);
    console.log(`[LOGIN] 1. Intento de login con username: "${username}"`);

    if (!username || !password) {
      console.log(`[LOGIN] ✗ ERROR: Username o password vacío`);
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    console.log(`[LOGIN] 2. Buscando usuario en BD...`);
    // ✅ MODIFICADO: Agregué full_name y email al SELECT
    const result = await query(
      'SELECT id, tenant_id, password_hash, role, full_name, email FROM users WHERE username = $1',
      [username]
    );

    console.log(`[LOGIN] 3. Resultado de búsqueda: ${result.rows.length} usuarios encontrados`);

    if (result.rows.length === 0) {
      console.log(`[LOGIN] ✗ ERROR: Usuario "${username}" NO encontrado en BD`);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = result.rows[0];
    console.log(`[LOGIN] 4. Usuario encontrado:`);
    console.log(`[LOGIN]    - ID: ${user.id}`);
    console.log(`[LOGIN]    - Role: ${user.role}`);
    console.log(`[LOGIN]    - TenantID: ${user.tenant_id}`);

    console.log(`[LOGIN] 5. Comparando passwords...`);
    const passwordValid = await comparePasswords(password, user.password_hash);
    
    if (!passwordValid) {
      console.log(`[LOGIN] ✗ ERROR: Password INCORRECTO`);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    console.log(`[LOGIN] 7. Generando token...`);
    const token = generateToken(user.id, user.tenant_id);
    const isSuperAdmin = user.role === 'admin' && user.tenant_id === null;

    console.log(`[LOGIN] ✓ LOGIN EXITOSO para usuario: "${username}"`);
    console.log(`[LOGIN] ✓ Rol enviado: ${user.role}`);

    // ✅ MODIFICADO: Ahora enviamos todos los datos que el Frontend necesita
    res.json({
      success: true,
      token,
      userId: user.id,
      clientId: user.tenant_id,
      isSuperAdmin,
      role: user.role, // ¡ESTO FALTABA!
      user: {          // Enviamos objeto completo para guardar en localStorage
        id: user.id,
        username: username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        isSuperAdmin
      }
    });
  } catch (error) {
    console.error(`[LOGIN] ✗ ERROR CRÍTICO:`, error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// VERIFICAR TOKEN
// ============================================
router.get('/me', authenticateToken, async (req, res) => {
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
// RESET PASSWORD (SUPER-ADMIN)
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
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ success: true, message: 'Contraseña reseteada exitosamente' });
  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;