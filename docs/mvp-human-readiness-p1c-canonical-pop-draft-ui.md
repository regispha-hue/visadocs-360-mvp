# MVP Human Readiness P1-C Canonical POP Draft UI

## Status geral

Em 2026-06-15, o Visadocs 360 avancou no eixo UI-ready ao permitir a criacao de minuta POP assistida a partir de chunks canonicos selecionados pela interface.

Este checkpoint documenta a validacao do P1-C, entregue no PR #57 e ajustado pelo hotfix PR #58.

## Commits e PRs

- PR #57 / commit ed965b9: feat: add canonical assisted POP draft UI.
- PR #58 / commit a9d3719: fix: show assisted draft CTA for selected chunks.

O PR #57 adicionou o fluxo visual para selecionar chunks e criar minuta POP assistida usando o endpoint existente:

POST /api/pops/assisted-drafts/from-canonical-sources

O PR #58 corrigiu a visibilidade do CTA Criar minuta POP dentro da area de chunks.

## Escopo entregue

A tela /dashboard/biblioteca passou a permitir, para usuarios ADMIN e RT:

- selecionar chunks canonicos;
- abrir modal de criacao de minuta POP;
- preencher titulo, codigo e objetivo;
- criar minuta POP assistida;
- manter o resultado em RASCUNHO;
- tratar codigo duplicado de forma amigavel.

O patch nao alterou API, schema, migrations, auth global, banco, Prisma ou IA generativa.

## Smoke publico

Os smokes publicos sem sessao permaneceram saudaveis:

- GET / retornou 200.
- GET /login retornou 200.
- GET /cadastro retornou 200.
- GET /dashboard retornou 307.
- GET /dashboard/biblioteca retornou 307.
- GET /dashboard/usuarios retornou 307.
- GET /api/auth/session retornou 200.
- POST /api/signup retornou 410.
- POST /api/users sem sessao retornou 401.
- POST /api/pops/assisted-drafts/from-canonical-sources sem sessao retornou 401.

Resultado: PASS.

## Incidente e hotfix

Apos o PR #57, o checkbox de chunk aparecia e ficava marcado, mas o CTA Criar minuta POP nao aparecia perto do viewer de chunks.

O PR #58 adicionou uma barra contextual dentro da area de chunks:

- mostra a quantidade de chunks selecionados;
- exibe o botao Criar minuta POP;
- aparece apenas para ADMIN e RT;
- nao aparece para SUPER_ADMIN ou OPERADOR.

Resultado: PASS apos hard refresh e validacao manual.

## Smoke manual RT

O smoke manual foi executado autenticado como RT do tenant sandbox.

Validacoes:

- /dashboard/biblioteca carregou corretamente.
- Ver chunks funcionou.
- O chunk canonico do documento QA-P1B-20260615-FONTE-001 foi exibido.
- O checkbox do chunk apareceu.
- O checkbox ficou marcado.
- A barra contextual mostrou 1 chunk selecionado.
- O botao Criar minuta POP apareceu.
- O modal abriu com campos de titulo, codigo e objetivo.
- A criacao da minuta pela UI retornou sucesso.
- A minuta apareceu em /dashboard/pops.
- O status da minuta/POP apareceu como RASCUNHO.

Resultado: PASS.

## Teste de codigo duplicado

Foi feita uma tentativa de criar nova minuta com o mesmo codigo:

QA-P1C-20260615-MINUTA-001

A UI exibiu mensagem amigavel:

Ja existe POP com este codigo neste tenant.

Resultado: PASS.

## Governanca regulatoria

O fluxo validado cria apenas minuta em RASCUNHO.

Nao houve:

- aprovacao automatica;
- criacao de ApprovedPopVersion;
- promocao de POP para vigente;
- uso de IA generativa;
- alteracao de schema;
- operacao direta de banco.

O contrato de ApprovedPopVersion = 0 ja havia sido validado no P0-C e permanece requisito de governanca deste fluxo.

## Permissoes

A revisao estatica confirmou:

- ADMIN pode ver e usar a acao.
- RT pode ver e usar a acao.
- OPERADOR nao ve a acao.
- SUPER_ADMIN nao ve a acao nessa tela por falta de tenant context.

## Ressalva UX

Apos sucesso na criacao da minuta, o link direto para /dashboard/pops/{pop.id} nao apareceu para o operador durante o smoke manual.

Apesar disso, a minuta foi criada e apareceu na lista /dashboard/pops com status RASCUNHO.

Classificacao:

P1/P2 polish, nao bloqueante para piloto humano guiado.

## Status apos P1-C

O MVP esta UI-ready para o fluxo essencial guiado:

- criar usuarios do tenant;
- criar fonte documental;
- enviar para camada canonica;
- gerar chunks;
- visualizar chunks;
- criar minuta POP assistida a partir de chunks;
- manter POP em RASCUNHO.

## Pendencias

Ainda faltam para piloto humano externo ou nao guiado:

- melhorar feedback pos-sucesso com link direto para POP criado;
- validar manualmente o comportamento SUPER_ADMIN quando credencial estiver disponivel;
- rate limit/captcha em endpoints publicos;
- rotacao da credencial de banco exposta antes de qualquer piloto externo;
- runbook de piloto humano e suporte;
- polimento de UX para diferenciar botao legado Minuta e novo fluxo de minuta canonica;
- eventual tela dedicada de revisao da minuta pelo RT.

## Proximo marco recomendado

Preparar checklist final de piloto humano guiado e resolver pendencias de seguranca operacional antes de convidar usuarios externos.
