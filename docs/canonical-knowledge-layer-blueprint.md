# Visadocs Canonical Knowledge Layer v1.1 Blueprint

## 1. Objetivo da camada canonica

A camada canonica de conhecimento do Visadocs v1.1 deve transformar o acervo documental do tenant em uma base governada, rastreavel e reutilizavel para consulta, geracao assistida de minutas, treinamento interno e evidencias operacionais.

Ela nao substitui o Responsavel Tecnico, nao certifica conformidade sanitaria, nao representa aprovacao institucional e nao deve prometer regularizacao automatica. Seu papel e organizar fontes, fragmentos, relacoes e historicos para apoiar decisao humana, revisao RT, versionamento e treinamento.

## 2. Conexao Biblioteca -> POP -> Treinamento -> Quiz -> Evidencia

Fluxo-alvo:

1. Biblioteca documental recebe ou referencia documentos do tenant.
2. Ingestao canonica cria um registro normalizado do documento e seu estado de processamento.
3. Chunking divide o conteudo em fragmentos rastreaveis, sem perder origem, versao e tenant.
4. Canon map cria nos e arestas entre documentos, POPs, temas, riscos, requisitos, treinamentos e evidencias.
5. RAG governado recupera apenas fontes permitidas e registra o que foi usado.
6. Geracao assistida cria minuta de POP sempre como rascunho/artefato auxiliar.
7. RT revisa, aprova ou reprova a minuta.
8. Aprovacao cria ApprovedPopVersion vigente e obsoleta versoes anteriores quando aplicavel.
9. Treinamento nasce apenas de ApprovedPopVersion vigente.
10. Quiz/tentativa registra ciencia, resultado e evidencia interna.
11. Historico permite reconstruir fonte -> fragmento -> minuta -> decisao RT -> versao -> treinamento -> tentativa/evidencia.

## 3. Tabelas existentes reaproveitaveis

| Modelo existente | Uso na v1.1 |
| --- | --- |
| Tenant | Escopo obrigatorio de todos os registros canonicos. |
| User | Autor, revisor, executor e responsavel por eventos. |
| DocumentaryLibraryItem | Entrada documental atual da biblioteca; fonte inicial para ingestao. |
| AssistedPopDraft | Minuta assistida existente; pode ser ligada a recuperacoes RAG e documentos canonicos. |
| AssistedPopDraftSource | Ligacao atual entre minuta e itens de biblioteca; base para manter compatibilidade. |
| Pop | Documento operacional do tenant, com status e conteudo atual. |
| ApprovedPopVersion | Versao aprovada pelo RT, usada como fonte unica para treinamentos. |
| RTApprovalEvent | Decisoes RT sobre aprovacao/reprovacao. |
| DocumentLifecycleEvent | Trilha canonica de eventos documentais e reconstrucoes historicas. |
| Treinamento | Registro interno de treinamento vinculado ao POP/versao aprovada. |
| Quiz, Questao, Alternativa | Estrutura atual de avaliacao. |
| TentativaQuiz, Resposta | Resultado de quiz e evidencia de ciencia/conclusao. |
| AuditoriaFiscalizacao | Superficie de consulta read-only e cronograma operacional. |
| AuditLog | Registro transversal de acoes relevantes. |
| Documento | Acervo documental legado que pode ser migrado ou sincronizado posteriormente. |

## 4. Tabelas novas propostas

As tabelas abaixo sao propostas para uma etapa futura. Este blueprint nao altera schema nem cria migration.

### CanonicalIngestionJob

Controla processamento de documentos por tenant.

Campos sugeridos:

- id
- tenantId
- sourceType: DOCUMENTARY_LIBRARY_ITEM, DOCUMENTO, UPLOAD, POP, EXTERNAL_IMPORT
- sourceId
- status: QUEUED, PROCESSING, COMPLETED, FAILED, SUPERSEDED
- requestedByUserId
- startedAt
- finishedAt
- errorCode
- errorMessageSafe
- metadata
- createdAt
- updatedAt

Regras:

- tenantId obrigatorio;
- erros nao devem expor segredo, URL sensivel ou prompt bruto;
- retry deve criar evento rastreavel.

### CanonicalDocument

Representa a versao canonica normalizada de um documento.

Campos sugeridos:

- id
- tenantId
- libraryItemId
- documentoId
- popId
- approvedPopVersionId
- title
- code
- type
- category
- status: ACTIVE, ARCHIVED, OBSOLETE, FAILED
- version
- sourceHash
- normalizedTextHash
- normalizedTextPreview
- effectiveAt
- obsoleteAt
- createdByUserId
- createdAt
- updatedAt

Regras:

- nao armazenar conteudo sensivel sem necessidade;
- hash serve para deduplicacao e auditoria;
- quando derivado de ApprovedPopVersion, deve preservar a versao exata.

### CanonicalChunk

Fragmento rastreavel de CanonicalDocument.

Campos sugeridos:

- id
- tenantId
- canonicalDocumentId
- chunkIndex
- chunkKey
- text
- textHash
- tokenEstimate
- sectionTitle
- pageStart
- pageEnd
- charStart
- charEnd
- status: ACTIVE, OBSOLETE, REDACTED
- metadata
- createdAt

Regras:

- todo chunk deve apontar para documento canonico;
- chunk obsoleto nao deve ser recuperado para nova geracao, salvo modo historico;
- conteudo recuperado deve respeitar tenant e status.

### CanonNode

No conceitual do mapa canonico.

Campos sugeridos:

- id
- tenantId
- kind: DOCUMENT, POP, APPROVED_VERSION, TRAINING, QUIZ, EVIDENCE, REQUIREMENT, RISK, TOPIC, PROCESS
- label
- normalizedLabel
- entityType
- entityId
- status
- metadata
- createdAt
- updatedAt

Regras:

- no pode representar entidade existente ou conceito extraido;
- nos tecnicos nao devem gerar claim regulatorio.

### CanonEdge

Aresta entre nos canonicos.

Campos sugeridos:

- id
- tenantId
- fromNodeId
- toNodeId
- relation: DERIVES_FROM, CITES, SUPERSEDES, TRAINS_ON, EVIDENCES, RELATES_TO, MITIGATES, REQUIRES_REVIEW
- confidence
- source: SYSTEM, USER, RT, IMPORT
- status
- metadata
- createdByUserId
- createdAt

Regras:

- relacoes usadas em geracao devem ser auditaveis;
- relacoes inferidas por IA devem ser marcadas como auxiliares e revisaveis.

### RagRetrievalLog

Registro de recuperacao de fontes para consulta ou geracao assistida.

Campos sugeridos:

- id
- tenantId
- userId
- purpose: SEARCH, DRAFT_POP, TRAINING_SUPPORT, QUIZ_SUPPORT, AUDIT_VIEW
- queryHash
- queryPreview
- filters
- retrievedChunkIds
- selectedChunkIds
- rejectedReason
- modelProvider
- modelName
- status
- createdAt

Regras:

- nao gravar prompt completo se contiver dado sensivel;
- registrar fontes selecionadas para reconstruir minuta;
- fail-closed quando tenant, status ou permissao nao forem claros.

### GeneratedPopDraft

Camada futura para separar geracao sob demanda do AssistedPopDraft legado.

Campos sugeridos:

- id
- tenantId
- assistedPopDraftId
- popId
- generatedByUserId
- retrievalLogId
- title
- code
- status: RASCUNHO, SUBMITTED_FOR_RT_REVIEW, REJECTED, APPROVED_LINKED
- content
- modelProvider
- modelName
- promptTemplateVersion
- safetyNoticeVersion
- createdAt
- updatedAt

Regras:

- toda saida permanece minuta ate decisao RT;
- deve preservar fontes e template versionado;
- nao deve permitir treinamento direto sem ApprovedPopVersion.

### InternalTrainingEvidence

Criar apenas se TentativaQuiz, Treinamento e registro/PDF atual nao forem suficientes.

Campos sugeridos:

- id
- tenantId
- treinamentoId
- tentativaQuizId
- approvedPopVersionId
- colaboradorId
- evidenceCode
- evidenceType: QUIZ_COMPLETION, PRACTICAL_CHECK, MANUAL_ACK
- status
- issuedAt
- issuedByUserId
- contentHash
- fileUrl
- metadata
- createdAt

Regras:

- linguagem sempre como registro interno/evidencia operacional;
- nunca chamar de certificacao oficial;
- preservar versao aprovada exata usada no treinamento.

## 5. Fluxo por fases

### Fase 1: biblioteca canonica sem IA

Objetivo: criar base canonica rastreavel sem embeddings, RAG ou geracao nova.

Entregas:

- mapear DocumentaryLibraryItem para CanonicalDocument;
- criar job de ingestao manual/sincrono;
- registrar status, hashes, origem e usuario;
- expor leitura tenant-safe;
- registrar DocumentLifecycleEvent.

Aceite:

- documento da biblioteca gera CanonicalDocument;
- falhas ficam registradas sem expor dado sensivel;
- nenhum fluxo atual de POP/treinamento quebra.

### Fase 2: Canonical Chunking v1

Objetivo: fragmentar documentos de forma deterministica e auditavel.

Entregas:

- criar CanonicalChunk;
- estrategia interna de chunking canonico: quebrar texto disponivel em fragmentos rastreaveis;
- camada de armazenamento compativel com FRAG-ALL para futura importacao de FRAG_PACK;
- guardar ordem, secao, hash e status;
- permitir reprocessamento idempotente por sourceHash.

Limite arquitetural: esta fase nao implementa o pipeline completo FRAG-ALL do NexoBook (`scan -> chunk -> classify -> dedupe -> pack`). A integracao futura deve importar, quando apropriado, `corpus_inventory.json`, `corpus_chunks.json`, `corpus_classification.json`, `corpus_deduplication.json` e `frag_pack.json`.

Aceite:

- todo chunk reconstrui sua origem;
- chunks obsoletos nao entram em recuperacao padrao;
- tenant isolation preservado.

### Fase 3: canon map

Objetivo: representar relacoes entre documentos, POPs, treinamentos e evidencias.

Entregas:

- CanonNode e CanonEdge;
- nos para POP, ApprovedPopVersion, Treinamento, Quiz e Evidencia;
- arestas DERIVES_FROM, TRAINS_ON, EVIDENCES e SUPERSEDES;
- eventos de ciclo documental para criacao/atualizacao de relacoes.

Aceite:

- ciclo completo pode ser reconstruido pelo mapa;
- relacoes inferidas ficam diferenciadas de relacoes confirmadas por usuario/RT.

### Fase 4: RAG governado

Objetivo: recuperar conteudo somente de fontes permitidas, ativas e rastreaveis.

Entregas:

- RagRetrievalLog;
- filtros por tenant, status, tipo, versao e permissao;
- criterio minimo de fonte util mantido;
- logs de chunks recuperados e usados.

Aceite:

- toda resposta/geracao aponta para fontes;
- recuperacao falha fechada se contexto for insuficiente;
- nenhum segredo ou dado cross-tenant e exposto.

### Fase 5: geracao de POP sob demanda

Objetivo: criar minutas de POP a partir de RAG governado.

Entregas:

- GeneratedPopDraft ou extensao controlada de AssistedPopDraft;
- templates versionados;
- aviso regulatorio obrigatorio;
- submissao para RT sem bypass.

Aceite:

- minuta nasce em RASCUNHO;
- RT gate continua obrigatorio;
- fontes e retrieval log ficam vinculados ao draft.

### Fase 6: treinamento + quiz automatico

Objetivo: sugerir treinamento e quiz a partir de ApprovedPopVersion vigente.

Entregas:

- geracao assistida de questoes como rascunho;
- revisao humana antes de ativar quiz;
- evidencia interna vinculada a tentativa aprovada;
- obsolescencia quando nova versao do POP exige retraining.

Aceite:

- treinamento nunca nasce de minuta;
- quiz automatico nao vira avaliacao ativa sem revisao;
- evidencia usa linguagem de registro interno.

### Fase 7: Notarius/RADAR

Objetivo: camada futura de monitoramento e apoio a revisao documental.

Entregas:

- RADAR: alertas de inconsistencias, lacunas e vencimentos;
- Notarius: assistente de preparacao documental com fontes;
- fila de revisao para RT/admin;
- registro de decisoes e justificativas.

Aceite:

- alertas sao auxiliares, nao conclusoes de conformidade;
- usuario autorizado decide e registra acao;
- todo alerta tem origem e trilha.

## 6. Primeiro patch tecnico recomendado

Primeiro patch apos este documento:

**Criar especificacao e migration plan para Fase 1, sem implementar RAG.**

Escopo recomendado:

- adicionar spec de CanonicalDocument e CanonicalIngestionJob;
- definir contratos de leitura/ingestao tenant-safe;
- preparar migration-safe plan seguindo `docs/prisma-baseline-plan.md`;
- nao criar embeddings, IA, RAG ou geracao nova ainda;
- manter app runtime intacto ate a migration ser revisada.

Arquivos provaveis do primeiro patch tecnico:

- `specs/002-canonical-knowledge-layer/spec.md`
- `specs/002-canonical-knowledge-layer/plan.md`
- `specs/002-canonical-knowledge-layer/tasks.md`
- futura migration Prisma somente apos aceite do plano.

## 7. Riscos e limites regulatorios

Riscos principais:

- tratar documento canonico como garantia de conformidade;
- recuperar fonte obsoleta em geracao nova;
- gerar POP com fonte insuficiente;
- misturar dados entre tenants;
- registrar prompt, segredo, token ou dado pessoal indevido;
- treinar colaborador em minuta nao aprovada;
- chamar evidencia interna de certificacao oficial;
- gerar quiz automatico sem revisao humana;
- alterar schema sem migration segura.

Limites obrigatorios:

- todo conteudo gerado e minuta/artefato auxiliar ate revisao RT;
- toda versao usada em treinamento deve ser ApprovedPopVersion vigente;
- toda recuperacao deve ser tenant-scoped e registrada;
- todo dado de origem deve manter relacao com documento, versao, usuario e data/hora;
- textos publicos e autenticados devem manter posicionamento prudente.

## 8. Criterios de aceite da v1.1

Aceite minimo para v1.1:

- Fase 1 entregue com CanonicalIngestionJob e CanonicalDocument tenant-safe;
- migration validada em Postgres local descartavel antes de deploy;
- nenhum uso de `prisma db push` em producao;
- ingestao de DocumentaryLibraryItem existente sem quebrar biblioteca atual;
- eventos DocumentLifecycleEvent para ingestao, sucesso, falha e obsolescencia;
- logs sem segredos e sem dados cross-tenant;
- auth/tenant guards preservados;
- copy regulatoria prudente preservada;
- quickstart de QA atualizado;
- rollback e riscos documentados.

Aceite ampliado, se Fases 2 e 3 entrarem no mesmo ciclo:

- chunks reconstruiveis por documento e versao;
- canon map reconstruindo Biblioteca -> POP -> Treinamento -> Quiz -> Evidencia;
- nenhum chunk obsoleto usado em fluxo padrao;
- relacoes inferidas marcadas como auxiliares/revisaveis.

Fora do aceite inicial:

- embeddings em producao;
- RAG generativo amplo;
- geracao automatica de quiz ativo;
- Notarius/RADAR operacional;
- qualquer promessa de conformidade sanitaria automatica.
