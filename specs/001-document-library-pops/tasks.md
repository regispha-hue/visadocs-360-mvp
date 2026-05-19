---

description: "Implementation tasks for 001-document-library-pops"
---

# Tasks: Biblioteca documental com POPs assistidos

**Input**: `specs/001-document-library-pops/plan.md`

**Scope rule**: This file defines implementation tasks only. Do not implement code
while generating these tasks.

**Constitution guardrails**: Preserve tenant isolation, auth/authz, audit trail,
document integrity, RT approval, migration safety, prudent regulatory copy and
delivery evidence.

**Original schema fact**: before implementation, `prisma/schema.prisma` declared
`UserRole` as `SUPER_ADMIN`, `ADMIN`, `OPERADOR`. Post-implementation remediation
normalized `User.role` as TEXT-safe to match `docs/prisma-baseline-plan.md`; the
`RT` role is accepted by application authorization guards without depending on
`ALTER TYPE UserRole` in production.

**Prisma baseline rule**: Follow `docs/prisma-baseline-plan.md`. Do not use
`prisma db push` in production. Production `migrate deploy` is blocked until the
baseline is resolved as documented.

## Phase 0: Pre-Runtime Verification

**Purpose**: Verify current state before changing runtime code.

- [X] T001 [P] Snapshot current Prisma role and schema baseline
  - Arquivos prováveis: `prisma/schema.prisma`, `docs/prisma-baseline-plan.md`
  - Objetivo: Confirmar que `UserRole` contém apenas `SUPER_ADMIN`, `ADMIN`, `OPERADOR` e registrar a regra de baseline.
  - Critério de aceite: A lacuna do papel `RT` está anotada em `specs/001-document-library-pops/quickstart.md` antes de qualquer gate de aprovação.
  - Comando de verificação: `rg -n "enum UserRole|SUPER_ADMIN|ADMIN|OPERADOR|RT" prisma/schema.prisma docs/prisma-baseline-plan.md`

- [X] T002 [P] Mapear superfícies atuais de tenant isolation em POPs e treinamentos
  - Arquivos prováveis: `app/api/pops/route.ts`, `app/api/pops/[id]/route.ts`, `app/api/treinamentos/route.ts`
  - Objetivo: Identificar onde `tenantId`, `SUPER_ADMIN` e filtros server-side já existem.
  - Critério de aceite: Riscos de bypass ou uso de `tenantId` vindo do body/query estão listados em `specs/001-document-library-pops/quickstart.md`.
  - Comando de verificação: `rg -n "tenantId|SUPER_ADMIN|getServerSession|Sem permissão|Acesso negado" app/api/pops app/api/treinamentos`

- [X] T003 [P] Mapear trilha de auditoria existente
  - Arquivos prováveis: `lib/audit.ts`, `app/api/pops/route.ts`, `app/api/treinamentos/route.ts`
  - Objetivo: Confirmar ações de audit log já existentes e lacunas para geração, revisão, aprovação, versão e vínculo com treinamento.
  - Critério de aceite: Lista de novas ações de auditoria necessárias está registrada em `specs/001-document-library-pops/quickstart.md`.
  - Comando de verificação: `rg -n "AUDIT_ACTIONS|createAuditLog|POP_|TREINAMENTO_|QUIZ_" lib app/api`

- [X] T004 [P] Conferir copy regulatória antes de UI
  - Arquivos prováveis: `docs/regulatory-positioning-policy.md`, `README.md`, `specs/001-document-library-pops/plan.md`
  - Objetivo: Extrair termos permitidos/proibidos para minuta, artefato auxiliar, RT, evidência interna e claims Anvisa.
  - Critério de aceite: Checklist de copy prudente está registrado em `specs/001-document-library-pops/quickstart.md`.
  - Comando de verificação: `rg -n "certifica|Anvisa|Responsável Técnico|minuta|registro interno|conformidade automática|habilitação" docs README.md specs/001-document-library-pops`

- [X] T005 [P] Inventariar rotas e telas prováveis sem alterar código
  - Arquivos prováveis: `app/api/`, `app/(dashboard)/dashboard/`, `lib/`
  - Objetivo: Confirmar caminhos existentes e diretórios novos necessários para biblioteca, drafts, aprovação e histórico.
  - Critério de aceite: Lista de arquivos prováveis neste `tasks.md` permanece compatível com a árvore atual.
  - Comando de verificação: `Get-ChildItem -Recurse -File app,lib,prisma | Select-Object -ExpandProperty FullName`

## Phase 1: Modelo de Dados e Migration-Safety

**Purpose**: Planejar e aplicar mudanças de schema de forma reversível/testável localmente.

- [X] T006 Resolver estratégia migration-safe para papel RT antes de aprovação
  - Arquivos prováveis: `prisma/schema.prisma`, `lib/types.ts`, `docs/prisma-baseline-plan.md`, `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Decidir entre adicionar `RT` ao enum Prisma ou normalizar papel/permite RT via estrutura compatível com produção, considerando que produção já teve enums convertidos para TEXT.
  - Critério de aceite: Estratégia documentada, impacto de produção descrito, rollback/mitigação definido, e nenhum gate de aprovação depende de `RT` antes disso.
  - Comando de verificação: `rg -n "enum UserRole|UserRole|ROLE_LABELS|ROLE_PERMISSIONS|RT" prisma/schema.prisma lib/types.ts docs/prisma-baseline-plan.md specs/001-document-library-pops/quickstart.md`

- [X] T007 Modelar estados documentais e constantes sem dependências novas
  - Arquivos prováveis: `lib/types.ts`
  - Objetivo: Definir estados para rascunho, em revisão, rejeitado, aprovado, vigente/ativo, obsoleto e arquivado.
  - Critério de aceite: Estados são explícitos, reutilizáveis e não prometem conformidade regulatória.
  - Comando de verificação: `rg -n "STATUS_POP|RASCUNHO|REVISAO|APROV|VIGENTE|OBSOLETO|ARQUIVADO" lib/types.ts`

- [X] T008 Modelar entidades de acervo, minuta, fontes, versões aprovadas e eventos
  - Arquivos prováveis: `prisma/schema.prisma`
  - Objetivo: Adicionar modelos compatíveis com `data-model.md`: `DocumentaryLibraryItem`, `AssistedPopDraft`, `AssistedPopDraftSource`, `ApprovedPopVersion`, `RTApprovalEvent`, `DocumentLifecycleEvent`.
  - Critério de aceite: Todos os modelos possuem `tenantId`, relações necessárias, timestamps, status e vínculos de versão/auditoria.
  - Comando de verificação: `rg -n "model DocumentaryLibraryItem|model AssistedPopDraft|model ApprovedPopVersion|model RTApprovalEvent|model DocumentLifecycleEvent|tenantId" prisma/schema.prisma`

- [X] T009 Modelar vínculo futuro de treinamento com versão aprovada
  - Arquivos prováveis: `prisma/schema.prisma`
  - Objetivo: Adicionar referência de `Treinamento` para `ApprovedPopVersion` preservando `popId` existente.
  - Critério de aceite: Treinamentos novos podem apontar para versão aprovada exata sem quebrar treinamentos antigos.
  - Comando de verificação: `rg -n "model Treinamento|approvedPopVersion|ApprovedPopVersion" prisma/schema.prisma`

- [X] T010 Definir índices e constraints tenant-safe
  - Arquivos prováveis: `prisma/schema.prisma`
  - Objetivo: Adicionar índices por `tenantId`, `status`, `type/category`, `popId`, `draftId`, `approvedPopVersionId` onde necessário.
  - Critério de aceite: Consultas de biblioteca, histórico, aprovação e treinamento têm índices compatíveis com tenant isolation.
  - Comando de verificação: `rg -n "@@index|@@unique|tenantId|status|popId|draftId|approvedPopVersionId" prisma/schema.prisma`

- [ ] T011 Gerar migration local sem usar produção
  - Arquivos prováveis: `prisma/migrations/`, `prisma/schema.prisma`
  - Objetivo: Criar migration SQL revisável para modelos e papel RT após validar baseline, e executar `migrate dev` somente em banco local descartável confirmado.
  - Critério de aceite: Migration criada em `prisma/migrations/` com SQL revisável; `prisma db push` não foi usado; execução de `yarn prisma migrate dev --name document_library_pops` registrada quando houver DB local descartável.
  - Status atual: SQL criado e revisado; `migrate dev` pendente por ausência de DB local descartável confirmado.
  - Comando de verificação pendente: `yarn prisma migrate dev --name document_library_pops`

- [X] T012 Validar Prisma client após migration
  - Arquivos prováveis: `prisma/schema.prisma`, `node_modules/.prisma/`
  - Objetivo: Garantir que schema compila e tipos Prisma são gerados.
  - Critério de aceite: `yarn prisma generate` conclui sem erro.
  - Comando de verificação: `yarn prisma generate`

- [X] T013 Registrar evidência de migration e rollback/mitigação
  - Arquivos prováveis: `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Documentar nome da migration, comandos executados, risco de baseline, rollback/mitigação e proibição de `db push` em produção.
  - Critério de aceite: Quickstart contém evidência clara e próxima ação para produção.
  - Comando de verificação: `rg -n "document_library_pops|baseline|rollback|mitigação|db push|migrate" specs/001-document-library-pops/quickstart.md`

## Phase 2: Autorização, Auditoria e Helpers Compartilhados

**Purpose**: Criar base comum antes de API/UI.

- [X] T014 Normalizar labels e permissões do papel RT
  - Arquivos prováveis: `lib/types.ts`
  - Objetivo: Atualizar labels/permissões para RT revisar/aprovar POP, gerenciar acervo e vincular treinamentos, sem tratar `ADMIN` como RT implicitamente.
  - Critério de aceite: `RT` aparece nos labels/permissões e approval gate pode checar papel explicitamente.
  - Comando de verificação: `rg -n "RT|Responsável Técnico|ROLE_LABELS|ROLE_PERMISSIONS|approve|aprovar" lib/types.ts`

- [X] T015 Criar schemas Zod para payloads críticos
  - Arquivos prováveis: `lib/validations.ts`
  - Objetivo: Validar criação de item de biblioteca, geração assistida, aprovação RT e criação de treinamento com versão aprovada.
  - Critério de aceite: Schemas rejeitam payload sem tenant/role implícito, status inválido ou tentativa de aprovação fora do fluxo.
  - Comando de verificação: `rg -n "document|library|draft|approval|approvedPopVersion|z\\.object" lib/validations.ts`

- [X] T016 Criar guard helper para sessão, tenant e papel
  - Arquivos prováveis: `lib/auth-guards.ts`
  - Objetivo: Centralizar `getServerSession`, tenant selecionado por `SUPER_ADMIN`, tenant do usuário comum e papel necessário.
  - Critério de aceite: Rotas futuras podem chamar `lib/auth-guards.ts` sem confiar em `tenantId` do body para usuários comuns; `lib/auth-options.ts` permanece apenas como configuração NextAuth.
  - Comando de verificação: `rg -n "getServerSession|tenantId|SUPER_ADMIN|require|role|RT" lib/auth-guards.ts lib/auth-options.ts`

- [X] T017 Criar helper append-only de evento documental
  - Arquivos prováveis: `lib/audit.ts`
  - Objetivo: Registrar eventos de criação, geração, revisão, aprovação, obsolescência, vínculo com treinamento e evidência.
  - Critério de aceite: Helper grava `tenantId`, entidade, ação, usuário, status, versão e detalhes não sensíveis.
  - Comando de verificação: `rg -n "DocumentLifecycleEvent|create.*Lifecycle|APPROVED|GENERATED|LINKED_TO_TRAINING|EVIDENCE_CREATED" lib/audit.ts`

- [X] T018 Adicionar ações de auditoria específicas
  - Arquivos prováveis: `lib/audit.ts`
  - Objetivo: Expandir `AUDIT_ACTIONS` para biblioteca, draft, aprovação RT, versão e vínculo de treinamento.
  - Critério de aceite: Ações existem sem remover ações antigas.
  - Comando de verificação: `rg -n "LIBRARY|DRAFT|APPROVAL|VERSION|LINKED|POP_" lib/audit.ts`

## Phase 3: API de Biblioteca e Geração Assistida de Minutas

**Purpose**: Entregar US1 com server-side tenant isolation antes da UI.

- [X] T019 Criar rota GET/POST de biblioteca documental
  - Arquivos prováveis: `app/api/document-library/route.ts`
  - Objetivo: Listar/buscar/criar itens do acervo por tenant com filtros de tipo, status e categoria.
  - Critério de aceite: Usuário comum nunca escolhe tenant arbitrário; `SUPER_ADMIN` exige tenant explícito.
  - Comando de verificação: `rg -n "GET|POST|tenantId|SUPER_ADMIN|DocumentaryLibraryItem|createAuditLog" app/api/document-library/route.ts`

- [X] T020 Implementar geração assistida fail-closed
  - Arquivos prováveis: `app/api/pops/assisted-drafts/route.ts`
  - Objetivo: Criar minuta apenas com fontes suficientes do mesmo tenant e nunca retornar prompt/provedor/log interno.
  - Critério de aceite: Sem fontes válidas ou sem ao menos uma fonte com 300 caracteres úteis normalizados retorna erro 422; com fonte útil válida cria `AssistedPopDraft` em rascunho.
  - Status atual: A7 corrigido com bloqueio para conteúdo vazio, ausente, título isolado ou placeholder evidente.
  - Comando de verificação: `rg -n "422|300|conteúdo técnico suficiente|DRAFT|RASCUNHO|sourceIds|tenantId|raw|prompt|provider" app/api/pops/assisted-drafts/route.ts`

- [X] T021 Registrar fontes e eventos da minuta
  - Arquivos prováveis: `app/api/pops/assisted-drafts/route.ts`, `lib/audit.ts`
  - Objetivo: Persistir referências às fontes, versão da fonte e evento `GENERATED`.
  - Critério de aceite: Minuta tem origem rastreável e evento documental/audit log sem dados sensíveis.
  - Comando de verificação: `rg -n "AssistedPopDraftSource|GENERATED|createAuditLog|sourceVersion|snippet" app/api/pops/assisted-drafts/route.ts lib/audit.ts`

- [X] T022 Atualizar UI da biblioteca sem claims indevidos
  - Arquivos prováveis: `app/(dashboard)/dashboard/biblioteca/page.tsx`
  - Objetivo: Mostrar acervo, filtros, ação de gerar minuta e aviso de revisão obrigatória do RT.
  - Critério de aceite: UI usa "minuta/rascunho/auxiliar", não "conforme/aprovado/certificado".
  - Comando de verificação: `rg -n "minuta|rascunho|auxiliar|Responsável Técnico|conform|certific|Anvisa" "app/(dashboard)/dashboard/biblioteca/page.tsx"`

- [X] T023 Atualizar lista de POPs para status documental
  - Arquivos prováveis: `app/(dashboard)/dashboard/pops/page.tsx`, `lib/types.ts`
  - Objetivo: Exibir status documental e origem assistida sem sugerir aprovação antes do RT.
  - Critério de aceite: Drafts/minutas são visualmente distintos de aprovados/vigentes.
  - Comando de verificação: `rg -n "RASCUNHO|REVISAO|APROV|VIGENTE|minuta|status" "app/(dashboard)/dashboard/pops/page.tsx" lib/types.ts`

- [ ] T024 Verificar US1 antes de seguir para aprovação
  - Arquivos prováveis: `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Registrar aceitação de browse/search tenant-safe e criação de minuta.
  - Critério de aceite: Checklist US1 documenta tenant isolation, fail-closed e copy prudente.
  - Status atual: evidência técnica registrada; aceitação manual US1 pendente.
  - Comando de verificação: `rg -n "US1|tenant|fail-closed|minuta|rascunho|RT" specs/001-document-library-pops/quickstart.md`

## Phase 4: Gate de Aprovação RT e Versionamento

**Purpose**: Entregar US2 somente após resolver papel RT.

- [X] T025 Bloquear aprovação por PATCH genérico de POP
  - Arquivos prováveis: `app/api/pops/[id]/route.ts`
  - Objetivo: Impedir que `status` aprovado/vigente seja definido por rota genérica.
  - Critério de aceite: Aprovação/vigência só pode ocorrer por rota dedicada de RT.
  - Comando de verificação: `rg -n "status|APPROVED|APROV|VIGENTE|ATIVO|approve|Sem permissão" "app/api/pops/[id]/route.ts"`

- [X] T026 Criar rota RT-only de aprovação/rejeição
  - Arquivos prováveis: `app/api/pops/[id]/approve/route.ts`
  - Objetivo: Permitir `APPROVED`, `REJECTED`, `CHANGES_REQUESTED` apenas para RT autorizado e tenant correto.
  - Critério de aceite: Usuário sem RT recebe 403; cross-tenant não revela existência de registro.
  - Comando de verificação: `rg -n "POST|RT|403|tenantId|APPROVED|REJECTED|CHANGES_REQUESTED" "app/api/pops/[id]/approve/route.ts"`

- [X] T027 Criar snapshot de versão aprovada de forma atômica
  - Arquivos prováveis: `app/api/pops/[id]/approve/route.ts`, `prisma/schema.prisma`
  - Objetivo: Criar `ApprovedPopVersion` com conteúdo, versão, RT, timestamp e status sem sobrescrever histórico.
  - Critério de aceite: Aprovação cria versão imutável e preserva versões anteriores.
  - Comando de verificação: `rg -n "ApprovedPopVersion|approvedAt|approvedByUserId|transaction|contentSnapshot|obsolete" "app/api/pops/[id]/approve/route.ts" prisma/schema.prisma`

- [X] T028 Registrar eventos e auditoria de aprovação
  - Arquivos prováveis: `app/api/pops/[id]/approve/route.ts`, `lib/audit.ts`
  - Objetivo: Registrar `RTApprovalEvent`, `DocumentLifecycleEvent` e `AuditLog` para cada decisão.
  - Critério de aceite: Eventos incluem usuário, tenant, data/hora, versão, status e decisão.
  - Comando de verificação: `rg -n "RTApprovalEvent|DocumentLifecycleEvent|createAuditLog|approvedAt|decision|version" "app/api/pops/[id]/approve/route.ts" lib/audit.ts`

- [X] T029 Atualizar tela de detalhe do POP para revisão/aprovação
  - Arquivos prováveis: `app/(dashboard)/dashboard/pops/[id]/page.tsx`
  - Objetivo: Mostrar status, versão, aviso de minuta e ações de RT quando permitido.
  - Critério de aceite: Usuário não RT não vê/aciona aprovação; RT vê decisão com aviso prudente.
  - Comando de verificação: `rg -n "RT|aprovar|rejeitar|minuta|rascunho|versão|status" "app/(dashboard)/dashboard/pops/[id]/page.tsx"`

- [X] T030 Atualizar formulário de POP sem permitir bypass
  - Arquivos prováveis: `app/(dashboard)/dashboard/pops/_components/pop-form-dialog.tsx`
  - Objetivo: Permitir edição/revisão sem permitir aprovação direta por usuários não RT.
  - Critério de aceite: Form não envia status aprovado/vigente fora do fluxo dedicado.
  - Comando de verificação: `rg -n "status|APROV|VIGENTE|ATIVO|RT|approve" "app/(dashboard)/dashboard/pops/_components/pop-form-dialog.tsx"`

- [ ] T031 Verificar US2 antes de treinamento
  - Arquivos prováveis: `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Registrar testes manuais de non-RT denial, aprovação RT, versão e auditoria.
  - Critério de aceite: Quickstart registra evidência de que gate RT está funcional antes de vínculo com treinamentos.
  - Status atual: evidência técnica registrada; teste manual non-RT/RT pendente.
  - Comando de verificação: `rg -n "US2|RT|403|aprovação|versão|audit|histórico" specs/001-document-library-pops/quickstart.md`

## Phase 5: Vínculo Futuro com Treinamentos e Evidências

**Purpose**: Entregar US3 com versão aprovada exata.

- [X] T032 Exigir versão aprovada ao criar treinamento
  - Arquivos prováveis: `app/api/treinamentos/route.ts`
  - Objetivo: Bloquear treinamento para POP rascunho, rejeitado, obsoleto ou sem versão aprovada.
  - Critério de aceite: POST retorna 422 quando POP não tem `ApprovedPopVersion` válida.
  - Comando de verificação: `rg -n "approvedPopVersion|422|RASCUNHO|REJECTED|OBSOLETE|tenantId" app/api/treinamentos/route.ts`

- [X] T033 Persistir snapshot de versão no treinamento
  - Arquivos prováveis: `app/api/treinamentos/route.ts`, `prisma/schema.prisma`
  - Objetivo: Salvar `approvedPopVersionId` e metadados suficientes para evidência histórica.
  - Critério de aceite: Alteração futura do POP não altera versão associada ao treinamento antigo.
  - Comando de verificação: `rg -n "approvedPopVersionId|pop.*versao|version|include|select" app/api/treinamentos/route.ts prisma/schema.prisma`

- [X] T034 Preservar vínculo imutável ao editar treinamento
  - Arquivos prováveis: `app/api/treinamentos/[id]/route.ts`
  - Objetivo: Impedir troca silenciosa da versão aprovada depois de criado o treinamento.
  - Critério de aceite: PATCH não altera `approvedPopVersionId` sem fluxo documentado.
  - Comando de verificação: `rg -n "approvedPopVersionId|PATCH|tenantId|Acesso negado|version" "app/api/treinamentos/[id]/route.ts"`

- [X] T035 Filtrar seletor de treinamento por POPs aprovados/vigentes
  - Arquivos prováveis: `app/(dashboard)/dashboard/treinamentos/_components/treinamento-form-dialog.tsx`
  - Objetivo: Mostrar apenas POPs treináveis ou explicar bloqueio para não aprovados.
  - Critério de aceite: UI não permite escolher minuta/rascunho para treinamento operacional.
  - Comando de verificação: `rg -n "approved|APROV|VIGENTE|ATIVO|RASCUNHO|popId" "app/(dashboard)/dashboard/treinamentos/_components/treinamento-form-dialog.tsx"`

- [X] T036 Exibir versão exata e linguagem de registro operacional
  - Arquivos prováveis: `app/(dashboard)/dashboard/treinamentos/page.tsx`
  - Objetivo: Mostrar versão do POP treinado e evitar termos de certificação/conformidade.
  - Critério de aceite: Tela comunica evidência interna, ciência/leitura/avaliação, sem claim sanitário.
  - Comando de verificação: `rg -n "versão|evidência|registro interno|certific|conform|Anvisa" "app/(dashboard)/dashboard/treinamentos/page.tsx"`

- [X] T037 Atualizar geração de evidência/certificado interno
  - Arquivos prováveis: `app/api/certificados/[tentativaId]/route.ts`, `lib/certificado-pdf.ts`, `lib/certificado-template.ts`
  - Objetivo: Incluir versão exata do POP e revisar copy para registro interno, não habilitação/certificação sanitária.
  - Critério de aceite: Documento gerado não usa claims proibidos e carrega versão/tenant/colaborador/data/status.
  - Comando de verificação: `rg -n "certific|registro|versão|POP|tenant|Anvisa|conformidade|habilitação" app/api/certificados lib/certificado-*`

- [ ] T038 Verificar US3 antes de histórico completo
  - Arquivos prováveis: `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Registrar treinamento aprovado-only e evidência com versão exata.
  - Critério de aceite: Quickstart prova bloqueio para rascunho e sucesso para versão aprovada.
  - Status atual: evidência técnica registrada; aceitação manual US3 pendente.
  - Comando de verificação: `rg -n "US3|treinamento|approvedPopVersion|versão exata|rascunho|evidência" specs/001-document-library-pops/quickstart.md`

## Phase 6: Histórico, Auditoria e Status Documental

**Purpose**: Entregar US4 e rastreabilidade ponta a ponta.

- [X] T039 Criar histórico de item da biblioteca documental
  - Arquivos prováveis: `app/api/document-library/[id]/history/route.ts`, `lib/audit.ts`
  - Objetivo: Expor eventos `DocumentLifecycleEvent` para criação/importação, classificação, alteração de metadados, status, fonte/origem, responsável, data/hora, tenant e relação com minutas derivadas.
  - Critério de aceite: Usuário autorizado consegue reconstruir o histórico do item da biblioteca por tenant, item, usuário, status, fonte e data/hora sem ver dados de outro tenant.
  - Comando de verificação: `rg -n "DocumentLifecycleEvent|DocumentaryLibraryItem|tenantId|source|draft|createdAt|userId|metadata" "app/api/document-library/[id]/history/route.ts" lib/audit.ts`

- [X] T040 Criar histórico de minuta gerada
  - Arquivos prováveis: `app/api/pops/assisted-drafts/[id]/history/route.ts`, `lib/audit.ts`
  - Objetivo: Expor criação da minuta, item de biblioteca utilizado, fontes associadas, alteração de metadados, mudança de status, submissão para revisão, decisão do RT, reprovação/aprovação, usuário responsável, data/hora e versão.
  - Critério de aceite: Usuário autorizado consegue reconstruir uma minuta por tenant, minuta, fontes, versão, status, usuário e data/hora.
  - Comando de verificação: `rg -n "DocumentLifecycleEvent|AssistedPopDraft|AssistedPopDraftSource|RTApprovalEvent|tenantId|version|status|review" "app/api/pops/assisted-drafts/[id]/history/route.ts" lib/audit.ts`

- [X] T041 Criar histórico de treinamento e evidência interna
  - Arquivos prováveis: `app/api/treinamentos/[id]/history/route.ts`, `app/api/certificados/[tentativaId]/route.ts`, `lib/audit.ts`
  - Objetivo: Expor criação a partir de versão aprovada, vínculo com POP aprovado exato, participantes, ciência/conclusão, certificado/evidência interna, obsolescência por nova versão e versão usada.
  - Critério de aceite: Usuário autorizado consegue rastrear treinamento/evidência por tenant, treinamento, colaborador, POP aprovado, versão, usuário e data/hora.
  - Comando de verificação: `rg -n "DocumentLifecycleEvent|approvedPopVersionId|Treinamento|EVIDENCE_CREATED|LINKED_TO_TRAINING|tenantId|colaborador|version" "app/api/treinamentos/[id]/history/route.ts" "app/api/certificados/[tentativaId]/route.ts" lib/audit.ts`

- [X] T042 Criar rota de histórico tenant-scoped de POP aprovado
  - Arquivos prováveis: `app/api/pops/[id]/history/route.ts`
  - Objetivo: Retornar versões aprovadas, eventos documentais, aprovações e vínculos relevantes sem vazamento cross-tenant.
  - Critério de aceite: GET exige sessão, checa tenant e retorna eventos ordenados.
  - Comando de verificação: `rg -n "GET|tenantId|ApprovedPopVersion|DocumentLifecycleEvent|RTApprovalEvent|orderBy" "app/api/pops/[id]/history/route.ts"`

- [X] T043 Registrar eventos de vínculo e evidência
  - Arquivos prováveis: `app/api/treinamentos/route.ts`, `app/api/certificados/[tentativaId]/route.ts`, `lib/audit.ts`
  - Objetivo: Criar eventos para treinamento vinculado e evidência gerada.
  - Critério de aceite: Eventos incluem versão aprovada, colaborador/treinamento quando aplicável, tenant e usuário responsável.
  - Comando de verificação: `rg -n "LINKED_TO_TRAINING|EVIDENCE_CREATED|approvedPopVersionId|DocumentLifecycleEvent" app/api/treinamentos app/api/certificados lib/audit.ts`

- [X] T044 Exibir histórico no detalhe do POP
  - Arquivos prováveis: `app/(dashboard)/dashboard/pops/[id]/page.tsx`
  - Objetivo: Mostrar linha do tempo com usuário, data/hora, status, versão e origem.
  - Critério de aceite: Revisor consegue reconstruir lifecycle sem intervenção técnica.
  - Comando de verificação: `rg -n "histórico|timeline|versão|aprov|treinamento|evento|createdAt" "app/(dashboard)/dashboard/pops/[id]/page.tsx"`

- [X] T045 Mostrar treinamentos afetados por nova versão
  - Arquivos prováveis: `app/(dashboard)/dashboard/pops/[id]/page.tsx`, `app/api/pops/[id]/history/route.ts`
  - Objetivo: Indicar treinamentos ligados a versões antigas quando nova versão é aprovada.
  - Critério de aceite: Treinamentos antigos continuam vinculados à versão original e ficam visíveis como afetados/históricos.
  - Status atual: Cobertura técnica aplicada; UI do histórico do POP exibe treinamentos vinculados a versões obsoletas e relação com a versão vigente quando disponível. Aceite manual completo permanece em T047/T048/T054.
  - Comando de verificação: `rg -n "affected|afetad|treinamentos|approvedPopVersionId|obsolete|versão" "app/(dashboard)/dashboard/pops/[id]/page.tsx" "app/api/pops/[id]/history/route.ts"`

- [ ] T046 Integrar histórico documental com logs administrativos
  - Arquivos prováveis: `app/(dashboard)/admin/logs/page.tsx`
  - Objetivo: Expor ou referenciar eventos documentais sem duplicar sistema de auditoria.
  - Critério de aceite: Admin autorizado consegue chegar ao histórico documental/audit log relevante.
  - Status atual: contagem de eventos documentais no admin/logs existe; exposição navegável permanece pendente.
  - Comando de verificação: `rg -n "AuditLog|DocumentLifecycle|histórico|logs|tenantId" "app/(dashboard)/admin/logs/page.tsx"`

- [ ] T047 Verificar reconstrução completa por tenant, documento, versão, usuário e data/hora
  - Arquivos prováveis: `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Validar que biblioteca, minuta, POP aprovado, treinamento e evidência podem ser reconstruídos por tenant, documento, versão, usuário e data/hora.
  - Critério de aceite: Quickstart registra evidência de reconstrução ponta a ponta para todos os tipos de histórico cobertos por FR-010.
  - Status atual: cobertura técnica parcial registrada; reconstrução manual completa pendente.
  - Comando de verificação: `rg -n "FR-010|DocumentLifecycleEvent|tenant|documento|versão|usuário|data/hora|biblioteca|minuta|treinamento|evidência" specs/001-document-library-pops/quickstart.md`

- [ ] T048 Verificar US4 ponta a ponta
  - Arquivos prováveis: `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Registrar lifecycle completo: acervo -> minuta -> RT -> versão -> treinamento -> evidência -> histórico.
  - Critério de aceite: Quickstart documenta resultado e riscos remanescentes.
  - Status atual: cobertura técnica parcial registrada; aceitação manual US4 pendente.
  - Comando de verificação: `rg -n "US4|lifecycle|histórico|acervo|minuta|RT|treinamento|evidência" specs/001-document-library-pops/quickstart.md`

## Phase 7: Testes, Verificações e Evidência Final

**Purpose**: Fechar a entrega com comandos, riscos e provas.

- [X] T049 Rodar geração Prisma
  - Arquivos prováveis: `prisma/schema.prisma`
  - Objetivo: Confirmar client Prisma compatível com schema.
  - Critério de aceite: Comando conclui sem erro ou falha documentada.
  - Comando de verificação: `yarn prisma generate`

- [X] T050 Rodar lint
  - Arquivos prováveis: `app/`, `lib/`, `components/`
  - Objetivo: Identificar erros TypeScript/Next/ESLint introduzidos.
  - Critério de aceite: `yarn lint` passa ou falhas são listadas com plano de correção.
  - Comando de verificação: `yarn lint`

- [X] T051 Verificar ausência de claims proibidos
  - Arquivos prováveis: `app/`, `lib/`, `README.md`, `docs/`
  - Objetivo: Garantir que UI/export/evidência não sugere conformidade automática, Anvisa ou substituição do RT.
  - Critério de aceite: Achados são zero ou corrigidos antes da entrega.
  - Comando de verificação: `rg -n "conformidade automática|aprovado pela Anvisa|homologado pela Anvisa|substitui.*RT|habilitação profissional|certificação sanitária" app lib README.md docs`

- [X] T052 Verificar segredos e dados sensíveis em rotas novas
  - Arquivos prováveis: `app/api/document-library/route.ts`, `app/api/pops/assisted-drafts/route.ts`, `app/api/pops/[id]/approve/route.ts`, `app/api/pops/[id]/history/route.ts`
  - Objetivo: Confirmar que respostas não expõem tokens, env vars, URLs sensíveis, prompts ou logs internos.
  - Critério de aceite: Nenhuma rota retorna segredos, prompts brutos ou dados cross-tenant.
  - Comando de verificação: `rg -n "process\\.env|secret|token|prompt|raw|provider|console\\.log|tenantId" app/api/document-library app/api/pops`

- [ ] T053 Executar verificação manual cronometrada para SC-001
  - Arquivos prováveis: `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Com usuário autorizado, localizar item da biblioteca, iniciar minuta assistida e registrar tempo total do fluxo.
  - Critério de aceite: Fluxo concluído em até 5 minutos e resultado registrado no quickstart/checklist de evidência da feature.
  - Comando de verificação: `rg -n "SC-001|5 minutos|cronometrad|tempo total|usuário autorizado|localizar item|minuta assistida" specs/001-document-library-pops/quickstart.md specs/001-document-library-pops/checklists/requirements.md`

- [ ] T054 Executar aceitação manual completa
  - Arquivos prováveis: `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Validar fluxo com usuários/roles apropriados: biblioteca, minuta, RT, aprovação, treinamento, evidência e histórico.
  - Critério de aceite: Todos os passos manuais relevantes estão marcados com resultado e data.
  - Comando de verificação: `rg -n "Manual acceptance|US1|US2|US3|US4|resultado|verificado" specs/001-document-library-pops/quickstart.md`

- [X] T055 Produzir evidência final da alteração
  - Arquivos prováveis: `specs/001-document-library-pops/quickstart.md`
  - Objetivo: Registrar arquivos modificados, racional técnico, riscos, comandos executados, resultados e próximos passos.
  - Critério de aceite: Evidência final atende a constituição do projeto.
  - Comando de verificação: `git status --short`

## Dependency Order

1. T001-T005 MUST run before runtime changes.
2. T006 MUST complete before T025-T031 approval gate work.
3. T008-T013 MUST complete before API/UI tasks that depend on new models.
4. T014-T018 MUST complete before mutating API routes.
5. T019-T024 deliver US1.
6. T025-T031 deliver US2 and must precede training linkage.
7. T032-T038 deliver US3.
8. T039-T048 deliver US4 and full FR-010 history coverage.
9. T049-T055 close verification and evidence.

## Parallel Opportunities

- T001-T005 are read-only/documentation and can run in parallel.
- T007, T014, T015 and T018 can run after T006 decision is recorded.
- T019 and T022 can be paired after route contract is fixed, but server-side tenant checks lead.
- T026-T028 must be sequential; T029-T030 can follow once approval contract is stable.
- T035-T037 can run after T032 defines the approved version contract.
- T039-T041 can run in parallel after `DocumentLifecycleEvent` semantics are stable.
- T051-T052 can run in parallel during final verification.

## MVP Scope

Minimum viable implementation is T001-T024 plus the smallest RT approval path from
T025-T031. Do not deliver training linkage until RT approval and approved version
snapshots are working.

## Explicit Non-Goals

- Do not add new dependencies unless a task is amended with explicit justification.
- Do not restructure the app, auth system or training module broadly.
- Do not use `prisma db push` in production.
- Do not represent generated POPs as compliant, certified, Anvisa-approved or
ready for operational use before RT approval.
