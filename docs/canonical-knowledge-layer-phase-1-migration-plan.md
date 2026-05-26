# Canonical Knowledge Layer Phase 1 Migration Plan

## Objetivo

Adicionar a base estrutural da Fase 1 da Canonical Knowledge Layer sem IA, embeddings, RAG, APIs novas ou mudanca de UX.

A Fase 1 cria apenas os modelos necessarios para registrar ingestao canonica e documentos canonicos tenant-scoped, preservando os fluxos existentes de biblioteca documental, POPs, treinamentos, auditoria e fiscalizacao.

## Escopo da migration

Modelos adicionados:

- `CanonicalIngestionJob`
- `CanonicalDocument`

Relacionamentos adicionados:

- `Tenant` -> `CanonicalIngestionJob[]`
- `Tenant` -> `CanonicalDocument[]`
- `DocumentaryLibraryItem` -> `CanonicalDocument[]`
- `ApprovedPopVersion` -> `CanonicalDocument[]`
- `CanonicalIngestionJob` -> `CanonicalDocument?`

## Estrategia de status e tipos

O schema atual do projeto usa campos `String` para papeis, status e tipos, e `docs/prisma-baseline-plan.md` registra que enums PostgreSQL foram convertidos para `TEXT` em producao.

Por isso, a Fase 1 nao cria enums Prisma/PostgreSQL. Os valores conceituais abaixo devem ser tratados como constantes de aplicacao em patch futuro:

- `CanonicalIngestionStatus`: `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `SUPERSEDED`
- `CanonicalDocumentStatus`: `ACTIVE`, `ARCHIVED`, `OBSOLETE`, `FAILED`
- `CanonicalDocumentKind`: `LIBRARY_ITEM`, `APPROVED_POP_VERSION`, `LEGACY_DOCUMENT`, `POP_SNAPSHOT`

Essa decisao evita reintroduzir `ALTER TYPE`/enum PostgreSQL e mantem a migration alinhada ao baseline TEXT-safe.

## O que a migration nao faz

- Nao remove tabelas existentes.
- Nao altera fluxo atual de POPs.
- Nao altera fluxo atual da biblioteca documental.
- Nao altera treinamentos, quizzes ou evidencias.
- Nao altera autenticacao, tenant guards ou permissoes.
- Nao cria APIs novas.
- Nao cria telas novas.
- Nao adiciona IA, embeddings ou RAG.
- Nao executa seed.
- Nao grava dados automaticamente.

## Regras de seguranca

- Todo registro canonico deve ter `tenantId`.
- Toda futura ingestao deve ser tenant-safe e fail-closed.
- Erros de ingestao devem usar `errorMessageSafe`, sem segredo, token, URL sensivel, prompt completo ou dado pessoal indevido.
- Documento canonico nao deve sugerir conformidade sanitaria automatica.
- Conteudo gerado a partir dessa camada, em fases futuras, continua sendo minuta/artefato auxiliar ate revisao e aprovacao do Responsavel Tecnico.

## Ordem de aplicacao local

Ambiente local/descartavel recomendado:

1. Confirmar que `DATABASE_URL` aponta para banco local ou descartavel.
2. Confirmar que nao aponta para Neon, producao, preview real ou tenant real.
3. Rodar `yarn prisma format`.
4. Rodar `yarn prisma generate`.
5. Rodar `yarn prisma migrate dev --name canonical_knowledge_layer_phase_1`.
6. Rodar `yarn build`.

## Ordem futura para producao

Antes de producao:

1. Seguir `docs/prisma-baseline-plan.md`.
2. Confirmar backup/snapshot do banco.
3. Confirmar estado de migrations em producao.
4. Nao usar `prisma db push`.
5. Aplicar migration de forma controlada apenas apos decisao explicita de release.
6. Fazer smoke de login, dashboard e rotas criticas.

## Riscos residuais

- A migration adiciona tabelas novas e relacoes opcionais, mas nao popula dados.
- A constraint `@@unique([tenantId, sourceType, sourceId, version])` permite multiplos registros quando `version` for `NULL` no PostgreSQL; futuras ingestoes devem preencher versao quando a origem tiver versionamento relevante ou validar duplicidade em aplicacao.
- Campos `String` exigem validacao de constantes em runtime em patch futuro.
- Fases seguintes devem cuidar de chunking, canon map e RAG sem reutilizar fonte obsoleta.

## Criterios de aceite da Fase 1

- `yarn prisma generate` passa.
- `yarn prisma migrate dev --name canonical_knowledge_layer_phase_1` passa em banco local descartavel.
- `yarn build` passa ou falha por motivo pre-existente documentado.
- Nenhuma API/tela/fluxo funcional e alterado.
- Nenhum seed e executado.
- Migration revisada como aditiva e nao destrutiva.
