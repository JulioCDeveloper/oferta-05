require("dotenv").config();

// ============================================================================
// FORÇAR IPv4 GLOBALMENTE - Resolver ETIMEDOUT em IPv6
// ============================================================================
const dns = require('dns');

// Força DNS a retornar IPv4 primeiro (Node.js 17+)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
  console.log('✅ DNS configurado para IPv4 first');
}

// Força IPv4 em todas as requisições HTTP/HTTPS (fallback para versões antigas)
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  // Se options for uma função, é o callback (sem options)
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  // Forçar family: 4 (IPv4)
  options = options || {};
  options.family = 4;
  options.verbatim = false; // Retornar IPv4 primeiro

  return originalLookup.call(this, hostname, options, callback);
};

console.log('✅ DNS lookup global configurado para IPv4 only');

const crypto = require("crypto");
const express = require("express");
// const cors = require("cors"); // Substituído por secureCors do middleware de segurança
const http = require("http"); // Importar o módulo HTTP
const { Server } = require("socket.io"); // Importar o servidor do socket.io

// ============================================================================
// VALIDAÇÃO DE SEGURANÇA NO STARTUP
// ============================================================================

/**
 * Valida a entropia e qualidade do JWT_SECRET
 * @param {string} secret - O segredo JWT a ser validado
 * @returns {object} { valid: boolean, errors: string[], warnings: string[] }
 */
const validateJwtSecret = (secret) => {
  const errors = [];
  const warnings = [];

  if (!secret) {
    errors.push('JWT_SECRET não está configurada');
    return { valid: false, errors, warnings };
  }

  // Verificar tamanho mínimo
  if (secret.length < 64) {
    errors.push(`JWT_SECRET muito curta: ${secret.length} caracteres (mínimo: 64)`);
  }

  // Verificar padrões fracos comuns
  const weakPatterns = [
    'secret', 'jwt', 'password', 'token', 'key', 'admin',
    '123456', 'qwerty', 'abc123', 'letmein', 'welcome',
    'infinity', 'buscas', 'default', 'changeme', 'test'
  ];

  const lowerSecret = secret.toLowerCase();
  for (const pattern of weakPatterns) {
    if (lowerSecret.includes(pattern)) {
      errors.push(`JWT_SECRET contém padrão fraco: "${pattern}"`);
    }
  }

  // Verificar entropia mínima (caracteres únicos)
  // Hexadecimal tem apenas 16 caracteres possíveis (0-9, a-f), então 16 é o máximo para hex puro
  const uniqueChars = new Set(secret).size;
  const minUniqueChars = 10; // Reduzido para ser compatível com chaves hexadecimais

  if (uniqueChars < minUniqueChars) {
    errors.push(`JWT_SECRET tem baixa entropia: ${uniqueChars} caracteres únicos (mínimo: ${minUniqueChars})`);
  }

  // Verificar se parece com um segredo gerado aleatoriamente (hex ou base64)
  const isHexLike = /^[a-f0-9]+$/i.test(secret);
  const isBase64Like = /^[a-zA-Z0-9+/=]+$/.test(secret);

  if (!isHexLike && !isBase64Like) {
    warnings.push('JWT_SECRET não parece ser gerada aleatoriamente. Considere usar: crypto.randomBytes(64).toString("hex")');
  }

  // Verificar se contém apenas caracteres repetidos
  if (/^(.)\1+$/.test(secret)) {
    errors.push('JWT_SECRET contém apenas caracteres repetidos');
  }

  // Verificar sequências óbvias
  if (/^(0123|1234|abcd|qwer)/i.test(secret)) {
    errors.push('JWT_SECRET começa com sequência óbvia');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      length: secret.length,
      uniqueChars,
      isHexLike,
      isBase64Like
    }
  };
};

// ============================================================================
// AUTO-DETECT ENVIRONMENT (localhost vs produção)
// ============================================================================
const os = require('os');
const autoDetectEnvironment = () => {
  // 1. Se NODE_ENV está explicitamente definido, respeita
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  // 2. Detecta pelo hostname do servidor
  const hostname = os.hostname().toLowerCase();
  const productionHostnames = ['infinitybuscas', 'api-server', 'vps', 'srv', 'prod'];
  if (productionHostnames.some(h => hostname.includes(h))) {
    return 'production';
  }

  // 3. Detecta pelo OS — servidores Linux sem display = provável produção
  if (os.platform() === 'linux' && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) {
    // Verifica se está rodando como serviço (PM2, systemd)
    if (process.env.PM2_HOME || process.env.pm_id !== undefined || process.ppid === 1) {
      return 'production';
    }
  }

  // 4. Detecta pela presença de portas de produção
  if (process.env.PORT === '8081' || process.env.PORT === '8002') {
    return 'production';
  }

  // 5. Windows = quase sempre desenvolvimento
  if (os.platform() === 'win32') {
    return 'development';
  }

  // 6. Default: development (mais seguro para não crashar)
  return 'development';
};

// Define NODE_ENV automaticamente se não estiver definido
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = autoDetectEnvironment();
  console.log(`🔍 Ambiente auto-detectado: ${process.env.NODE_ENV}`);
} else {
  console.log(`🔍 Ambiente definido: ${process.env.NODE_ENV}`);
}

const validateSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Validar JWT_SECRET com verificação de entropia
  const jwtValidation = validateJwtSecret(process.env.JWT_SECRET);

  if (!jwtValidation.valid) {
    // Em produção: AVISA mas NÃO CRASHA — o servidor precisa ficar online
    console.error('═══════════════════════════════════════════════════════════════');
    if (isProduction) {
      console.error('[SECURITY CRITICAL] JWT_SECRET com problemas:');
    } else {
      console.warn('[Security] ⚠️ JWT_SECRET com problemas de segurança:');
    }
    jwtValidation.errors.forEach(err => {
      console.error(`  ❌ ${err}`);
    });
    console.error('  💡 Gere uma chave segura com:');
    console.error('     node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.error('═══════════════════════════════════════════════════════════════');
    // NÃO chama process.exit() — o servidor deve continuar rodando
  } else {
    // Mostrar warnings mesmo se válido
    jwtValidation.warnings.forEach(warn => {
      console.warn(`[Security] ⚠️ ${warn}`);
    });
    console.log(`[Security] ✅ JWT_SECRET válida (${jwtValidation.stats.length} chars, ${jwtValidation.stats.uniqueChars} únicos)`);
  }

  // Validar ENCRYPTION_KEY — avisa mas NÃO crasha
  if (!process.env.ENCRYPTION_KEY) {
    if (isProduction) {
      console.error('[SECURITY CRITICAL] ⚠️ ENCRYPTION_KEY não configurada em produção!');
    } else {
      console.warn('[Security] ⚠️ ENCRYPTION_KEY não configurada');
    }
    // NÃO chama process.exit() — o servidor deve continuar rodando
  }

  // Validar CONSULTA_API_KEY
  if (!process.env.CONSULTA_API_KEY && isProduction) {
    console.warn('[Security] ⚠️ CONSULTA_API_KEY não configurada em produção');
  }

  console.log('✅ Validação de segurança concluída');
};

// Executar validação antes de qualquer coisa
validateSecurityConfig();

// ============================================================================
// CARREGAMENTO SEGURO DE MÓDULOS — Não crasha se algum falhar
// ============================================================================
let sequelize1, sequelize2, sequelize3, sequelize4;
let routes, cron, Cliente, Usuario, Plano, Dispositivos, PlanoAdquirido;
let Integracao, LogIntegracao, ChaveAPI, ApiCreditos, ApiCreditosHistorico;
let secureCors, securityHeaders, sanitizeInput, secureErrorHandler, isDevelopment, cspWithNonce, cookieAuth, redisStore;
let cookieParser, helmet;
let GiftCard, TransacaoCarteira, inicializarIntegracoesDefault, Op;
let bitcoin, presenceService, liveChatService;
let dbErrorHandler, dbHealthService;

// -- Databases --
try {
  sequelize1 = require("./src/config/database1");
  console.log('✅ Database 1 carregado');
} catch (e) {
  console.error('❌ Database 1 falhou:', e.message);
}

try {
  sequelize2 = require("./src/config/database2");
  console.log('✅ Database 2 carregado');
} catch (e) {
  console.error('❌ Database 2 falhou:', e.message);
}

try {
  sequelize3 = require("./src/config/database3");
  console.log('✅ Database 3 carregado');
} catch (e) {
  console.error('❌ Database 3 falhou:', e.message);
}

try {
  sequelize4 = require("./src/config/database4");
  console.log('✅ Database 4 carregado');
} catch (e) {
  console.error('❌ Database 4 falhou:', e.message);
}

// -- Node-cron (separado para não depender de rotas) --
try {
  cron = require("node-cron");
  console.log('✅ node-cron carregado');
} catch (e) {
  console.error('❌ node-cron falhou:', e.message);
}

// -- Rotas e Modelos --
try {
  routes = require("./src/routes");
  ({ Cliente } = require("./src/models/Clientes"));
  ({ Usuario } = require("./src/models/Usuario"));
  ({ Plano } = require("./src/models/Planos"));
  Dispositivos = require("./src/models/Dispositivos");
  PlanoAdquirido = require("./src/models/PlanosAdquiridos");
  Integracao = require("./src/models/Integracao");
  LogIntegracao = require("./src/models/LogIntegracao");
  ChaveAPI = require("./src/models/ChaveAPI");
  ApiCreditos = require("./src/models/ApiCreditos");
  ApiCreditosHistorico = require("./src/models/ApiCreditosHistorico");
  console.log('✅ Rotas e modelos carregados');
} catch (e) {
  console.error('❌ Erro ao carregar rotas/modelos:', e.message);
  console.error('   Stack:', e.stack?.split('\n')[1]);
}

// -- Middlewares de Segurança --
try {
  ({
    secureCors,
    securityHeaders,
    sanitizeInput,
    secureErrorHandler,
    isDevelopment,
    cspWithNonce,
    cookieAuth,
    redisStore,
  } = require("./src/middlewares/security"));
  console.log('✅ Middlewares de segurança carregados');
} catch (e) {
  console.error('❌ Middlewares de segurança falharam:', e.message);
  // Fallback mínimo para CORS e segurança
  secureCors = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  };
  securityHeaders = (req, res, next) => next();
  sanitizeInput = (req, res, next) => next();
  secureErrorHandler = (err, req, res, next) => res.status(500).json({ error: err.message });
  isDevelopment = () => process.env.NODE_ENV !== 'production';
  cspWithNonce = (req, res, next) => next();
  cookieAuth = (req, res, next) => next();
  redisStore = { shutdown: async () => { } };
}

// -- Cookie Parser --
try {
  cookieParser = require("cookie-parser");
} catch (e) {
  console.error('❌ cookie-parser não instalado');
  cookieParser = () => (req, res, next) => next();
}

// -- Helmet --
try {
  helmet = require("helmet");
  console.log('[Security] ✅ Helmet.js carregado');
} catch (e) {
  console.warn('[Security] ⚠️ Helmet.js não instalado. Execute: npm install helmet');
  helmet = null;
}

// -- Associações e Modelos extras --
try {
  require("./src/models/associations");
  GiftCard = require("./src/models/GiftCard");
  TransacaoCarteira = require("./src/models/TransacaoCarteira");
  ({ inicializarIntegracoesDefault } = require("./src/controllers/integracoesController"));
  ({ Op } = require("sequelize"));
  console.log('✅ Associações e modelos extras carregados');
} catch (e) {
  console.error('❌ Associações/modelos extras falharam:', e.message);
  Op = {};
}

// -- Módulo Bitcoin --
try {
  bitcoin = require("./src/bitcoin");
  console.log('✅ Módulo Bitcoin carregado');
} catch (e) {
  console.error('❌ Módulo Bitcoin falhou:', e.message);
  bitcoin = { initialize: async () => { }, shutdown: () => { }, routes: require('express').Router() };
}

// -- Serviço de Presença --
try {
  ({ presenceService } = require("./src/services/PresenceService"));
  console.log('✅ PresenceService carregado');
} catch (e) {
  console.error('❌ PresenceService falhou:', e.message);
  presenceService = { initialize: () => { }, shutdown: () => { } };
}

// -- Live Chat --
try {
  ({ liveChatService } = require("./src/services/LiveChatService"));
  console.log('✅ LiveChatService carregado');
} catch (e) {
  console.error('❌ LiveChatService falhou:', e.message);
  liveChatService = { initialize: () => { }, shutdown: () => { } };
}

// -- DB Error Handler e Health Service --
try {
  ({ dbErrorHandler } = require("./src/middleware/dbErrorHandler"));
  dbHealthService = require("./src/services/dbHealthService");
  console.log('✅ dbErrorHandler e dbHealthService carregados');
} catch (e) {
  console.error('❌ dbErrorHandler/dbHealthService falhou:', e.message);
  dbErrorHandler = (err, req, res, next) => next(err);
  dbHealthService = {};
}


const app = express();

// SEGURANÇA: Confiar no proxy reverso (Nginx) para determinar req.secure (HTTPS)
// Sem isso, req.secure é sempre false atrás de proxy, e HSTS nunca é enviado
// 'loopback' = confia apenas em proxies locais (127.0.0.1, ::1)
app.set('trust proxy', 'loopback');

const server = http.createServer(app); // Criar um servidor HTTP

// ============================================================================
// CONFIGURAÇÃO DE CORS SEGURO PARA SOCKET.IO
// ============================================================================
// Origens permitidas em produção (inclui localhost para desenvolvimento remoto)
const allowedOrigins = [
  'https://infinitybuscas.com',
  'https://www.infinitybuscas.com',
  // Permitir desenvolvimento local conectando ao servidor de produção
  'http://localhost:3000',
  'https://brpdfonline.site',
  'https://oferta-05.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

// Função para verificar IP privado (RFC 1918)
const isPrivateIP = (hostname) => {
  if (hostname.startsWith('10.')) return true;
  if (hostname.startsWith('192.168.')) return true;
  if (hostname.startsWith('172.')) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
  }
  return false;
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Sem origin (Postman, curl, mobile apps) - permite
      if (!origin) return callback(null, true);

      // Localhost/127.0.0.1 - SEMPRE permite (desenvolvimento local)
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Domínio de produção - permite
      if (origin.includes('infinitybuscas.com')) {
        return callback(null, true);
      }

      // IPs privados (rede local) - permite
      try {
        const url = new URL(origin);
        if (isPrivateIP(url.hostname)) {
          return callback(null, true);
        }
      } catch (e) {
        // URL inválida
      }

      // Em desenvolvimento, permite qualquer origem
      if (isDevelopment()) {
        return callback(null, true);
      }

      // Produção com origem desconhecida - bloqueia
      console.log(`[Socket.IO] Origem bloqueada: ${origin}`);
      callback(new Error('Origem não permitida'), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  // Configurações otimizadas para presença em tempo real
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Inicializar serviço de presença com Socket.IO
presenceService.initialize(io);

// Inicializar serviço de Live Chat com Socket.IO
liveChatService.initialize(io);

// Exportar io para uso em outros módulos
app.set('io', io);
app.set('presenceService', presenceService);
app.set('liveChatService', liveChatService);
// Porta padrão: 8081 em produção (Nginx upstream), 8080 em dev
const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? 8081 : 8080);

// ============================================================================
// MIDDLEWARES DE SEGURANÇA (aplicados antes de tudo)
// ============================================================================

// 0. Helmet.js - Headers de segurança padrão da indústria (se disponível)
// CORREÇÃO 23/12/2024: Ajustado Cross-Origin policies para permitir CORS
if (helmet) {
  app.use(helmet({
    // CSP é gerenciado separadamente com nonces
    contentSecurityPolicy: false,
    // Permite frames do mesmo domínio (já configurado em securityHeaders)
    frameguard: { action: 'sameorigin' },
    // HSTS em produção
    hsts: !isDevelopment() ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false,
    // Proteção contra XSS
    xssFilter: true,
    // Não expor tecnologia usada
    hidePoweredBy: true,
    // Proteção contra MIME sniffing
    noSniff: true,
    // Referrer Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // CORREÇÃO: Cross-Origin policies ajustadas para permitir CORS
    // Desabilitado para não conflitar com nosso middleware secureCors
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }));
  console.log('[Security] ✅ Helmet.js configurado');
}

// 1. Headers de segurança (X-Frame-Options, X-Content-Type-Options, etc.)
app.use(securityHeaders);

// 2. CSP com nonce para scripts inline seguros
app.use(cspWithNonce);

// 3. CORS seguro (permite desenvolvimento local, restringe produção)
app.use(secureCors);

// 4. Parser de cookies (necessário para autenticação HttpOnly)
app.use(cookieParser());

// 5. Middleware para extrair token de cookie HttpOnly (compatibilidade com Bearer)
app.use(cookieAuth.extractTokenFromCookie);

// 6. Middleware para parsear JSON (limite aumentado para suportar upload de imagens base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 7. Sanitização de entrada (remove caracteres perigosos)
app.use(sanitizeInput);

// 8. Servir arquivos estáticos (HTML, CSS, JS, imagens)
app.use(express.static('.', {
  setHeaders: (res, path) => {
    // Adicionar CORS para arquivos estáticos também
    res.header('Access-Control-Allow-Origin', '*');
  }
}));

// Log de inicialização de segurança
console.log(`🔒 Segurança: Modo ${isDevelopment() ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'} (${os.hostname()})`);
console.log(`🔗 Porta: ${port} | PID: ${process.pid}`);
if (isDevelopment()) {
  console.log('⚠️  CORS permissivo ativado para desenvolvimento');
}

// Teste de conexão com o banco de dados 1
sequelize1
  .authenticate()
  .then(() => {
    // console.log("Conectado ao banco de dados 1 com sucesso.");
  })
  .catch((err) => {
    console.error("Não foi possível conectar ao banco de dados 1:", err);
  });

// Teste de conexão com o banco de dados 2
sequelize2
  .authenticate()
  .then(() => {
    console.log("Conectado ao banco de dados 2 com sucesso.");
  })
  .catch((err) => {
    console.error("Não foi possível conectar ao banco de dados 2:", err);
  });

// Teste de conexão com o banco de dados 3
sequelize3
  .authenticate()
  .then(() => {
    // console.log("Conectado ao banco de dados 3 com sucesso.");
  })
  .catch((err) => {
    console.error("Não foi possível conectar ao banco de dados 3:", err);
  });

// Teste de conexão com o banco de dados 3
sequelize4
  .authenticate()
  .then(() => {
    // console.log("Conectado ao banco de dados 4 com sucesso.");
  })
  .catch((err) => {
    console.error("Não foi possível conectar ao banco de dados 4:", err);
  });

// Sincronizar os modelos com os bancos de dados 1
sequelize1
  .sync({ alter: false, force: false })
  .then(async () => {
    console.log("Modelos sincronizados com o banco de dados 1.");

    // Migrações de startup — extraídas para src/migrations/startup.js
    try {
      const { executarMigracoes } = require('./src/migrations/startup');
      await executarMigracoes(sequelize1);
    } catch (migErr) {
      console.log("⚠️ Migração (pode ser ignorado):", migErr.message);
    }

    // Inicializar integrações padrão após sincronização
    try {
      await inicializarIntegracoesDefault();
      console.log("Integrações padrão inicializadas.");
    } catch (err) {
      console.log("Erro ao inicializar integrações padrão:", err.message);
      console.error("Stack:", err.stack);
    }
  })
  .catch((err) => {
    console.error(
      "Erro ao sincronizar os modelos com o banco de dados 1:",
      err
    );
    console.error("Stack:", err.stack);
  });

// Sincronizar os modelos com os bancos de dados 2
sequelize2
  .sync()
  .then(() => {
    // console.log("Modelos sincronizados com o banco de dados 2.");
  })
  .catch((err) => {
    console.error(
      "Erro ao sincronizar os modelos com o banco de dados 2:",
      err
    );
  });

// Sincronizar os modelos com os bancos de dados 3
sequelize3
  .sync()
  .then(() => {
    // console.log("Modelos sincronizados com o banco de dados 3.");
  })
  .catch((err) => {
    console.error(
      "Erro ao sincronizar os modelos com o banco de dados 3:",
      err
    );
  });

// Sincronizar os modelos com os bancos de dados 4
sequelize4
  .sync()
  .then(() => {
    // console.log("Modelos sincronizados com o banco de dados 3.");
  })
  .catch((err) => {
    console.error(
      "Erro ao sincronizar os modelos com o banco de dados 4:",
      err
    );
  });

// Usar o arquivo de rotas (com guard para caso tenha falhado o carregamento)
if (routes) {
  app.use(routes);
} else {
  console.error('⚠️ Rotas principais não carregadas — servidor rodando sem rotas');
  app.use((req, res) => res.status(503).json({ error: 'Servidor em modo degradado — rotas não carregadas' }));
}

// Rotas de autenticação segura (HttpOnly Cookies)
try {
  const authRoutes = require('./src/routes/authRoutes');
  app.use('/api/v1/auth', authRoutes);
} catch (e) {
  console.error('❌ authRoutes falhou:', e.message);
}

// Proxy transparente para API Infinity Buscas (intercepta /api/search)
// Permite que o frontend chame a API como se fosse direta, mas passa pelo servidor
try {
  const proxyInfinityRoutes = require('./src/routes/proxyInfinityRoutes');
  app.use('/api', proxyInfinityRoutes);
  console.log('✅ Proxy Infinity Buscas configurado em /api/search');
} catch (e) {
  console.error('❌ proxyInfinityRoutes falhou:', e.message);
}

// Rotas do módulo Bitcoin HD Wallet
if (bitcoin?.routes) {
  app.use('/api/v1/bitcoin', bitcoin.routes);
}

// ============================================================================
// SISTEMA GLOBAL DE FALLBACK - Health Check Endpoint
// ============================================================================
app.get('/api/v1/system-health', async (req, res) => {
  try {
    const status = await dbHealthService.getFullStatus();
    const httpStatus = status.sistema.status === 'operacional' ? 200
      : status.sistema.status === 'degradado' ? 207
        : 503;
    return res.status(httpStatus).json(status);
  } catch (error) {
    return res.status(500).json({
      sistema: { status: 'erro', mensagem: 'Erro ao verificar saúde do sistema' },
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// ERROR HANDLERS (ordem importa: dbErrorHandler antes do secureErrorHandler)
// ============================================================================
// 1. Intercepta erros de Database e retorna respostas estruturadas (503)
app.use(dbErrorHandler);

// 2. Error handler genérico de segurança (último)
app.use(secureErrorHandler);

// Configurar o WebSocket para chat (mantém compatibilidade)
// Nota: A presença é gerenciada pelo PresenceService
io.on("connection", (socket) => {
  // Handler de chat (mantido para compatibilidade)
  socket.on("chat message", (msg) => {
    console.log("Mensagem recebida: " + msg);
    io.emit("chat message", msg);
  });

  // Log de conexões (o PresenceService gerencia a lógica de presença)
  socket.on("disconnect", () => {
    // O PresenceService já lida com desconexões
  });
});

// Cron Jobs — extraídos para src/cron/index.js
if (cron) {
  try {
    const { inicializarCronJobs } = require('./src/cron');
    inicializarCronJobs({ PlanoAdquirido, Dispositivos, sequelize1, Op });
  } catch (cronErr) {
    console.error('[CRON] ❌ Erro ao inicializar cron jobs:', cronErr.message);
  }
}

// Iniciar o servidor
server.listen(port, async () => {
  console.log(`Servidor rodando na porta ${port}`);

  // Verificar configuração IPv4
  console.log('🔍 Verificando configuração de rede...');
  try {
    const dns = require('dns');
    dns.lookup('google.com', { family: 4 }, (err, address, family) => {
      if (err) {
        console.error('⚠️ Erro ao resolver DNS IPv4:', err.message);
      } else {
        console.log(`✅ DNS IPv4 funcionando: google.com → ${address} (family: ${family})`);
      }
    });
  } catch (err) {
    console.error('⚠️ Erro ao verificar DNS:', err.message);
  }

  // Inicializar módulo Bitcoin (cria tabelas e inicia worker de monitoramento)
  try {
    await bitcoin.initialize({
      syncDatabase: true,  // Cria/atualiza tabelas de pagamentos Bitcoin
      startWorker: true    // Inicia worker de monitoramento automático
    });
    console.log("✅ Módulo Bitcoin inicializado com sucesso");
  } catch (err) {
    console.error("❌ Erro ao inicializar módulo Bitcoin:", err.message);
  }

  // Inicializar Health Check automático do sistema de consultas
  try {
    const ConsultaService = require('./src/services/ConsultaService');
    // Health check a cada 5 minutos (300000ms)
    ConsultaService.startHealthCheck(5 * 60 * 1000);
    console.log("✅ Health Check do sistema de consultas iniciado (intervalo: 5min)");
  } catch (err) {
    console.error("❌ Erro ao inicializar Health Check:", err.message);
  }
});

// Graceful shutdown - para o worker de Bitcoin, PresenceService, LiveChatService, ConsultaService e Redis
process.on('SIGTERM', async () => {
  console.log('Recebido SIGTERM, encerrando graciosamente...');
  presenceService.shutdown();
  liveChatService.shutdown();
  bitcoin.shutdown();
  // Parar health check e cache cleanup do sistema de consultas
  try {
    const ConsultaService = require('./src/services/ConsultaService');
    ConsultaService.stopHealthCheck();
    const ConsultaApiService = require('./src/services/ConsultaApiService');
    ConsultaApiService.shutdown();
  } catch (e) { /* ignorar */ }
  await redisStore.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Recebido SIGINT, encerrando graciosamente...');
  presenceService.shutdown();
  liveChatService.shutdown();
  bitcoin.shutdown();
  // Parar health check e cache cleanup do sistema de consultas
  try {
    const ConsultaService = require('./src/services/ConsultaService');
    ConsultaService.stopHealthCheck();
    const ConsultaApiService = require('./src/services/ConsultaApiService');
    ConsultaApiService.shutdown();
  } catch (e) { /* ignorar */ }
  await redisStore.shutdown();
  process.exit(0);
});

// ============================================================================
// PROTEÇÃO CONTRA CRASH — Graceful Shutdown + Restart via PM2
// ============================================================================
// SEGURANÇA: Após uncaughtException, o Node.js fica em estado INDEFINIDO.
// Continuar servindo requisições pode corromper dados ou produzir resultados errados.
// A estratégia correta é: logar, encerrar graciosamente, e deixar o PM2 reiniciar.
// ============================================================================

process.on('uncaughtException', (err) => {
  console.error('═══════════════════════════════════════════════════════════════');
  console.error('[FATAL] Exceção não capturada — iniciando shutdown gracioso:');
  console.error(`  Mensagem: ${err.message}`);
  console.error(`  Stack: ${err.stack}`);
  console.error(`  Timestamp: ${new Date().toISOString()}`);
  console.error('═══════════════════════════════════════════════════════════════');

  // Encerrar serviços críticos antes de sair
  try {
    presenceService?.shutdown?.();
    liveChatService?.shutdown?.();
    bitcoin?.shutdown?.();
  } catch (shutdownErr) {
    console.error('[FATAL] Erro durante shutdown de serviços:', shutdownErr.message);
  }

  // Dar tempo para flush dos logs, depois sair
  // PM2 vai reiniciar automaticamente
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('═══════════════════════════════════════════════════════════════');
  console.error('[FATAL] Promise rejeitada não tratada — iniciando shutdown:');
  console.error(`  Razão: ${reason}`);
  if (reason?.stack) console.error(`  Stack: ${reason.stack}`);
  console.error(`  Timestamp: ${new Date().toISOString()}`);
  console.error('═══════════════════════════════════════════════════════════════');

  // Encerrar serviços críticos
  try {
    presenceService?.shutdown?.();
    liveChatService?.shutdown?.();
    bitcoin?.shutdown?.();
  } catch (shutdownErr) {
    console.error('[FATAL] Erro durante shutdown de serviços:', shutdownErr.message);
  }

  setTimeout(() => {
    process.exit(1);
  }, 3000);
});
