# Especificação Técnica: OS-Recruiter - Mecanismo de Recrutamento e Cross-Pollination

## 1. Introdução
O **Mecanismo de Recrutamento** é o coração do OS-Recruiter. Ele define como o IP canônico de uma obra anterior é injetado no contexto de criação de uma nova obra, garantindo a **coerência inter-obras** e facilitando o *cross-pollination* (polinização cruzada) de ideias.

## 2. Injeção de Contexto (Recruitment Injection)

O recrutamento deve ser transparente para o LLM, mas determinístico em sua aplicação.

### 2.1. Injeção no RAG (Canonical Retrieval)
O RAG do Allux (já com Dual Thresholds) deve ser modificado para incluir fontes recrutadas.

| Fonte de Contexto | Prioridade | Mecanismo de Injeção |
| :--- | :--- | :--- |
| **1. Obra Ativa** | **Máxima** | Busca no RAG da obra atual (artefatos, axiomas). |
| **2. Obras Recrutadas** | **Alta** | Busca no RAG das obras recrutadas (apenas artefatos `CANON` e `FROZEN`). |
| **3. Knowledge Graph** | **Determinística** | Consulta direta ao KG unificado (Obra Ativa + Obras Recrutadas). |

**Regra de Ouro:** Se um conceito existe na Obra Ativa e em uma Obra Recrutada, a definição da **Obra Ativa** tem precedência.

### 2.2. Injeção no Prompt (Axiom Inheritance)
O módulo de Otimização do Nexo (Axiom Embedding) deve ser atualizado para incluir os axiomas recrutados.

1. **Seleção:** O sistema filtra os axiomas recrutados que são relevantes para a instrução do usuário.
2. **Namespace:** Os axiomas recrutados são injetados no prompt com um prefixo claro (e.g., `[AXIOMA_REC:LDM-001]`).
3. **Validação:** O OS-RADAR (Contratos Semânticos) deve verificar a coerência do novo artefato não apenas contra os axiomas da obra atual, mas também contra os axiomas recrutados.

## 3. Cross-Pollination de Obras

O *cross-pollination* é o uso intencional de elementos de uma obra recrutada na obra ativa.

### 3.1. Mecanismo de Sugestão (MCP Tool)
O Allux deve expor um *tool* MCP para que o LLM possa sugerir o uso de elementos recrutados.

```typescript
// MCP Tool Definition
{
  "name": "os_recruiter_suggest_crossover",
  "description": "Sugere um elemento canônico de uma obra recrutada que é semanticamente relevante para o contexto atual.",
  "parameters": {
    "type": "object",
    "properties": {
      "concept": { "type": "string", "description": "O conceito ou entidade que está sendo discutido." }
    }
  }
}
```

**Workflow de Sugestão:**
1. **LLM:** Gera um trecho de texto.
2. **LLM (Self-Correction):** Invoca `os_recruiter_suggest_crossover(concept="Mãe dos Sete")`.
3. **Allux API:** Retorna um artefato canônico relacionado de uma obra recrutada (e.g., "A descrição da Mãe dos Sete no Homem Reverso é: [...]").
4. **LLM:** Utiliza o artefato retornado para enriquecer o texto atual, garantindo a coerência do *crossover*.

### 3.2. Recrutamento de Arquivos (File System Integration)
O `Artifacts` da obra recrutada devem ser acessíveis via *symbolic links* ou cópia para o diretório `library/recruited_assets/` da obra ativa.

*   **Vantagem:** Permite que o Assembler Typst e outros processadores de arquivos acessem o conteúdo recrutado diretamente, facilitando a inclusão de imagens, *layouts* ou blocos de código canônicos.

## 4. Posicionamento Estratégico
O OS-Recruiter transforma o Allux em um **Motor de Criação de Universos Coerentes**. Para estúdios de IP, isso significa que a criação de *spin-offs*, *prequels* e *sequels* é acelerada e a fidelidade canônica é garantida por um sistema determinístico, eliminando a necessidade de longos manuais de estilo e revisões manuais de continuidade. O Allux se torna o **Guardião do Cânone Multiverso** da Nexoritmologia.
