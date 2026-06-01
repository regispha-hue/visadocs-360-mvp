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

