import { Router, type Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from './ocorrencias.js';

const router = Router();

router.get('/', authenticateToken, async (_req: any, res: Response) => {
  try {
    const summaryResult = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM "SOS" WHERE created_at >= NOW() - INTERVAL '24 hours') AS sos_last_24h,
        (SELECT COUNT(*)::int FROM "ocorrencia" WHERE created_at >= NOW() - INTERVAL '24 hours') AS ocorrencias_last_24h,
        (SELECT COUNT(*)::int FROM "SOS") AS sos_total,
        (SELECT COUNT(*)::int FROM "ocorrencia") AS ocorrencias_total
    `);

    const feedResult = await query(`
      SELECT *
      FROM (
        SELECT
          s.id,
          'sos' AS source,
          'Alerta SOS emitido' AS title,
          COALESCE(s.location, 'Localizacao nao informada') AS description,
          s.location,
          s.created_at,
          u.id AS user_id,
          u.name AS user_name
        FROM "SOS" s
        INNER JOIN "user" u ON u.id = s.user_id

        UNION ALL

        SELECT
          o.id,
          'ocorrencia' AS source,
          o.title,
          COALESCE(o.description, 'Ocorrencia registrada') AS description,
          o.location,
          o.created_at,
          u.id AS user_id,
          u.name AS user_name
        FROM "ocorrencia" o
        INNER JOIN "user" u ON u.id = o.user_id
      ) AS alert_feed
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json({
      summary: summaryResult.rows[0],
      alerts: feedResult.rows,
    });
  } catch (error) {
    console.error('Error fetching alertas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
