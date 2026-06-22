# Resposta a auditoria profunda - 2026-06-22

Origem: auditoria externa "AUDITORIA PROFUNDA - VISADOCS 360 MVP".

## Verificacoes realizadas

### Schema vs UI/API

Modelos citados pela auditoria com superficie real encontrada no repositorio:

- `NaoConformidade`: pagina autenticada e rotas de ciclo CAPA em `/api/nao-conformidades`.
- `Risco`: pagina autenticada `/dashboard/risco` e API `/api/risco`.
- `AuditoriaFiscalizacao`: API `/api/auditoria-fiscalizacao`, dashboard fiscal e pagina de fiscalizacao.
- `AlertaTreinamento`: endpoint `/api/alertas`.
- `CanonicalDocument`, `CanonicalChunk`, `RagRetrievalLog`: APIs canonicas e uso pela geracao assistida de POP.
- `AssistedPopDraft`: APIs e dialog de minuta assistida.
- `Certificado`: APIs de emissao/download e relacao com tentativas de quiz.
- `VerificacaoPratica`: pagina e API dedicadas.

## Correcoes implementadas

### C12 - Alertas inteligentes

Antes:

- Alertas eram gerados apenas quando a rota `/api/alertas` era chamada.

Agora:

- Logica extraida para `lib/alertas-treinamento.ts`.
- Nova rota cron `/api/cron/alertas-treinamento`.
- `vercel.json` agenda execucao diaria as 09:00 UTC.
- Alertas obsoletos sao marcados como lidos quando deixam de se aplicar.
- Rota interativa `/api/alertas` continua atualizando alertas sob demanda.

### C11 - NC para treinamento obrigatorio

Antes:

- Fechamento de NC apenas gravava `sugestaoTreinamento`.

Agora:

- Ao fechar NC com `sugestaoTreinamento=true`, o sistema cria treinamentos pendentes vinculados ao POP da NC.
- Se a NC tem colaborador vinculado, cria para esse colaborador.
- Se a NC nao tem colaborador vinculado, cria para todos os colaboradores ativos do tenant.
- Duplicidades de treinamento pendente para mesmo POP/colaborador sao evitadas.
- A timeline e o audit log da NC registram o resultado da criacao.

### C10 - Fiscal QR fail-closed

Antes:

- A API continha fallbacks simulados em caso de erro, com dados ficticios.
- QR podia permanecer valido por 24 horas por padrao.

Agora:

- Removidos fallbacks simulados das funcoes criticas.
- A API retorna erro real quando o banco ou a geracao falha.
- QR gerado com identificador forte via `crypto.randomUUID()`.
- Codigo de acesso gerado com entropia maior.
- Validade padrao reduzida para 2 horas, com limite maximo de 24 horas quando informado.
- Acesso retorna dados reais do tenant em vez de informacoes ficticias.

### VISA Assistente e geracao assistida

Antes:

- A minuta assistida ja tinha aviso regulatorio basico.

Agora:

- A minuta explicita que a IA nao interpreta normas, nao emite parecer regulatorio, nao substitui consulta tecnica e nao dispensa aprovacao formal do RT.
- O evento de ciclo documental grava `regulatoryGuardrail` nos metadados.

## Pendencias ainda recomendadas

- Criar pagina publica `/fiscal` sem login para leitura do token/QR, caso ainda nao exista fluxo publico fora do painel autenticado.
- Criar relatorio executivo "O que fazer hoje" no dashboard consolidando alertas, NCs abertas e vencimentos.
- Ampliar testes E2E para rotas criticas: aprovacao de farmacia, cron de alertas, fechamento de NC com treinamento e Fiscal QR.
- Avaliar BullMQ/queue apenas se o volume real exceder a execucao cron diaria simples.
