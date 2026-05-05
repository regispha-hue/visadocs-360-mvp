/**
 * Nexoritia OS Middleware for Visadocs 360 MVP
 * Middleware de validação governada para Next.js
 */

    // @ts-ignore
import { NextRequest, NextApiResponse, NextResponse } from 'next/server';
import { nexoritiaClient } from '../lib/nexoritia-client';

// Configuração do middleware
interface NexoritiaConfig {
  enabled: boolean;
  strictMode: boolean;
  validationDomains: string[];
  bypassPaths: string[];
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
  };
}

const config: NexoritiaConfig = {
  enabled: process.env.NEXORITIA_ENABLE_VALIDATION === 'true',
  strictMode: process.env.NEXORITIA_STRICT_MODE === 'true',
  validationDomains: ['farmacia_manipulacao', 'documentos_regulatorios', 'treinamento_certificacao'],
  bypassPaths: ['/api/health', '/_next', '/favicon.ico', '/api/auth'],
  rateLimiting: {
    enabled: process.env.NEXORITIA_RATE_LIMIT === 'true',
    requestsPerMinute: 60
  }
};

// Rate limiting simples em memória
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Middleware principal de validação Nexoritia
 */
export async function nexoritiaMiddleware(
  req: NextRequest,
  res: NextApiResponse,
  handler: () => Promise<void>
) {
  // 1. Verificar se Nexoritia está habilitado
  if (!config.enabled) {
    return handler();
  }

  // 2. Bypass para paths específicos
  if (shouldBypassPath(req.nextUrl.pathname)) {
    return handler();
  }

  // 3. Rate limiting
  if (config.rateLimiting.enabled && !await checkRateLimit(req)) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60
      },
      { status: 429 }
    );
  }

  // 4. Validar requisição baseada no método e path
  const validationResult = await validateRequest(req);
  
  if (!validationResult.valid) {
    return NextResponse.json(
      {
        error: 'Request blocked by Nexoritia OS',
        violations: validationResult.violations,
        action: validationResult.action,
        timestamp: new Date().toISOString()
      },
      { status: validationResult.statusCode || 400 }
    );
  }

  // 5. Adicionar headers de validação
  res.setHeader('X-Nexoritia-Validated', 'true');
  res.setHeader('X-Nexoritia-Timestamp', new Date().toISOString());
  res.setHeader('X-Nexoritia-Domain', validationResult.domain || 'unknown');

  // 6. Continuar processamento
  return handler();
}

/**
 * Verifica se path deve ser ignorado pela validação
 */
function shouldBypassPath(pathname: string): boolean {
  return config.bypassPaths.some(path => pathname.startsWith(path)) ||
         pathname.startsWith('/api/auth/') ||
         pathname.startsWith('/_next/') ||
         pathname.endsWith('.ico') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg');
}

/**
 * Rate limiting simples
 */
async function checkRateLimit(req: NextRequest): Promise<boolean> {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000; // 1 minuto

  const current = rateLimitMap.get(clientIp) || { count: 0, resetTime: windowStart + 60000 };

  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = windowStart + 60000;
  }

  current.count++;
  rateLimitMap.set(clientIp, current);

  return current.count <= config.rateLimiting.requestsPerMinute;
}

/**
 * Valida requisição baseada no método e conteúdo
 */
async function validateRequest(req: NextRequest): Promise<{
  valid: boolean;
  violations: string[];
  action: string;
  domain?: string;
  statusCode?: number;
}> {
  const { method, url, headers } = req;
  const pathname = new URL(url).pathname;

  try {
    // 1. Detectar domínio baseado no path
    const domain = detectDomain(pathname);
    
    // 2. Validar baseado no método HTTP
    switch (method) {
      case 'POST':
      case 'PUT':
      case 'PATCH':
        return await validateBodyRequest(req, domain);
      
      case 'GET':
        return validateGetRequest(req, domain);
      
      default:
        return {
          valid: true,
          violations: [],
          action: 'ALLOW'
        };
    }
  } catch (error) {
    console.error('❌ Erro na validação Nexoritia:', error);
    return {
      valid: false,
      violations: ['Internal validation error'],
      action: 'BLOCK',
      statusCode: 500
    };
  }
}

/**
 * Detecta domínio de validação baseado no path
 */
function detectDomain(pathname: string): string {
  if (pathname.includes('/pops') || pathname.includes('/procedimentos')) {
    return 'farmacia_manipulacao';
  }
  if (pathname.includes('/documentos') || pathname.includes('/regulatorios')) {
    return 'documentos_regulatorios';
  }
  if (pathname.includes('/treinamentos') || pathname.includes('/certificados')) {
    return 'treinamento_certificacao';
  }
  return 'geral';
}

/**
 * Valida requisições com corpo (POST/PUT/PATCH)
 */
async function validateBodyRequest(req: NextRequest, domain: string): Promise<{
  valid: boolean;
  violations: string[];
  action: string;
  domain: string;
}> {
  const violations: string[] = [];
  let body: any;

  try {
    // Tentar obter corpo da requisição
    if (req.body) {
      body = req.body;
    } else {
      // Se body não estiver disponível, tentar ler
      const bodyBuffer = await req.text();
      body = JSON.parse(bodyBuffer);
    }
  } catch (error) {
    return {
      valid: false,
      violations: ['Invalid request body'],
      action: 'BLOCK',
      domain
    };
  }

  // 1. Validar conteúdo textual
  if (body.content || body.descricao || body.titulo) {
    const content = body.content || body.descricao || body.titulo || '';
    
    try {
      const validation = await nexoritiaClient.validateText({
        content,
        domain,
        strict_mode: config.strictMode
      });

      if (!validation.valid) {
        violations.push(...validation.violations);
      }
    } catch (error) {
      violations.push(`Validation service error: ${error.message}`);
    }
  }

  // 2. Validações específicas por domínio
  if (domain === 'farmacia_manipulacao') {
    violations.push(...validatePharmacyContent(body));
  } else if (domain === 'documentos_regulatorios') {
    violations.push(...validateDocumentContent(body));
  } else if (domain === 'treinamento_certificacao') {
    violations.push(...validateTrainingContent(body));
  }

  // 3. Determinar ação baseada nas violações
  const action = determineAction(violations);

  return {
    valid: violations.length === 0,
    violations,
    action,
    domain
  };
}

/**
 * Valida requisições GET
 */
function validateGetRequest(req: NextRequest, domain: string): {
  valid: boolean;
  violations: string[];
  action: string;
  domain: string;
} {
  const violations: string[] = [];
  const { url, headers } = req;

  // Validar parâmetros da query
  const urlObj = new URL(url);
  const searchParams = urlObj.searchParams;

  // Verificar por injeção de SQL básica
  for (const [key, value] of searchParams) {
    if (containsSqlInjection(value)) {
      violations.push(`Potential SQL injection in parameter: ${key}`);
    }
  }

  // Verificar XSS básico
  const userAgent = headers['user-agent'] || '';
  if (containsXss(userAgent)) {
    violations.push('Potential XSS in User-Agent header');
  }

  const action = determineAction(violations);

  return {
    valid: violations.length === 0,
    violations,
    action,
    domain
  };
}

/**
 * Validações específicas para conteúdo farmacêutico
 */
function validatePharmacyContent(body: any): string[] {
  const violations: string[] = [];

  // Verificar concentrações
  if (body.concentracao && body.concentracao > 100) {
    violations.push('Concentration exceeds 100% limit');
  }

  // Verificar temperatura
  if (body.temperatura && (body.temperatura < 2 || body.temperatura > 25)) {
    violations.push('Temperature outside valid range (2-25°C)');
  }

  // Verificar umidade
  if (body.umidade && (body.umidade < 45 || body.umidade > 75)) {
    violations.push('Humidity outside valid range (45-75%)');
  }

  return violations;
}

/**
 * Validações específicas para documentos regulatórios
 */
function validateDocumentContent(body: any): string[] {
  const violations: string[] = [];

  // Verificar se tem versão
  if (!body.versao && body.tipo !== 'draft') {
    violations.push('Document missing version');
  }

  // Verificar se tem data
  if (!body.data && body.status === 'published') {
    violations.push('Published document missing date');
  }

  // Verificar se tem assinatura
  if (!body.assinatura && body.requerAssinatura) {
    violations.push('Document missing signature');
  }

  return violations;
}

/**
 * Validações específicas para treinamento
 */
function validateTrainingContent(body: any): string[] {
  const violations: string[] = [];

  // Verificar duração mínima
  if (body.duracao && body.duracao < 60) {
    violations.push('Training duration below 60 minutes minimum');
  }

  // Verificar nota mínima
  if (body.nota && body.nota < 70 && body.status === 'aprovado') {
    violations.push('Approved training with score below 70%');
  }

  // Verificar número máximo de tentativas
  if (body.tentativas && body.tentativas > 3) {
    violations.push('Training attempts exceed maximum of 3');
  }

  return violations;
}

/**
 * Determina ação baseada nas violações
 */
function determineAction(violations: string[]): string {
  const criticalViolations = violations.filter(v => 
    v.includes('SQL injection') || 
    v.includes('XSS') || 
    v.includes('exceeds 100%') ||
    v.includes('below 70%')
  );

  const highViolations = violations.filter(v => 
    v.includes('missing version') ||
    v.includes('missing date') ||
    v.includes('missing signature')
  );

  if (criticalViolations.length > 0) {
    return 'BLOCK';
  } else if (highViolations.length > 0) {
    return config.strictMode ? 'BLOCK' : 'FORCE_REWRITE';
  } else if (violations.length > 0) {
    return 'WARN';
  }

  return 'ALLOW';
}

/**
 * Detecção simples de injeção de SQL
 */
function containsSqlInjection(value: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(--|\*|;|'|"|`)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i
  ];

  return sqlPatterns.some(pattern => pattern.test(value));
}

/**
 * Detecção simples de XSS
 */
function containsXss(value: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi
  ];

  return xssPatterns.some(pattern => pattern.test(value));
}

/**
 * Logger de validação
 */
export function logValidation(req: NextRequest, result: any): void {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.headers['x-forwarded-for'],
    valid: result.valid,
    violations: result.violations,
    action: result.action,
    domain: result.domain
  };

  if (result.valid) {
    console.log('✅ Nexoritia Validation:', logData);
  } else {
    console.warn('⚠️  Nexoritia Validation Blocked:', logData);
  }
}

export default nexoritiaMiddleware;
