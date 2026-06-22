# Mapa das implementacoes ativas

Atualizado em 2026-06-22. Base de producao: commit `50248d39cdbb3271dac1f487ae006df87431aa00`.

Este documento resume o que esta ativo no MVP e serve como ponto de partida para manutencao, QA, novos PRs e handoff tecnico.

## Fluxos documentais

### Biblioteca de POPs

- Menu autenticado para acervo de POPs.
- Organizacao por pastas e subpastas seguindo a origem do acervo importado.
- Redundancias removidas na exibicao: a tela ja representa a Biblioteca de POPs, portanto os caminhos devem iniciar em grupos como `POPs Drogarias` ou `POPs para Farmacias de Manipulacao`.
- Documentos da biblioteca podem compor RAG/camada canonica, servir como referencia para o assistente interno e originar treinamentos quando aplicavel.

### RQ's e MBP

- Menu autenticado para Registros da Qualidade, Manuais de Boas Praticas e anexos.
- Documentos organizados por arvore documental e vinculaveis a trilhas de conformidade.
- MBP e anexos relevantes sao tratados como referencia operacional e insumo para assistente/RAG.

### Controle de Qualidade

- Menu/trilha propria para material de Controle de Qualidade.
- Conteudos importados de `conteudo_modular.md`, `index.html` e materiais relacionados devem ficar fora da pasta generica de POPs quando seu uso principal for treinamento, quiz ou conformidade de CQ.
- Todos os conteudos de CQ elegiveis devem gerar treinamento, quiz e evidencia/certificacao de conclusao.

### Nao Conformidades e CAPA

- Fluxo de Nao Conformidades ativo.
- Todas as ocorrencias de CAPA devem aparecer como `CAPA (Acao Corretiva e Preventiva)`.
- CAPA permanece como trilha de qualidade, nao como certificacao sanitaria automatica.

## Treinamentos e certificados

Ativo em producao pela migracao `20260622090000_training_certificates_printing`.

Recursos principais:

- Conclusao de treinamento com rastreabilidade.
- Quiz com pontuacao, nota minima e status.
- Certificado emitido apos conclusao quando os criterios forem atingidos.
- Download de certificado.
- Minha Trilha e Minha Pasta para colaborador.
- Alertas de treinamento pendente.

Modelos de dados relevantes:

- `Certificado`
- `AlertaTreinamento`
- `DocumentoImpressaoLog`
- Relacionamentos entre colaborador, treinamento, quiz, documento e tenant.

Endpoints ativos de referencia:

- `/api/treinamentos/[id]/concluir`
- `/api/treinamentos/trilha`
- `/api/usuarios/[id]/certificados`
- `/api/certificados/[id]/download`
- `/api/alertas`

## Impressao controlada

Recurso ativo para documentos editaveis da biblioteca.

Objetivo:

- Permitir impressao/download controlado.
- Registrar usuario, documento, tenant, motivo/status e trilha de auditoria.
- Suportar consulta posterior dos logs.

Endpoints ativos de referencia:

- `/api/biblioteca/[id]/imprimir`
- `/api/biblioteca/logs-impressao`

## Gestao, fiscalizacao e evidencias

Recursos ativos:

- Pasta Central de Gestao.
- Dashboard fiscal.
- Evidencias e logs para apoio operacional.

Endpoints de referencia:

- `/api/gestao/pasta-central`
- `/api/fiscal/dashboard`

## RAG, assistente e geracao assistida

Ativo como camada de conhecimento documental/canonica:

- Importacao de documentos para biblioteca e camada canonica.
- Chunks para busca interna.
- Assistente tecnico com base documental.
- Geracao assistida de POPs sob demanda, sempre como minuta auxiliar.

Regra de negocio:

- POP gerado sob demanda entra na esteira operacional existente.
- Admin/RT define criterio de treinamento emergencial ou ordinario.
- Uso operacional depende de revisao e aprovacao do Responsavel Tecnico.

Documentos tecnicos relacionados:

- `docs/canonical-knowledge-layer-blueprint.md`
- `docs/canonical-knowledge-layer-phase-1-migration-plan.md`
- `docs/canonical-knowledge-layer-phase-2-api-plan.md`

## Pendencias conhecidas

- Remover ou arquivar apenas com PR dedicado: Farmacotecnica, PDFs vazios e RQs de Planejamento Mensal.
- Confirmar duplicidades remanescentes oriundas da importacao em lote antes de exclusao definitiva.
- Evoluir monitoramento legislativo com crawler/inbox de alertas se for priorizado no roadmap.
