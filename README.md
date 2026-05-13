# VISADOCS - Gestão de POPs e Treinamentos para Farmácias de Manipulação

## Sobre

VISADOCS é um SaaS B2B multi-tenant para farmácias de manipulação, focado em:
- **Gestão de POPs** (Procedimentos Operacionais Padrão)
- **Treinamentos internos** com rastreabilidade
- **Quizzes e registros internos de treinamento** em PDF
- **Gestão de Matérias-Primas, Lotes e Fornecedores**
- **VISA Assistente** (assistente documental para apoio à consulta interna)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (multi-tenant, role-based)
- **UI:** Tailwind CSS + Shadcn/Radix UI
- **Charts:** Recharts
- **Storage:** AWS S3
- **PDF:** geração de documentos em revisão para independência de fornecedor
- **DOCX:** docx library

## Módulos

| Módulo | Descrição |
|--------|-----------|
| Dashboard | Métricas gerais da farmácia |
| POPs | 162 POPs organizados em 12 setores |
| Biblioteca | Visualização em pastas/accordion |
| Treinamentos | Registro e acompanhamento |
| Quizzes | Avaliações vinculadas a POPs |
| Registros de treinamento | Registros internos em PDF com QR Code |
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

Deploy atual em revisão de portabilidade, conforme política interna de independência de fornecedores.


## Posicionamento regulatório

O VISADOCS 360 é uma ferramenta auxiliar para gestão documental, treinamentos internos e organização de evidências de qualidade.

A plataforma não certifica conformidade sanitária, não representa aprovação institucional da Anvisa e não substitui a revisão, adaptação e aprovação do Responsável Técnico.

Diretriz interna aplicável: `docs/regulatory-positioning-policy.md`.

## Licença

Proprietário - VISADOCS © 2026
