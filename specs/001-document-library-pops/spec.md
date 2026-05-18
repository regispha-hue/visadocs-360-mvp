# Feature Specification: Biblioteca documental com POPs assistidos

**Feature Branch**: `001-document-library-pops`

**Created**: 2026-05-18

**Status**: Draft

**Input**: User description: "Criar biblioteca documental com geração assistida de POPs, revisão obrigatória do RT, aprovação, versionamento e vínculo com treinamentos internos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar acervo e iniciar POP assistido (Priority: P1)

Como Responsável Técnico ou usuário autorizado de um tenant, quero consultar uma
biblioteca documental organizada e iniciar a geração assistida de uma minuta de
POP a partir do acervo, para acelerar a adaptação documental sem tratar o
resultado como documento aprovado.

**Why this priority**: Sem acervo e geração assistida controlada, a feature não
entrega o valor central de apoio documental.

**Independent Test**: Pode ser testada acessando a biblioteca de um tenant,
localizando modelos ou referências, gerando uma minuta de POP e confirmando que a
minuta nasce vinculada ao tenant, ao acervo de origem e ao status de rascunho.

**Acceptance Scenarios**:

1. **Given** um usuário autorizado no tenant e um acervo documental disponível,
   **When** ele busca ou navega pelos documentos, **Then** visualiza somente itens
   do seu tenant e consegue identificar tipo, status, versão e aplicabilidade.
2. **Given** um usuário autorizado selecionando fontes da biblioteca, **When** ele
   solicita a geração assistida de um POP, **Then** o sistema cria uma minuta com
   status de rascunho, fonte rastreável e aviso de que revisão do RT é obrigatória.
3. **Given** uma fonte insuficiente ou indisponível para a geração assistida,
   **When** o usuário tenta gerar uma minuta, **Then** o sistema bloqueia a geração
   ou informa que não há base documental suficiente, sem inventar conteúdo
   regulatório.

---

### User Story 2 - Revisar e aprovar POP como RT (Priority: P1)

Como Responsável Técnico, quero revisar, ajustar e aprovar explicitamente uma
minuta de POP, para que somente documentos revisados possam se tornar vigentes e
entrar no fluxo operacional.

**Why this priority**: A aprovação pelo RT é regra constitucional do produto e
condição para qualquer uso operacional de POPs gerados ou adaptados.

**Independent Test**: Pode ser testada criando uma minuta, tentando usá-la antes
da aprovação, revisando-a como RT, aprovando uma versão e verificando que apenas
a versão aprovada pode ser marcada como vigente.

**Acceptance Scenarios**:

1. **Given** uma minuta de POP em rascunho, **When** um usuário sem papel de RT
   tenta aprovar o documento, **Then** o sistema nega a ação e registra a tentativa
   conforme a política de auditoria aplicável.
2. **Given** uma minuta de POP revisada pelo RT, **When** o RT aprova o documento,
   **Then** o sistema registra responsável, data/hora, versão aprovada, tenant,
   status documental e histórico da alteração.
3. **Given** uma versão aprovada de POP, **When** uma nova edição é iniciada,
   **Then** o sistema preserva a versão aprovada anterior e cria nova minuta sem
   alterar retroativamente registros existentes.

---

### User Story 3 - Vincular POP aprovado a treinamentos internos (Priority: P2)

Como administrador do tenant ou RT, quero vincular POPs aprovados a treinamentos
internos, para registrar ciência, leitura ou avaliação dos colaboradores usando a
versão correta do documento.

**Why this priority**: O vínculo com treinamentos transforma POPs aprovados em
rotina operacional rastreável, preservando evidências internas sem prometer
habilitação profissional ou conformidade automática.

**Independent Test**: Pode ser testada selecionando um POP aprovado, criando um
treinamento, vinculando colaboradores e confirmando que cada registro aponta para
a versão exata do POP treinado.

**Acceptance Scenarios**:

1. **Given** um POP aprovado e vigente, **When** um usuário autorizado cria um
   treinamento, **Then** o sistema permite vincular o treinamento à versão aprovada
   exata do POP.
2. **Given** uma minuta ou POP não aprovado, **When** um usuário tenta vinculá-lo a
   treinamento operacional, **Then** o sistema bloqueia o vínculo e explica que
   apenas documentos aprovados pelo RT podem ser treinados.
3. **Given** um colaborador que concluiu leitura, ciência ou avaliação, **When** o
   registro interno é gerado, **Then** ele mostra tenant, colaborador, POP, versão,
   data/hora, status e responsável, sem declarar certificação sanitária ou
   habilitação profissional autônoma.

---

### User Story 4 - Acompanhar histórico e auditoria documental (Priority: P2)

Como RT, administrador ou auditor interno autorizado, quero consultar histórico,
versões e eventos de cada POP e treinamento vinculado, para reconstruir decisões,
aprovações e registros de ciência quando necessário.

**Why this priority**: Rastreabilidade é requisito transversal para gestão
documental regulatória auxiliar.

**Independent Test**: Pode ser testada alterando status de um POP, aprovando uma
versão, vinculando treinamento e consultando o histórico completo com usuário,
data/hora, status e versão.

**Acceptance Scenarios**:

1. **Given** um POP com múltiplas versões, **When** um usuário autorizado consulta
   o histórico, **Then** visualiza eventos ordenados com responsável, data/hora,
   status, versão e origem da alteração.
2. **Given** um treinamento vinculado a uma versão antiga de POP, **When** uma nova
   versão do POP é aprovada, **Then** os registros anteriores continuam apontando
   para a versão usada no treinamento original.

### Edge Cases

- Tentativa de acessar, buscar, gerar ou exportar documentos de outro tenant deve
  ser bloqueada e não deve revelar existência de dados externos ao tenant atual.
- Minuta gerada com fontes insuficientes deve permanecer bloqueada para aprovação
  até que o usuário revise e complete conteúdo mínimo exigido pelo fluxo.
- Aprovação concorrente da mesma minuta deve resultar em uma única versão aprovada
  ou em conflito claro para revisão humana.
- Remoção, obsolescência ou substituição de fonte do acervo não deve apagar
  histórico nem quebrar vínculo de documentos e treinamentos já registrados.
- Textos de POP, treinamento, certificado interno, evidência ou exportação não
  devem sugerir conformidade sanitária automática, aprovação pela Anvisa ou
  substituição do RT.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a tenant-scoped documentary library where
  authorized users can browse, search, filter and view items by type, status,
  version and applicability.
- **FR-002**: System MUST allow authorized users to start assisted POP drafting
  from selected library items or approved tenant sources.
- **FR-003**: System MUST create every assisted POP output as a draft/minuta with
  traceable source references, tenant, creator, creation date/time and document
  status.
- **FR-004**: System MUST display clear regulatory positioning for assisted POPs:
  auxiliary draft only, subject to RT review and approval, with no automatic
  sanitary compliance claim.
- **FR-005**: System MUST prevent drafts, unreviewed POPs and rejected POPs from
  being marked as vigente or linked to operational training.
- **FR-006**: System MUST allow the RT to review, edit, reject or approve POP
  drafts and record the decision with responsible user, tenant, role, date/time,
  version and status.
- **FR-007**: System MUST preserve immutable historical references for approved
  POP versions used in trainings and records of ciência, leitura or avaliação.
- **FR-008**: System MUST allow authorized users to create internal trainings only
  from RT-approved POP versions.
- **FR-009**: System MUST generate internal operational records for training,
  ciência, leitura or avaliação that identify collaborator, tenant, POP, exact
  version, date/time, status and responsible user.
- **FR-010**: System MUST provide a version and audit history view for each library
  item, generated draft, approved POP and linked training record.
- **FR-011**: System MUST enforce tenant isolation, authentication and authorization
  for library access, generation, review, approval, version history, training
  linkage, records and exports.
- **FR-012**: System MUST prevent exposure of secrets, sensitive URLs, environment
  variables, internal logs, personal data from other tenants, source prompts or
  improper regulatory claims in generated content, records or user-visible errors.
- **FR-013**: System MUST keep obsolete POP versions available for historical
  traceability while preventing their use in new trainings unless explicitly
  allowed by a documented corrective workflow.
- **FR-014**: System MUST let authorized users identify which trainings are
  affected when a new approved POP version supersedes a prior version.
- **FR-015**: System MUST support export or display of evidence as internal
  operational records, not as professional habilitation certificates or sanitary
  compliance certificates.
- **FR-REG-001**: If the feature generates or publishes regulatory/documental
  content, System MUST label it as draft, auxiliary artifact, or operational
  record until RT review and approval.
- **FR-REG-002**: System MUST preserve tenant isolation, authentication,
  authorization, audit trail, and data segregation for all tenant-scoped actions.
- **FR-REG-003**: Critical document, training, evidence, certificate, and AI-assisted
  actions MUST record responsible user, tenant, date/time, version, source event,
  and document status.
- **FR-REG-004**: Public copy, generated text, exports, and documentation MUST NOT
  imply automatic sanitary compliance, RT replacement, Anvisa approval, or legal
  certification beyond internal operational records.

### Key Entities *(include if feature involves data)*

- **Documentary Library Item**: Tenant-scoped source document, model, reference,
  POP base, RQ, manual or supporting material available for search and assisted
  drafting; includes type, title, status, version, tenant and applicability.
- **Assisted POP Draft**: Draft POP generated or adapted from library sources;
  includes tenant, source references, creator, status, review notes and current
  draft version.
- **Approved POP Version**: Specific RT-approved version of a POP; includes code,
  title, version, approval event, effective status and traceability metadata.
- **RT Approval Event**: Review decision made by the Responsável Técnico; includes
  responsible user, role, tenant, date/time, decision, notes and resulting status.
- **Training Assignment**: Internal training tied to an exact approved POP version
  and target collaborators or groups.
- **Training Evidence Record**: Internal operational record of ciência, leitura,
  avaliação or completion; includes collaborator, POP version, tenant, date/time,
  result/status and responsible party.
- **Audit History Entry**: Immutable event describing creation, generation,
  status change, approval, obsolescence, training linkage or export.

### Regulatory, Tenant, and Audit Context *(mandatory when applicable)*

- **Tenant data touched**: Library items, generated drafts, POP versions, approval
  events, training assignments, collaborator records, evidence records, searches,
  filters and exports are tenant-scoped.
- **Roles and approvals**: Authorized operational users may browse and draft;
  admins may organize library and trainings; only RT may approve POPs for
  operational use.
- **Document status lifecycle**: Draft, in review, rejected, approved, current,
  obsolete and archived. Equivalent local labels are acceptable if the distinction
  remains testable.
- **Audit evidence**: Every generation, edit, review, approval, rejection,
  obsolescence, training linkage and evidence generation records actor, tenant,
  timestamp, version, status and source event.
- **Regulatory copy constraints**: All user-facing copy follows
  `docs/regulatory-positioning-policy.md`; generated POPs and training records
  are auxiliary/internal records and must not claim automatic compliance, RT
  replacement or Anvisa approval.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of authorized users can locate a relevant library item and start
  a POP draft in under 5 minutes during acceptance testing.
- **SC-002**: 100% of assisted POP outputs are created with draft/minuta status and
  cannot be used for training before RT approval.
- **SC-003**: 100% of approved POPs include tenant, approving RT, approval date/time,
  version and status in the visible record and audit history.
- **SC-004**: 100% of training evidence records remain linked to the exact approved
  POP version used at the time of training.
- **SC-005**: In tenant isolation testing, users cannot view, search, link, approve
  or export documents, trainings or evidence from another tenant.
- **SC-006**: Reviewers can reconstruct the complete lifecycle of a POP, from
  library source through draft, RT approval, training linkage and evidence record,
  without requesting technical intervention.
- **SC-007**: Regulatory copy review finds zero instances of automatic sanitary
  compliance, Anvisa approval, RT replacement or professional habilitation claims
  in feature screens, generated records and exports.

## Assumptions

- Existing role concepts include at least RT, tenant administrator and operational
  users; role names may map to the product's current terminology.
- The first release focuses on POPs and their training linkage; RQs, manuals and
  other document types may reuse the same lifecycle later.
- Assisted generation depends on tenant library/acervo sources and should fail
  closed when source material is insufficient.
- Training records are internal operational evidence, not certificates of
  professional habilitation or proof of sanitary compliance.
- The feature must preserve existing tenant segregation and audit expectations
  already established in the product.
