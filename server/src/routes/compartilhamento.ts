import { Router, type Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from './ocorrencias.js';

const router = Router();

const isValidLatitude = (n: any) => typeof n === 'number' && Number.isFinite(n) && n >= -90 && n <= 90;
const isValidLongitude = (n: any) => typeof n === 'number' && Number.isFinite(n) && n >= -180 && n <= 180;

// Compartilhar localizacao com os contatos emergenciais por SMS (refs #82)
// O envio do SMS em si e feito pelo app (expo-sms). Aqui registramos o
// compartilhamento, buscamos os contatos emergenciais e montamos a mensagem.
router.post('/', authenticateToken, async (req: any, res: Response) => {
  const { latitude, longitude } = req.body;
  const userId = req.user.id;

  if (!isValidLatitude(latitude)) {
    return res.status(400).json({ error: 'Invalid latitude' });
  }
  if (!isValidLongitude(longitude)) {
    return res.status(400).json({ error: 'Invalid longitude' });
  }

  try {
    const contatos = await query(
      'SELECT id, name, phone FROM "contatos" WHERE user_id = $1 AND emergencial = true LIMIT 20',
      [userId]
    );

    if (contatos.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum contato emergencial cadastrado' });
    }

    const location = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const body =
      `📍 Estou compartilhando minha localização com você pelo ElaSegura.\n\n` +
      `Veja onde estou agora:\n${mapsUrl}\n\n` +
      `— Enviado pelo ElaSegura 💜`;

    await query(
      'INSERT INTO "compartilhamento" (user_id, latitude, longitude, location) VALUES ($1, $2, $3, $4)',
      [userId, latitude, longitude, location]
    );

    res.status(201).json({
      message: 'Localização pronta para compartilhar',
      contatos: contatos.rows,
      body,
      mapsUrl,
    });
  } catch (error) {
    console.error('Error sharing location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
