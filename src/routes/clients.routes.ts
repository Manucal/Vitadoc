import { Express, Request, Response } from 'express';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

export function setupClientsRoutes(app: Express) {
  // Crear un nuevo cliente (SOLO ADMIN)
  app.post('/api/clients', authenticateToken, async (req: Request, res: Response) => {
    try {
      // Verificar que sea admin
      const adminCheck = await db.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [req.userId]
      );

      if (!adminCheck.rows[0]?.is_admin) {
        return res.status(403).json({ error: 'Solo administradores pueden crear clientes' });
      }

      const {
        name,
        email,
        phone,
        address,
        city,
        client_type,
        subscription_plan,
        max_users,
        max_patients,
      } = req.body;

      const result = await db.query(
        `INSERT INTO clients (
          name, email, phone, address, city, 
          client_type, subscription_plan, max_users, max_patients, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          name,
          email,
          phone,
          address,
          city,
          client_type,
          subscription_plan || 'basic',
          max_users || 5,
          max_patients || 1000,
          req.userId,
        ]
      );

      // Registrar en audit log
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, $3, $4, $5)`,
        [req.userId, 'CREATE_CLIENT', 'client', result.rows[0].id, JSON.stringify({ name })]
      );

      res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        client: result.rows[0],
      });
    } catch (error) {
      console.error('Error creando cliente:', error);
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  });

  // Obtener todos los clientes (SOLO ADMIN)
  app.get('/api/clients', authenticateToken, async (req: Request, res: Response) => {
    try {
      const adminCheck = await db.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [req.userId]
      );

      if (!adminCheck.rows[0]?.is_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const result = await db.query(
        'SELECT * FROM clients ORDER BY created_at DESC'
      );

      res.json({
        success: true,
        clients: result.rows,
      });
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  });

  // Obtener cliente por ID
  app.get('/api/clients/:clientId', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;

      const result = await db.query(
        'SELECT * FROM clients WHERE id = $1',
        [clientId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json({
        success: true,
        client: result.rows[0],
      });
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      res.status(500).json({ error: 'Error al obtener cliente' });
    }
  });

  // Actualizar cliente (SOLO ADMIN)
  app.put('/api/clients/:clientId', authenticateToken, async (req: Request, res: Response) => {
    try {
      const adminCheck = await db.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [req.userId]
      );

      if (!adminCheck.rows[0]?.is_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const { clientId } = req.params;
      const { name, email, phone, address, city, status, subscription_plan, max_users } = req.body;

      const result = await db.query(
        `UPDATE clients 
        SET name = $1, email = $2, phone = $3, address = $4, city = $5, 
            status = $6, subscription_plan = $7, max_users = $8, updated_at = NOW()
        WHERE id = $9
        RETURNING *`,
        [name, email, phone, address, city, status, subscription_plan, max_users, clientId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        client: result.rows[0],
      });
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  });

  // Eliminar cliente (SOLO ADMIN)
  app.delete('/api/clients/:clientId', authenticateToken, async (req: Request, res: Response) => {
    try {
      const adminCheck = await db.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [req.userId]
      );

      if (!adminCheck.rows[0]?.is_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const { clientId } = req.params;

      await db.query('DELETE FROM clients WHERE id = $1', [clientId]);

      res.json({
        success: true,
        message: 'Cliente eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      res.status(500).json({ error: 'Error al eliminar cliente' });
    }
  });
}
