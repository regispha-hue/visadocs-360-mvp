# MVP Human Readiness P1-B Canonical Content UI

## Status geral

Em 2026-06-15, o Visadocs 360 avancou no eixo UI-ready para piloto humano guiado ao permitir preparacao de conteudo canonico e geracao de chunks pela interface.

Este checkpoint documenta a validacao da UI minima de preparacao canonica entregue no PR #55 e estabilizada pelo hotfix PR #56.

## Commits e PRs

- PR #55 / commit 2ecb981: feat: add canonical content preparation UI.
- PR #56 / commit a066aea: fix: prevent biblioteca session crash.

O PR #55 adicionou a interface de criacao de item documental com content e botao para gerar chunks canonicos.

O PR #56 corrigiu crash client-side em /dashboard/biblioteca causado por acesso inseguro ao retorno de useSession.

## Escopo entregue

A tela /dashboard/biblioteca passou a permitir, para usuarios ADMIN e RT:

- criar item documental com conteudo textual;
- enviar item para Biblioteca Canonica;
- gerar chunks canonicos;
- visualizar chunks gerados;
- receber mensagem amigavel quando chunks ja existem.

O patch nao alterou API, schema, migrations, auth global, banco, Prisma ou dependencias.

## Smoke publico

Apos o deploy dos commits relacionados, os smokes publicos sem sessao passaram:

- GET / retornou 200.
- GET /login retornou 200.
- GET /cadastro retornou 200.
- GET /dashboard retornou 307.
- GET /dashboard/biblioteca retornou 307.
- GET /api/auth/session retornou 200.
- POST /api/signup retornou 410.
- POST /api/users sem sessao retornou 401.

Resultado: PASS.

## Incidente e hotfix

Apos o merge do PR #55, /dashboard/biblioteca apresentou client-side exception:

Cannot destructure property 'data' of useSession(...) as it is undefined.

O PR #56 corrigiu o problema com acesso defensivo ao retorno de useSession.

Apos o hotfix, /dashboard/biblioteca carregou corretamente como ADMIN.

## Smoke manual ADMIN

O smoke manual foi executado autenticado como ADMIN do tenant sandbox QA.

Validacoes:

- /dashboard/biblioteca carregou sem client-side exception.
- O botao Novo item documental apareceu.
- O modal Novo item documental abriu corretamente.
- O modal exibiu campos de tipo, versao, titulo, codigo, categoria e conteudo textual.
- O ADMIN criou o item QA-P1B-20260615-FONTE-001 - QA-P1B-20260615 Fonte UI.
- O item apareceu no Acervo documental.
- O envio para Biblioteca Canonica funcionou.
- O documento canonico apareceu na Biblioteca Canonica.
- O status inicial do documento canonico foi PENDING_REVIEW.
- O botao Gerar chunks apareceu.
- A geracao de chunks funcionou.
- O status mudou para CHUNKED.
- O botao Ver chunks apareceu.
- Ver chunks exibiu 1 chunk com texto criado pela UI.
- Uma segunda tentativa de Gerar chunks mostrou mensagem amigavel de chunks ja gerados.

Resultado: PASS.

## Permissoes

A revisao estatica confirmou que as acoes de escrita canonica em /dashboard/biblioteca ficam restritas a:

- ADMIN
- RT

A flag usada no cliente considera apenas ADMIN ou RT para escrita.

SUPER_ADMIN e OPERADOR nao devem ver as acoes de escrita nessa pagina.

Motivo da restricao para SUPER_ADMIN:

- /dashboard/biblioteca nao tem contexto explicito de tenant para SUPER_ADMIN;
- APIs de escrita exigem tenantId para SUPER_ADMIN;
- exibir acoes de escrita para SUPER_ADMIN nessa tela causaria erro "Tenant nao especificado".

## Smoke SUPER_ADMIN

O smoke manual com SUPER_ADMIN nao foi executado porque a credencial SUPER_ADMIN nao estava disponivel ao operador no momento da validacao.

Esse comportamento ficou coberto por revisao estatica do diff, mas deve ser validado manualmente quando houver credencial SUPER_ADMIN disponivel.

Status:

- SUPER_ADMIN manual smoke: NAO EXECUTADO.
- Cobertura estatica: PASS.

## Governanca e seguranca

- Nenhum cookie, token, header Set-Cookie ou segredo foi impresso.
- Nenhuma credencial foi trafegada pelo chat.
- Nenhum dado foi manipulado por SQL direto.
- Nenhum endpoint destrutivo foi criado.
- A UI nao usa localStorage ou sessionStorage para conteudo sensivel.
- A UI nao usa dangerouslySetInnerHTML ou eval.
- O conteudo textual fica somente em state do formulario durante a criacao.

## Status apos P1-B

O MVP esta mais proximo de UI-ready para piloto humano guiado.

Agora, um ADMIN consegue pela interface:

- criar fonte documental textual;
- enviar para camada canonica;
- gerar chunks;
- visualizar chunks.

Isso remove a dependencia de DevTools/API manual para a preparacao basica de conteudo canonico.

## Pendencias

Ainda faltam para humano real nao guiado:

- P1-C: UI para selecionar chunks/retrieval e criar minuta POP assistida.
- Validacao manual SUPER_ADMIN da ausencia de acoes de escrita em /dashboard/biblioteca.
- Rate limit/captcha nos endpoints publicos.
- Rotacao da credencial de banco exposta antes de qualquer piloto externo.
- Runbook de piloto humano e suporte.
- UX mais clara para status de CanonicalIngestionJob.

## Proximo marco recomendado

P1-C: UI para criar minuta POP assistida a partir de chunks canonicos selecionados.
