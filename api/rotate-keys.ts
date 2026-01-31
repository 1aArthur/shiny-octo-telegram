import crypto from 'crypto';

export async function POST(req) {
  const secret = req.headers?.get('x-rotation-secret');
  
  if (secret !== process.env.ROTATION_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const newKey = crypto.randomBytes(32).toString('hex');
  const timestamp = new Date().toISOString();

  console.log(`[KEY_ROTATION] ${timestamp} - Nova chave gerada`);

  return new Response(JSON.stringify({
    success: true,
    message: 'Key rotation initiated',
    timestamp,
  }), { status: 200 });
}
