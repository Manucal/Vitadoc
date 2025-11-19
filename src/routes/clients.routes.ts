import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';


const router = Router();


// POST - Crear cliente
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, clientType } = req.body;
    
    if (!name || !email || !clientType) {
      return res.status(400).json({ error: 'Campos requeridos: name, email, clientType' });
    }


    const adminCheckResult = await query('SELECT role FROM users WHERE id = $1', [req.userId]);
    if (adminCheckResult.rows.length === 0 || adminCheckResult.rows.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear clientes' });
    }


    const existsResult = await query('SELECT id FROM tenants WHERE contact_email = $1', [email]);
    if (existsResult.rows.length > 0) {
      return res.status(409).json({ error: 'El cliente ya existe con este email' });
    }


    const clientId = uuidv4();
    const result = await query(
      'INSERT INTO tenants (id, name, type, contact_email, contact_phone, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, type, contact_email, status, created_date',
      [clientId, name, clientType, email, phone || null, 'active']
    );


    res.status(201).json({ success: true, message: 'Cliente creado exitosamente', client: result.rows });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


// GET - Listar todos los clientes
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const adminCheckResult = await query('SELECT role FROM users WHERE id = $1', [req.userId]);
    if (adminCheckResult.rows.length === 0 || adminCheckResult.rows.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden listar clientes' });
    }


    const result = await query('SELECT id, name, type, contact_email, contact_phone, status, created_date FROM tenants ORDER BY created_date DESC');
    res.json({ success: true, clients: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


// GET - Obtener un cliente específico
router.get('/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    
    const result = await query('SELECT * FROM tenants WHERE id = $1', [clientId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }


    res.json({ success: true, client: result.rows });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


// DELETE - Eliminar cliente
router.delete('/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;


    const adminCheckResult = await query('SELECT role FROM users WHERE id = $1', [req.userId]);
    if (adminCheckResult.rows.length === 0 || adminCheckResult.rows.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar clientes' });
    }


    const existsResult = await query('SELECT id FROM tenants WHERE id = $1', [clientId]);
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }


    await query('DELETE FROM tenants WHERE id = $1', [clientId]);
    res.json({ success: true, message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


export default router;
