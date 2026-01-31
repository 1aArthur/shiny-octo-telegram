const RATE_LIMIT = 30;
const TIME_WINDOW = 60 * 1000;
const clients = new Map();

export function checkRateLimit(req) {
  const clientIp = req.headers?.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  
  let clientData = clients.get(clientIp);
  
  if (!clientData || now > clientData.resetTime) {
    clients.set(clientIp, { count: 1, resetTime: now + TIME_WINDOW, violations: 0 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (clientData.count >= RATE_LIMIT) {
    clientData.violations++;
    console.error(`[ALERT] Rate limit exceeded for IP ${clientIp}`);
    return { allowed: false, remaining: 0 };
  }

  clientData.count++;
  return { allowed: true, remaining: RATE_LIMIT - clientData.count };
}

export function logRequest(req, status, duration) {
  const clientIp = req.headers?.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const timestamp = new Date().toISOString();
  const endpoint = new URL(req.url).pathname;
  console.log(`[${timestamp}] ${clientIp} | ${req.method} ${endpoint} | Status: ${status} | ${duration}ms`);
}
