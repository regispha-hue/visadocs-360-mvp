# Especificação Técnica: OS-Memory - Sincronização de Contexto e State Management

## 1. Introdução
O principal desafio da portabilidade do Allux é o **Context Window** (janela de contexto) limitado dos LLMs. O **Mecanismo de Sincronização de Contexto** do OS-Memory garante que o LLM receba apenas o contexto essencial para a tarefa atual, mas com a capacidade de acessar a memória de longo prazo a qualquer momento.

## 2. Sincronização de Contexto (Context Sync)

O Context Sync é o processo de construir o prompt de entrada para o LLM, injetando o contexto de forma inteligente.

### 2.1. O Prompt Híbrido (The Hybrid Prompt)

O prompt enviado ao LLM será composto por quatro seções, priorizadas por relevância e token-efficiency:

| Seção do Prompt | Fonte de Dados | Propósito |
| :--- | :--- | :--- |
| **1. System Prompt** | Allux Core (Fixo) | Define a persona, o tom e as regras de execução do Allux. |
| **2. Working State** | OS-Memory (Curto Prazo) | Injeta o `current_task`, `relevant_axioms` e `recent_events`. |
| **3. Contextual RAG** | Axiom Embedding (Canônica) | Injeta os vetores e o texto dos axiomas **críticos** e **relevantes** (via RAG Ontológico). |
| **4. Conversational RAG** | OS-Memory (Longo Prazo) | Injeta o resumo das conversas passadas (Memória Episódica) relevantes para a *query* do usuário. |

### 2.2. Algoritmo de Compressão de Contexto

Para evitar o estouro do Context Window, o Allux deve aplicar um algoritmo de compressão:

1. **Priorização:** O Allux prioriza o contexto na ordem 1 > 2 > 3 > 4.
2. **Token Budget:** O Allux calcula o *token budget* restante após a injeção do `System Prompt` e do `Working State`.
3. **Compressão Semântica:** O contexto da Memória Episódica (4) é resumido ou condensado pelo próprio LLM (em uma chamada separada) antes de ser injetado no prompt principal.
4. **Truncamento:** Se o limite de tokens for atingido, o contexto da Memória Episódica é truncado primeiro, seguido pelo Contextual RAG (3). O `System Prompt` e o `Working State` são **intocáveis**.

## 3. State Management (Gerenciamento de Estado)

O Allux deve gerenciar o estado da conversa fora do LLM para garantir a persistência.

### 3.1. MCP Tool para Atualização de Estado
O LLM deve ser instruído a atualizar o `Working State` após cada resposta significativa.

```typescript
// MCP Tool Definition
{
  "name": "os_memory_update_state",
  "description": "Atualiza o Working State com novas inferências, metas ou resultados de tarefas.",
  "parameters": {
    "type": "object",
    "properties": {
      "new_inferred_goals": { "type": "array", "description": "Novas metas de longo prazo inferidas." },
      "task_status_update": { "type": "string", "description": "Atualização do status da tarefa atual." }
    }
  }
}
```

### 3.2. Persistência de Raciocínio
O Allux utiliza o **OS-Notarius** para registrar o `Working State` periodicamente.

*   **Vantagem:** O estado de raciocínio do Allux é **imutável** e **rastreável** via blockchain. Se o LLM for trocado (portabilidade), o novo LLM pode carregar o último `Working State` assinado e ancorado, garantindo a continuidade cognitiva.

## 4. Posicionamento Estratégico
O Mecanismo de Sincronização de Contexto do OS-Memory é a solução definitiva para a **Portabilidade Inteligente**. Ele garante que o Allux não dependa da memória volátil do LLM, mas sim de sua própria infraestrutura de memória persistente e auditável. O Allux se torna o **Gerenciador de Estado Cognitivo Universal** da Nexoritmologia.
