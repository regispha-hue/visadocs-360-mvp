# Higiene do repositorio

Atualizado em 2026-06-22.

Objetivo: deixar claro o que esta ativo, o que e historico e quais limpezas podem ser feitas sem risco de remover funcionalidade de producao.

## Areas ativas

Manter como superficie principal de manutencao:

- `app/` - rotas Next.js, APIs e telas autenticadas.
- `components/` - componentes compartilhados.
- `lib/` - regras de negocio, provedores e utilitarios.
- `prisma/` - schema e migracoes.
- `scripts/` - automacoes de seed, importacao e manutencao quando ainda usadas.
- `docs/` - documentacao tecnica, runbooks e politicas.
- `kb_docs/`, `pops_kits/`, `pops_rag/` - materiais de conhecimento quando referenciados por RAG/importacao.

## Areas historicas ou candidatas a arquivamento

Nao remover sem PR especifico e validacao, mas tratar como nao prioritarias para desenvolvimento diario:

- `ABACUS_DEPLOY.zip`
- `ABACUS_DEPLOY/`
- `nexoritia-analysis/`
- `nexoritia-evolution/`
- `nexoritia-os/`
- `nexoritia-visadocs-integration/`
- `.specify/`
- `.agents/`

Motivo: esses caminhos parecem conter experimentos, material historico, integracoes antigas ou artefatos auxiliares. A limpeza recomendada e mover para arquivo externo ou branch/tag historica depois de confirmar que nao participam do build, deploy, seed, importacao ou operacao.

## Branches

Politica adotada nesta limpeza:

- Remover branches remotas ja mergeadas em `main`.
- Preservar `main`, `preview-producao`, `work` e branches sem evidencia clara de merge.
- Criar PR de documentacao para qualquer mudanca de estado permanente no repositorio.

## Limpezas funcionais pendentes

Pendencias vindas da curadoria documental:

- Excluir ou arquivar documentos de `Farmacotecnica` quando nao fizerem mais parte da estrutura vigente.
- Excluir PDFs vazios depois de auditoria de duplicidade e conteudo.
- Excluir RQs `Planejamento Mensal` quando confirmados como obsoletos.

Essas limpezas devem ser feitas por script auditavel, com CSV de antes/depois e criterio de selecao explicito.

## Criterios para exclusao segura

Antes de apagar qualquer arquivo, documento importado ou registro:

- Confirmar que nao e referenciado por rotas, seeds, scripts ou documentacao operacional.
- Confirmar que nao compoe RAG/camada canonica em uso.
- Confirmar que nao e evidencia de treinamento, certificado, impressao ou trilha regulatoria.
- Gerar relatorio de impacto.
- Preferir arquivar primeiro quando houver incerteza.
