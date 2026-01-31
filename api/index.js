// Vercel Serverless Function Router
// Automatically routes to the correct handler based on path

export { POST as POST_moltbot } from './moltbot';
export { POST as POST_rotateKeys } from './rotate-keys';

// Default export for any direct access
export default async function handler(req, res) {
  // Route to appropriate handler
  if (req.method === 'POST' && req.url?.includes('/moltbot')) {
    const { POST } = await import('./moltbot');
    return POST(req);
  }
  
  if (req.method === 'POST' && req.url?.includes('/rotate-keys')) {
    const { POST } = await import('./rotate-keys');
    return POST(req);
  }
  
  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}
