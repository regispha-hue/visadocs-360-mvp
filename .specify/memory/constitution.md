<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template placeholders -> I. Posicionamento Regulatório Auxiliar
- Template placeholders -> II. Minutas Até Revisão e Aprovação do RT
- Template placeholders -> III. Isolamento Multi-Tenant e Controles de Acesso
- Template placeholders -> IV. Rastreabilidade e Status Documental
- Template placeholders -> V. Migrations Seguras e Reproduzíveis
- Template placeholders -> VI. Sigilo, Dados Sensíveis e Claims
- Template placeholders -> VII. Patches Mínimos e Reversíveis
- Template placeholders -> VIII. Comunicação Pública Prudente
- Template placeholders -> IX. Ciclo Documental Assistido
- Template placeholders -> X. Evidência de Alteração
Added sections:
- Controles Obrigatórios de Produto
- Fluxo de Desenvolvimento
Removed sections:
- Nenhuma
Templates requiring updates:
- updated: .specify/templates/plan-template.md
- updated: .specify/templates/spec-template.md
- updated: .specify/templates/tasks-template.md
- not present: .specify/templates/commands/*.md
Follow-up TODOs:
- Nenhum
-->
# Visadocs 360 MVP Constitution

## Core Principles

### I. Posicionamento Regulatório Auxiliar
O Visadocs 360 MVP MUST ser tratado como SaaS regulatório auxiliar para gestão
documental, treinamentos internos, organização de evidências e geração assistida
de minutas. O produto MUST NOT declarar, prometer ou sugerir conformidade
sanitária automática, aprovação institucional, homologação pela Anvisa ou
substituição de julgamento técnico-profissional.

Rationale: a conformidade sanitária depende de avaliação humana, contexto
operacional, responsabilidade técnica e decisões fora do alcance automático do
software.

### II. Minutas Até Revisão e Aprovação do RT
Toda geração de POP, RQ, manual, treinamento, certificado, evidência ou documento
regulatório MUST permanecer como minuta, rascunho, artefato auxiliar ou registro
operacional até revisão e aprovação explícita do Responsável Técnico. Nenhum
artefato assistido por IA ou biblioteca documental MAY ser promovido a vigente,
ativo, aprovado ou treinável sem registrar aprovação do RT.

Rationale: a responsabilidade técnica permanece com o RT e precisa ser refletida
no fluxo, no texto da interface, nos estados documentais e nos registros.

### III. Isolamento Multi-Tenant e Controles de Acesso
Nenhuma alteração MAY quebrar isolamento multi-tenant, autenticação, autorização,
segregação de dados por tenant, trilha de auditoria ou integridade dos registros.
Toda feature que lê, grava, exporta, treina, busca ou gera dados MUST explicitar
como tenant, usuário, papel e permissões são validados.

Rationale: vazamento entre tenants ou bypass de autorização é falha crítica de
produto, segurança e confiança operacional.

### IV. Rastreabilidade e Status Documental
Toda feature crítica MUST prever rastreabilidade, versionamento, logs, histórico
de alterações, usuário responsável, data/hora e status documental. Documentos,
treinamentos, evidências, certificados internos e artefatos gerados MUST preservar
vínculo com versão, tenant, responsável e evento de origem.

Rationale: registros só têm valor operacional quando é possível reconstruir quem
fez o quê, quando, em qual versão e sob qual status.

### V. Migrations Seguras e Reproduzíveis
Alterações de banco MUST ser migration-safe, testáveis localmente e reversíveis
quando viável. Mudanças de schema MUST NOT depender de edição manual não
documentada em produção. Toda migration MUST declarar impacto, estratégia de
rollback ou mitigação, dados afetados e comandos de verificação local.

Rationale: o banco é parte central da integridade documental e multi-tenant; drift
manual não rastreado compromete auditoria e operação.

### VI. Sigilo, Dados Sensíveis e Claims
O sistema MUST NOT expor segredos, tokens, URLs sensíveis, variáveis de ambiente,
dados de tenants, dados pessoais, logs internos ou claims regulatórios indevidos.
Logs, mensagens de erro, exports, PDFs, DOCX, prompts, respostas de IA e
telemetria MUST ser revisados para evitar vazamento de dados ou promessas
regulatórias impróprias.

Rationale: segurança, privacidade e prudência regulatória precisam valer tanto
para código quanto para conteúdo gerado e observabilidade.

### VII. Patches Mínimos e Reversíveis
Mudanças SHOULD ser patches mínimos, incrementais, testáveis e reversíveis.
Overcoding, dependências desnecessárias e reestruturações amplas MUST ser
evitados salvo justificativa explícita no plano ou na evidência final da alteração.

Rationale: escopo controlado reduz regressões em fluxos regulatórios, autenticação,
tenant isolation e documentos já versionados.

### VIII. Comunicação Pública Prudente
Toda alteração pública de texto, marketing, landing page, README ou documentação
MUST preservar posicionamento regulatório prudente: ferramenta auxiliar, não
substituto do RT, não certificadora de conformidade e não representante de
aprovação institucional da Anvisa. Claims proibidos pela política regulatória do
repositório MUST NOT ser introduzidos.

Rationale: a copy pública define expectativa comercial e jurídica do produto; ela
deve ser consistente com as limitações reais do SaaS.

### IX. Ciclo Documental Assistido
Integrações com geração de POP sob demanda, RAG, biblioteca documental,
treinamentos e certificados internos MUST seguir o ciclo: acervo/biblioteca,
geração assistida, revisão do RT, aprovação, versionamento, treinamento e registro
de ciência. Etapas fora dessa sequência MUST ser justificadas e bloqueadas quando
criarem risco de documento não aprovado ser usado como vigente.

Rationale: o ciclo conecta geração assistida, controle documental e treinamento
sem transformar rascunhos em evidência aprovada.

### X. Evidência de Alteração
O agente executor MUST produzir evidência de alteração ao concluir trabalho:
arquivos modificados, racional técnico, riscos, comandos de verificação e próximos
passos. Quando testes ou verificações não forem executados, o motivo MUST ser
registrado.

Rationale: mudanças em software regulatório auxiliar precisam deixar rastro
compreensível para revisão humana e continuidade do projeto.

## Controles Obrigatórios de Produto

- Estados documentais MUST diferenciar rascunho, em revisão, aprovado, vigente,
  obsoleto, rejeitado ou equivalente aplicável ao fluxo.
- Ações de aprovação MUST registrar tenant, usuário, papel, data/hora, versão e
  artefato aprovado.
- Funcionalidades de IA ou geração assistida MUST apresentar o resultado como
  apoio documental e MUST fail closed quando não houver fonte suficiente para
  resposta regulatória.
- Treinamentos e registros de ciência MUST ficar vinculados à versão exata do
  documento aprovado usado no momento do treinamento.
- Exports, PDFs, DOCX, certificados internos e evidências MUST preservar linguagem
  de registro operacional interno, sem sugerir habilitação profissional autônoma.
- Qualquer acesso a dados MUST aplicar segregação por tenant no servidor, não
  apenas na interface.

## Fluxo de Desenvolvimento

- Planos de implementação MUST passar por Constitution Check antes da pesquisa e
  novamente após o design.
- Especificações MUST declarar riscos regulatórios, dados por tenant, papéis
  envolvidos, estados documentais e evidências de auditoria quando aplicável.
- Tarefas MUST incluir verificações de autenticação, autorização, tenant isolation,
  auditoria, versionamento e migrations quando a feature tocar essas superfícies.
- Alterações em banco MUST usar migrations revisáveis e comandos locais
  documentados; edição manual de produção só MAY ocorrer com plano documentado,
  backup, responsável e evidência posterior.
- Alterações públicas de texto MUST ser revisadas contra
  `docs/regulatory-positioning-policy.md`.
- Entregas MUST preferir incrementos pequenos, demonstráveis e reversíveis.

## Governance

Esta constituição prevalece sobre preferências locais, planos de feature e decisões
de implementação quando houver conflito. Exceções MUST ser documentadas no plano
da feature, incluindo risco, alternativa simples rejeitada, mitigação e responsável
pela aprovação.

Amendments MUST atualizar este arquivo, incluir Sync Impact Report, revisar os
templates dependentes de Spec Kit e indicar o tipo de bump semântico. MAJOR remove
ou redefine princípio de forma incompatível; MINOR adiciona ou expande regra
material; PATCH corrige redação sem mudar obrigação.

Toda revisão de PR, implementação por agente ou entrega manual MUST verificar:
tenant isolation, autenticação/autorização, rastreabilidade, migrations, sigilo,
prudência regulatória e evidência final. A política
`docs/regulatory-positioning-policy.md` complementa esta constituição para copy
pública e claims regulatórios.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-18
