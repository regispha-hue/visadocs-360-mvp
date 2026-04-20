# Arquitetura do OS-ChatHistoryIndex: Indexação Retroativa de Conversas

## 1. Introdução
O **OS-ChatHistoryIndex** é o componente do **OS-Memory** responsável por transformar o histórico de conversas antigas (que não foram geradas sob o Allux) em uma fonte de memória episódica utilizável. Ele realiza uma **Indexação Retroativa** para integrar o passado fragmentado ao presente determinístico do Allux.

## 2. O Processo de Arqueologia Cognitiva

A indexação retroativa é um processo de *pipeline* que converte dados brutos de chat em vetores de memória de longo prazo.

| Etapa | Descrição | Propósito |
| :--- | :--- | :--- |
| **1. Ingestão** | Importação de arquivos de histórico de chat (JSON, CSV, TXT) de diversas fontes (Claude, ChatGPT, Telegram). | Unificar o passado fragmentado. |
| **2. Segmentação** | Divisão do histórico em "episódios" ou "turnos" significativos. | Criar unidades de memória coerentes. |
| **3. Sumarização** | O LLM (guiado pelo Allux) gera um resumo conciso de cada episódio. | Reduzir o volume de dados e o custo de tokens. |
| **4. Vetorização** | O resumo é transformado em um *embedding* de alta fidelidade. | Criar o índice de busca semântica. |
| **5. Indexação** | O vetor e os metadados (timestamp, autor, resumo) são armazenados no banco de dados vetorial (Memória Episódica). | Tornar o passado acessível via RAG. |

## 3. Estrutura de Dados do Índice

O índice deve ser rico em metadados para permitir buscas precisas.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `episode_id` | UUID | Identificador único do episódio. |
| `source_platform` | String | Plataforma original (e.g., `ChatGPT`, `Claude`, `Telegram`). |
| `timestamp_range` | Array [start, end] | Período de tempo coberto pelo episódio. |
| `summary_text` | String | Resumo conciso do conteúdo do episódio. |
| `embedding_vector` | Array | Vetor de alta dimensão para busca semântica. |
| `related_concepts` | Array | Conceitos-chave extraídos (e.g., "Mãe dos Sete", "Axioma LDM-001"). |

## 4. Indexação de Intenção (Intent Indexing)

Para que o Allux possa "lembrar" o que o usuário queria fazer, o LLM deve ser instruído a extrair a **intenção** de cada episódio.

*   **Prompt de Intenção:** "Com base neste segmento de chat, qual era a meta de longo prazo do usuário? (e.g., 'Desenvolver a arquitetura do Allux', 'Escrever o Capítulo 5')."
*   **Armazenamento:** A intenção extraída é armazenada no campo `inferred_goals` do índice.

## 5. Posicionamento Estratégico
O OS-ChatHistoryIndex transforma o histórico de conversas em um **Ativo de Conhecimento**. Ele permite que o Allux ofereça um serviço de **Migração Cognitiva**, onde o usuário pode importar todo o seu passado de IA para o ambiente determinístico do Allux. Isso é crucial para a adoção, pois resolve a dor de ter que "começar do zero" ao mudar de plataforma. O Allux se torna o **Arqueólogo Cognitivo** da Nexoritmologia.
