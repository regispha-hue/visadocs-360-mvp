\# Canonical Knowledge Layer v1.5 Checkpoint



\## Status geral



A v1.5 da Canonical Knowledge Layer foi fechada como Ponte Canonico para Minuta POP Assistida, sem IA generativa, sem aprovacao automatica e sem geracao de POP vigente. Entrega o primeiro elo operacional entre a camada canonica e a producao documental do tenant.



\## Implementado



\- Endpoint `POST /api/pops/assisted-drafts/from-canonical-sources` (PR #48).



\- Criacao de `Pop` em status RASCUNHO a partir de chunks canonicos selecionados.



\- Criacao de `AssistedPopDraft` em status RASCUNHO com mesmo escopo do Pop.



\- Criacao de `AssistedPopDraftCanonicalSource` para cada chunk usado (rastreabilidade canonica).



\- Registro de `AuditLog` para a operacao de criacao da minuta.



\- Registro de `DocumentLifecycleEvent` para a entidade Pop criada.



\- Vinculo opcional com `RagRetrievalLog` quando a minuta nasce de uma consulta canonica.



\- Hotfix de compatibilidade com schema real de producao (PR #49): preenchimento de `setor`, `dataRevisao`, `responsavel` e `objetivo` no `Pop.create`.



\- Tag de versao publicada: `v1.5.0-canonical-assisted-pop-draft` apontando para o commit `42ae38e` no `main`.



\## Permissoes validadas



\- `ADMIN` pode criar minuta assistida (validado por contrato no codigo).



\- `RT` pode criar minuta assistida (validado por contrato no codigo).



\- `OPERADOR` permanece bloqueado (403 por contrato).



\- Sem sessao retorna 401 (validado em smoke producao).



\- Regras de tenant permanecem aplicadas


## Correcao retroativa (2026-06-11)

Esta secao registra correcao posterior ao fechamento original da v1.5.

### Imprecisao identificada

A secao "Riscos residuais" deste checkpoint, e a release notes da v1.5.0 publicada em https://github.com/regispha-hue/visadocs-360-mvp/releases/tag/v1.5.0-canonical-assisted-pop-draft, afirmaram que "nao existe caminho legitimo via API para aprovar tenant PENDENTE para ATIVO".

Essa afirmacao esta incorreta.

### Verdade

O endpoint POST /api/farmacias/[id]/aprovar existe no repositorio desde o commit fundador do MVP (commit 6b011e2, 12/abr/2026) e foi refinado pelo PR #13 "fix: validate tenant approval preconditions" (commit 65c8fa7, mergeado em 13/mai/2026).

Esta presente em todas as tags v1.0 ate v1.5 e foi confirmadamente deployado em producao no commit 42ae38e (Vercel state=success, smoke producao retorna HTTP 401 sem sessao).

Funcionalidades reais do endpoint:
- Autenticacao via getServerSession e role SUPER_ADMIN.
- Validacao de tenant existe, esta em PENDENTE, tem email e responsavel validos.
- Transacao atomica: muda Tenant.status para ATIVO e cria usuario ADMIN com senha temporaria via bcrypt.
- Registra AuditLog com AUDIT_ACTIONS.TENANT_APPROVED.
- Dispara emailProvider (stub ConsoleEmailProvider em producao, nao falha).

### Causa-raiz do falso-negativo

A auditoria executada durante a sessao da v1.5 usou PowerShell Get-Content sobre paths contendo colchetes (app/api/farmacias/[id]/...). O PowerShell interpretou os colchetes como wildcard pattern e retornou ItemNotFound mesmo com o arquivo presente no disco. A conclusao precipitada foi "endpoint nao existe", quando a leitura correta seria via Test-Path -LiteralPath e Get-Content -LiteralPath.

Confirmacao posterior em 11/jun/2026 com -LiteralPath e git ls-tree mostrou o endpoint presente em todas as tags v1.* e no build de producao (.next/server/app/api/farmacias/[id]/aprovar/route.js).

### Consequencias praticas

- Issue #50 (v1.6-A: PUT /aprovar) foi fechada em 11/jun/2026 como duplicate da funcionalidade existente. Comentario completo em https://github.com/regispha-hue/visadocs-360-mvp/issues/50.
- Issue #51 (v1.6-B: criacao de RT) permanece aberta para reavaliacao apos QA happy path da v1.5.
- O caminho feliz autenticado da v1.5 sempre foi tecnicamente viavel em producao. QA retroativo sera executado em sessao subsequente.

### Licao aprendida (processo)

Em qualquer auditoria futura sobre paths que contem caracteres especiais do shell (colchetes, asteriscos, interrogacao), usar:
- Test-Path -LiteralPath em PowerShell
- aspas duplas em bash para preservar literal
- git ls-tree como fonte de verdade sobre o que esta versionado, antes de confiar em Get-ChildItem ou ls

Manter este principio fixo: filesystem listing pode ter falso-negativo silencioso, git tree nao.
