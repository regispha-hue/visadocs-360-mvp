# Especificação Técnica: OS-Agent - Mecanismo de Proatividade

## 1. Introdução
O Mecanismo de Proatividade é o que permite ao Allux **iniciar a comunicação**, superando a passividade dos LLMs tradicionais. Ele monitora o estado interno e externo do ecossistema e gera alertas ou executa ações autônomas baseadas em gatilhos definidos.

## 2. Arquitetura de Monitoramento (The Watcher)

O Allux deve ter um processo de monitoramento contínuo (The Watcher) que verifica gatilhos em intervalos regulares.

| Fonte de Gatilho | Descrição | Módulo Allux Envolvido |
| :--- | :--- | :--- |
| **Gatilho Ontológico** | Violação de um Contrato Semântico (OS-RADAR) ou conflito de axiomas. | OS-RADAR |
| **Gatilho Temporal** | Prazo de uma tarefa no `NEXT.md` expirado ou evento agendado. | OS-StpReddnce (NEXT.md) |
| **Gatilho de Estado** | Mudança crítica no `Working State` (e.g., tarefa principal concluída). | OS-Memory |
| **Gatilho Externo** | Mudança em um arquivo monitorado, preço de ação, ou e-mail importante. | OS-Agent (Skills de Monitoramento) |

## 3. Fluxo de Ação Proativa

### 3.1. Geração de Alerta
1. **Detecção:** O Watcher detecta um gatilho.
2. **Contextualização:** O Allux usa o LLM para contextualizar o alerta com o `Working State` atual.
3. **Formulação:** O LLM formula uma mensagem proativa, sugerindo a ação canônica.

**Exemplo:**
*   **Gatilho:** Conflito de Axioma detectado.
*   **Mensagem:** "Alerta Ontológico: O conceito 'Mãe dos Sete' foi redefinido na Obra B. Isso viola o Axioma LDM-001 da Obra A. Ação Sugerida: Executar `FRAG-ALL Mãe dos Sete` para reconciliação."

### 3.2. Execução Autônoma (Ação de Nível 2)
Para ações de baixo risco e alta certeza, o Allux pode executar a ação sem confirmação.

*   **Regra:** Ação Autônoma só é permitida se o **Axioma de Execução** for `AUTO_EXECUTE: TRUE`.
*   **Exemplo:**
    *   **Gatilho:** Arquivo temporário criado no `/tmp` (Gatilho Externo).
    *   **Ação Autônoma:** OS-Agent executa a Skill `file_cleaner` (governado pelo Axioma `CLEANUP_TMP: TRUE`).
    *   **Notificação:** O Allux envia uma notificação: "Limpeza de /tmp executada (Ação Autônoma Nível 2)."

## 4. Posicionamento Estratégico
O Mecanismo de Proatividade transforma o Allux em um **Parceiro Cognitivo Ativo**. Ele garante que o universo ontológico do usuário esteja sempre em conformidade e que o trabalho avance sem a necessidade de intervenção constante. O Allux se torna o **Guardião Proativo do Nexo** da Nexoritmologia.
