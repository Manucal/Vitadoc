// src/services/auditService.ts

import { query } from '../config/database.js';
import { Request } from 'express';

export interface AuditLogInput {
  tenantId: string | null;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  status: 'SUCCESS' | 'FAILED' | 'DENIED';
  changes?: any;
  errorMessage?: string;
  req?: Request;
  metadata?: any;
}

/**
 * Registra una acción en audit_logs
 */
export const logAction = async ({
  tenantId,
  actorId,
  action,
  resourceType,
  resourceId,
  status,
  changes,
  errorMessage,
  req,
  metadata
}: AuditLogInput) => {
  try {
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || 'UNKNOWN';
    const userAgent = req?.get('user-agent') || 'UNKNOWN';

    await query(
      `INSERT INTO audit_logs 
       (tenant_id, actor_id, action, resource_type, resource_id, status, changes, error_message, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        tenantId,
        actorId,
        action,
        resourceType,
        resourceId || null,
        status,
        changes ? JSON.stringify(changes) : null,
        errorMessage || null,
        ipAddress,
        userAgent,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    console.log(`[AUDIT] ${action} | ${status} | Actor: ${actorId}`);
  } catch (error) {
    console.error('[AUDIT] Error logging action:', error);
    // No lanzar error, solo loguear en consola
  }
};

/**
 * Obtiene logs de auditoría (con filtros)
 */
export const getAuditLogs = async (
  tenantId?: string,
  actorId?: string,
  action?: string,
  limit: number = 100,
  offset: number = 0
) => {
  try {
    let queryText = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (tenantId) {
      params.push(tenantId);
      queryText += ` AND tenant_id = $${params.length}`;
    }

    if (actorId) {
      params.push(actorId);
      queryText += ` AND actor_id = $${params.length}`;
    }

    if (action) {
      params.push(action);
      queryText += ` AND action = $${params.length}`;
    }

    queryText += ' ORDER BY created_at DESC';

    params.push(limit);
    queryText += ` LIMIT $${params.length}`;

    params.push(offset);
    queryText += ` OFFSET $${params.length}`;

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('[AUDIT] Error fetching logs:', error);
    return [];
  }
};

/**
 * Obtiene estadísticas de auditoría
 */
export const getAuditStats = async (tenantId?: string) => {
  try {
    let queryText = `
      SELECT 
        action,
        status,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM audit_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tenantId) {
      params.push(tenantId);
      queryText += ` AND tenant_id = $${params.length}`;
    }

    queryText += ` GROUP BY action, status, DATE(created_at)
                ORDER BY date DESC, count DESC`;

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('[AUDIT] Error fetching stats:', error);
    return [];
  }
};

/**
 * Limpia logs antiguos (>90 días)
 */
export const cleanOldLogs = async (daysOld: number = 90) => {
  try {
    const result = await query(
      `DELETE FROM audit_logs 
       WHERE created_at < NOW() - INTERVAL '${daysOld} days'`
    );
    console.log(`[AUDIT] Cleaned ${result.rowCount} old logs`);
  } catch (error) {
    console.error('[AUDIT] Error cleaning old logs:', error);
  }
};