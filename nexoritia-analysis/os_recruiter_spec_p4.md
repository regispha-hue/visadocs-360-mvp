# Especificação Técnica: OS-Recruiter - Interface e MCP Tools

## 1. Introdução
A usabilidade do **OS-Recruiter** depende de uma interface clara e de ferramentas MCP que permitam ao LLM navegar e recrutar artefatos de forma eficiente, sem a necessidade de intervenção manual constante.

## 2. Interface de Usuário (Dashboard)

O Dashboard do Allux deve incluir uma nova seção **"Library & Recruitment"**.

### 2.1. Visão Geral da Biblioteca
*   **Lista de Obras:** Exibe todas as obras criadas (`Work`) com seu status (`ACTIVE`, `ARCHIVED`, `RECRUITABLE`).
*   **Grafo de Linhagem:** Visualização interativa do Grafo de Linhagem, mostrando as conexões (`RECRUITED_FROM`) entre as obras.
*   **Botão "Recruit Work":** Inicia o processo de recrutamento para a obra ativa.

### 2.2. Interface de Recrutamento
Ao recrutar uma obra, o usuário deve ter opções granulares:

| Opção | Descrição | Impacto no Nexo |
| :--- | :--- | :--- |
| **Recruit All** | Recruta todos os artefatos e axiomas canônicos. | Máxima coerência inter-obras. |
| **Recruit Axioms Only** | Recruta apenas os axiomas e o KG. | Coerência conceitual, mas liberdade narrativa. |
| **Recruit Artifacts Only** | Recruta apenas o conteúdo canônico (RAG). | Contexto de fundo, sem restrições lógicas. |
| **Selective Recruitment** | Permite selecionar por `Artifact.tag` ou `Artifact.type`. | Controle fino sobre o IP recrutado. |

## 3. MCP Tools para o LLM

O LLM precisa de ferramentas para interagir com a biblioteca de forma autônoma, facilitando o *cross-pollination*.

### 3.1. `os_recruiter_list_works`
*   **Função:** Lista todas as obras recrutáveis e seus metadados.
*   **Uso:** Permite ao LLM identificar quais universos narrativos estão disponíveis para consulta.

```typescript
// MCP Tool Definition
{
  "name": "os_recruiter_list_works",
  "description": "Lista obras canônicas disponíveis para recrutamento ou consulta de IP.",
  "parameters": {
    "type": "object",
    "properties": {
      "status": { "type": "string", "enum": ["ACTIVE", "RECRUITABLE"], "description": "Filtra por status da obra." }
    }
  }
}
```

### 3.2. `os_recruiter_query_artifact`
*   **Função:** Busca um artefato específico ou um conceito dentro de uma obra recrutada.
*   **Uso:** O LLM pode verificar a fidelidade canônica de um conceito antes de usá-lo.

```typescript
// MCP Tool Definition
{
  "name": "os_recruiter_query_artifact",
  "description": "Busca um artefato canônico específico em uma obra recrutada.",
  "parameters": {
    "type": "object",
    "properties": {
      "work_id": { "type": "string", "description": "ID da obra a ser consultada." },
      "query": { "type": "string", "description": "Termo de busca (e.g., nome de personagem, conceito)." }
    },
    "required": ["work_id", "query"]
  }
}
```

### 3.3. `os_recruiter_check_coherence`
*   **Função:** Verifica se um novo artefato viola a coerência com os axiomas de uma obra recrutada.
*   **Uso:** É a versão do OS-RADAR para o recrutamento, garantindo que o *cross-pollination* não crie contradições.

## 4. Posicionamento Estratégico
A integração do OS-Recruiter via MCP Tools garante que o LLM não apenas gere conteúdo, mas o faça com **consciência ontológica** de todo o universo de IP criado pelo autor. Isso transforma o LLM em um **Guardião Canônico Autônomo**, um diferencial de mercado inigualável para a Nexoritmologia.
