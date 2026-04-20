# Especificação Técnica: Refinamento do OS-RADAR com Contratos Semânticos

## 1. Introdução
O **OS-RADAR** é o subsistema de validação ontológica do Allux. Para garantir a **inevitabilidade industrial** do Allux, é crucial evoluir o OS-RADAR de um simples "detector de desvios" para um sistema de **Contratos Semânticos** que imponha o determinismo do nexo em tempo real.

Um Contrato Semântico é uma regra lógica formalizada que, se violada, **bloqueia** a execução do LLM ou força uma correção, eliminando a alucinação na fonte.

## 2. Arquitetura de Contratos Semânticos

### 2.1. Formalização dos Axiomas
Os 21 Axiomas Canônicos do Allux (e futuros axiomas de verticais) devem ser formalizados em uma linguagem que seja **legível por máquina** e **interpretável por LLM**.

**Proposta de Formato:** **JSON-LD** ou **YAML** estruturado, permitindo a validação por *reasoners* (como o SHACL, já mencionado na arquitetura do Allux) e a injeção direta no prompt do LLM.

| Campo | Tipo | Descrição | Exemplo (Axioma Fictício) |
| :--- | :--- | :--- | :--- |
| `axiom_id` | String | Identificador único e imutável. | `AXIOM_LIT_001` |
| `priority` | Enum | `CRITICAL`, `HIGH`, `MEDIUM`. | `CRITICAL` |
| `domain` | String | Domínio de aplicação (e.g., `LiteraryOS`, `FinOpsOS`). | `LiteraryOS` |
| `rule_type` | Enum | Tipo de restrição (`INVARIANT`, `CONSTRAINT`, `RELATION`). | `INVARIANT` |
| `natural_language` | String | Descrição legível por humanos. | "A Mãe dos Sete é sempre a entidade geradora e nunca a entidade gerada." |
| `formal_logic` | String | Regra em lógica de primeira ordem ou SHACL/SPARQL. | `(Entity.MotherOfSeven) AND NOT (is_generated_by SOME Entity)` |
| `violation_action` | Enum | Ação em caso de falha (`BLOCK_PROMOTION`, `FORCE_REWRITE`, `ALERT_ONLY`). | `BLOCK_PROMOTION` |

### 2.2. Fluxo de Validação em Tempo Real (OS-RADAR 2.0)

O OS-RADAR 2.0 deve operar como um *middleware* entre o LLM e o Canon Registry.

1. **LLM Geração:** O LLM gera um artefato (texto, código, etc.).
2. **Injeção de Contratos:** O **Prompt de Validação** injeta o `formal_logic` dos axiomas `CRITICAL` e `HIGH` relevantes.
3. **OS-RADAR Check:** O OS-RADAR executa o seguinte:
    a. **Verificação Simbólica:** Utiliza um *reasoner* (e.g., SHACL) para verificar se o artefato viola o `formal_logic`.
    b. **Verificação LLM (Self-Correction):** O LLM é solicitado a avaliar sua própria saída contra o `natural_language` do Contrato Semântico (Chain-of-Thought de validação).
4. **Ação Determinística:**
    *   Se a verificação falhar e `violation_action` for `BLOCK_PROMOTION`, o artefato é rejeitado e o LLM é forçado a reescrever (`FORCE_REWRITE`).
    *   Se for `ALERT_ONLY`, o artefato é marcado com um *flag* de risco.

## 3. Implementação Técnica (Pseudocódigo)

```python
# Novo Endpoint na API do Allux
@app.post("/os_radar/validate_semantic_contract")
def validate_semantic_contract(artifact_content: str, relevant_axioms: List[Axiom]):
    
    for axiom in relevant_axioms:
        # 1. Execução do Reasoner Simbólico (SHACL/OWL)
        is_symbolic_valid = symbolic_reasoner.check(axiom.formal_logic, artifact_content)
        
        if not is_symbolic_valid and axiom.priority == "CRITICAL":
            # Ação Determinística: Bloqueio Imediato
            return {"status": "VIOLATION", "axiom_id": axiom.axiom_id, "action": "BLOCK_PROMOTION"}

        # 2. Execução da Self-Correction do LLM (para regras complexas)
        llm_prompt = f"""
        Você é o Verificador Ontológico do Allux.
        Axioma: {axiom.natural_language}
        Conteúdo: {artifact_content}
        Sua tarefa é: Avaliar se o Conteúdo viola o Axioma. Responda APENAS 'VIOLATION' ou 'PASS'.
        """
        llm_response = call_llm(llm_prompt, model="Verifier")
        
        if llm_response == "VIOLATION" and axiom.violation_action == "FORCE_REWRITE":
            # Força a reescrita do conteúdo
            return {"status": "VIOLATION", "axiom_id": axiom.axiom_id, "action": "FORCE_REWRITE"}

    return {"status": "PASS", "message": "Contratos Semânticos respeitados."}
```

## 4. Posicionamento Estratégico
A adoção de **Contratos Semânticos** posiciona o Allux como o **único sistema de governança de IA que garante a conformidade lógica** (não apenas factual). Isso é o que a indústria de *Compliance* e *RegTech* precisa, tornando o Allux inevitável para as verticais **Compliance-OS** e **RegOS/Legal**. O Allux passa a ser um *firewall* de lógica, não apenas um filtro de palavras.
