import { validateAuth } from './auth';
import { checkRateLimit, logRequest } from './middleware/rateLimit';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free';

export async function POST(req) {
  const startTime = Date.now();

  try {
    const auth = await validateAuth(req);
    if (!auth.valid) {
      logRequest(req, auth.code || 401, Date.now() - startTime);
      return new Response(JSON.stringify({ error: auth.error }), { status: auth.code || 401 });
    }

    const rateLimit = checkRateLimit(req);
    if (!rateLimit.allowed) {
      logRequest(req, 429, Date.now() - startTime);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
    }

    const { message } = await req.json();
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://seu-dominio.vercel.app',
        'X-Title': 'MoltBot Secure',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'Você é um assistente IA útil e seguro.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const aiResponse = await response.json();
    const botMessage = aiResponse.choices?.[0]?.message?.content || 'Sem resposta';

    logRequest(req, 200, Date.now() - startTime);

    return new Response(JSON.stringify({
      success: true,
      response: botMessage,
      timestamp: new Date().toISOString(),
      remaining: rateLimit.remaining,
    }), { status: 200 });

  } catch (error) {
    console.error('[ERROR]', error);
    logRequest(req, 500, Date.now() - startTime);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
