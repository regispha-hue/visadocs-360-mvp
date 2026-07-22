# Auditoria de hardening - 2026-07-22

## Escopo

Auditoria corretiva focada em isolamento multi-tenant, permissões críticas, integridade documental, higiene de repositório e prontidão de MVP do VISADOCS 360.

## Correções aplicadas

### Isolamento multi-tenant

- Removidos fallbacks perigosos `tenantId || "default"` nas APIs:
  - `app/api/auditoria-fiscalizacao/route.ts`
  - `app/api/verificacao-pratica/route.ts`
  - `app/api/risco/route.ts`
  - `app/api/pops/rag/route.ts`
- Criações em fornecedores, colaboradores, matérias-primas e lotes passaram a usar `requireTenantId()`.
- Regra resultante: `SUPER_ADMIN` pode informar tenant explicitamente; demais perfis usam somente o tenant da sessão.

### Permissões críticas

- `app/api/upload/presigned/route.ts` agora exige papel autorizado para upload.
- Upload público fica restrito a `SUPER_ADMIN`, `ADMIN` e `RT`.
- Upload passa a validar tipo de arquivo permitido e tamanho máximo informado de 25 MB.
- Publicação de certificado/laudo em CQ foi restrita a `SUPER_ADMIN`, `ADMIN` e `RT`.
- Vínculo de fornecedor em matéria-prima/lote agora valida que o fornecedor pertence ao mesmo tenant.

### Integridade documental

- Adicionado helper `lib/integrity.ts` para gerar SHA-256.
- Criação e edição de itens da biblioteca documental registram metadados de integridade nos eventos/auditoria:
  - `contentHash`
  - `fileReferenceHash`
  - `fileName`
  - `algorithm: sha256`
- A solução evita migração de banco neste hardening e usa a trilha documental existente.

### Higiene do repositório

- Removidos artefatos locais gerados/legados:
  - `ABACUS_DEPLOY.zip`
  - `tsconfig.tsbuildinfo`
- `ABACUS_DEPLOY/` foi preservado porque ainda é referenciado por `pops_rag/nexoritia_integration.py`.

## Varreduras executadas

- Busca por `tenantId || "default"` em `app/api` e `lib`: sem ocorrências após correção.
- Busca por `data.tenantId || user.tenantId` em `app/api`: sem ocorrências após correção.
- Busca por campos públicos sensíveis:
  - `certificadoPublic`
  - `laudoPublic`
  - `isPublic`
  Todos os pontos críticos encontrados foram protegidos por papel.

## Restrições ainda existentes

- Algumas rotas antigas ainda usam `getServerSession` diretamente. Não foram classificadas como bloqueio nesta rodada, mas devem migrar progressivamente para `getCurrentUser()` e `requireTenantId()`.
- `ABACUS_DEPLOY/` permanece como dependência histórica do RAG/Nexoritia. Antes de apagar, é necessário substituir a integração ou comprovar que o modo atual não depende desse código.
- O Radar ANVISA real, tarefas recorrentes ambientais e scorecard executivo seguem como evoluções de produto, não como correções de bloqueio deste hardening.
- A integridade documental foi registrada em trilha de auditoria; uma etapa futura pode adicionar colunas/indexes próprios se houver decisão de migração.

## Veredito

Classificação após validação técnica:

- MVP demo: pronto, desde que o build passe.
- Produção restrita: aceitável para piloto controlado com tenants conhecidos, usuários monitorados e revisão humana do RT/Admin.
- Produção plena: ainda não recomendada sem radar regulatório real, hardening completo de todas as rotas legadas, rate limiting, monitoramento operacional e política formal de backup/restore.
