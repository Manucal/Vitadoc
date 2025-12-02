import { Router } from 'express';
import { pool } from '../config/database.js'; // Usamos tu conexión existente
import authenticateToken from '../middleware/auth.js'; // Tu seguridad actual

const router = Router();

// 1. OBTENER KITS (GET /api/kits)
// Trae solo los kits creados por el médico que está logueado
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Asumimos que el ID del usuario viene en el token (req.user.id)
        const userId = req.user.id; 
        
        const result = await pool.query(
            'SELECT * FROM treatment_kits WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener kits:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 2. CREAR UN KIT (POST /api/kits)
// Recibe un array de medicamentos y lo guarda como plantilla
router.post('/', authenticateToken, async (req, res) => {
    const { name, description, medicines } = req.body;
    const userId = req.user.id;

    if (!name || !medicines) {
        return res.status(400).json({ error: 'Falta el nombre o los medicamentos' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO treatment_kits (user_id, name, description, medicines) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, name, description || '', JSON.stringify(medicines)]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear kit:', err);
        res.status(500).json({ error: 'Error al guardar el kit' });
    }
});

// 3. ELIMINAR KIT (DELETE /api/kits/:id)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Validamos que el kit pertenezca al usuario antes de borrarlo
        const result = await pool.query(
            'DELETE FROM treatment_kits WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Kit no encontrado o no tienes permiso' });
        }

        res.json({ message: 'Kit eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar kit:', err);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

export default router;