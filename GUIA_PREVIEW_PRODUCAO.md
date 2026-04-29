# GUIA DE PREVIEW EM PRODUÇÃO - VISADOCS

## Opções para Visualizar o Projeto em Produção

### 1. Vercel Preview (Recomendado)

#### Passo 1: Instalar Vercel CLI
```bash
npm install -g vercel
```

#### Passo 2: Login no Vercel
```bash
vercel login
```

#### Passo 3: Configurar Projeto
```bash
cd C:\Users\Usuario\Documents\visadocs-360-mvp
vercel link
```

#### Passo 4: Criar Branch de Preview
```bash
git checkout -b preview-producao
git add .
git commit -m "Preview para produção"
git push origin preview-producao
```

#### Passo 5: Deploy Preview
```bash
vercel --scope seu-usuario
```

**Resultado**: URL tipo `https://visadocs-360-mvp-seu-usuario.vercel.app`

---

### 2. Railway Preview

#### Passo 1: Criar Conta Railway
- Acesse https://railway.app
- Crie conta com GitHub

#### Passo 2: Novo Projeto
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar projeto
railway new visadocs-preview
```

#### Passo 3: Configurar Variáveis
```bash
# Adicionar variáveis de ambiente
railway variables set DATABASE_URL="postgresql://user:password@host:5432/dbname"
railway variables set NEXTAUTH_SECRET="seu-secret-aqui"
railway variables set NEXTAUTH_URL="https://seu-projeto.railway.app"
```

#### Passo 4: Deploy
```bash
railway up
```

**Resultado**: URL tipo `https://seu-projeto.railway.app`

---

### 3. Neon + Vercel (Completo)

#### Passo 1: Criar Banco Neon
```bash
# Instalar Neon CLI
npm install -g @neondatabase/serverless

# Criar projeto
neonctl projects create visadocs-preview

# Obter connection string
neonctl connection-string --project-id seu-project-id
```

#### Passo 2: Configurar Vercel com Neon
```bash
# Adicionar variáveis no Vercel
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

#### Passo 3: Deploy Completo
```bash
# Gerar Prisma Client
npx prisma generate

# Migrar banco
npx prisma db push

# Deploy
vercel --prod
```

---

### 4. Local com Banco de Produção (Debug)

#### Passo 1: Configurar .env.local
```env
# Usar banco de produção localmente
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
NEXTAUTH_SECRET=seu-secret-aqui
NEXTAUTH_URL=http://localhost:3000
```

#### Passo 2: Iniciar Local
```bash
npm run dev
```

**Resultado**: `http://localhost:3000` com banco de produção

---

## Scripts Automatizados

### Script de Preview Rápido
```bash
#!/bin/bash
# preview-deploy.sh

echo "🚀 Iniciando deploy de preview..."

# Gerar Prisma Client
npx prisma generate

# Migrar banco
npx prisma db push

# Criar branch de preview
git checkout -b preview-$(date +%s)
git add .
git commit -m "Preview deploy - $(date)"
git push origin preview-$(date +%s)

# Deploy no Vercel
vercel

echo "✅ Preview deploy concluído!"
echo "🔗 URL: $(vercel ls | grep preview | tail -1 | awk '{print $2}')"
```

### Script de Teste de Preview
```bash
#!/bin/bash
# test-preview.sh

PREVIEW_URL=$1
if [ -z "$PREVIEW_URL" ]; then
    echo "Uso: $0 <preview-url>"
    exit 1
fi

echo "🧪 Testando preview: $PREVIEW_URL"

# Testar health check
curl -f "$PREVIEW_URL/api/health" || {
    echo "❌ Health check falhou"
    exit 1
}

# Testar página principal
curl -f "$PREVIEW_URL/" || {
    echo "❌ Página principal falhou"
    exit 1
}

# Testar API de autenticação
curl -f "$PREVIEW_URL/api/auth/session" || {
    echo "❌ API de autenticação falhou"
    exit 1
}

echo "✅ Todos os testes passaram!"
```

---

## Configuração de Variáveis de Preview

### .env.preview
```env
# Banco de dados de preview
DATABASE_URL=postgresql://preview_user:password@ep-xxx.us-east-2.aws.neon.tech/dbname_preview?sslmode=require

# Autenticação
NEXTAUTH_SECRET=preview-secret-$(openssl rand -base64 32)
NEXTAUTH_URL=https://visadocs-preview.vercel.app

# Storage (opcional)
CLOUDFLARE_R2_BUCKET=visadocs-preview-storage

# Debug
NODE_ENV=development
DEBUG=visadocs:*
```

---

## Checklist de Preview

### Antes do Deploy
- [ ] Build local funciona (`npm run build`)
- [ ] Testes unitários passando (`npm test`)
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível
- [ ] Storage configurado (se necessário)

### Após o Deploy
- [ ] Health check OK (`/api/health`)
- [ ] Página principal carrega
- [ ] Login funciona
- [ ] POPs listam corretamente
- [ ] Upload de arquivos funciona
- [ ] Relatórios geram corretamente
- [ ] Responsividade OK
- [ ] Performance aceitável (< 3s)

---

## URLs de Preview Exemplos

### Vercel Preview
```
Main: https://visadocs-360-mvp.vercel.app
Staging: https://visadocs-staging.vercel.app
Feature: https://visadocs-abc123.vercel.app
```

### Railway Preview
```
Production: https://visadocs-production.railway.app
Staging: https://visadocs-staging.railway.app
```

### Custom Domain Preview
```
Preview: https://preview.visadocs.com
Staging: https://staging.visadocs.com
```

---

## Troubleshooting

### Build Falha
```bash
# Limpar cache
rm -rf .next node_modules package-lock.json
npm install

# Verificar dependências
npm audit

# Build detalhado
npm run build -- --verbose
```

### Banco Não Conecta
```bash
# Testar conexão
npx prisma db pull

# Verificar string de conexão
echo $DATABASE_URL

# Testar com psql
psql "$DATABASE_URL" -c "SELECT 1;"
```

### Variáveis de Ambiente
```bash
# Verificar no Vercel
vercel env ls

# Verificar no Railway
railway variables list

# Testar localmente
echo $NEXTAUTH_SECRET
```

---

## Monitoramento de Preview

### Logs em Tempo Real
```bash
# Vercel logs
vercel logs --follow

# Railway logs
railway logs --follow
```

### Performance
```bash
# Testar load
curl -w "@curl-format.txt" -o /dev/null -s "$PREVIEW_URL"

# Lighthouse
npx lighthouse "$PREVIEW_URL" --output html --output-path ./lighthouse-report.html
```

---

## Próximos Passos

1. **Executar script de preview rápido**
2. **Testar checklist completo**
3. **Compartilhar URL com equipe**
4. **Coletar feedback**
5. **Ajustar conforme necessário**
6. **Promover para produção quando aprovado**

Este guia permite visualizar o projeto em ambiente de produção real antes do deploy final, garantindo qualidade e identificação de issues antecipadamente.
