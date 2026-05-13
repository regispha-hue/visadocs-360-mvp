# Auditoria de Dependências Abacus — VISADOCS 360 MVP

Versão: 1.0
Data: 2026-05-13
Status: Auditoria técnica interna
Ciclo: C4 — Abacus Dependency Audit

---

## 1. Propósito

Este documento registra a auditoria das dependências Abacus ainda presentes no runtime do VISADOCS 360 MVP.

A finalidade é mapear, classificar e planejar a remoção ou substituição dessas dependências, preservando a política de independência de fornecedores definida em:

docs/vendor-independence-policy.md

Este documento não executa remoção técnica. Ele apenas consolida o diagnóstico e define plano de saída.

---

## 2. Escopo da auditoria

Foram auditadas as seguintes superfícies:

- README.md;
- app;
- components;
- lib;
- public;
- src;
- package.json;
- next.config;
- middleware.ts.

Foram procurados os seguintes padrões:

- abacus;
- apps.abacus.ai;
- ABACUSAI_API_KEY;
- chatllm;
- appllm-lib;
- createConvertHtmlToPdfRequest;
- getConvertHtmlToPdfStatus;
- sendNotificationEmail;
- HTML2PDF.

---

## 3. Resultado consolidado

| Classe | Arquivo | Dependência | Função | Criticidade |
|---|---|---|---|---|
| P0 | app/api/certificados/[tentativaId]/route.ts | apps.abacus.ai/api/createConvertHtmlToPdfRequest | Geração de PDF de certificado | Alta |
| P0 | app/api/certificados/[tentativaId]/route.ts | apps.abacus.ai/api/getConvertHtmlToPdfStatus | Consulta de status de conversão PDF | Alta |
| P0 | app/api/certificados/[tentativaId]/route.ts | ABACUSAI_API_KEY | Token de execução Abacus | Alta |
| P0 | app/api/farmacias/[id]/aprovar/route.ts | apps.abacus.ai/api/sendNotificationEmail | Envio de e-mail de aprovação | Alta |
| P0 | app/api/farmacias/[id]/aprovar/route.ts | ABACUSAI_API_KEY | Token de execução Abacus | Alta |
| P1 | app/(dashboard)/dashboard/assistente/page.tsx | apps.abacus.ai/chatllm | Assistente incorporado por iframe | Média |
| P1 | app/layout.tsx | apps.abacus.ai/chatllm/appllm-lib.js | Script global ChatLLM | Média |
| OK | README.md | Abacus / HTML2PDF | Menção pública | Já saneado no C3 |

---

## 4. Classificação de risco

### 4.1 P0 — Dependências críticas de runtime

São P0 as integrações que afetam fluxo funcional do produto:

- geração de PDF de certificado;
- envio de e-mail de aprovação;
- uso de token ABACUSAI_API_KEY em backend.

Essas dependências devem ser removidas ou encapsuladas por adapter antes de onboarding real de cliente pagante ou processamento recorrente de dados de cliente.

### 4.2 P1 — Dependências de interface e experiência

São P1 as integrações ligadas ao assistente embarcado:

- iframe externo do ChatLLM;
- script global `appllm-lib.js`.

Essas dependências não devem ser apresentadas como fundamento regulatório, nem como parte indispensável do core documental do VISADOCS.

---

## 5. Riscos identificados

| Risco | Descrição | Severidade |
|---|---|---|
| Vendor lock-in | Fluxos de PDF, e-mail e assistente dependem de Abacus | Alta |
| Subprocessador não governado | Conteúdo pode trafegar por API externa sem documentação contratual consolidada | Alta |
| Exposição de dados | Certificados, HTML gerado, e-mails ou metadados podem conter dados de tenant/usuário | Alta |
| Falha operacional | Indisponibilidade Abacus pode quebrar geração de PDF ou notificação | Alta |
| Inconsistência com C2 | Dependência contradiz a política de independência de fornecedores | Alta |
| Inconsistência com C1 | Assistente externo não pode ser usado como argumento regulatório | Média |

---

## 6. Plano de saída recomendado

### 6.1 Geração de PDF

Substituir chamadas Abacus de PDF por componente controlado pelo VISADOCS.

Opções aceitáveis:

- PDFKit;
- React-PDF;
- Puppeteer self-hosted;
- Playwright self-hosted;
- outro gerador server-side auditável.

Diretriz:

- manter template sob controle do repositório;
- gerar PDF no servidor da aplicação ou infraestrutura controlada;
- não trafegar HTML/documentos de cliente para API externa não aprovada;
- preservar metadados mínimos de tenant, POP, treinamento, tentativa e data.

### 6.2 E-mail transacional

Substituir `sendNotificationEmail` via Abacus por adapter de e-mail.

Opções aceitáveis:

- Resend;
- Amazon SES;
- SMTP transacional;
- outro provedor com configuração documentada.

Diretriz:

- criar camada `EmailProvider`;
- manter templates no repositório;
- permitir troca de fornecedor por variável de ambiente;
- não acoplar regra de negócio ao fornecedor.

### 6.3 Assistente

Substituir iframe ChatLLM por módulo interno ou desativar temporariamente.

Opções aceitáveis:

- tela interna de assistente documental;
- placeholder informando que o módulo está em revisão;
- RAG interno futuro com fontes rastreáveis;
- adapter LLM sem dependência direta de Abacus.

Diretriz:

- não carregar script externo global sem necessidade;
- não apresentar IA como substituta do RT;
- exibir disclaimer regulatório quando o assistente estiver ativo.

---

## 7. Ordem segura de execução

| Ordem | Ação | Tipo |
|---|---|---|
| 1 | Criar adapter de geração de PDF | Código |
| 2 | Migrar certificado para PDF server-side | Código |
| 3 | Criar adapter de e-mail | Código |
| 4 | Migrar e-mail de aprovação | Código |
| 5 | Remover `ABACUSAI_API_KEY` do runtime | Configuração |
| 6 | Remover iframe ChatLLM da tela de assistente | UI |
| 7 | Remover script `appllm-lib.js` do layout | UI |
| 8 | Rodar auditoria Abacus novamente | Validação |
| 9 | Confirmar zero dependência Abacus em runtime | Validação |

---

## 8. Fora de escopo deste ciclo

Este ciclo não altera:

- APIs;
- geração real de PDF;
- envio real de e-mail;
- iframe do assistente;
- script global;
- banco de dados;
- schema Prisma;
- variáveis de ambiente;
- deploy;
- fluxo de autenticação;
- certificados internos;
- nomenclatura funcional interna.

---

## 9. Critério de aceite para encerramento do C4

O C4 estará encerrado quando:

- esta auditoria estiver versionada no repositório;
- a branch `audit/abacus-dependency` estiver mergeada na `main`;
- nenhum arquivo de runtime tiver sido alterado;
- `git diff --check` estiver limpo;
- o próximo ciclo técnico de remoção/desacoplamento estiver claramente identificado.

---

## 10. Próximo ciclo recomendado

Após o C4, recomenda-se iniciar ciclo técnico específico:

C4.1 — PDF Provider Adapter

Objetivo:

- remover dependência Abacus da geração de PDF;
- manter funcionalidade de certificado;
- preservar template e rastreabilidade;
- impedir tráfego de HTML/documentos para API externa não aprovada.

---

Fim da auditoria.