# MVP Human Readiness Final Pilot Checklist

## Status geral

Este documento consolida o estado do Visadocs 360 apos os marcos P0-A, P0-B, P0-C, P1-A, P1-B e P1-C.

Status atual:

MVP UI-ready para piloto humano guiado.

O produto ainda nao deve ser aberto para piloto externo nao guiado sem resolver as pendencias de seguranca operacional listadas neste documento.

## Linha de base validada

### P0-A

POST /api/signup publico foi desabilitado e passou a retornar HTTP 410.

Objetivo atingido:

- remover criacao publica de usuarios privilegiados;
- manter cadastro publico de farmacia via /api/farmacias/cadastro;
- manter criacao de ADMIN pelo fluxo de aprovacao de tenant.

### P0-B

POST /api/users foi implementado como endpoint tenant-scoped para criacao segura de usuarios.

Validado:

- ADMIN cria RT e OPERADOR;
- SUPER_ADMIN cria usuarios no contexto de tenant;
- OPERADOR nao cria usuarios;
- ADMIN nao cria ADMIN ou SUPER_ADMIN;
- email duplicado e roles invalidas sao bloqueados;
- senha temporaria nao retorna hash;
- AuditLog USER_CREATED e usado.

### P0-C

QA end-to-end API passou em producao com tenant sandbox.

Validado:

- cadastro de tenant;
- aprovacao de tenant;
- criacao automatica de ADMIN;
- login ADMIN;
- criacao RT/OPERADOR;
- criacao de item documental;
- criacao de CanonicalIngestionJob e CanonicalDocument;
- geracao de CanonicalChunk;
- retrieval canonico;
- criacao de minuta POP assistida via API;
- Pop e AssistedPopDraft em RASCUNHO;
- ApprovedPopVersion = 0.

Tenant sandbox principal:

cmqb9we7w0000l5048ovy8k8x

Marker base:

QA-P0C-20260612-143718

### P1-A

UI de gestao de usuarios por tenant foi validada.

Validado:

- ADMIN acessa /dashboard/usuarios;
- ADMIN ve usuarios do proprio tenant;
- ADMIN cria RT e OPERADOR pela UI;
- tempPassword aparece uma unica vez;
- SUPER_ADMIN cria usuario no detalhe da farmacia;
- SUPER_ADMIN nao ve SUPER_ADMIN como opcao;
- senha temporaria nao foi colada em chat.

### P1-B

UI de preparacao canonica e geracao de chunks foi validada.

Validado como ADMIN:

- /dashboard/biblioteca carrega sem crash apos hotfix;
- cria item documental com content;
- envia item para Biblioteca Canonica;
- documento canonico aparece;
- gera chunks;
- ve chunks;
- segunda geracao mostra conflito amigavel.

### P1-C

UI de criacao de minuta POP assistida foi validada.

Validado como RT:

- /dashboard/biblioteca carrega;
- Ver chunks funciona;
- checkbox de chunk aparece;
- CTA Criar minuta POP aparece apos selecao;
- modal abre com titulo, codigo e objetivo;
- criacao de minuta pela UI funciona;
- minuta aparece em /dashboard/pops;
- status RASCUNHO;
- codigo duplicado mostra mensagem amigavel.

Ressalva:

- link direto pos-sucesso para /dashboard/pops/{pop.id} nao apareceu no smoke manual;
- usuario ainda consegue encontrar a minuta em /dashboard/pops.

## Fluxo humano guiado recomendado

### Preparacao pelo operador

1. Confirmar que o tenant sandbox esta ativo.
2. Confirmar que ha usuario ADMIN ou RT disponivel.
3. Se necessario, SUPER_ADMIN cria novo RT pela tela de detalhe da farmacia.
4. Copiar senha temporaria uma unica vez para o participante do teste.
5. Garantir que o participante sabe que o ambiente e sandbox.

### Fluxo para o participante ADMIN ou RT

1. Entrar em /login.
2. Acessar /dashboard/biblioteca.
3. Criar item documental:
   - tipo REFERENCIA;
   - titulo identificavel;
   - codigo identificavel;
   - categoria QA;
   - content textual suficiente.
4. Enviar item para Biblioteca Canonica.
5. Gerar chunks.
6. Clicar em Ver chunks.
7. Selecionar pelo menos um chunk.
8. Clicar em Criar minuta POP.
9. Preencher:
   - titulo;
   - codigo unico;
   - objetivo.
10. Criar minuta.
11. Abrir /dashboard/pops.
12. Confirmar que a minuta aparece como RASCUNHO.

### Fluxo esperado

O participante deve conseguir completar o fluxo sem DevTools e sem chamada manual de API.

## Checklist de aceite para piloto guiado

Antes de cada sessao de piloto guiado:

- [ ] Production responde GET / com HTTP 200.
- [ ] /login responde HTTP 200.
- [ ] /dashboard redireciona sem sessao.
- [ ] /api/signup retorna HTTP 410.
- [ ] /api/users sem sessao retorna HTTP 401.
- [ ] Usuario de teste consegue logar.
- [ ] /dashboard/biblioteca carrega sem client-side exception.
- [ ] Usuario consegue criar item documental.
- [ ] Usuario consegue enviar item para Biblioteca Canonica.
- [ ] Usuario consegue gerar chunks.
- [ ] Usuario consegue visualizar chunks.
- [ ] Usuario consegue selecionar chunk.
- [ ] Usuario consegue criar minuta POP assistida.
- [ ] Minuta aparece em /dashboard/pops.
- [ ] Minuta fica em RASCUNHO.
- [ ] Nenhuma aprovacao automatica ocorre.

## O que esta pronto

- Onboarding de tenant via cadastro e aprovacao.
- Criacao controlada de usuarios por tenant.
- UI de usuarios para ADMIN e SUPER_ADMIN.
- UI de biblioteca documental.
- UI de preparacao canonica.
- UI de geracao e visualizacao de chunks.
- UI de criacao de minuta POP assistida.
- Travas de governanca: RASCUNHO, sem ApprovedPopVersion, sem POP vigente automatico.

## O que ainda nao esta pronto para piloto externo

### Seguranca operacional

- Rotacionar credencial de banco exposta anteriormente.
- Adicionar rate limit/captcha nos endpoints publicos.
- Revisar logs para garantir ausencia de segredo.
- Confirmar politica de backup/rollback antes de usuario externo.

### UX e produto

- Exibir link direto para POP criado apos sucesso no P1-C.
- Diferenciar melhor o botao legado Minuta do fluxo novo de minuta canonica.
- Validar manualmente SUPER_ADMIN em /dashboard/biblioteca quando houver credencial.
- Melhorar status de CanonicalIngestionJob.
- Criar runbook de suporte para participante humano.
- Configurar email transacional real ou formalizar procedimento manual de senha temporaria.

## Decisao de readiness

### Piloto interno guiado

Status: APROVADO COM RESSALVAS.

Pode ser executado com operador acompanhando o participante.

Condicoes:

- usar tenant sandbox;
- nao usar dados reais sensiveis;
- operador deve conhecer o fluxo;
- aceitar que algumas mensagens ainda sao tecnicas;
- registrar observacoes de UX.

### Piloto externo ou nao guiado

Status: NAO APROVADO.

Bloqueios:

- rotacao da credencial de banco;
- rate limit/captcha;
- runbook;
- polimento de UX minimo;
- politica de suporte.

## Issues recomendadas apos este checkpoint

### P1/P2: mostrar link pos-sucesso da minuta

Titulo sugerido:

fix: show created POP link after canonical draft creation

Aceite:

- apos criar minuta, UI mostra link /dashboard/pops/{pop.id};
- usuario consegue abrir a minuta diretamente;
- fallback para /dashboard/pops se pop.id ausente.

### P1: rate limit/captcha public endpoints

Titulo sugerido:

security: add rate limiting to public auth and onboarding endpoints

Aceite:

- /login, /api/auth/*, /api/farmacias/cadastro e /api/signup tem protecao minima;
- mensagens amigaveis;
- sem quebrar fluxo de cadastro.

### P0 antes de externo: rotate exposed database credential

Titulo sugerido:

security: rotate exposed Neon database credential before external pilot

Aceite:

- senha rotacionada no Neon;
- Vercel atualizado;
- local atualizado;
- redeploy executado;
- smoke publico passa.

### P1: pilot runbook

Titulo sugerido:

docs: add guided human pilot runbook

Aceite:

- instrucoes para operador;
- instrucoes para participante;
- criterios de sucesso;
- como reportar erro;
- como encerrar sessao.

## Conclusao

O Visadocs 360 atingiu readiness suficiente para piloto humano guiado interno.

O proximo trabalho deve focar em seguranca operacional, runbook e polimento antes de qualquer exposicao externa.
