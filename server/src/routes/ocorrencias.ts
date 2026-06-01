import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = Router();

// Auth Middleware
export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Create Ocorrencia
router.post('/', authenticateToken, async (req: any, res: Response) => {
  const { title, description, location } = req.body;
  const userId = req.user.id;

  try {
    const result = await query(
      'INSERT INTO "ocorrencia" (user_id, title, description, location) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, description, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ocorrencia:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List latest ocorrencias for Home
router.get('/recentes', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT
         o.id,
         o.title,
         o.description,
         o.location,
         o.created_at,
         u.name AS user_name
       FROM "ocorrencia" o
       INNER JOIN "user" u ON u.id = o.user_id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent ocorrencias:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Map data (areas grouped by location + recent occurrences)
router.get('/mapa', async (_req: Request, res: Response) => {
  try {
    const areasResult = await query(
      `SELECT
         location_name AS name,
         incidents,
         CASE
           WHEN incidents >= 5 THEN 'danger'
           WHEN incidents >= 2 THEN 'medium'
           ELSE 'safe'
         END AS risk
       FROM (
         SELECT
           COALESCE(NULLIF(TRIM(location), ''), 'Nao informado') AS location_name,
           COUNT(*)::int AS incidents
         FROM "ocorrencia"
         GROUP BY 1
       ) grouped
       ORDER BY incidents DESC, name ASC
       LIMIT 30`
    );

    const occurrencesResult = await query(
      `WITH location_stats AS (
         SELECT
           COALESCE(NULLIF(TRIM(location), ''), 'Nao informado') AS location_name,
           COUNT(*)::int AS incidents
         FROM "ocorrencia"
         GROUP BY 1
       )
       SELECT
         o.id,
         COALESCE(NULLIF(TRIM(o.location), ''), 'Nao informado') AS bairro,
         o.title AS tipo,
         o.created_at,
         CASE
           WHEN ls.incidents >= 5 THEN 'danger'
           WHEN ls.incidents >= 2 THEN 'medium'
           ELSE 'safe'
         END AS risco
       FROM "ocorrencia" o
       INNER JOIN location_stats ls
         ON ls.location_name = COALESCE(NULLIF(TRIM(o.location), ''), 'Nao informado')
       ORDER BY o.created_at DESC
       LIMIT 50`
    );

    res.json({
      areas: areasResult.rows,
      occurrences: occurrencesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching mapa data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List Ocorrencias (user's own)
router.get('/', authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const result = await query('SELECT * FROM "ocorrencia" WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ocorrencias:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
