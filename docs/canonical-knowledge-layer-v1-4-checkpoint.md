# Canonical Knowledge Layer v1.4 Checkpoint

## Status geral

A v1.4 da Canonical Knowledge Layer foi fechada como Consulta Canonica Auditavel, sem IA generativa, sem embeddings e sem geracao automatica de POP.

## Implementado

- UI de Consulta Canonica em `/dashboard/biblioteca`.
- Consumo do endpoint `POST /api/canonical/retrievals`.
- Busca textual auditavel sobre `CanonicalChunk`.
- Exibicao de trechos encontrados, metadados do chunk e documento de origem.
- Exibicao de `retrievalLogId` para rastreabilidade operacional.
- Estado vazio para busca sem resultado.
- Tratamento de carregamento e erro sem quebrar a pagina.

## Permissoes validadas

- `ADMIN` pode consultar o acervo canonico.
- `RT` pode consultar o acervo canonico.
- `OPERADOR` permanece bloqueado para consulta canonica auditavel.
- Regras de tenant permanecem aplicadas pelo endpoint de retrieval.

## Validacoes realizadas

- QA Preview validado com dataset temporario.
- QA producao validado com dataset temporario.
- Busca com termo existente retornou resultado e `retrievalLogId`.
- Busca com termo inexistente retornou vazio sem erro 500.
- `RagRetrievalLog` foi criado com `queryPreview`, `queryHash`, `retrievedChunkIds`, `resultCount`, `tenantId` e `userId`.
- Dataset QA foi removido apos validacao.
- Smoke final de producao passou sem erro 500.

## Limites regulatorios e funcionais

- A tela oferece consulta textual auditavel, nao resposta automatica.
- Nao ha promessa de conformidade garantida.
- Nao ha certificacao, validacao oficial ou substituicao do Responsavel Tecnico.
- O resultado da consulta e material de apoio para revisao humana.
- Nenhum POP vigente e criado automaticamente.

## Riscos residuais

- A busca ainda e textual simples e pode nao recuperar todos os trechos relevantes.
- A qualidade da consulta depende da qualidade dos chunks canonicos disponiveis.
- A experiencia de filtros e navegacao ainda pode evoluir em fases futuras.
- Logs de recuperacao registram rastreabilidade operacional, mas nao substituem auditoria regulatoria oficial.

## Proxima fase

POP sob demanda assistido, com travas obrigatorias:

- gerar apenas minuta;
- anexar fontes canonicas usadas;
- registrar recuperacoes e eventos;
- exigir revisao e aprovacao do Responsavel Tecnico;
- nunca promover automaticamente uma minuta para POP vigente.
