# Production Deploy and Migration Runbook

## Objetivo

Este runbook define o fluxo seguro para releases de producao do Visadocs quando houver migrations Prisma.

## Politica atual

- O deploy da Vercel nao executa `prisma migrate deploy` automaticamente hoje.
- Migrations de producao devem ser tratadas como etapa operacional controlada.
- Nunca usar `prisma db push` em producao.
- Nao liberar uso de API ou feature nova que dependa de tabela nova antes de confirmar a migration.

## Fluxo recomendado

1. Revisar o PR, incluindo `prisma/schema.prisma` e `prisma/migrations/**/migration.sql`.
2. Confirmar que a migration e aditiva ou que o plano de rollback foi aprovado.
3. Fazer merge do PR.
4. Disparar/confirmar deploy production da Vercel.
5. Aplicar migration de forma controlada:

```bash
yarn prisma migrate deploy
```

6. Validar a tabela `_prisma_migrations`.
7. Validar a existencia das tabelas/indices esperados.
8. Fazer smoke production.
9. Liberar o uso da API ou fluxo novo somente apos as validacoes.

## Validacoes obrigatorias

Depois de aplicar migrations, confirmar:

- `_prisma_migrations` contem a migration esperada com `finished_at` preenchido.
- A migration nao aparece com rollback ou erro.
- As tabelas novas existem quando aplicavel.
- As rotas publicas respondem sem `500`.
- Rotas protegidas continuam redirecionando/bloqueando sem sessao.
- APIs novas sem sessao retornam `401` ou `403`, nunca `500`.

## Exemplo Canonical Knowledge Layer

Para a migration `20260526130947_canonical_knowledge_layer_phase_1`, as validacoes esperadas sao:

- `_prisma_migrations` contem `20260526130947_canonical_knowledge_layer_phase_1`.
- Tabela `CanonicalDocument` existe.
- Tabela `CanonicalIngestionJob` existe.
- `POST /api/canonical/ingestion-jobs` sem sessao retorna `401` ou `403`.
- Smoke production:
  - `/`
  - `/login`
  - `/cadastro`
  - `/dashboard`
  - `/api/auth/session`

## Comandos proibidos em producao

```bash
prisma db push
yarn prisma db push
```

## Observacoes

- Nao imprimir segredos, `DATABASE_URL`, tokens ou cookies em logs ou chats.
- Confirmar o ambiente alvo antes de qualquer comando com escrita.
- Se o deploy production subir antes da migration, tratar a release como incompleta ate a validacao do banco.
