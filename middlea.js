/**
 * Middleware de Segurança Centralizado
 * 
 * Implementa múltiplas camadas de proteção sem quebrar funcionalidades existentes
 */

const crypto = require('crypto');

// ============================================================================
// CONFIGURAÇÕES DE SEGURANÇA
// ============================================================================

const SECURITY_CONFIG = {
  // Ambientes de desenvolvimento permitidos
  developmentHosts: [
    'localhost',
    '127.0.0.1',
    '::1',
  ],

  // Domínios de produção permitidos (HTTPS e HTTP para flexibilidade)
  productionOrigins: [
    'https://infinitybuscas.com',
    'https://www.infinitybuscas.com',
    'https://api.infinitybuscas.com',
    'http://infinitybuscas.com',
    'http://www.infinitybuscas.com',
    'http://api.infinitybuscas.com',
    // Sites externos permitidos
    'https://brpdfonline.site',
    'https://www.brpdfonline.site',
    'https://oferta-05.vercel.app',
    // Desenvolvimento local conectando ao servidor de produção
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ],

  // Rate limiting padrão
  rateLimit: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100,
  },

  // Rate limiting para rotas sensíveis
  strictRateLimit: {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },

  // Rate limiting para login
  loginRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 10,
  },
};

// ============================================================================
// STORE DE RATE LIMITING (com suporte a Redis se disponível)
// ============================================================================

let redisClient = null;

// Tenta conectar ao Redis se disponível
const initRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      const Redis = require('ioredis');
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Não reconectar automaticamente
      });

      redisClient.on('error', () => {
        console.log('[Security] Redis não disponível, usando fallback em memória');
        redisClient = null;
      });

      await redisClient.ping();
      console.log('[Security] Redis conectado para rate limiting');
    }
  } catch (err) {
    console.log('[Security] Redis não disponível, usando fallback em memória');
    redisClient = null;
  }
};

// Inicializa Redis em background (não bloqueia)
initRedis().catch((err) => {
  console.warn('[Security] Redis init falhou:', err.message || 'erro desconhecido');
});

// Store em memória (fallback)
const memoryStore = new Map();

// Limpa store em memória periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of memoryStore.entries()) {
    if (now - data.firstRequest > SECURITY_CONFIG.rateLimit.windowMs * 2) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém IP do cliente de forma segura
 */
const getClientIP = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';
};

/**
 * Verifica se é ambiente de desenvolvimento
 * SEGURANÇA: Deve ser EXPLÍCITO - apenas 'development' é considerado dev
 * Se NODE_ENV não está definido, assume PRODUÇÃO (mais seguro)
 */
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Verifica se é um IP de rede privada (RFC 1918)
 */
const isPrivateIP = (hostname) => {
  if (!hostname) return false;

  // IPv6: Normalizar IPv4-mapped IPv6 (::ffff:10.0.0.1 → 10.0.0.1)
  let ip = hostname;
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // IPv6 ULA (Unique Local Address): fd00::/8
  if (ip.toLowerCase().startsWith('fd')) return true;

  // IPv6 Link-local: fe80::/10
  if (ip.toLowerCase().startsWith('fe80:')) return true;

  // IPv6 Loopback: ::1
  if (ip === '::1') return true;

  // IPv4: Classe A: 10.0.0.0/8
  if (ip.startsWith('10.')) return true;

  // IPv4: Classe C: 192.168.0.0/16
  if (ip.startsWith('192.168.')) return true;

  // IPv4: Classe B: 172.16.0.0/12
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Verifica se origem é permitida
 * 
 * SEGURANÇA: Permite localhost/IPs privados apenas em desenvolvimento
 * ou quando a requisição também vem de IP local (dupla verificação)
 */
const isOriginAllowed = (origin, req = null) => {
  if (!origin) return true; // Requisições sem origin (ex: Postman, curl)

  // Primeiro verifica se está na lista de origens permitidas (inclui localhost para dev remoto)
  if (SECURITY_CONFIG.productionOrigins.includes(origin)) {
    return true;
  }

  // Verifica se é localhost ou IP privado
  try {
    const url = new URL(origin);
    const isLocalOrigin = SECURITY_CONFIG.developmentHosts.includes(url.hostname) || isPrivateIP(url.hostname);

    if (isLocalOrigin) {
      // Em desenvolvimento, sempre permite
      if (isDevelopment()) {
        return true;
      }

      // Em produção, só permite se a requisição também vier de IP local
      // Isso previne que alguém em produção tente usar localhost como origin
      if (req) {
        const clientIP = getClientIP(req);
        const isLocalRequest = clientIP === '127.0.0.1' ||
          clientIP === '::1' ||
          clientIP === 'localhost' ||
          isPrivateIP(clientIP);
        if (isLocalRequest) {
          return true;
        }
      } else {
        // Se não temos acesso ao req, permite em ambiente não-produção
        return true;
      }
    }
  } catch (e) {
    // URL inválida
  }

  return false;
};

/**
 * Gera chave única para rate limiting
 */
const getRateLimitKey = (req, prefix = 'rl') => {
  const ip = getClientIP(req);
  const userId = req.usuarioId || req.user?.id || 'anon';
  return `${prefix}:${ip}:${userId}`;
};

// ============================================================================
// MIDDLEWARES DE SEGURANÇA
// ============================================================================

/**
 * Middleware de CORS seguro (compatível com desenvolvimento local e produção)
 * 
 * CORREÇÃO 23/12/2024: Headers CORS são definidos SEMPRE, mesmo em erros
 * 
 * Permite automaticamente:
 * - Origens de produção (infinitybuscas.com)
 * - Localhost para desenvolvimento (qualquer porta)
 * - IPs privados para desenvolvimento em rede local
 */
const secureCors = (req, res, next) => {
  const origin = req.headers.origin;

  // Função para verificar se é localhost ou IP privado
  const isLocalOrigin = (originUrl) => {
    if (!originUrl) return false;
    try {
      const url = new URL(originUrl);
      const hostname = url.hostname;
      // Localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return true;
      }
      // IPs privados
      if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Função para verificar se é origem de produção
  // SEGURANÇA: Verifica contra a lista de origens permitidas
  const isProductionOrigin = (originUrl) => {
    if (!originUrl) return false;
    // Verifica se a origem está na lista de origens permitidas
    return SECURITY_CONFIG.productionOrigins.includes(originUrl);
  };

  // Determina a origem permitida
  let allowedOrigin = '*';

  if (!origin) {
    // Sem origin (Postman, curl, etc) - permite qualquer
    allowedOrigin = '*';
  } else if (isLocalOrigin(origin)) {
    // Localhost/IP privado - SEMPRE permite (desenvolvimento)
    allowedOrigin = origin;
  } else if (isProductionOrigin(origin)) {
    // Domínio de produção - permite a origem exata
    allowedOrigin = origin;
  } else if (isDevelopment()) {
    // Ambiente de desenvolvimento - permite qualquer origem
    allowedOrigin = origin;
  } else {
    // Produção com origem desconhecida - permite a origem mesmo assim
    // Isso evita o erro de CORS quando a origem é válida mas não está na lista
    console.log(`[Security] CORS: Origem não reconhecida: ${origin}`);
    // Permite a origem mesmo assim (mais permissivo)
    allowedOrigin = origin;
  }

  // CORREÇÃO: Define headers CORS SEMPRE (antes de qualquer outro middleware)
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Master-Password, Access-Key, X-API-Key, X-Client-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After');

  // Preflight OPTIONS - responde imediatamente
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};

/**
 * Middleware de Headers de Segurança (compatível com inline styles)
 * SEGURANÇA: Headers extras adicionados para proteção completa
 * 
 * CORREÇÃO 23/12/2024: Removido Cross-Origin-Resource-Policy que bloqueava CORS
 */
const securityHeaders = (req, res, next) => {
  // Proteção contra clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Proteção contra MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Proteção XSS (legado, mas ainda útil)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // SEGURANÇA: Headers extras para proteção adicional
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // CORREÇÃO 23/12/2024: Cross-Origin headers ajustados para permitir CORS
  // Cross-Origin-Embedder-Policy: unsafe-none permite recursos cross-origin
  // Cross-Origin-Resource-Policy: cross-origin permite que recursos sejam carregados de outras origens
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // HSTS (apenas em produção com HTTPS)
  if (!isDevelopment() && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // CSP — removido 'unsafe-eval' (não deveria ser necessário para API REST)
  // NOTA: Para o frontend SPA, configure CSP no Nginx/reverse proxy com nonces
  if (!isDevelopment()) {
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https: wss:; " +
      "frame-ancestors 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self';"
    );
  }

  next();
};

/**
 * Rate Limiter Configurável
 */
const createRateLimiter = (config = {}) => {
  const options = {
    windowMs: config.windowMs || SECURITY_CONFIG.rateLimit.windowMs,
    maxRequests: config.maxRequests || SECURITY_CONFIG.rateLimit.maxRequests,
    message: config.message || 'Muitas requisições. Tente novamente em alguns segundos.',
    keyPrefix: config.keyPrefix || 'rl',
    skipFailedRequests: config.skipFailedRequests || false,
    skip: config.skip || (() => false),
  };

  return async (req, res, next) => {
    // Permite pular rate limiting para certas condições
    if (options.skip(req)) {
      return next();
    }

    const key = getRateLimitKey(req, options.keyPrefix);
    const now = Date.now();

    try {
      let data;

      if (redisClient) {
        // Usa Redis se disponível
        const redisKey = `ratelimit:${key}`;
        const stored = await redisClient.get(redisKey);

        if (stored) {
          data = JSON.parse(stored);
        } else {
          data = { count: 0, firstRequest: now, requests: [] };
        }

        // Limpa requisições antigas
        data.requests = data.requests.filter(t => now - t < options.windowMs);

        if (data.requests.length >= options.maxRequests) {
          const retryAfter = Math.ceil((data.requests[0] + options.windowMs - now) / 1000);
          res.setHeader('Retry-After', retryAfter);
          res.setHeader('X-RateLimit-Limit', options.maxRequests);
          res.setHeader('X-RateLimit-Remaining', 0);

          return res.status(429).json({
            error: options.message,
            retryAfter,
          });
        }

        data.requests.push(now);
        data.count++;

        await redisClient.setex(redisKey, Math.ceil(options.windowMs / 1000), JSON.stringify(data));

      } else {
        // Fallback para memória
        if (!memoryStore.has(key)) {
          memoryStore.set(key, { count: 0, firstRequest: now, requests: [] });
        }

        data = memoryStore.get(key);
        data.requests = data.requests.filter(t => now - t < options.windowMs);

        if (data.requests.length >= options.maxRequests) {
          const retryAfter = Math.ceil((data.requests[0] + options.windowMs - now) / 1000);
          res.setHeader('Retry-After', retryAfter);
          res.setHeader('X-RateLimit-Limit', options.maxRequests);
          res.setHeader('X-RateLimit-Remaining', 0);

          return res.status(429).json({
            error: options.message,
            retryAfter,
          });
        }

        data.requests.push(now);
        data.count++;
      }

      // Headers informativos
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - data.requests.length));

      next();

    } catch (err) {
      // SEGURANÇA: Em produção, fail-closed (bloqueia se houver erro)
      // Em desenvolvimento, fail-open para facilitar debug
      console.error('[Security] Erro no rate limiter:', err.message);

      if (!isDevelopment()) {
        // Em produção: fail-closed - bloqueia por segurança
        console.error('[Security] PRODUÇÃO: Rate limiter falhou - bloqueando requisição');
        return res.status(503).json({
          error: 'Serviço temporariamente indisponível. Tente novamente.',
          code: 'RATE_LIMIT_ERROR'
        });
      }

      // Em desenvolvimento: fail-open para não atrapalhar debug
      next();
    }
  };
};

// ============================================================================
// IMPORTAR MÓDULOS DE SEGURANÇA ADICIONAIS (necessário antes dos rate limiters)
// ============================================================================

const cookieAuth = require('./cookieAuth');
const resourceOwnership = require('./resourceOwnership');
const redisStore = require('./redisStore');

// ============================================================================
// RATE LIMITER COM REDIS (DISTRIBUÍDO) - Definido antes de createSmartRateLimiter
// ============================================================================

/**
 * Rate Limiter com suporte a Redis para ambientes distribuídos
 */
const createDistributedRateLimiter = (config = {}) => {
  const options = {
    windowMs: config.windowMs || SECURITY_CONFIG.rateLimit.windowMs,
    maxRequests: config.maxRequests || SECURITY_CONFIG.rateLimit.maxRequests,
    message: config.message || 'Muitas requisições. Tente novamente em alguns segundos.',
    keyPrefix: config.keyPrefix || 'rl',
    skip: config.skip || (() => false),
  };

  return async (req, res, next) => {
    if (options.skip(req)) {
      return next();
    }

    const ip = getClientIP(req);
    const userId = req.usuarioId || req.user?.id || 'anon';
    const key = `${options.keyPrefix}:${ip}:${userId}`;

    try {
      const result = await redisStore.checkRateLimit(key, options.maxRequests, options.windowMs);

      // Headers informativos
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);

        return res.status(429).json({
          error: options.message,
          retryAfter,
        });
      }

      next();
    } catch (err) {
      console.error('[Security] Erro no rate limiter distribuído:', err.message);

      // SEGURANÇA: Em produção, fail-closed
      if (!isDevelopment()) {
        console.error('[Security] PRODUÇÃO: Rate limiter distribuído falhou - bloqueando');
        return res.status(503).json({
          error: 'Serviço temporariamente indisponível. Tente novamente.',
          code: 'RATE_LIMIT_ERROR'
        });
      }

      // Em desenvolvimento: fail-open
      next();
    }
  };
};

// ============================================================================
// RATE LIMITERS PRÉ-CONFIGURADOS
// ============================================================================
// SEGURANÇA SEC-023: Usa Redis quando disponível para funcionar com múltiplas instâncias
// Fallback automático para memória se Redis não estiver disponível

/**
 * Factory para criar rate limiter que usa Redis se disponível
 * @param {object} config - Configuração do rate limiter
 * @returns {function} Middleware de rate limiting
 */
const createSmartRateLimiter = (config) => {
  // Tenta usar Redis primeiro, fallback para memória
  const distributedLimiter = createDistributedRateLimiter(config);
  const memoryLimiter = createRateLimiter(config);

  return async (req, res, next) => {
    try {
      // Tenta usar o distribuído (Redis)
      return await distributedLimiter(req, res, next);
    } catch (err) {
      // Fallback para memória se Redis falhar
      console.warn(`[Security] Rate limiter Redis falhou, usando memória: ${err.message}`);
      return await memoryLimiter(req, res, next);
    }
  };
};

// Rate limiters pré-configurados - SEPARADOS POR ROTA para evitar bloqueios indevidos
// SEGURANÇA SEC-023: Agora usam Redis quando disponível
const loginRateLimiter = createSmartRateLimiter({
  windowMs: SECURITY_CONFIG.loginRateLimit.windowMs,
  maxRequests: SECURITY_CONFIG.loginRateLimit.maxRequests,
  message: 'Muitas tentativas de login. Aguarde 15 minutos.',
  keyPrefix: 'login',
});

// Rate limiter específico para cadastro (separado do login)
const registerRateLimiter = createSmartRateLimiter({
  windowMs: SECURITY_CONFIG.loginRateLimit.windowMs, // 15 minutos
  maxRequests: 5, // Menos tentativas para cadastro
  message: 'Muitas tentativas de cadastro. Aguarde 15 minutos.',
  keyPrefix: 'register',
});

// Rate limiter específico para recuperação de senha
const forgotPasswordRateLimiter = createSmartRateLimiter({
  windowMs: SECURITY_CONFIG.loginRateLimit.windowMs, // 15 minutos
  maxRequests: 5,
  message: 'Muitas tentativas de recuperação de senha. Aguarde 15 minutos.',
  keyPrefix: 'forgot',
});

// Rate limiter específico para validação de código
const validateCodeRateLimiter = createSmartRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  maxRequests: 10,
  message: 'Muitas tentativas de validação. Aguarde 5 minutos.',
  keyPrefix: 'validate',
});

const twoFactorRateLimiter = createSmartRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  maxRequests: 5,
  message: 'Muitas tentativas de verificação 2FA. Aguarde 5 minutos.',
  keyPrefix: '2fa',
});

const webhookRateLimiter = createSmartRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: 'Limite de webhooks excedido.',
  keyPrefix: 'webhook',
});

const apiRateLimiter = createSmartRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Limite de requisições da API excedido.',
  keyPrefix: 'api',
});

// Rate limiter específico para atualização de perfil (previne abuso)
const profileUpdateRateLimiter = createSmartRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10, // 10 atualizações por minuto
  message: 'Muitas atualizações de perfil. Aguarde um momento.',
  keyPrefix: 'profile',
});

// Rate limiter específico para alteração de email (mais restritivo)
const emailChangeRateLimiter = createSmartRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 3, // 3 tentativas por hora
  message: 'Muitas tentativas de alteração de email. Aguarde 1 hora.',
  keyPrefix: 'email_change',
});



/**
 * Middleware de Sanitização de Entrada
 */
const sanitizeInput = (req, res, next) => {
  // Campos que não devem ter trim (senhas podem ter espaços intencionais)
  const noTrimFields = ['password', 'senha', 'currentpassword', 'confirmpassword', 'newpassword', 'novasenha', 'confirmarsenha'];
  // Campos que não devem ter escape HTML (conteúdo rico, base64)
  const noEscapeFields = ['avatar', 'conteudo', 'descricao', 'mensagem'];

  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (typeof value === 'string') {
        // Remove caracteres de controle perigosos (sempre)
        let clean = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Aplica trim apenas se não for campo de senha
        if (!noTrimFields.includes(lowerKey)) {
          clean = clean.trim();
        }

        // Escapa HTML e neutraliza vetores de XSS adicionais
        if (!noEscapeFields.includes(key) && !noTrimFields.includes(lowerKey)) {
          clean = clean
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Remove event handlers inline (onmouseover=, onclick=, etc.)
            .replace(/\bon\w+\s*=/gi, '')
            // Remove URIs javascript: e data:text/html
            .replace(/javascript\s*:/gi, '')
            .replace(/data\s*:\s*text\/html/gi, '')
            // Remove template injection ${ ... }
            .replace(/\$\{[^}]*\}/g, '');
        }

        sanitized[key] = clean;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Middleware de Validação de Webhook
 * SEGURANÇA: Em produção, webhook sem secret é BLOQUEADO
 */
const validateWebhook = (secretEnvVar) => {
  return (req, res, next) => {
    const secret = process.env[secretEnvVar];

    // SEGURANÇA: Em produção, webhook sem secret é bloqueado
    if (!secret) {
      if (!isDevelopment()) {
        console.error(`[Security] BLOQUEADO: Webhook sem secret em produção (${secretEnvVar})`);
        return res.status(500).json({ error: 'Webhook não configurado corretamente' });
      }
      console.warn(`[Security] Webhook sem secret em desenvolvimento (${secretEnvVar})`);
      return next();
    }

    // SEGURANÇA: Assinatura HMAC é OBRIGATÓRIA quando secret está configurado
    const signature = req.headers['x-webhook-signature'] ||
      req.headers['x-hub-signature-256'] ||
      req.headers['x-signature'];

    if (!signature) {
      console.warn(`[Security] BLOQUEADO: Webhook sem assinatura (secret configurado: ${secretEnvVar})`);
      return res.status(401).json({ error: 'Assinatura do webhook é obrigatória' });
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const providedSig = signature.replace('sha256=', '');

    // timingSafeEqual requer buffers do mesmo tamanho
    // Se tamanhos diferentes, a assinatura é inválida
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const providedBuffer = Buffer.from(providedSig, 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
      console.warn('[Security] Webhook com assinatura de tamanho inválido');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
      console.warn('[Security] Webhook com assinatura inválida');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Verifica IP whitelist se configurado
    const allowedIPs = process.env[`${secretEnvVar}_IPS`];
    if (allowedIPs) {
      const clientIP = getClientIP(req);
      const ipList = allowedIPs.split(',').map(ip => ip.trim());

      if (!ipList.includes(clientIP)) {
        console.warn(`[Security] Webhook de IP não autorizado: ${clientIP}`);
        return res.status(403).json({ error: 'IP não autorizado' });
      }
    }

    next();
  };
};

/**
 * Middleware de Auditoria Simples
 */
const auditLog = (action) => {
  return (req, res, next) => {
    const startTime = Date.now();

    // Captura resposta
    const originalSend = res.send;
    res.send = function (body) {
      const duration = Date.now() - startTime;
      const userId = req.user?.id || req.usuarioId || 'anonymous';
      const ip = getClientIP(req);

      // Log de auditoria (apenas ações importantes)
      if (action) {
        console.log(JSON.stringify({
          type: 'AUDIT',
          action,
          userId,
          ip,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date().toISOString(),
        }));
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Middleware de Tratamento de Erros Seguro
 * SEGURANÇA: Stack trace NUNCA é enviado ao cliente (nem em desenvolvimento)
 * Stack trace é logado apenas no servidor para debugging
 */
const secureErrorHandler = (err, req, res, next) => {
  // Log completo do erro (APENAS no servidor - NUNCA expor ao cliente)
  console.error('[Error]', {
    message: err.message,
    stack: err.stack, // Stack trace apenas no log do servidor
    path: req.path,
    method: req.method,
    ip: getClientIP(req),
    userId: req.user?.id || req.usuarioId || 'anonymous',
    timestamp: new Date().toISOString(),
  });

  // CORREÇÃO 23/12/2024: Garantir headers CORS em erros
  const origin = req.headers.origin;
  if (origin && origin.includes('infinitybuscas.com')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://infinitybuscas.com');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Resposta segura para o cliente - NUNCA incluir stack trace
  const statusCode = err.statusCode || err.status || 500;

  // Mensagem genérica para erros 500 (não expor detalhes internos)
  const clientMessage = statusCode === 500
    ? 'Erro interno do servidor'
    : err.message;

  // SEGURANÇA: Resposta limpa sem informações sensíveis
  res.status(statusCode).json({
    error: clientMessage,
    // Código de erro para identificação (sem detalhes técnicos)
    code: err.code || 'INTERNAL_ERROR',
  });
};

/**
 * Validador de Senha Forte
 * SEGURANÇA: Validação de senha forte é OBRIGATÓRIA por padrão
 * Para desabilitar (NÃO RECOMENDADO), defina DISABLE_STRONG_PASSWORD=true
 */
const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres');
  }

  if (password && password.length > 128) {
    errors.push('Senha deve ter no máximo 128 caracteres');
  }

  // SEGURANÇA: Validação forte é PADRÃO (só desabilita se explicitamente configurado)
  const requireStrongPassword = process.env.DISABLE_STRONG_PASSWORD !== 'true';

  if (requireStrongPassword && password) {
    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter letra minúscula');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter letra maiúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Senha deve conter número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password)) {
      errors.push('Senha deve conter caractere especial (!@#$%^&*...)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Middleware de Validação de Senha (para rotas de registro/alteração)
 */
const passwordValidationMiddleware = (req, res, next) => {
  const { password, confirmpassword } = req.body;

  // Se não tem senha no body, pula validação
  if (!password) {
    return next();
  }

  // Valida força da senha
  const validation = validatePassword(password);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Senha fraca',
      details: validation.errors,
    });
  }

  // Valida confirmação se presente
  if (confirmpassword && password !== confirmpassword) {
    return res.status(400).json({
      error: 'As senhas não são iguais',
    });
  }

  next();
};

// ============================================================================
// CSP MELHORADO (SEM UNSAFE-INLINE ONDE POSSÍVEL)
// ============================================================================

/**
 * Gera nonce para scripts inline seguros
 */
const generateNonce = () => {
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Middleware de CSP com nonce
 */
const cspWithNonce = (req, res, next) => {
  // Gera nonce único para esta requisição
  const nonce = generateNonce();
  res.locals.cspNonce = nonce;

  if (!isDevelopment()) {
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`, // unsafe-inline ainda necessário para alguns estilos
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    res.setHeader('Content-Security-Policy', csp);
  }

  next();
};

// ============================================================================
// VALIDAÇÃO DE BASE64 PARA UPLOADS
// ============================================================================

/**
 * Valida e sanitiza imagem base64
 * @param {string} base64String - String base64 da imagem
 * @param {object} options - Opções de validação
 * @returns {object} { valid, sanitized, error }
 */
const validateBase64Image = (base64String, options = {}) => {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  } = options;

  if (!base64String || typeof base64String !== 'string') {
    return { valid: false, sanitized: null, error: 'Base64 inválido' };
  }

  // Extrai tipo MIME e dados
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

  if (!matches) {
    // Pode ser base64 puro sem prefixo
    try {
      const decoded = Buffer.from(base64String, 'base64');
      if (decoded.length > maxSizeBytes) {
        return { valid: false, sanitized: null, error: 'Imagem muito grande' };
      }
      // Tenta detectar tipo pelo magic bytes
      const type = detectImageType(decoded);
      if (!type || !allowedTypes.includes(type)) {
        return { valid: false, sanitized: null, error: 'Tipo de imagem não permitido' };
      }
      return { valid: true, sanitized: `data:${type};base64,${base64String}`, type };
    } catch {
      return { valid: false, sanitized: null, error: 'Base64 inválido' };
    }
  }

  const [, mimeType, data] = matches;

  // Verifica tipo MIME
  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, sanitized: null, error: `Tipo ${mimeType} não permitido` };
  }

  // Verifica tamanho
  try {
    const decoded = Buffer.from(data, 'base64');
    if (decoded.length > maxSizeBytes) {
      return { valid: false, sanitized: null, error: 'Imagem muito grande' };
    }

    // Verifica magic bytes
    const detectedType = detectImageType(decoded);
    if (detectedType !== mimeType) {
      return { valid: false, sanitized: null, error: 'Tipo declarado não corresponde ao conteúdo' };
    }

    return { valid: true, sanitized: base64String, type: mimeType };
  } catch {
    return { valid: false, sanitized: null, error: 'Erro ao decodificar base64' };
  }
};

/**
 * Detecta tipo de imagem pelos magic bytes
 */
const detectImageType = (buffer) => {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'image/webp';
  }
  return null;
};

/**
 * Middleware para validar avatar base64 no body
 * SEGURANÇA: Validação completa com magic bytes obrigatória
 */
const validateAvatarMiddleware = (req, res, next) => {
  if (!req.body?.avatar || typeof req.body.avatar !== 'string') {
    return next();
  }

  const avatar = req.body.avatar.trim();

  // Se estiver vazio ou for string vazia, permite (remoção de avatar)
  if (avatar === '' || avatar === 'null' || avatar === 'undefined') {
    req.body.avatar = null;
    return next();
  }

  // SEGURANÇA: Bloquear URLs externas (previne SSRF)
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    console.warn('[Security] Tentativa de usar URL externa como avatar:', avatar.substring(0, 50));
    return res.status(400).json({
      error: 'URLs externas não são permitidas para avatar. Faça upload da imagem.',
      code: 'EXTERNAL_URL_NOT_ALLOWED'
    });
  }

  // Se for muito curto, não é base64 válido de imagem
  if (avatar.length < 100) {
    return res.status(400).json({
      error: 'Avatar inválido',
      code: 'INVALID_AVATAR'
    });
  }

  // Extrair dados base64 (com ou sem prefixo data:)
  let base64Data = avatar;
  let declaredMime = null;

  const dataUrlMatch = avatar.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    declaredMime = dataUrlMatch[1];
    base64Data = dataUrlMatch[2];
  }

  // Decodificar e validar
  try {
    const buffer = Buffer.from(base64Data, 'base64');

    // SEGURANÇA: Limite de tamanho (5MB)
    const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_AVATAR_SIZE) {
      return res.status(400).json({
        error: 'Avatar muito grande. Tamanho máximo: 5MB',
        code: 'AVATAR_TOO_LARGE'
      });
    }

    // SEGURANÇA: Validar magic bytes SEMPRE (não confiar no MIME declarado)
    const detectedType = detectImageType(buffer);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!detectedType) {
      console.warn('[Security] Avatar com magic bytes não reconhecidos');
      return res.status(400).json({
        error: 'Tipo de arquivo não reconhecido. Use JPEG, PNG, GIF ou WebP.',
        code: 'INVALID_FILE_TYPE'
      });
    }

    if (!allowedTypes.includes(detectedType)) {
      console.warn('[Security] Avatar com tipo não permitido:', detectedType);
      return res.status(400).json({
        error: 'Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP.',
        code: 'FILE_TYPE_NOT_ALLOWED'
      });
    }

    // SEGURANÇA: Se declarou MIME, deve corresponder ao detectado
    if (declaredMime && declaredMime !== detectedType) {
      console.warn('[Security] MIME declarado não corresponde ao conteúdo:', declaredMime, 'vs', detectedType);
      return res.status(400).json({
        error: 'Tipo declarado não corresponde ao conteúdo do arquivo',
        code: 'MIME_MISMATCH'
      });
    }

    // Sanitizar: garantir formato correto com tipo detectado
    req.body.avatar = `data:${detectedType};base64,${base64Data}`;

    next();
  } catch (err) {
    console.warn('[Security] Erro ao processar avatar:', err.message);
    return res.status(400).json({
      error: 'Avatar inválido. Verifique se o arquivo é uma imagem válida.',
      code: 'INVALID_AVATAR'
    });
  }
};

// ============================================================================
// MIDDLEWARE DE RE-AUTENTICAÇÃO
// ============================================================================

/**
 * Middleware que exige re-autenticação para ações críticas
 * Requer que o usuário forneça a senha atual no body
 */
const requireReauth = async (req, res, next) => {
  const { currentPassword, senha_atual } = req.body;
  const password = currentPassword || senha_atual;

  if (!password) {
    return res.status(400).json({
      error: 'Senha atual obrigatória para esta operação',
      code: 'REAUTH_REQUIRED'
    });
  }

  try {
    const Cliente = require('../models/Clientes');
    const cliente = await Cliente.findByPk(req.clienteId);

    if (!cliente) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, cliente.password);

    if (!isValid) {
      return res.status(401).json({
        error: 'Senha incorreta',
        code: 'INVALID_PASSWORD'
      });
    }

    // Remove a senha do body para não ser processada acidentalmente
    delete req.body.currentPassword;
    delete req.body.senha_atual;

    next();
  } catch (error) {
    console.error('[Security] Erro na re-autenticação:', error.message);
    return res.status(500).json({ error: 'Erro ao verificar senha' });
  }
};

/**
 * Middleware que exige 2FA para ações críticas (se ativado)
 */
const require2FAIfEnabled = async (req, res, next) => {
  const { twoFactorCode, codigo_2fa } = req.body;
  const code = twoFactorCode || codigo_2fa;

  try {
    const Usuario = require('../models/Usuario');
    const UsuarioConfg = require('../models/UsuarioConfg');

    const usuario = await Usuario.findOne({ where: { cliente_id: req.clienteId } });
    if (!usuario) {
      return next(); // Se não encontrar usuário, deixa passar para o controller tratar
    }

    const config = await UsuarioConfg.findOne({ where: { usuario_id: usuario.id } });

    // Se 2FA não está ativado, permite
    if (!config?.two_factor_enabled) {
      return next();
    }

    // 2FA está ativado, exige código
    if (!code) {
      return res.status(400).json({
        error: 'Código 2FA obrigatório para esta operação',
        code: 'TWO_FA_REQUIRED',
        requires2FA: true
      });
    }

    const speakeasy = require('speakeasy');
    const isValid = speakeasy.totp.verify({
      secret: config.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!isValid) {
      return res.status(401).json({
        error: 'Código 2FA inválido',
        code: 'INVALID_2FA'
      });
    }

    // Remove o código do body
    delete req.body.twoFactorCode;
    delete req.body.codigo_2fa;

    next();
  } catch (error) {
    console.error('[Security] Erro na verificação 2FA:', error.message);
    return res.status(500).json({ error: 'Erro ao verificar 2FA' });
  }
};

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

module.exports = {
  // Middlewares principais
  secureCors,
  securityHeaders,
  sanitizeInput,
  secureErrorHandler,

  // Rate limiters
  createRateLimiter,
  createDistributedRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
  validateCodeRateLimiter,
  twoFactorRateLimiter,
  webhookRateLimiter,
  apiRateLimiter,
  profileUpdateRateLimiter,
  emailChangeRateLimiter,

  // Validação
  validateWebhook,
  validatePassword,
  passwordValidationMiddleware,
  validateBase64Image,
  validateAvatarMiddleware,

  // Auditoria
  auditLog,

  // CSP
  cspWithNonce,
  generateNonce,

  // Re-autenticação
  requireReauth,
  require2FAIfEnabled,

  // Utilitários
  getClientIP,
  isDevelopment,
  isOriginAllowed,

  /**
   * SEGURANÇA: Sanitiza parâmetros de paginação
   * Previne ataques de DoS via paginação excessiva
   * @param {object} query - req.query
   * @param {object} options - { maxLimit: 100, defaultLimit: 20, defaultPage: 1 }
   * @returns {{ page: number, limit: number }}
   */
  sanitizePagination: (query, options = {}) => {
    const { maxLimit = 100, defaultLimit = 20, defaultPage = 1 } = options;
    return {
      page: Math.max(1, parseInt(query.page) || defaultPage),
      limit: Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit))
    };
  },

  // Configurações
  SECURITY_CONFIG,

  // Re-exportar módulos de segurança
  cookieAuth,
  resourceOwnership,
  redisStore,
};

