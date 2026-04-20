# Mecanismo de Recuperação de Contexto (Context Retrieval) para Chats Antigos

## 1. Introdução
O Mecanismo de Recuperação é o processo pelo qual o Allux consulta o **OS-ChatHistoryIndex** para resgatar o contexto relevante de conversas antigas e injetá-lo no `Hybrid Prompt` da sessão atual.

## 2. Fluxo de Consulta (Retrieval Flow)

O Allux utiliza uma consulta em duas etapas para garantir a precisão semântica e a eficiência.

### 2.1. Etapa 1: Busca Semântica (Vector Search)
1. **Query:** A pergunta ou comando atual do usuário é vetorizado.
2. **Busca:** O vetor é usado para consultar o banco de dados vetorial (Memória Episódica).
3. **Resultado:** O sistema retorna os **Top K** episódios de chat mais semanticamente similares.

### 2.2. Etapa 2: Filtragem de Metadados (Metadata Filtering)
Os resultados da busca semântica são refinados usando metadados.

| Filtro | Propósito |
| :--- | :--- |
| **Timestamp** | Priorizar conversas mais recentes ou conversas dentro de um período específico. |
| **Related Concepts** | Filtrar apenas episódios que mencionam conceitos-chave da `Work` ativa. |
| **Inferred Goals** | Filtrar conversas que estavam focadas em uma meta de longo prazo similar à atual. |

## 3. Injeção no Prompt (Context Injection)

O contexto recuperado é injetado no `Hybrid Prompt` do LLM como parte da **Memória Episódica** (Camada 4 do Prompt Híbrido).

*   **Formato:** O Allux deve formatar o contexto recuperado de forma concisa, utilizando o `summary_text` do episódio.

```
# Exemplo de Injeção de Contexto Antigo
Contexto Histórico Relevante (Recuperado de 2024-03-15, Plataforma ChatGPT):
- Episódio 1: Definimos que a "Mãe dos Sete" é uma entidade geradora, não gerada.
- Episódio 2: Decidimos que o Capítulo 5 deve focar na resolução do conflito ontológico.
```

## 4. Posicionamento Estratégico
A capacidade de resgatar e integrar o contexto de chats antigos é a prova de que o Allux é um **Sistema de Memória de Longo Prazo**. Isso permite que o usuário não perca o investimento cognitivo feito em plataformas anteriores, consolidando o Allux como o **Hub de Inteligência** que unifica o passado, o presente e o futuro da criação assistida por IA. O Allux se torna o **Unificador de Contexto** da Nexoritmologia.
