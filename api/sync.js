import { Redis } from '@upstash/redis';

const allowed = /^[a-zA-Z0-9_-]{4,48}$/;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  const key = String(req.query.key || '').trim();

  if (!allowed.test(key)) {
    return res.status(400).json({ ok: false, error: 'Use uma chave de sync com 4 a 48 letras, numeros, _ ou -.' });
  }

  const storageKey = `letsgo:${key}`;

  try {
    if (req.method === 'GET') {
      const data = await redis.get(storageKey);
      return res.status(200).json({ ok: true, data: data || null });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
      await redis.set(storageKey, {
        updatedAt: new Date().toISOString(),
        payload: body?.payload || {},
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Metodo nao permitido.' });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      error: 'Sincronizacao indisponivel. Conecte o Vercel KV/Redis ao projeto e redeploy.',
    });
  }
}
