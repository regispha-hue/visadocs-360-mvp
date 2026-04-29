# RELATÓRIO COMPLETO DO PROJETO VISADOCS

## Visão Geral

O VISADOCS é uma plataforma SaaS B2B multi-tenant para gestão de compliance em farmácias de manipulação, focada em POPs (Procedimentos Operacionais Padrão), treinamentos e conformidade regulatória.

### Stack Tecnológico Principal

- **Frontend**: Next.js 14 com App Router
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI + Shadcn/ui
- **Linguagem**: TypeScript
- **Gerenciamento de Estado**: Zustand + Jotai
- **Storage**: AWS S3 + Azure Storage
- **PDF Generation**: jsPDF + jsPDF-autotable

---

## Estrutura de Pastas e Arquivos

```
visadocs-360-mvp/
|-- app/                          # Next.js App Router
|   |-- (dashboard)/              # Dashboard principal
|   |-- api/                      # API Routes
|   |   |-- auth/                 # Autenticação
|   |   |-- pops/                 # POPs
|   |   |-- treinamentos/         # Treinamentos
|   |   |-- colaboradores/        # Colaboradores
|   |   |-- materias-primas/      # Matérias-primas
|   |   |-- lotes/                # Lotes
|   |   |-- fornecedores/         # Fornecedores
|   |   |-- documentos/           # Documentos
|   |   |-- quizzes/              # Quizzes
|   |   |-- relatorios/           # Relatórios
|   |   |-- auditoria-fiscalizacao/ # Auditorias
|   |   |-- verificacao-pratica/   # Verificação prática
|   |   |-- risco/                # Gestão de risco
|   |   |-- upload/               # Upload de arquivos
|   |   |-- progresso/            # Progresso
|   |   |-- certificados/         # Certificados
|   |   |-- signup/               # Cadastro
|   |   |-- farmacias/            # Farmácias
|   |   |-- auditoria/            # Auditoria
|   |-- cadastro/                 # Página de cadastro
|   |-- login/                    # Página de login
|   |-- globals.css               # Estilos globais
|   |-- layout.tsx                # Layout principal
|   |-- page.tsx                  # Página inicial
|
|-- components/                   # Componentes React
|   |-- ui/                       # Componentes UI (shadcn/ui)
|   |-- forms/                    # Formulários
|   |-- charts/                   # Gráficos
|   |-- layout/                   # Layout components
|
|-- lib/                          # Bibliotecas e utilitários
|   |-- anvisa-monitor.ts         # Monitoramento ANVISA
|   |-- anvisa-web-scraper.ts     # Web scraping ANVISA
|   |-- pop-auto-updater.ts       # Atualização automática de POPs
|   |-- relatorio-fiscalizacao.ts # Relatórios de fiscalização
|   |-- erp-integration.ts        # Integração com ERPs
|   |-- white-label-system.ts    # Sistema white-label
|   |-- gap-analysis-ai.ts        # Gap analysis com IA
|   |-- regulatory-rag-agent.ts   # Agente regulatório RAG
|   |-- compliance-automation.ts  # Automação de compliance
|   |-- audit.ts                  # Sistema de auditoria
|   |-- auth-options.ts           # Configurações de autenticação
|   |-- db.ts                     # Configuração do Prisma
|   |-- s3.ts                     # Configuração AWS S3
|   |-- aws-config.ts             # Configuração AWS
|   |-- certificado-template.ts   # Templates de certificados
|   |-- docx-mp-generator.ts      # Gerador de DOCX
|   |-- docx-pop-generator.ts     # Gerador de POPs em DOCX
|   |-- types.ts                  # Tipos TypeScript
|   |-- utils.ts                  # Utilitários
|   |-- validations.ts            # Validações
|
|-- prisma/                       # Schema e migrações do Prisma
|   |-- schema.prisma             # Schema do banco
|   |-- migrations/                # Migrações
|   |-- seed.ts                   # Dados iniciais
|
|-- public/                       # Arquivos estáticos
|   |-- icons/                    # Ícones
|   |-- images/                   # Imagens
|   |-- templates/                # Templates de documentos
|
|-- scripts/                      # Scripts de automação
|   |-- seed.ts                   # Seed do banco
|
|-- types/                        # Definições de tipos
|   |-- api.ts                    # Tipos da API
|   |-- auth.ts                   # Tipos de autenticação
|
|-- hooks/                        # Hooks React
|   |-- useAuth.ts                # Hook de autenticação
|   |-- useApi.ts                 # Hook de API
|
|-- kb_docs/                      # Base de conhecimento
|   |-- normas/                   # Normas regulatórias
|   |-- templates/                # Templates
|
|-- pops_rag/                     # Sistema RAG para POPs
|   |-- embeddings/               # Embeddings
|   |-- vectors/                  # Vetores
|
|-- pops_kits/                    # Kits de POPs
|   |-- templates/                # Templates
|   |-- exemplos/                 # Exemplos
|
|-- nexoritia/                    # Sistema de autenticação criptográfica
|-- nexoritia-analysis/           # Análise do sistema
|-- nexoritia-evolution/          # Evolução do sistema
|-- nexoritia-os/                # Sistema operacional
|-- nexoritia-visadocs-integration/ # Integração
|
|-- .env.example                  # Exemplo de variáveis de ambiente
|-- .gitignore                    # Arquivos ignorados pelo Git
|-- README.md                     # Documentação do projeto
|-- package.json                  # Dependências e scripts
|-- tsconfig.json                 # Configuração TypeScript
|-- tailwind.config.ts            # Configuração Tailwind
|-- next.config.js                # Configuração Next.js
|-- components.json               # Configuração shadcn/ui
|-- postcss.config.js             # Configuração PostCSS
```

---

## Banco de Dados (PostgreSQL + Prisma)

### Schema Principal

#### Models Principais

**Tenant** (Farmácias)
```prisma
model Tenant {
  id                 String             @id @default(uuid())
  nome               String
  cnpj               String             @unique
  responsavel        String
  email              String             @unique
  telefone           String
  endereco           Json
  status             TenantStatus       @default(PENDENTE)
  subscriptionStatus SubscriptionStatus @default(TRIAL)
  trialEndsAt        DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  users              User[]
  pops               Pop[]
  colaboradores      Colaborador[]
  treinamentos       Treinamento[]
  auditLogs          AuditLog[]
  materiasPrimas     MateriaPrima[]
  lotes              Lote[]
  fornecedores       Fornecedor[]
  documentos         Documento[]
  quizzes            Quiz[]
}
```

**User** (Usuários do sistema)
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      UserRole @default(OPERADOR)
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Pop** (Procedimentos Operacionais Padrão)
```prisma
model Pop {
  id                  String     @id @default(uuid())
  codigo              String
  titulo              String
  descricao           String
  setor               String
  validadoEm          DateTime?
  implantadoEm        DateTime?
  dataRevisao         DateTime?
  validadeAnos        Int?
  literaturaConsultada String[]
  status              PopStatus  @default(RASCUNHO)
  tenantId            String
  tenant              Tenant     @relation(fields: [tenantId], references: [id])
  treinamentos        Treinamento[]
  naoConformidades    NaoConformidade[]
  documentos          Documento[]
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt
}
```

**Colaborador** (Colaboradores da farmácia)
```prisma
model Colaborador {
  id          String            @id @default(uuid())
  nome        String
  email       String
  funcao      String
  registro    String?
  status      ColaboradorStatus @default(ATIVO)
  tenantId    String
  tenant      Tenant            @relation(fields: [tenantId], references: [id])
  treinamentos Treinamento[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}
```

**Treinamento** (Treinamentos realizados)
```prisma
model Treinamento {
  id              String             @id @default(uuid())
  dataTreinamento DateTime           @default(now())
  instrutor       String
  status          TreinamentoStatus  @default(PENDENTE)
  avaliacao       Float?
  popId           String
  pop             Pop                @relation(fields: [popId], references: [id])
  colaboradorId   String
  colaborador     Colaborador        @relation(fields: [colaboradorId], references: [id])
  tenantId        String
  tenant          Tenant             @relation(fields: [tenantId], references: [id])
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}
```

**MateriaPrima** (Matérias-primas)
```prisma
model MateriaPrima {
  id             String              @id @default(uuid())
  codigo         String
  nome           String
  descricao      String
  categoria      String
  unidadeMedida  String
  estoqueMinimo  Float?
  status         MateriaPrimaStatus  @default(ATIVO)
  tenantId       String
  tenant         Tenant              @relation(fields: [tenantId], references: [id])
  lotes          Lote[]
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
}
```

**Lote** (Lotes de matérias-primas)
```prisma
model Lote {
  id                String      @id @default(uuid())
  numeroLote        String
  loteInterno       String?
  dataFabricacao    DateTime?
  dataValidade      DateTime
  dataRecebimento   DateTime    @default(now())
  quantidade        Float
  quantidadeAtual   Float
  precoUnitario     Float
  notaFiscal        String?
  status            LoteStatus  @default(QUARENTENA)
  materiaPrimaId    String
  materiaPrima      MateriaPrima @relation(fields: [materiaPrimaId], references: [id])
  tenantId          String
  tenant            Tenant      @relation(fields: [tenantId], references: [id])
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

**Fornecedor** (Fornecedores)
```prisma
model Fornecedor {
  id        String   @id @default(uuid())
  nome      String
  cnpj      String
  email     String
  telefone  String
  endereco  String
  contato   String
  ativo     Boolean  @default(true)
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Documento** (Documentos do sistema)
```prisma
model Documento {
  id        String         @id @default(uuid())
  titulo    String
  tipo      DocumentoTipo
  arquivo   String
  versao    String
  popId     String?
  pop       Pop?           @relation(fields: [popId], references: [id])
  tenantId  String
  tenant    Tenant         @relation(fields: [tenantId], references: [id])
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}
```

**AuditLog** (Logs de auditoria)
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  action    String
  entity    String
  entityId  String
  userId    String
  userName  String
  details   Json
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
}
```

#### Enums

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN_FARMACIA
  RT
  ANALISTA_CQ
  OPERADOR
}

enum TenantStatus {
  PENDENTE
  ATIVO
  SUSPENSO
  CANCELADO
}

enum SubscriptionStatus {
  TRIAL
  ATIVO
  SUSPENSO
  CANCELADO
}

enum PopStatus {
  RASCUNHO
  ATIVO
  ARQUIVADO
}

enum ColaboradorStatus {
  ATIVO
  INATIVO
}

enum TreinamentoStatus {
  PENDENTE
  EM_AVALIACAO
  CONCLUIDO
}

enum DocumentoTipo {
  RQ
  MBP
  ANEXO
}

enum MateriaPrimaStatus {
  ATIVO
  INATIVO
  DESCONTINUADO
}

enum LoteStatus {
  QUARENTENA
  APROVADO
  REPROVADO
  VENCIDO
  EM_USO
  ESGOTADO
}
```

---

## Dependências Principais

### Dependências de Produção

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/s3-request-presigner": "^3.0.0",
    "@azure/storage-blob": "^12.0.0",
    "@next-auth/prisma-adapter": "1.0.7",
    "@prisma/client": "6.7.0",
    "@radix-ui/react-*": "1.x.x",
    "@tanstack/react-query": "5.0.0",
    "bcryptjs": "2.4.3",
    "chart.js": "4.4.9",
    "class-variance-authority": "0.7.0",
    "date-fns": "3.6.0",
    "dayjs": "1.11.13",
    "dotenv": "16.5.0",
    "jsonwebtoken": "9.0.2",
    "jspdf": "^4.2.1",
    "jspdf-autotable": "^5.0.7",
    "lodash": "4.17.21",
    "lucide-react": "0.446.0",
    "next": "14.2.28",
    "next-auth": "4.24.11",
    "plotly.js": "2.35.3",
    "react": "18.2.0",
    "react-chartjs-2": "5.3.0",
    "react-hook-form": "7.53.0",
    "react-hot-toast": "2.4.1",
    "zod": "3.23.8",
    "zustand": "5.0.3"
  }
}
```

### Dependências de Desenvolvimento

```json
{
  "devDependencies": {
    "@types/*": "latest",
    "eslint": "9.24.0",
    "eslint-config-next": "15.3.0",
    "postcss": "8.4.30",
    "prisma": "6.7.0",
    "tailwindcss": "3.3.3",
    "ts-node": "10.9.2",
    "tsx": "4.20.3",
    "typescript": "5.2.2"
  }
}
```

---

## APIs e Endpoints

### Autenticação
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Cadastro
- `GET /api/auth/session` - Sessão atual
- `POST /api/auth/signout` - Logout

### POPs
- `GET /api/pops` - Listar POPs
- `POST /api/pops` - Criar POP
- `GET /api/pops/[id]` - Detalhes do POP
- `PUT /api/pops/[id]` - Atualizar POP
- `DELETE /api/pops/[id]` - Excluir POP

### Treinamentos
- `GET /api/treinamentos` - Listar treinamentos
- `POST /api/treinamentos` - Criar treinamento
- `PUT /api/treinamentos/[id]` - Atualizar treinamento

### Colaboradores
- `GET /api/colaboradores` - Listar colaboradores
- `POST /api/colaboradores` - Criar colaborador
- `PUT /api/colaboradores/[id]` - Atualizar colaborador

### Matérias-Primas
- `GET /api/materias-primas` - Listar matérias-primas
- `POST /api/materias-primas` - Criar matéria-prima
- `PUT /api/materias-primas/[id]` - Atualizar matéria-prima

### Lotes
- `GET /api/lotes` - Listar lotes
- `POST /api/lotes` - Criar lote
- `PUT /api/lotes/[id]` - Atualizar lote

### Fornecedores
- `GET /api/fornecedores` - Listar fornecedores
- `POST /api/fornecedores` - Criar fornecedor
- `PUT /api/fornecedores/[id]` - Atualizar fornecedor

### Documentos
- `GET /api/documentos` - Listar documentos
- `POST /api/documentos` - Criar documento
- `GET /api/documentos/[id]/download` - Download de documento

### Relatórios
- `GET /api/relatorios/compliance` - Relatório de compliance
- `GET /api/relatorios/fiscalizacao` - Relatório de fiscalização
- `GET /api/relatorios/gap-analysis` - Relatório de gap analysis

### Upload
- `POST /api/upload` - Upload de arquivos

### Auditoria
- `GET /api/auditoria/logs` - Logs de auditoria
- `POST /api/auditoria/registro` - Registrar auditoria

---

## Variáveis de Ambiente

### .env.example

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Azure Storage (opcional)
AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
AZURE_STORAGE_CONTAINER=your-container-name

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoramento ANVISA (opcional)
ANVISA_API_URL=https://api.anvisa.gov.br
ANVISA_API_KEY=your-anvisa-api-key

# ERP Integration (opcional)
OUROFORMULAS_API_URL=https://api.ouroformulas.com.br
OUROFORMULAS_API_KEY=your-ouroformulas-api-key

# White Label (opcional)
WHITE_LABEL_LOGO_URL=https://your-domain.com/logo.png
WHITE_LABEL_PRIMARY_COLOR=#0066cc
WHITE_LABEL_COMPANY_NAME=Your Company
```

---

## Configuração de Deploy

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/visadocs
      - NEXTAUTH_SECRET=your-secret-here
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=visadocs
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## Scripts Úteis

### Scripts do package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx --require dotenv/config scripts/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

### Scripts de Deploy

```bash
# Build para produção
npm run build

# Gerar client Prisma
npx prisma generate

# Migrar banco de dados
npx prisma migrate deploy

# Iniciar aplicação
npm start
```

---

## Funcionalidades Implementadas

### 1. Sistema Multi-Tenant
- Gestão de múltiplas farmácias
- Isolamento completo de dados
- Configurações individuais por tenant

### 2. Gestão de POPs
- Criação e edição de POPs
- Validação e aprovação
- Controle de versões
- Geração em PDF/DOCX

### 3. Sistema de Treinamentos
- Cadastro de colaboradores
- Treinamentos por POP
- Avaliação de aprendizado
- Certificados automáticos

### 4. Controle de Qualidade
- Gestão de matérias-primas
- Controle de lotes
- Fornecedores
- Documentos técnicos

### 5. Auditoria e Compliance
- Logs completos de auditoria
- Relatórios de conformidade
- Gap analysis automático
- Monitoramento ANVISA

### 6. Recursos Avançados
- Monitoramento regulatório (RAG)
- Atualização automática de POPs
- Integração com ERPs
- Sistema white-label
- Automação de compliance

---

## Guia de Migração

### 1. Backup dos Dados

```bash
# Backup do banco PostgreSQL
pg_dump -h host -U user -d dbname > visadocs_backup.sql

# Backup dos arquivos
tar -czf visadocs_files.tar.gz public/ uploads/
```

### 2. Configuração do Novo Ambiente

```bash
# Clonar repositório
git clone <repositorio>
cd visadocs-360-mvp

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com novas configurações

# Gerar client Prisma
npx prisma generate

# Migrar banco de dados
npx prisma migrate deploy

# Restaurar dados (se necessário)
psql -h new_host -U user -d new_db < visadocs_backup.sql

# Iniciar aplicação
npm run dev
```

### 3. Configuração de Produção

```bash
# Build para produção
npm run build

# Configurar PM2 (opcional)
pm2 start npm --name "visadocs" -- start

# Configurar Nginx (opcional)
# Configurar SSL
# Configurar backup automático
```

---

## Requisitos de Infraestrutura

### Mínimo Recomendado
- **CPU**: 2 vCPUs
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **Banco**: PostgreSQL 15
- **Node.js**: 18.x ou superior

### Produção Recomendado
- **CPU**: 4 vCPUs
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **Banco**: PostgreSQL 15 com backup
- **Load Balancer**: Nginx ou similar
- **CDN**: Para assets estáticos
- **Monitoramento**: Prometheus + Grafana

---

## Considerações de Segurança

1. **Autenticação**: NextAuth.js com JWT
2. **Autorização**: Role-based access control
3. **Validação**: Zod schemas
4. **SQL Injection**: Prisma ORM protege contra
5. **XSS**: React sanitiza automaticamente
6. **CSRF**: NextAuth.js inclui proteção
7. **Upload**: Validação de tipos e tamanhos
8. **Logs**: Auditoria completa de todas as ações

---

## Monitoramento e Manutenção

### Logs
- Logs de aplicação em `/var/log/visadocs/`
- Logs de auditoria no banco de dados
- Logs de erro em serviços externos

### Backup
- Backup diário do banco de dados
- Backup semanal dos arquivos
- Retenção de 30 dias

### Monitoramento
- Health check em `/api/health`
- Métricas de performance
- Alertas de erro

---

## Suporte e Documentação

### Documentação Adicional
- `README.md` - Visão geral
- `PROGRESS_REPORT.md` - Relatório de progresso
- `POPS_RAG_ANALYSIS.md` - Análise RAG
- `POPS_RAG_IMPLEMENTATION_SUMMARY.md` - Implementação RAG

### Contato
- Documentação técnica nos arquivos do projeto
- Comentários detalhados no código
- Schema completo no Prisma

---

## Próximos Passos

1. **Configurar ambiente de produção**
2. **Migrar dados existentes**
3. **Configurar backups automáticos**
4. **Implementar monitoramento**
5. **Testar todas as funcionalidades**
6. **Treinar equipe de suporte**

Este relatório cobre toda a estrutura atual do VISADOCS, permitindo uma migração completa ou reconstrução do zero em qualquer ambiente de hospedagem.
