# Especificação Técnica: OS-Agent - O Braço Executor do Allux

## 1. Introdução
O **OS-Agent** é o módulo que confere ao Allux a capacidade de **ação autônoma**. Ele traduz a intenção do usuário (validada pelo OS-RADAR e contextualizada pelo OS-Memory) em comandos executáveis no ambiente de *self-hosting* do Allux.

## 2. Arquitetura de Execução Governada

O OS-Agent opera sob o princípio de **Execução Governada por Axiomas**.

### 2.1. O Ciclo de Execução

1. **Intenção do Usuário:** O usuário envia um comando (e.g., "Organize meus downloads").
2. **Validação Ontológica (OS-RADAR):** O Allux verifica se a intenção viola algum Contrato Semântico (e.g., "Axioma: Nunca delete arquivos sem confirmação").
3. **Seleção de Skill:** O LLM (agora um *Reasoning Engine*) seleciona a Skill (ferramenta) apropriada (e.g., `file_organizer`).
4. **Execução Governada (OS-Agent):** O OS-Agent executa a Skill, injetando os parâmetros **governados** pelo axioma (e.g., o parâmetro `delete_files` é forçado a `false`).
5. **Registro (OS-Notarius):** A ação executada e seu resultado são registrados e ancorados como um evento de IP.

### 2.2. Skills (Ferramentas de Execução)

As Skills são funções modulares que o LLM pode invocar.

| Categoria de Skill | Exemplo de Skill | Governança Necessária (Axioma) |
| :--- | :--- | :--- |
| **Sistema de Arquivos** | `file_organizer`, `file_backup` | Regras de organização (OS-StpReddnce). |
| **Web/Rede** | `web_scraper`, `api_caller` | Regras de privacidade e limites de uso. |
| **Código** | `script_runner`, `repo_manager` | Regras de versionamento e branch canônico. |
| **Comunicação** | `send_message`, `send_email` | Regras de tom e destinatários canônicos. |

## 3. Criação Autônoma de Skills

O OS-Agent deve ser capaz de criar suas próprias Skills, como o ClawdBot.

1. **Intenção:** O usuário pede uma tarefa sem Skill existente (e.g., "Crie um script para monitorar o preço do Bitcoin").
2. **Design:** O LLM projeta o código da Skill (e.g., um script Python).
3. **Validação de Código:** O **OS-RADAR** verifica o código da Skill contra axiomas de segurança (e.g., "Axioma: Nenhum script pode conter chaves de API em texto puro").
4. **Instalação:** O OS-Agent instala a Skill validada.
5. **Registro:** O **OS-Notarius** registra a Skill como um novo artefato de IP.

## 4. Posicionamento Estratégico
O OS-Agent garante que o Allux seja o **único Agente Autônomo que não pode se desviar do cânone**. Ele transforma a capacidade de ação do ClawdBot em uma **Ação Determinística Governada**. O Allux se torna o **Agente de Execução Canônica** da Nexoritmologia.
