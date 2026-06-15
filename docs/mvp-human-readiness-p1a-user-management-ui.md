# MVP Human Readiness P1-A User Management UI

## Status geral

Em 2026-06-12, o Visadocs 360 avancou no eixo UI-ready para piloto humano guiado.

Este checkpoint documenta a validacao da UI minima de gestao de usuarios por tenant, entregue no PR #54.

## Commit e PR

- PR #54: feat: add tenant user management UI
- Merge commit: e3e8f69
- Escopo: UI-only
- Arquivos principais:
  - components/sidebar.tsx
  - components/user-create-dialog.tsx
  - app/(dashboard)/dashboard/usuarios/page.tsx
  - app/(dashboard)/admin/farmacias/[id]/page.tsx

Nao houve alteracao de API, schema, migrations, auth, banco, env/secrets ou dependencias.

## Contexto anterior

Antes do P1-A, o P0-B ja havia criado o endpoint POST /api/users para criacao segura de usuarios por tenant.

O P0-C ja havia validado o fluxo API end-to-end em producao, usando o tenant sandbox:

cmqb9we7w0000l5048ovy8k8x

Marker base:

QA-P0C-20260612-143718

## Smoke publico pos-deploy

Apos o merge do PR #54, production passou a apontar para e3e8f69.

Smokes publicos sem sessao:

- GET / retornou 200.
- GET /login retornou 200.
- GET /cadastro retornou 200.
- GET /dashboard retornou 307.
- GET /dashboard/usuarios retornou 307.
- GET /api/auth/session retornou 200.
- POST /api/signup retornou 410.
- POST /api/users sem sessao retornou 401.

Resultado: PASS.

## Smoke ADMIN

A tela /dashboard/usuarios foi validada autenticada como ADMIN do tenant sandbox.

Validacoes:

- A sidebar mostrou o link Usuarios para ADMIN.
- A tela /dashboard/usuarios carregou.
- A tela exibiu o tenant QA-P0C-20260612-143718 Sandbox Farmacia.
- A lista de usuarios do tenant carregou.
- A contagem inicial era 3 usuarios.
- A tela exibiu ADMIN, RT e OPERADOR criados durante P0-C.
- O botao Novo usuario estava disponivel.
- As permissoes exibidas informavam que ADMIN pode criar RT e OPERADOR.
- ADMIN nao viu ADMIN ou SUPER_ADMIN como opcoes de criacao.
- ADMIN criou o usuario QA-P1A-20260612 UI RT.
- ADMIN criou o usuario QA-P1A-20260612 UI OPERADOR.
- A contagem subiu para 5 usuarios.
- Os novos usuarios apareceram na lista com roles corretas.
- A senha temporaria foi exibida uma unica vez apos cada criacao.
- O botao copiar estava presente.
- A senha sumiu ao fechar o modal.
- Nenhuma senha temporaria foi colada no chat.

Resultado: PASS.

## Smoke SUPER_ADMIN

A tela /admin/farmacias/cmqb9we7w0000l5048ovy8k8x foi validada autenticada como SUPER_ADMIN.

Validacoes:

- A pagina carregou corretamente.
- O tenant QA-P0C foi exibido com status Ativo.
- As estatisticas do tenant foram exibidas.
- A lista de usuarios carregou.
- O botao Novo usuario estava disponivel.
- As opcoes visiveis de papel eram ADMIN, RT e OPERADOR.
- SUPER_ADMIN nao apareceu como opcao.
- SUPER_ADMIN criou o usuario QA-P1A-20260612 SUPERADMIN RT.
- A senha temporaria foi exibida uma unica vez.
- O botao copiar estava presente.
- A senha sumiu ao fechar o modal.
- O novo usuario apareceu na lista com role RT.
- A contagem final subiu para 6 usuarios.

Resultado: PASS.

## Governanca e seguranca

- Nenhum cookie, token, header Set-Cookie ou senha temporaria foi impresso.
- Nenhum dado foi criado fora do tenant sandbox marcado.
- A senha temporaria ficou apenas na UI durante o fluxo de criacao e foi removida ao fechar o modal.
- A UI nao usa localStorage ou sessionStorage para senha temporaria.
- A UI nao imprime tempPassword em console.
- A UI nao permite criacao de SUPER_ADMIN.

## Status apos P1-A

O MVP esta parcialmente UI-ready para piloto humano guiado.

A gestao minima de usuarios por tenant agora pode ser feita pela interface:

- ADMIN cria RT e OPERADOR em /dashboard/usuarios.
- SUPER_ADMIN cria ADMIN, RT e OPERADOR no detalhe da farmacia.

## Pendencias

Ainda faltam para um MVP humano nao guiado:

- UI para preparar item documental para camada canonica.
- UI para enviar item documental para CanonicalIngestionJob.
- UI para gerar CanonicalChunks.
- UI para selecionar chunks ou resultados de retrieval e criar minuta POP assistida.
- Rate limit/captcha nos endpoints publicos.
- Rotacao da credencial de banco exposta antes de qualquer piloto externo.
- Runbook de piloto humano e suporte.

## Proximo marco recomendado

P1-B: UI para preparar conteudo canonico e gerar chunks pela interface.
