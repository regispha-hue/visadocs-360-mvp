/** Nexoritia OS Middleware for Visadocs 360 | Otimizado */
import { NextRequest, NextResponse } from 'next/server';

interface Config { enabled: boolean; strictMode: boolean; bypassPaths: string[]; }

const config: Config = {
  enabled: process.env.NEXORITIA_ENABLE_VALIDATION === 'true',
  strictMode: process.env.NEXORITIA_STRICT_MODE === 'true',
  bypassPaths: ['/api/health', '/_next', '/favicon.ico', '/api/auth']
};

function shouldBypass(pathname: string): boolean {
  return config.bypassPaths.some(p => pathname.startsWith(p)) || !!pathname.match(/\.(ico|png|jpg|js|css)$/);
}

function detectDomain(pathname: string): string {
  if (pathname.includes('/pops') || pathname.includes('/procedimentos')) return 'farmacia_manipulacao';
  if (pathname.includes('/documentos')) return 'documentos_regulatorios';
  if (pathname.includes('/treinamentos')) return 'treinamento_certificacao';
  return 'geral';
}

export async function nexoritiaMiddleware(req: NextRequest, handler: () => Promise<NextResponse>) {
  if (!config.enabled) return handler();
  if (shouldBypass(req.nextUrl.pathname)) return handler();

  const domain = detectDomain(req.nextUrl.pathname);
  const res = await handler();
  res.headers.set('X-Nexoritia-Domain', domain);
  res.headers.set('X-Nexoritia-Validated', 'true');
  return res;
}
