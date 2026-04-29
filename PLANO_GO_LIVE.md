# PLANO DE GO-LIVE - VISADOCS

## Arquitetura Recomendada (Robusta com Custo Mínimo)

### Visão Geral
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel App    │    │  PostgreSQL     │    │  S3 Compatible  │
│   (Frontend)    │◄──►│   (Neon/Supa)   │◄──►│  (Cloudflare R2)│
│   (API Routes)   │    │   + Backup      │    │   + CDN         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │  Observability  │
                    │  (Logs/Metrics) │
                    └──────────────────┘
```

## 1. Camada App - Vercel

### Configuração
- **Plano**: Pro ($20/mês inicial, escalar conforme uso)
- **Features**: 
  - Preview Deployments automáticos
  - Branch Protection (main/production)
  - Edge Functions para APIs críticas
  - Analytics básico
  - Custom Domains + SSL

### Estrutura de Deploy
```
main (production)     → visadocs.com
develop (staging)    → staging.visadocs.com
feature/* (preview)   → random.vercel.app
```

### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXTAUTH_URL": "https://visadocs.com",
    "NODE_ENV": "production"
  }
}
```

## 2. Banco de Dados - PostgreSQL Gerenciado

### Opções Recomendadas

#### Neon (Recomendado para começar)
- **Custo**: $0-29/mês (escala automática)
- **Features**:
  - Serverless PostgreSQL
  - Branching de banco
  - Backup automático + PITR (7 dias)
  - Connection pooling
  - Auto-scaling

#### Supabase (Alternativa)
- **Custo**: $0-25/mês
- **Features**:
  - PostgreSQL + Auth + Storage
  - Backup automático
  - Realtime subscriptions
  - Edge Functions

### Configuração Neon
```bash
# Criar projeto
neonctl projects create visadocs-prod

# Criar branch de produção
neonctl branches create main --project-id visadocs-prod

# Obter connection string
neonctl connection-string --project-id visadocs-prod
```

### Variáveis de Ambiente
```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

## 3. Storage - S3 Compatível

### Cloudflare R2 (Recomendado)
- **Custo**: $0-15/mês
- **Features**:
  - 10GB free storage
  - 1M free operations/mês
  - Sem egress fees (diferencial chave)
  - CDN integrado

### Configuração R2
```bash
# Criar bucket
wrangler r2 bucket create visadocs-storage

# Configurar CORS
wrangler r2 bucket put cors visadocs-storage cors.json
```

### CORS Configuration
```json
{
  "AllowedOrigins": ["https://visadocs.com", "https://staging.visadocs.com"],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

### Variáveis de Ambiente
```env
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET=visadocs-storage
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## 4. Autenticação e Secrets

### NextAuth Configuration
```typescript
// lib/auth-options.ts
export const authOptions: NextAuthOptions = {
  providers: [
    // Configurar providers
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
      }
      return token;
    }
  }
};
```

### Secrets Management
```bash
# Gerar secret forte
openssl rand -base64 32

# Configurar no Vercel
vercel env add NEXTAUTH_SECRET
vercel env add DATABASE_URL
vercel env add CLOUDFLARE_R2_ACCESS_KEY_ID
vercel env add CLOUDFLARE_R2_SECRET_ACCESS_KEY
```

### Rotação de Secrets
```bash
# Script de rotação
#!/bin/bash
NEW_SECRET=$(openssl rand -base64 32)
vercel env add NEXTAUTH_SECRET --value $NEW_SECRET
echo "Secret rotated: $NEW_SECRET"
```

## 5. Observabilidade

### Logs Centralizados
```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Middleware de Observabilidade
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  response.headers.set('x-response-time', String(Date.now() - start));
  response.headers.set('x-request-id', crypto.randomUUID());
  
  return response;
}
```

### Health Check
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}
```

## 6. Plano de Go-Live

### Fase 1: Preparação (Dia 0-2)

#### 1.1 Corrigir Lock de Dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar build
npm run build

# Corrigir conflitos se necessário
npm audit fix
```

#### 1.2 Configurar Variáveis de Ambiente
```bash
# Ambiente de desenvolvimento
cp .env.example .env.local

# Produção (Vercel)
vercel env pull .env.production
```

#### 1.3 Configurar Banco de Produção
```bash
# Criar projeto Neon
neonctl projects create visadocs-prod

# Migrar schema
npx prisma migrate deploy

# Seed inicial (se necessário)
npx prisma db seed
```

### Fase 2: Deploy Inicial (Dia 3)

#### 2.1 Configurar Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login e configurar projeto
vercel login
vercel link

# Configurar branch protection
vercel env add PRODUCTION_BRANCH --value main
```

#### 2.2 Deploy de Staging
```bash
# Deploy do branch develop
git checkout develop
git push origin develop
vercel --scope your-team
```

#### 2.3 Testes de Staging
```bash
# Smoke tests automatizados
npm run test:smoke

# Testes manuais checklist
- [ ] Login funciona
- [ ] CRUD POPs funciona
- [ ] Upload de arquivos
- [ ] Geração de relatórios
- [ ] Autenticação persiste
```

### Fase 3: Produção (Dia 4-5)

#### 3.1 Deploy de Produção
```bash
# Merge develop → main
git checkout main
git merge develop

# Tag de versão
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# Deploy produção
vercel --prod
```

#### 3.2 Configurar Domínio e SSL
```bash
# Adicionar domínio custom
vercel domains add visadocs.com

# Configurar DNS
# A → 76.76.19.61
# CNAME → cname.vercel-dns.com
```

#### 3.3 Configurar Monitoramento
```typescript
// app/api/webhooks/vercel/route.ts
export async function POST(request: NextRequest) {
  const event = await request.json();
  
  if (event.type === 'deployment.error') {
    // Enviar alerta
    await sendAlert({
      type: 'DEPLOY_ERROR',
      message: event.payload.error.message
    });
  }
  
  return Response.json({ received: true });
}
```

### Fase 4: Pós-Go-Live (Dia 6+)

#### 4.1 Monitoramento Contínuo
```bash
# Scripts de monitoramento
#!/bin/bash
# health-check.sh

response=$(curl -s -o /dev/null -w "%{http_code}" https://visadocs.com/api/health)

if [ $response != "200" ]; then
  echo "Health check failed: $response"
  # Enviar alerta
  send-sms "VISADOCS DOWN: $response"
fi
```

#### 4.2 Backup Automático
```bash
# Backup diário do banco
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d)
neonctl databases dump visadocs-prod > backup_$DATE.sql

# Upload para R2
wrangler r2 object put visadocs-storage/backups/backup_$DATE.sql --file=backup_$DATE.sql
```

#### 4.3 Política de Incidente
```yaml
# incident-response.yml
incident_levels:
  critical:
    - Site down
    - Database connection failed
    - Data corruption
    response_time: 15min
  high:
    - Feature broken
    - Performance degradation
    response_time: 1h
  medium:
    - Minor bugs
    - UI issues
    response_time: 4h
```

## 7. Custos Estimados (Mensal)

### Inicial (Primeiros 3 meses)
```
Vercel Pro:           $20
Neon PostgreSQL:       $0-29
Cloudflare R2:         $0-15
Domain:               $12
SSL Certificate:       $0 (Let's Encrypt)
Monitoring:           $0-10
---
Total: $32-86/mês
```

### Escala (100+ usuários)
```
Vercel Pro:           $20-100
Neon PostgreSQL:       $29-99
Cloudflare R2:         $15-50
Domain:               $12
Monitoring:           $10-50
---
Total: $86-311/mês
```

## 8. Checklist Final

### Antes do Go-Live
- [ ] Build sem erros
- [ ] Todos os testes passando
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] Storage configurado
- [ ] SSL certificado
- [ ] Monitoramento ativo
- [ ] Backup automático
- [ ] Política de incidente definida

### Pós Go-Live
- [ ] Health check funcionando
- [ ] Logs centralizados
- [ ] Alertas configurados
- [ ] Performance monitorada
- [ ] Usuários testando
- [ ] Feedback coletado
- [ ] Documentação atualizada

## 9. Rollback Plan

### Rollback Rápido
```bash
# Reverter para tag anterior
git checkout v0.9.0
git push -f origin main

# Deploy rápido
vercel --prod --force
```

### Rollback de Banco
```bash
# Restaurar backup
neonctl databases restore visadocs-prod backup_20240429.sql
```

## 10. Próximos Passos

1. **Executar plano fase por fase**
2. **Monitorar métricas iniciais**
3. **Coletar feedback dos usuários**
4. **Ajustar configurações conforme uso**
5. **Escalar recursos conforme necessidade**

Este plano garante um go-live seguro, observável e com rollback rápido, mantendo custos controlados e escalabilidade para crescimento.
