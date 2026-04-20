# Arquitetura do Allux como Agente Soberano (Allux-Agent)

## 1. O Paradigma Allux-Agent

O **Allux-Agent** é a materialização do Allux OS como um sistema de Agente de IA que opera sob o princípio da **Soberania Ontológica**. Ele é um sistema **Neuro-Simbólico** onde o componente simbólico (o Allux Core) governa o componente neural (o LLM).

### 1.1. Componentes do Allux-Agent

O Allux-Agent é composto por três camadas principais:

| Camada | Componente | Função |
| :--- | :--- | :--- |
| **1. Simbólica (Governança)** | **Allux Core** | Contém o **Canon Registry**, **OS-RADAR**, **OS-Notarius** e **OS-Memory**. É o **Kernel de Regras** determinísticas. |
| **2. Neural (Raciocínio)** | **LLM** (e.g., Claude, GPT) | Motor de Raciocínio e Geração de Linguagem Natural. Recebe o prompt governado e invoca as Skills. |
| **3. Execução (Ação)** | **Motor de Execução** (e.g., Manus/Shell/Browser) | Executa as ações físicas (código, arquivos, web) conforme instruído pelo LLM. |

### 1.2. Fluxo de Raciocínio Governado (The Nexo Loop)

O fluxo de trabalho do Allux-Agent é um ciclo contínuo de validação e execução:

1.  **Input:** O usuário envia uma intenção (e.g., "Crie o backend para o novo módulo").
2.  **Contextualização (OS-Memory):** O Allux Core carrega o `Working State` e o `Prompt Híbrido` (axiomas, memória episódica).
3.  **Geração de Plano (LLM):** O LLM gera um plano de ação (Chain-of-Thought) e invoca a **Skill** apropriada (e.g., `webdev_init_project`).
4.  **Validação (OS-RADAR):** O Allux Core intercepta a invocação da Skill e a valida contra os **Contratos Semânticos** (e.g., "Axioma: Todo projeto deve usar TypeScript"). Se houver violação, o LLM é forçado a reescrever o plano.
5.  **Execução (OS-Agent):** O Allux Core envia o comando validado para o **Motor de Execução** (Manus).
6.  **Registro (OS-Notarius):** O resultado da execução é hasheado, assinado e ancorado como IP.
7.  **Output:** O resultado é apresentado ao usuário, e o `Working State` é atualizado.

## 2. Portabilidade e Agente-Agnóstico

A portabilidade do Allux-Agent é garantida pela separação estrita entre o **Kernel de Regras** (Allux Core) e o **Motor de Raciocínio/Execução** (LLM/Manus).

*   **Agente-Agnóstico:** O Allux Core se comunica com o LLM e o Motor de Execução através de **APIs e MCP Tools** padronizados.
*   **Troca de LLM:** Se o LLM for trocado (e.g., de Claude para GPT), o novo LLM apenas precisa ser instruído a respeitar o `System Prompt` e a invocar as APIs do Allux Core. O Allux Core injeta o `Working State` e os axiomas, e o novo LLM assume o raciocínio.
*   **Troca de Execução:** Se o Manus for trocado por outro motor de execução (e.g., um servidor local), o novo motor apenas precisa implementar as APIs de **Skills** do OS-Agent.

**O Allux-Agent é o padrão de facto para a criação de Agentes de IA determinísticos e portáteis.**
