import { Router, type Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from './ocorrencias.js';

const router = Router();

// Create Contato
router.post('/', authenticateToken, async (req: any, res: Response) => {
  const { name, phone } = req.body;
  const userId = req.user.id;

  try {
    const result = await query(
      'INSERT INTO "contatos" (user_id, name, phone) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contato:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List Contatos
router.get('/', authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const result = await query('SELECT * FROM "contatos" WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contatos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
