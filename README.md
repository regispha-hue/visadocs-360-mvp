# VISADOCS - Gestão de POPs e Treinamentos para Farmácias de Manipulação

## Sobre

VISADOCS é um SaaS B2B multi-tenant para farmácias de manipulação, focado em:
- **Gestão de POPs** (Procedimentos Operacionais Padrão) conforme RDC 67/2007
- **Treinamentos e Compliance** com rastreabilidade completa
- **Quizzes e Certificação** com microcertificados PDF
- **Gestão de Matérias-Primas, Lotes e Fornecedores**
- **VISA Assistente** (Chatbot IA para legislação farmacêutica)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (multi-tenant, role-based)
- **UI:** Tailwind CSS + Shadcn/Radix UI
- **Charts:** Recharts
- **Storage:** AWS S3
- **PDF:** HTML2PDF API (Abacus.AI)
- **DOCX:** docx library

## Módulos

| Módulo | Descrição |
|--------|-----------|
| Dashboard | Métricas gerais da farmácia |
| POPs | 162 POPs organizados em 12 setores |
| Biblioteca | Visualização em pastas/accordion |
| Treinamentos | Registro e acompanhamento |
| Quizzes | Avaliações vinculadas a POPs |
| Certificados | Microcertificados PDF com QR Code |
| Colaboradores | Gestão com "Pasta Pessoal" |
| Documentos | 74 documentos (RQs, MBP, Anexos) |
| Progresso LMS | Analytics por setor e colaborador |
| Matérias-Primas | Fichas técnicas e especificações |
| Lotes | Controle de qualidade e rastreabilidade |
| Fornecedores | Cadastro e qualificação |
| Relatórios | Métricas e gráficos |
| VISA Assistente | Chatbot IA legislação |

## Roles

- `SUPER_ADMIN` - Administrador global
- `ADMIN_FARMACIA` - Administrador da farmácia
- `RT` - Responsável Técnico
- `ANALISTA_CQ` - Analista de Controle de Qualidade
- `OPERADOR` - Operador

## Setup

```bash
# Instalar dependências
yarn install

# Configurar variáveis de ambiente
cp .env.example .env
# Preencher DATABASE_URL, NEXTAUTH_SECRET, etc.

# Gerar Prisma client
yarn prisma generate

# Aplicar schema ao banco
yarn prisma db push

# Rodar seed (opcional)
npx ts-node scripts/seed-pops-lista-mestra.ts

# Desenvolvimento
yarn dev
```

## Deploy

Hospedado em [visadocs.abacusai.app](https://visadocs.abacusai.app)

## Licença

Proprietário - VISADOCS © 2026
