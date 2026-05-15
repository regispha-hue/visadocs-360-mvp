# AGENTS.md — VISADOCS 360 MVP

## Perfil operacional

Este repositório deve ser tratado como projeto sensível, com integração a GitHub, Vercel, Neon, Supabase, Prisma e variáveis de ambiente locais.

O agente deve atuar com postura conservadora:
- preferir auditoria antes de edição;
- aplicar diffs mínimos;
- nunca executar ações destrutivas sem confirmação explícita;
- nunca exibir valores de variáveis de ambiente;
- nunca publicar, migrar banco ou alterar produção por iniciativa própria.

## Regras absolutas

Não executar sem autorização explícita do usuário:

- git push
- vercel deploy
- vercel deploy --prod
- prisma migrate deploy
- prisma db push
- prisma migrate reset
- prisma migrate dev em banco remoto
- supabase db push
- supabase db pull
- supabase migration repair
- supabase migration up
- docker compose down
- comandos que apaguem dados, resetem banco, sobrescrevam schema remoto ou alterem produção

## Git

Fluxo padrão:

1. Sempre iniciar verificando:
   - git status --short --branch
   - git branch --show-current

2. Não trabalhar diretamente em main para alterações relevantes.

3. Antes de editar:
   - explicar arquivos afetados;
   - propor plano curto;
   - aplicar menor diff possível.

4. Depois de editar:
   - mostrar git diff --stat;
   - rodar validações cabíveis;
   - só sugerir commit após validação.

## Package manager

O projeto declara Yarn 4.13.0.

Preferir:

- yarn install
- yarn build
- yarn dev
- yarn lint, se aplicável

Evitar npm install, salvo quando o usuário autorizar expressamente.

A presença simultânea de yarn.lock e package-lock.json deve ser tratada como risco de mistura de gerenciadores. Não atualizar package-lock.json sem autorização explícita.

## Ambiente

Arquivos .env podem ser detectados, mas seus valores nunca devem ser exibidos.

Permitido listar apenas nomes de variáveis, jamais seus conteúdos.

Arquivos sensíveis/local-only devem permanecer fora do Git, incluindo:

- .env
- .env.local
- .env.production.local
- .vercel
- .neon
- supabase/.temp/

## Integrações

Estado esperado:

- GitHub MCP ativo via wrapper local em ~/.codex/github-mcp.ps1
- Vercel MCP ativo via OAuth
- Neon MCP ativo via OAuth
- Supabase MCP desativado por instabilidade de handshake
- Supabase disponível via CLI/npx supabase

O agente não deve tentar reativar Supabase MCP sem pedido explícito.

## Validação mínima

Antes de qualquer entrega técnica, preferir:

- git status --short --branch
- yarn build, quando a alteração afetar app/runtime
- npx tsc --noEmit --pretty false, quando houver TypeScript e o script não existir
- inspeção de diff antes de commit

## Critério de pronto

Uma tarefa só deve ser considerada pronta quando:

1. o diff for pequeno e justificável;
2. não houver segredo exposto;
3. não houver alteração destrutiva;
4. o status do Git estiver claro;
5. o próximo passo seguro estiver declarado.
