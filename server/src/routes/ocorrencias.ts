import { Router, type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = Router();

const ALLOWED_TYPES = ['error', 'warning'] as const;
type OccurrenceType = (typeof ALLOWED_TYPES)[number];

const isValidType = (value: unknown): value is OccurrenceType =>
  typeof value === 'string' && ALLOWED_TYPES.includes(value as OccurrenceType);

const isValidLatitude = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;

const isValidLongitude = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;

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
  const { title, description, location, type, latitude, longitude } = req.body;
  const userId = req.user.id;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  if (type !== undefined && !isValidType(type)) {
    return res.status(400).json({ error: "Type must be 'error' or 'warning'" });
  }

  if (latitude !== undefined && latitude !== null && !isValidLatitude(latitude)) {
    return res.status(400).json({ error: 'Invalid latitude' });
  }

  if (longitude !== undefined && longitude !== null && !isValidLongitude(longitude)) {
    return res.status(400).json({ error: 'Invalid longitude' });
  }

  try {
    const result = await query(
      `INSERT INTO "ocorrencia" (user_id, title, description, location, type, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        title,
        description,
        location ?? null,
        type ?? 'error',
        latitude ?? null,
        longitude ?? null,
      ]
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
         o.type,
         o.latitude,
         o.longitude,
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
         latitude,
         longitude,
         CASE
           WHEN incidents >= 5 THEN 'danger'
           WHEN incidents >= 2 THEN 'medium'
           ELSE 'safe'
         END AS risk
       FROM (
         SELECT
           COALESCE(NULLIF(TRIM(location), ''), 'Nao informado') AS location_name,
           COUNT(*)::int AS incidents,
           AVG(latitude)::float AS latitude,
           AVG(longitude)::float AS longitude
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
         o.type,
         o.latitude,
         o.longitude,
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

// List all Ocorrencias for the authenticated user
router.get('/', authenticateToken, async (req: any, res: Response) => {
  const filter = req.query.filter as string | undefined;

  try {
    let result;
    if (filter) {
      result = await query(
        `SELECT *
         FROM "ocorrencia"
         WHERE user_id = $1
           AND (title ILIKE $2 OR description ILIKE $2)
         ORDER BY created_at DESC`,
        [req.user.id, `%${filter}%`]
      );
    } else {
      result = await query(
        `SELECT *
         FROM "ocorrencia"
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ocorrencias:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List nearby Ocorrencias for the Proximas tab
router.get('/proximas', authenticateToken, async (req: any, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = req.query.radius !== undefined ? Number(req.query.radius) : 1000;
  const filter = req.query.filter as string | undefined;

  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return res.status(400).json({ error: 'Valid lat and lng query params are required' });
  }

  if (!Number.isFinite(radius) || radius <= 0) {
    return res.status(400).json({ error: 'radius must be a positive number (meters)' });
  }

  try {
    let queryString = `
      SELECT *
      FROM (
        SELECT
          *,
          (
            6371000 * acos(
              LEAST(
                1.0,
                cos(radians($1::float8)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2::float8)) +
                sin(radians($1::float8)) * sin(radians(latitude))
              )
            )
          ) AS distance
        FROM "ocorrencia"
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ) sub
      WHERE distance <= $3
    `;
    const params: any[] = [lat, lng, radius];

    if (filter) {
      queryString += ` AND (title ILIKE $4 OR description ILIKE $4)`;
      params.push(`%${filter}%`);
    }

    queryString += ` ORDER BY distance ASC`;

    const result = await query(queryString, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching nearby ocorrencias:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
