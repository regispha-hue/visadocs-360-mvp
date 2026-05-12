# Prisma Baseline Migration Plan

## Contexto

O banco de dados do Visadocs já existe em produção e está estabilizado. Esta baseline migration representa o estado atual do schema, capturado em `prisma/schema.prisma`, sem alterar o banco existente.

## O que é esta baseline

A migration `20260512_baseline_current_schema` é um snapshot do schema atual do banco de dados. Ela foi gerada usando:

```bash
prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

Esta migration **NÃO** deve ser aplicada ao banco de produção, pois o schema já existe lá.

## Estado atual do banco

O banco de produção Neon já possui todas as tabelas, índices e foreign keys definidos no schema. Hotfixes manuais foram aplicados:

- `Tenant.logoUrl` - campo adicionado manualmente
- `Tenant.status` - convertido manualmente de enum PostgreSQL para TEXT
- Enums convertidos para TEXT - para compatibilidade com hotfixes anteriores

## Regras absolutas

### Proibido em produção

- ❌ `prisma db push` - nunca usar em produção
- ❌ `prisma migrate deploy` - antes de `migrate resolve`
- ❌ `prisma migrate dev` - altera o schema local
- ❌ `prisma migrate resolve` - sem backup prévio
- ❌ Qualquer comando que execute SQL no banco

### Permitido

- ✅ `prisma migrate diff` - apenas para gerar arquivos locais
- ✅ `prisma format` - formatação do schema
- ✅ `prisma generate` - gerar client
- ✅ Leitura de schema e migrations

## Próximos passos

### Etapa 1: Commit da baseline

A migration baseline deve ser commitada no repositório para estabelecer o ponto de partida para futuras migrations.

### Etapa 2: migrate resolve (futuro)

Antes de aplicar qualquer migration nova em produção, é necessário:

1. **Fazer backup do banco Neon**
2. Executar `prisma migrate resolve --applied 20260512_baseline_current_schema`

Isso marca a baseline como aplicada no Prisma, sem executar SQL.

### Etapa 3: Migrations futuras

Após o `migrate resolve`, novas migrations podem ser criadas e aplicadas com:

```bash
prisma migrate dev --name nome_da_migration  # desenvolvimento
prisma migrate deploy                       # produção (após resolve)
```

## Estrutura do schema

O schema atual contém:

- **Enum**: `UserRole` (SUPER_ADMIN, ADMIN, OPERADOR)
- **23 tabelas principais**: User, Tenant, Pop, Colaborador, Treinamento, Quiz, Questao, Alternativa, TentativaQuiz, Resposta, Risco, NaoConformidade, Auditoria, AuditoriaRisco, Norma, AlertaNorma, VerificacaoPratica, Documento, Fornecedor, MateriaPrima, PopMateriaPrima, Lote, AuditLog, AuditoriaFiscalizacao
- **2 tabelas de relacionamento**: _RiscoNaoConformidades, _AuditoriaToRisco

## Referências

- [Prisma Migrate Baseline](https://www.prisma.io/docs/concepts/components/prisma-migrate/baseline)
- [Prisma Migrate Resolve](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)
