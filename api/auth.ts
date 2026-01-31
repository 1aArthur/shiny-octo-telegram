import jwt from 'jsonwebtoken';

const AUTH_SECRET = process.env.AUTH_SECRET || '';
const IP_ALLOWLIST = (process.env.IP_ALLOWLIST || '').split(',').map(ip => ip.trim());

export async function validateAuth(req) {
  const clientIp = req.headers?.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  
  if (!IP_ALLOWLIST.includes(clientIp)) {
    console.error(`[SECURITY] Blocked unauthorized IP: ${clientIp}`);
    return { valid: false, error: 'IP not allowed', code: 403 };
  }

  const authHeader = req.headers?.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing Bearer token', code: 401 };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, AUTH_SECRET);
    return { valid: true, payload: decoded, clientIp };
  } catch (error) {
    return { valid: false, error: 'Invalid token', code: 401 };
  }
}

export function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(
    { ...payload, iat: Math.floor(Date.now() / 1000) },
    AUTH_SECRET,
    { expiresIn, algorithm: 'HS256' }
  );
}
