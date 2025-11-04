import express, { Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { hashPassword, comparePasswords, generateToken } from '../config/auth';
import { query } from '../config/database';

const router = express.Router();

// LOGIN
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const result = await query(
      'SELECT id, tenant_id, password_hash FROM users WHERE username = $1',
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

    res.json({
      success: true,
      token,
      userId: user.id,
      clientId: user.tenant_id,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// REGISTRO
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, fullName, clientName, clientType } = req.body;

    if (!username || !password || !email || !fullName || !clientName || !clientType) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Crear cliente/tenant
    const clientResult = await query(
      'INSERT INTO tenants (name, type, contact_email, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [clientName, clientType, email, 'active']
    );

    const clientId = clientResult.rows[0].id;

    // Hashear contraseña
    const passwordHash = await hashPassword(password);

    // Crear usuario
    const userResult = await query(
      'INSERT INTO users (tenant_id, username, email, password_hash, full_name, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [clientId, username, email, passwordHash, fullName, 'admin', 'active']
    );

    const userId = userResult.rows[0].id;
    const token = generateToken(userId, clientId);

    res.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      token,
      userId,
      clientId,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// VERIFICAR TOKEN
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, username, email, full_name, role FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
