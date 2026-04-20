# Interface de Comando e Visualização de Fragmentos (FRAG-UI)

## 1. Introdução
A eficácia do comando FRAG depende de uma interface que apresente a complexidade da busca multidimensional de forma clara e acionável. O **FRAG-UI** é a camada de apresentação que transforma a lista de fragmentos em um mapa de conhecimento.

## 2. Interface de Comando (CLI/Chat)

O comando deve ser simples, mas o output deve ser rico em metadados.

| Ação | Comando | Output Imediato |
| :--- | :--- | :--- |
| **Busca** | `FRAG-ALL Mãe dos Sete` | Retorna a Síntese Canônica e um link para o FRAG-UI. |
| **Visualização** | `FRAG-UI <fragment_id>` | Abre o fragmento original no contexto (e.g., abre o chat antigo, ou o arquivo de código). |
| **Injeção** | `FRAG-INJECT <fragment_id>` | Injeta o fragmento no `Working State` para uso imediato. |

## 3. Visualização de Fragmentos (FRAG-UI)

O FRAG-UI deve ser uma interface gráfica (Web/Desktop) que permite ao usuário navegar pelo nexo.

### 3.1. Mapa de Conexões (Nexo Graph)
*   **Nó Central:** O termo de busca (e.g., "Mãe dos Sete").
*   **Nós Conectados:** Os fragmentos recuperados, coloridos por `source_type` (e.g., Axiomas em azul, Chats em verde, Código em vermelho).
*   **Arestas:** Linhas que representam a relação semântica ou temporal entre os fragmentos.

### 3.2. Painel de Detalhes
Ao clicar em um fragmento, o painel exibe:

| Campo | Conteúdo |
| :--- | :--- |
| **Síntese Canônica** | A resposta sintetizada pelo LLM (Nexo Reconstitution). |
| **Detalhes do Fragmento** | `source_work`, `timestamp`, `relevance_score`. |
| **Ações** | Botões para `FRAG-INJECT`, `Verificar OS-Notarius Proof`, `Abrir Fonte Original`. |

## 4. Posicionamento Estratégico
O FRAG-UI transforma a busca em **Exploração Ontológica**. Ele permite que o usuário visualize a complexidade do seu próprio universo de IP de forma intuitiva. O FRAG-UI é a **Visualização do Nexo** da Nexoritmologia.
