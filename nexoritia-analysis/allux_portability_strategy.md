# Estratégia de Portabilidade e Incorporação de Funcionalidades via Allux-Kernel

## 1. A Chave da Portabilidade: Separação de Responsabilidades

A portabilidade do Allux-Agent é garantida pela separação estrita entre o **Kernel de Regras** (Allux Core) e o **Motor de Execução** (LLM/Manus).

### 1.1. Allux Core: O Kernel de Regras (O "O Quê")

O Allux Core é o único componente que precisa ser portátil. Ele contém a inteligência determinística:

*   **Conteúdo:** Axiomas, Contratos Semânticos, Knowledge Graph, Working State.
*   **Formato:** O **FactoringKernel Package (FKP)** empacota esse conteúdo em um formato universal (JSON-LD, YAML, WASM), assinado pelo OS-Notarius.
*   **Portabilidade:** O FKP pode ser carregado em qualquer ambiente (local, nuvem, LLM de terceiros) que possua um SDK de importação do Allux.

### 1.2. Motor de Execução: O Periférico (O "Como")

O Motor de Execução (Manus, um servidor local, um script Python) é tratado como um **periférico** que implementa as APIs de **Skills** do OS-Agent.

| Funcionalidade Manus | Skill do OS-Agent | Mecanismo de Incorporação |
| :--- | :--- | :--- |
| **Shell/File** | `os_agent_file_manager` | O LLM invoca a Skill, e o Allux Core valida a ação contra o OS-RADAR antes de enviar o comando para o Shell. |
| **Browser** | `os_agent_web_navigator` | O LLM invoca a Skill, e o Allux Core injeta o Contrato Semântico de segurança (e.g., lista negra de URLs) no comando do Browser. |
| **Webdev Init** | `os_agent_project_factory` | O LLM invoca a Skill, e o Allux Core injeta os FactoringKernels (e.g., "Usar React/TS/Tailwind") como parâmetros obrigatórios. |

## 2. Incorporação de Funcionalidades (Governança de Tools)

A incorporação de novas funcionalidades (como as 100 ferramentas especializadas) não requer a reescrita do Allux Core. Requer apenas a criação de um **Contrato Semântico** e uma **Skill** correspondente.

### 2.1. Exemplo: Incorporação de Edição de Vídeo

1.  **Criação de Skill:** O OS-Agent cria uma Skill chamada `os_agent_video_editor` que encapsula a API da ferramenta de vídeo.
2.  **Criação de Axioma:** O usuário define um novo Contrato Semântico: "Axioma: Todo vídeo promocional deve usar a paleta de cores canônica da Obra X."
3.  **Fluxo Governado:**
    *   O LLM invoca `os_agent_video_editor(prompt="Criar trailer...")`.
    *   O OS-RADAR intercepta, verifica o Axioma e injeta o parâmetro `color_palette="CANON_X"` no comando da ferramenta de vídeo.
    *   O **OS-Notarius** registra o vídeo final, garantindo que ele é canônico e assinado.

## 3. Conclusão: O Allux como Padrão de Interoperabilidade

O Allux-Agent não é uma ferramenta; é um **Padrão de Interoperabilidade Ontológica**. Ele permite que o usuário troque o LLM, o motor de execução e as ferramentas de produção sem perder a **Soberania Ontológica** (o Allux Core).

**O Allux é o único sistema que garante que a funcionalidade seja governada pela intenção, e não pela capacidade da ferramenta.**
