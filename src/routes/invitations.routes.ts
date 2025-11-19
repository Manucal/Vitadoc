import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET - Listar invitaciones
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true, message: 'Listar invitaciones', invitations: [] });
  } catch (error) {
    console.error('Error al obtener invitaciones:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// POST - Crear invitación
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { email, fullName, role } = req.body;

    if (!email || !fullName || !role) {
      return res.status(400).json({ error: 'Campos requeridos: email, fullName, role' });
    }

    const invitationId = uuidv4();
    res.status(201).json({
      success: true,
      message: 'Invitación creada exitosamente',
      invitation: { id: invitationId, email, fullName, role, status: 'pending' }
    });
  } catch (error) {
    console.error('Error al crear invitación:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
