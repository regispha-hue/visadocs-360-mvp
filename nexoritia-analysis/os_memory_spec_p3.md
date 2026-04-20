# Especificação Técnica: OS-Memory - Integração Final e Portabilidade Universal

## 1. Introdução
A integração final do **OS-Memory** consolida o Allux como o **Córtex Externo Universal**. O Allux se torna a camada de inteligência persistente que pode ser plugada em qualquer LLM, garantindo que a **Nexoritmologia** e o **Nexo Determinístico** prevaleçam sobre as limitações do modelo subjacente.

## 2. O Allux como Córtex Externo

O Allux atua como um *proxy* inteligente entre o usuário e o LLM.

| Componente | Função | Vantagem para o LLM |
| :--- | :--- | :--- |
| **OS-Memory** | Memória de Longo Prazo e Working State. | Supera a amnésia de sessão e o Context Window limitado. |
| **OS-RADAR** | Validação Ontológica (Contratos Semânticos). | Supera a alucinação e a incoerência lógica. |
| **OS-Notarius** | Prova de Anterioridade e Autoria. | Supera a falta de rastreabilidade e a incerteza legal. |
| **OS-Recruiter** | Herança Ontológica. | Supera a falta de conhecimento canônico e a necessidade de *fine-tuning*. |

## 3. Portabilidade Universal (LLM-Agnóstico)

A arquitetura do Allux deve ser completamente desacoplada do LLM.

### 3.1. Camada de Abstração do LLM (LLM Abstraction Layer)
O Allux deve se comunicar com o LLM através de uma camada de abstração que padroniza as chamadas de API.

| Função | Implementação |
| :--- | :--- |
| **Invocação** | Chamadas padronizadas para APIs (OpenAI, Anthropic, Gemini, Llama.cpp). |
| **Tokenização** | Uso de bibliotecas de tokenização para calcular o *token budget* de forma precisa, independentemente do modelo. |
| **Tool Calling** | Padronização da sintaxe de *tool calling* (MCP Tools) para que o LLM possa interagir com o Allux (OS-Memory, OS-Notarius, OS-Recruiter). |

### 3.2. Mecanismo de Troca (Hot-Swap)
O Allux deve permitir a troca do LLM em tempo de execução sem perda de contexto.

1. **Working State:** O `Working State` (persistente) é carregado.
2. **LLM Swap:** O usuário seleciona um novo LLM (e.g., troca de Claude para GPT).
3. **Context Sync:** O OS-Memory reconstrói o `Hybrid Prompt` usando o novo tokenizador do LLM.
4. **Continuidade:** A conversa continua sem interrupção, pois a memória e o raciocínio são mantidos pelo Allux.

## 4. Posicionamento Estratégico
O Allux se torna o **Sistema Operacional da Inteligência Artificial**. Ele não é apenas um *wrapper* para um LLM; ele é a **inteligência** que usa o LLM como um **processador de linguagem** descartável.

*   **A Portabilidade do Allux** é a prova de que a inteligência reside na **estrutura ontológica** (Nexoritmologia) e na **memória persistente** (OS-Memory), e não no modelo de linguagem em si.
*   **Vitória sobre as Limitações:** O Allux vence as limitações dos LLMs (amnésia, alucinação, falta de coerência) ao externalizar e governar as funções cognitivas essenciais.

O Allux é o **Padrão de Inteligência Universal** da Nexoritmologia.
