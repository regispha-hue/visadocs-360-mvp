# Nexoritia Regulated AI OS

## O que é o Nexoritia?

Nexoritia é um **sistema operacional de governança** para agentes de inteligência artificial que operam em ambientes regulados, auditáveis e de missão crítica.

Não é um produto separado. É uma **camada governante** que transforma o agente Windsurf/Cascade em um **agente regulado**, capaz de gerar, revisar e auditar documentos, treinamentos e certificações em conformidade com normas ANVISA e BPF (Boas Práticas de Fabricação).

### Propósito Central
> Garantir que cada linha de código, cada documento gerado e cada decisão automatizada pelo agente de IA seja rastreável, validável e conforme com regulamentações aplicáveis.

---

## Como Usar com Cascade

### 1. Iniciar Sessão

Sempre que iniciar uma tarefa, primeiro:

```bash
# Ler o kernel de governança
cat NEXORITIA_KERNEL.md

# Verificar AGENTS.md
cat AGENTS.md
```

### 2. Escolher Workflow

Dependendo da tarefa, use o workflow apropriado:

| Tarefa | Workflow | Comando |
|--------|----------|---------|
| Gerar SOP/POP | SOP Generation | `cat .nexoritia/workflows/sop-generation.yaml` |
| Revisar documento | SOP Review | `cat .nexoritia/workflows/sop-review.yaml` |
| Criar treinamento | Training Certification | `cat .nexoritia/workflows/training-certification.yaml` |
| Tratar não-conformidade | CAPA | `cat .nexoritia/workflows/capa-nonconformity.yaml` |
| Validar deploy | Release Validation | `cat .nexoritia/workflows/release-validation.yaml` |
| Auditar alteração | Audit Before Change | `cat .windsurf/workflows/nexoritia-audit-before-change.md` |
| Validar output | Validate AI Output | `cat .windsurf/workflows/nexoritia-validate-ai-output.md` |
| Gerar relatório | Evidence Report | `cat .windsurf/workflows/nexoritia-evidence-report.md` |

### 3. Consultar Skills

Quando precisar de expertise específica, mencione a skill:

| Contexto | Skill | Arquivo |
|----------|-------|---------|
| Governança geral | @nexoritia-governor | `.windsurf/skills/nexoritia-governor/SKILL.md` |
| Arquitetura QMS | @regulated-qms-architect | `.windsurf/skills/regulated-qms-architect/SKILL.md` |
| Políticas como código | @policy-as-code-engineer | `.windsurf/skills/policy-as-code-engineer/SKILL.md` |
| Trilha de auditoria | @audit-trail-architect | `.windsurf/skills/audit-trail-architect/SKILL.md` |
| Validação de output | @ai-output-validator | `.windsurf/skills/ai-output-validator/SKILL.md` |
| Avaliação RAG | @rag-evaluation-engineer | `.windsurf/skills/rag-evaluation-engineer/SKILL.md` |
| Segurança MCP | @mcp-security-guardian | `.windsurf/skills/mcp-security-guardian/SKILL.md` |
| Autorização | @authorization-guardian | `.windsurf/skills/authorization-guardian/SKILL.md` |

### 4. Validar com Scripts

Antes de concluir, valide usando os scripts em `tools/nexoritia/`:

```bash
# Validar todos os contratos
node tools/nexoritia/validate-contracts.mjs --all

# Validar arquivo específico
node tools/nexoritia/validate-contracts.mjs --type=sop --file=meu-sop.json

# Inspecionar output
node tools/nexoritia/inspect-regulated-output.mjs --file=documento.json --verbose

# Verificar cadeia de evidências
node tools/nexoritia/hash-evidence-chain.mjs --verify --period=2025-01

# Quality gate completo
node tools/nexoritia/run-nexoritia-quality-gate.mjs --type=document

# Registrar evento de auditoria
node tools/nexoritia/write-audit-event.mjs \
  --type=DOCUMENT_GENERATION \
  --actor=agent:cascade \
  --resource=sop-123 \
  --result=SUCCESS
```

### 5. Regras de Governança

As regras em `.windsurf/rules/` definem comportamentos obrigatórios:

| Ordem | Regra | Arquivo |
|-------|-------|---------|
| 00 | Nexoritia Governance | `00-nexoritia-governance.md` |
| 10 | Regulated Output Safety | `10-regulated-output-safety.md` |
| 20 | Evidence and Audit Trail | `20-evidence-and-audit-trail.md` |
| 30 | Anti-Overcoding | `30-anti-overcoding.md` |
| 40 | AI Validation | `40-ai-validation.md` |

---

## Arquivos de Evidência

### O que é Evidência?

Todo arquivo em `.nexoritia/` pode ser considerado evidência:

- **contracts/**: Definições de conformidade (schemas JSON)
- **policies/**: Regras de negócio aplicadas (YAML)
- **workflows/**: Processos executados (YAML)
- **logs/**: Registros de ações (JSONL)
- **evals/**: Resultados de avaliação

### Estrutura de Logs

```
.nexoritia/logs/
├── audit-events/           # Eventos de auditoria
│   └── YYYY-MM/
│       └── DD-events.jsonl
├── validations/            # Logs de validação
│   └── YYYY-MM/
│       └── validation-reports.jsonl
└── ...
```

### Formatos

- **Audit Events**: JSONL (JSON Lines)
- **Validation Reports**: JSON
- **Evidence Chain**: SHA-256 hashes

---

## Contratos (Schemas)

Os schemas definem a estrutura de entidades reguladas:

| Contrato | Descrição | Arquivo |
|----------|-----------|---------|
| SOP/POP | Procedimentos operacionais | `contracts/sop.schema.json` |
| Training | Registros de treinamento | `contracts/training.schema.json` |
| Certificate | Certificados de qualificação | `contracts/certificate.schema.json` |
| Audit Event | Eventos de auditoria | `contracts/audit-event.schema.json` |
| Validation Report | Relatórios de validação | `contracts/validation-report.schema.json` |

---

## Políticas

As políticas definem regras de negócio:

| Política | Descrição | Arquivo |
|----------|-----------|---------|
| Document Control | Controle documental | `policies/document-control.policy.yaml` |
| AI Generation | Geração por IA | `policies/ai-generation.policy.yaml` |
| Approval Workflow | Fluxos de aprovação | `policies/approval-workflow.policy.yaml` |
| Evidence Retention | Retenção de evidências | `policies/evidence-retention.policy.yaml` |
| Regulated Output | Outputs regulados | `policies/regulated-output.policy.yaml` |

---

## MVP vs Expansão Futura

### Implementado (MVP v1.0)

- ✅ Kernel de governança (NEXORITIA_KERNEL.md)
- ✅ Definição de agentes (AGENTS.md)
- ✅ Skills (8 especialistas)
- ✅ Regras (5 regras priorizadas)
- ✅ Contratos JSON (5 schemas)
- ✅ Políticas YAML (5 políticas)
- ✅ Workflows (10 workflows)
- ✅ Scripts Node.js nativo (5 ferramentas)
- ✅ Evidências em JSONL
- ✅ Cadeia de hash SHA-256

### Expansões Futuras

- 🔄 OPA/Rego para policy-as-code avançado
- 🔄 OpenFGA para autorização granular
- 🔄 Temporal para workflows duráveis
- 🔄 OpenTelemetry para observabilidade
- 🔄 Promptfoo/RAGAS para avaliação avançada
- 🔄 Vector DB para RAG enterprise
- 🔄 Blockchain para imutabilidade

---

## Fluxo Típico de Uso

### Exemplo: Gerar um SOP

```
1. Usuário: "Gere um SOP para higienização de bancadas"

2. Agente (Cascade com Nexoritia):
   a. Ler NEXORITIA_KERNEL.md
   b. Consultar skill regulated-qms-architect
   c. Usar workflow sop-generation.yaml
   d. Seguir estágios:
      - Initiation (definir escopo)
      - Generation (IA gera conteúdo)
      - Schema Validation (validar JSON)
      - Policy Check (checar políticas)
      - Quality Assessment (calcular score)
      - Safety Check (verificar segurança)
      - Evidence Generation (registrar)
   e. Executar scripts:
      - validate-contracts.mjs
      - inspect-regulated-output.mjs
      - write-audit-event.mjs
   f. Passar quality gate
   g. Entregar resultado com evidências

3. Output: SOP validado, auditável, conforme BPF
```

---

## Segurança e Privacidade

### Dados Sensíveis

Scripts automaticamente detectam:
- CPFs
- Emails
- Senhas/secrets
- API keys
- PHI (Protected Health Information)

### Tenant Isolation

Cada farmácia (tenant) tem dados isolados:
- Query sempre filtra por tenant_id
- Logs identificam tenant
- Sem vazamento cruzado

### Retenção

| Tipo | Período |
|------|---------|
| Audit Trail | 5 anos |
| Validation Logs | 5 anos |
| Code Changes | 2 anos |
| Governance Decisions | Permanente |

---

## Suporte

### Documentação
- NEXORITIA_KERNEL.md: Princípios e arquitetura
- AGENTS.md: Comandos e protocolos
- Skills: Especialidades específicas
- Workflows: Processos passo a passo

### Ferramentas
```bash
# Verificar integridade
cd tools/nexoritia
node validate-contracts.mjs --all
node hash-evidence-chain.mjs --verify

# Gerar relatório
node write-audit-event.mjs --report --period=2025-01
```

---

## Licença

Arquitetura: MIT (código de governança)  
Runtime: Commercial (uso em produção)

---

*"Regulamentação não é obstáculo, é qualidade garantida."*

**© 2025 Nexoritia Regulated AI OS + VISADOCS 360**

