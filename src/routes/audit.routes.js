import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { getAuditLogs, getAuditStats } from '../services/auditService.js';

const router = express.Router();

/**
 * GET /api/audit/logs
 * Obtener logs de auditoría
 */
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { tenantId, action, limit = '100', offset = '0' } = req.query;

    // ✅ Validar que sea super-admin
    const userResult = await query(
      'SELECT role, tenant_id FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];
    const isSuperAdmin = user.role === 'admin' && user.tenant_id === null;

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Solo super-admin puede ver logs de auditoría' });
    }

    const logs = await getAuditLogs(
      tenantId,
      undefined,
      action,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('[AUDIT ROUTES] Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener logs de auditoría'
    });
  }
});

/**
 * GET /api/audit/stats
 * Obtener estadísticas de auditoría
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.query;

    // ✅ Validar que sea super-admin
    const userResult = await query(
      'SELECT role, tenant_id FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];
    const isSuperAdmin = user.role === 'admin' && user.tenant_id === null;

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Solo super-admin puede ver estadísticas' });
    }

    const stats = await getAuditStats(tenantId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[AUDIT ROUTES] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

export default router;
