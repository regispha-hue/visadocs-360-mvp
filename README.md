# VISADOCS 360 MVP

SaaS B2B multi-tenant para gestao documental, POPs, treinamentos, evidencias de qualidade e apoio operacional para farmacias.

## Estado atual

Producao atualizada em 2026-06-22 no commit `50248d39cdbb3271dac1f487ae006df87431aa00`.

Implementacoes ativas documentadas:

- [Mapa das implementacoes ativas](docs/active-implementation-map.md)
- [Higiene do repositorio](docs/repository-hygiene.md)
- [Runbook de deploy e migracoes](docs/production-deploy-and-migration-runbook.md)
- [Politica de posicionamento regulatorio](docs/regulatory-positioning-policy.md)

## Sobre

VISADOCS 360 e uma plataforma auxiliar para:

- Gestao de POPs e documentos controlados
- Biblioteca documental com acervo hierarquico, busca e trilha RAG/canonica
- Treinamentos internos, quizzes, certificados e rastreabilidade
- RQ's, MBP, anexos e Controle de Qualidade
- Nao Conformidades e CAPA (Acao Corretiva e Preventiva)
- Impressao controlada de documentos editaveis da biblioteca
- Alertas, fiscalizacao interna, pasta central de gestao e evidencias
- VISA Assistente e geracao assistida de POPs com revisao do RT/Admin

## Tech Stack

- **Framework:** Next.js 15 App Router
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js multi-tenant com controle por papeis
- **UI:** Tailwind CSS + Shadcn/Radix UI
- **Charts:** Recharts
- **Storage:** AWS S3 ou adaptador equivalente configurado
- **Documentos:** PDF/DOCX com adaptadores internos e trilha de auditoria

## Modulos principais

| Modulo | Status |
|---|---|
| Dashboard | Ativo |
| POPs | Ativo |
| Biblioteca de POPs | Ativo, com pastas/subpastas e documentos editaveis |
| RQ's e MBP | Ativo, organizado por categorias documentais |
| Controle de Qualidade | Ativo como trilha propria com treinamentos e quizzes |
| Treinamentos | Ativo, com conclusao, quiz e certificados |
| Colaboradores | Ativo, com Minha Pasta e Minha Trilha |
| Progresso LMS | Ativo |
| Relatorios | Ativo |
| Nao Conformidades / CAPA | Ativo |
| VISA Assistente | Ativo como assistente interno documental |

## Papeis

- `SUPER_ADMIN` - Administracao global
- `ADMIN` - Administracao da farmacia/tenant
- `RT` - Responsavel Tecnico
- `OPERADOR` - Operacao/colaborador

## Setup

```bash
yarn install
cp .env.example .env
yarn prisma generate
yarn prisma migrate dev
yarn dev
```

## Deploy

Deploy em Vercel com migracoes Prisma aplicadas por `prisma migrate deploy`.

Para producao, consulte `docs/production-deploy-and-migration-runbook.md` antes de executar alteracoes de schema.

## Posicionamento regulatorio

O VISADOCS 360 e uma ferramenta auxiliar para gestao documental, treinamentos internos e organizacao de evidencias de qualidade.

A plataforma nao certifica conformidade sanitaria, nao representa aprovacao institucional da Anvisa e nao substitui a revisao, adaptacao e aprovacao do Responsavel Tecnico.

Diretriz interna aplicavel: `docs/regulatory-positioning-policy.md`.

## Licenca

Proprietario - VISADOCS (c) 2026
