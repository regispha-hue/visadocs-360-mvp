# Mecanismo de Persistência Trans-Sessão (Cross-Chat Persistence)

## 1. Introdução
A Persistência Trans-Sessão é a capacidade do Allux de manter a continuidade cognitiva e o estado de trabalho (Working State) entre diferentes janelas de chat, diferentes dispositivos ou diferentes LLMs.

## 2. O Ciclo de Vida da Memória (OS-Memory)

O OS-Memory gerencia a memória em um ciclo contínuo, independente da sessão de chat.

### 2.1. Início da Sessão (Load State)
1. **Identificação:** O Allux autentica o usuário e identifica a `Work` (Obra) ativa.
2. **Carregamento:** O Allux carrega o último `Working State` persistente e o `Contextual RAG` (Axiomas e Memória Episódica) do usuário.
3. **Injeção:** O `Hybrid Prompt` é construído e enviado ao LLM, garantindo que o LLM comece a conversa com o contexto completo da sessão anterior.

### 2.2. Durante a Sessão (Update State)
*   **Atualização Contínua:** O LLM usa o MCP Tool `os_memory_update_state` para atualizar o `Working State` após cada passo significativo de raciocínio.
*   **Compressão Episódica:** O histórico de mensagens é periodicamente resumido e vetorizado para a Memória Episódica (Longo Prazo), mantendo a memória de longo prazo eficiente.

### 2.3. Fim da Sessão (Save State)
1. **Finalização:** Ao detectar o fim da sessão (e.g., inatividade, fechamento da janela), o Allux executa uma última atualização do `Working State`.
2. **Persistência:** O `Working State` final é salvo no banco de dados persistente do Allux.
3. **Ancoragem:** Opcionalmente, o `Working State` pode ser ancorado pelo **OS-Notarius** para criar um ponto de restauração imutável do raciocínio.

## 3. Portabilidade de Chat (Cross-Platform)

O Allux deve ser acessível via diferentes *front-ends* (Telegram, Web App, API).

| Plataforma | Mecanismo de Conexão | Persistência |
| :--- | :--- | :--- |
| **Web App** | Conexão direta com a API do Allux. | Máxima (acesso direto ao OS-Memory). |
| **Telegram/WhatsApp** | Gateway de mensagens que roteia a conversa para a API do Allux. | Alta (o gateway mantém o `session_id` e o Allux faz o resto). |
| **API (Integração)** | O cliente fornece o `user_id` e o `work_id` na chamada. | Total (o Allux carrega o estado com base nos IDs fornecidos). |

**Conclusão:** A inteligência do Allux é **trans-sessão**. O LLM pode ser trocado, o chat pode ser fechado, mas o **Working State** e a **Memória Episódica** persistem, garantindo a continuidade cognitiva e a quebra da amnésia de chat.
