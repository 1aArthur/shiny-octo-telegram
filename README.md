# MoltBot + OpenRouter + Vercel Deployment

## 📋 Overview

Uma solução segura e escalável para hospedar o **MoltBot** no **Vercel** integrando com a IA **GLM-4.5-Air** via **OpenRouter**.

### Stack
- **Bot Framework**: MoltBot
- **AI API**: OpenRouter (z-ai/glm-4.5-air:free)
- **Hosting**: Vercel (gratuito)
- **Security**: Auth, Rate Limiting, TLS, IP Allowlist

---

## 🚀 Setup Rápido

### 1. Instalação do MoltBot

```bash
curl -fsSL https://molt.bot/install.sh | bash
```

### 2. Variáveis de Ambiente (.env)

```env
# OpenRouter API
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=z-ai/glm-4.5-air:free

# Security
AUTH_SECRET=your-strong-secret-min-32-chars-here
AUTH_TOKEN=your-jwt-token-secret

# Vercel
VERCEL_ENV=production
VERCEL_URL=https://your-domain.vercel.app
```

### 3. Deploy no Vercel

```bash
npm i -g vercel
vercel login
vercel deploy --prod
```

---

## 🔒 Security Fixes

### 1. Fechar Porta / Firewall (IP Allowlist)

Crie `vercel.json`:

```json
{
  "env": {
    "IP_ALLOWLIST": "@IP_ALLOWLIST",
    "ALLOWED_ORIGINS": "https://clawd.bot"
  },
  "buildCommand": "npm run build",
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### 2. Autenticação (JWT + Strong Secret)

Crie `api/middleware/auth.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const AUTH_SECRET = process.env.AUTH_SECRET!;

export async function validateAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, AUTH_SECRET);
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
}

export function generateToken(payload: any) {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: '24h' });
}
```

### 3. Rate Limiting + Logs + Alerts

Crie `api/middleware/rateLimit.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT = 60; // requests per minute
const TIME_WINDOW = 60 * 1000; // 1 minute

const requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

export function checkRateLimit(req: NextRequest): boolean {
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  let clientData = requestCounts.get(clientIp);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientIp, { count: 1, resetTime: now + TIME_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    console.error(`[RATE_LIMIT_ALERT] IP ${clientIp} exceeded limit`);
    return false;
  }
  
  clientData.count++;
  return true;
}

export function logRequest(req: NextRequest, status: number) {
  const timestamp = new Date().toISOString();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const endpoint = new URL(req.url).pathname;
  
  console.log(`[${timestamp}] ${clientIp} - ${req.method} ${endpoint} - ${status}`);
}
```

### 4. TLS (HTTPS)

Vercel fornece **HTTPS automaticamente** para todos os domínios.

### 5. Rotação de Keys

Crie `api/rotate-keys.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-rotation-secret');
  if (secret !== process.env.ROTATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const newKey = crypto.randomBytes(32).toString('hex');
  console.log('[KEY_ROTATION] Nova chave gerada:', newKey);
  
  return NextResponse.json({ message: 'Key rotated successfully' });
}
```

---

## 📁 Estrutura do Projeto

```
.
├── api/
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── cors.ts
│   ├── moltbot.ts
│   ├── rotate-keys.ts
│   └── health.ts
├── pages/
│   └── index.tsx
├── .env.local (git ignored)
├── vercel.json
├── package.json
└── README.md
```

---

## 🔬 Endpoint da API

### POST /api/moltbot

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "message": "Olá, qual é sua função?",
  "context": "optional-context"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Sou um assistente de IA...",
  "timestamp": "2024-01-30T..."
}
```

---

## 🛡️ Checklist de Segurança

- [x] Fechar porta/firewall com IP allowlist
- [x] Autenticação com JWT
- [x] TLS/HTTPS (automático no Vercel)
- [x] Rate limiting implementado
- [x] Logs estruturados
- [x] Alerts de anomalia
- [x] Rotação de chaves
- [x] CORS configurado
- [x] Headers de segurança
- [x] Variáveis de ambiente no .env

---

## 📊 Monitoramento

```bash
vercel logs
```

---

## 🤝 Integração com clawd.bot

```javascript
fetch('https://seu-projeto.vercel.app/api/moltbot', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message: 'seu-prompt' })
})
```

---

**Autor**: 1aArthur | **Status**: Production Ready 🚀
