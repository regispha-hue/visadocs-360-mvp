# QA/demo seed

## Objetivo

Criar um dataset ficticio, controlado e removivel para QA autenticado antes de demo externa do Visadocs 360 MVP.

Este seed nao deve ser usado como seed geral do produto e nao deve ser executado contra banco de producao.

## Ambiente permitido

Use apenas um destes ambientes:

- Postgres local descartavel;
- banco QA dedicado;
- banco Preview isolado.

Nao execute contra producao. O script aborta quando identifica sinais de producao, incluindo `NODE_ENV=production`, `VERCEL_ENV=production`, `NEXTAUTH_URL` da producao canonica ou `DATABASE_URL` com termos `prod`/`production`.

## Variaveis necessarias

```powershell
$env:VISADOCS_QA_SEED_CONFIRM="true"
$env:DATABASE_URL="<url-do-banco-qa-preview-ou-local>"
$env:NEXTAUTH_SECRET="<secret-do-ambiente-qa-ou-preview>"
$env:NEXTAUTH_URL="<url-do-ambiente-qa-ou-preview>"
```

O script exige `VISADOCS_QA_SEED_CONFIRM=true`.

## Como executar

Depois de confirmar que `DATABASE_URL` aponta para ambiente QA/Preview/local:

```powershell
yarn seed:qa-demo
```

Nao use `prisma db push`. Nao rode migrations junto deste seed. Migrations devem ser tratadas separadamente conforme `docs/prisma-baseline-plan.md`.

## Credenciais ficticias

Todos os usuarios usam a mesma senha ficticia:

```text
QA-Demo-Visadocs-2026!
```

Usuarios criados:

```text
ADMIN: qa.admin.demo@visadocs.local
RT: qa.rt.demo@visadocs.local
OPERADOR: qa.operador.demo@visadocs.local
```

Tenant:

```text
Nome: QA DEMO VISADOCS 360
CNPJ ficticio: 00999999000191
Status: ATIVO
```

## Dataset criado

- tenant QA ativo;
- usuario ADMIN;
- usuario RT;
- usuario OPERADOR;
- colaborador ativo;
- fonte documental util com conteudo suficiente;
- fonte documental insuficiente para teste negativo;
- POP em rascunho;
- POP aprovado e versionado;
- minuta assistida vinculada a fonte documental;
- `ApprovedPopVersion` com status `CURRENT`;
- treinamento vinculado a versao aprovada;
- quiz com questao e alternativas;
- tentativa aprovada com codigo de validacao;
- auditoria/fiscalizacao com cronograma de validades;
- eventos `DocumentLifecycleEvent`, `RTApprovalEvent` e `AuditLog` minimos.

## Roteiro resumido de validacao

1. Fazer login como `ADMIN`.
2. Abrir `/dashboard` e confirmar carregamento.
3. Abrir `/dashboard/biblioteca` e confirmar fonte util e fonte insuficiente.
4. Confirmar que a fonte util permite fluxo de minuta assistida.
5. Abrir `/dashboard/pops` e confirmar POP em rascunho e POP aprovado.
6. Fazer login como `OPERADOR` e confirmar que aprovacao de POP e bloqueada.
7. Fazer login como `RT` e validar aprovacao/reprovacao em fluxo controlado, se aplicavel ao teste.
8. Abrir `/dashboard/treinamentos` e confirmar treinamento concluido.
9. Abrir quiz/tentativa e baixar registro interno de treinamento.
10. Abrir `/dashboard/fiscalizacao` e confirmar acesso rapido, modo consulta read-only e cronograma.
11. Confirmar ausencia de 500 e ausencia de copy regulatoria forte.
12. Fazer logout e confirmar redirecionamento das rotas protegidas.

## Recriar ou remover dataset

O seed e idempotente para o tenant QA identificado pelo CNPJ ficticio `00999999000191`.

Ao executar novamente, ele remove apenas dados associados a esse tenant QA e recria o dataset. Nao remove dados de outros tenants.

Para remover manualmente, use apenas ambiente QA/Preview/local e delete o tenant com CNPJ ficticio acima e seus dados relacionados, respeitando as relacoes do Prisma. Nao execute remocao manual em producao.

## Observacoes regulatórias

Os dados sao ficticios e existem apenas para demonstrar fluxo operacional. O dataset nao declara conformidade sanitaria, nao substitui o Responsavel Tecnico e nao representa aprovacao institucional da Anvisa ou de qualquer orgao regulador.
