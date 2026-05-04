# NEXORITIA KERNEL

## Definição

Nexoritia é uma camada de governança operacional para produção assistida por IA em áreas reguladas.

Ele não substitui responsável técnico, validação humana, decisão regulatória, revisão profissional ou aprovação institucional.

Sua função é estruturar, validar, registrar e auditar o processo de produção.

## Missão

Transformar outputs de IA em fluxos controlados:

solicitação → geração → validação → revisão → aprovação → evidência → rastreabilidade → entrega

## Escopo

Aplicável a projetos que envolvam:

- documentos regulados;
- POPs/SOPs;
- treinamentos;
- certificados;
- protocolos;
- relatórios técnicos;
- SaaS para áreas reguladas;
- auditoria documental;
- rastreabilidade operacional;
- fluxos com risco jurídico, técnico, sanitário ou reputacional.

## Princípio central

Gerar é barato. Validar é obrigatório. Auditar é o diferencial.

## Evidência mínima

Nenhum output regulado deve ser considerado entregue sem:

1. origem da solicitação;
2. skill utilizada;
3. política aplicada;
4. checklist de validação;
5. versão do documento;
6. responsável pela revisão;
7. status de aprovação;
8. registro de auditoria.

## Arquitetura

1. Kernel Governante
2. Agent Layer
3. Policy Layer
4. Evidence Layer
5. Evaluation Layer
6. Workflow Layer
7. Integration Layer
8. Product Layer

## Critérios de validação

Um output regulado deve ser validado quanto a:

- completude;
- coerência;
- aderência ao escopo;
- ausência de alegações não sustentadas;
- rastreabilidade;
- controle de versão;
- identificação de responsável;
- estado de aprovação;
- riscos remanescentes.

## Critérios de bloqueio

Bloquear ou exigir revisão humana quando houver:

- ausência de evidência mínima;
- conteúdo regulatório não verificado;
- alteração de banco, auth, deploy ou env;
- exposição de segredo;
- mudança em contrato de API;
- geração de documento final sem revisão;
- saída sem identificação de versão;
- tentativa de automatizar aprovação humana obrigatória.

## Matriz de risco

| Risco | Severidade | Ação |
|---|---:|---|
| Exposição de segredo | Crítica | Bloquear |
| Documento regulado sem revisão | Alta | Bloquear |
| Mudança de banco sem plano | Alta | Bloquear |
| Output sem evidência | Alta | Exigir validação |
| Texto incompleto | Média | Revisar |
| Falha de formatação | Baixa | Corrigir |

## Relação com Windsurf/Cascade

Windsurf/Cascade é o executor.

Nexoritia é o governante.

As skills são especialistas.

As rules são limites.

Os workflows são ritos operacionais.

Os logs são evidência.

## Regra anti-overcoding

Não introduzir frameworks, serviços, filas, autorização externa, motores de workflow ou policy engines antes de necessidade comprovada.

O MVP deve ser simples, auditável, versionável e funcional.
