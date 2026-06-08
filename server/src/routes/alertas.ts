import { Router, type Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from './ocorrencias.js';

const router = Router();

router.get('/', authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const summaryResult = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM "SOS" WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '24 hours') AS sos_last_24h,
        (SELECT COUNT(*)::int FROM "ocorrencia" WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '24 hours') AS ocorrencias_last_24h,
        (SELECT COUNT(*)::int FROM "SOS" WHERE user_id = $1) AS sos_total,
        (SELECT COUNT(*)::int FROM "ocorrencia" WHERE user_id = $1) AS ocorrencias_total
    `, [userId]);

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
          u.name AS user_name,
          'error' AS type
        FROM "SOS" s
        INNER JOIN "user" u ON u.id = s.user_id
        WHERE s.user_id = $1

        UNION ALL

        SELECT
          o.id,
          'ocorrencia' AS source,
          o.title,
          COALESCE(o.description, 'Ocorrencia registrada') AS description,
          o.location,
          o.created_at,
          u.id AS user_id,
          u.name AS user_name,
          o.type
        FROM "ocorrencia" o
        INNER JOIN "user" u ON u.id = o.user_id
        WHERE o.user_id = $1
      ) AS alert_feed
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId]);

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
