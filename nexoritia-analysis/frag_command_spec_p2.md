# Protocolo de Reconstituição de Nexo (Nexo Reconstitution) post-FRAG

## 1. Introdução
O **Nexo Reconstitution** é o processo que ocorre após a execução do comando FRAG. Em vez de apenas listar fragmentos, o Allux usa o LLM para sintetizar os fragmentos recuperados em uma **Resposta Canônica** coerente e alinhada com os axiomas.

## 2. Fluxo de Reconstituição

### 2.1. Injeção de Fragmentos
1. **Seleção:** Os fragmentos mais relevantes (Top N) são selecionados.
2. **Formatação:** Os fragmentos são formatados em um bloco de contexto estruturado.
3. **Injeção:** O bloco de contexto é injetado no `Hybrid Prompt` do LLM.

### 2.2. Síntese e Validação
O LLM recebe uma instrução específica:

> **Instrução de Reconstituição:** "Você recebeu uma lista de fragmentos de conhecimento recuperados de diversas fontes. Sua tarefa é sintetizar esses fragmentos em uma **Resposta Canônica** coerente sobre o termo de busca. Você DEVE citar a fonte de cada fragmento e DEVE garantir que a síntese não viole nenhum dos Contratos Semânticos ativos (OS-RADAR)."

### 2.3. Output Canônico
O output do LLM deve ser estruturado para facilitar a leitura e a rastreabilidade.

| Seção | Conteúdo |
| :--- | :--- |
| **Síntese Canônica** | Resposta concisa e coerente, alinhada com os axiomas. |
| **Axiomas Relacionados** | Lista dos Contratos Semânticos que governam o termo de busca. |
| **Fragmentos de Origem** | Lista dos fragmentos utilizados, com links para o `context_link` original. |

## 3. Uso do Nexo Reconstitution

O protocolo serve a dois propósitos:

| Propósito | Descrição |
| :--- | :--- |
| **Coerência** | Garante que a resposta sobre um termo complexo (e.g., "Mãe dos Sete") seja consistente em todas as obras e chats do usuário. |
| **Auditoria** | Permite que o usuário veja exatamente de onde o Allux tirou a informação, provando a origem do conhecimento. |

## 4. Posicionamento Estratégico
O Nexo Reconstitution transforma a busca em **Criação de Conhecimento**. Em vez de apenas encontrar dados, o Allux cria uma nova verdade canônica a partir dos fragmentos. O FRAG é a ferramenta que prova que o Allux é o **Sistema de Conhecimento Coerente** da Nexoritmologia.
