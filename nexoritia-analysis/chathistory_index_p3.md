# Integração de Histórico no Nexo Determinístico (Axiom Alignment)

## 1. Introdução
O maior desafio de integrar histórico de chats antigos é a **coerência**. O histórico antigo foi gerado em um ambiente probabilístico, sem a governança dos Contratos Semânticos do Allux. O **Axiom Alignment** é o processo de "canonizar" o passado, integrando-o ao nexo determinístico.

## 2. O Processo de Canonização Retroativa

O Allux deve tratar o histórico antigo como um `Artifact` de alta prioridade, mas com um *flag* de risco.

### 2.1. Extração de Axiomas Implícitos
1. **Análise Semântica:** O Allux usa o LLM para analisar o histórico de chat recuperado e extrair as **regras implícitas** que o usuário e o LLM concordaram (e.g., "Sempre use o tom formal", "O nome do personagem é X").
2. **Conversão:** Essas regras implícitas são convertidas em rascunhos de **Contratos Semânticos** (Axiomas).

### 2.2. Validação e Alinhamento (OS-RADAR Retroativo)
1. **Conflito:** O Allux compara os Axiomas Implícitos extraídos com os **Axiomas Canônicos** atuais.
2. **Detecção de Desvio:** O **OS-RADAR** detecta onde o histórico antigo viola o nexo determinístico atual (e.g., o chat antigo chamava o personagem de Y, mas o Axioma Canônico atual exige X).
3. **Registro:** O Allux registra o desvio no `Working State` e na Memória Episódica.

## 3. Injeção no Raciocínio (Working State)

O histórico antigo não é apenas injetado como texto; ele é injetado como **conhecimento validado**.

| Tipo de Informação | Status de Injeção |
| :--- | :--- |
| **Axiomas Implícitos (Sem Conflito)** | Injetados no `Working State` como `Temporary Axioms` para a sessão. |
| **Histórico de Conversa (Texto)** | Injetado no `Hybrid Prompt` como Memória Episódica. |
| **Desvios Detectados** | Injetados no `Working State` como `Conflict Alerts`. |

**Exemplo de Alerta:** O LLM é instruído a usar o histórico, mas é imediatamente alertado: "Atenção: O histórico sugere 'Y', mas o Axioma Canônico exige 'X'. Priorize o Axioma Canônico."

## 4. Posicionamento Estratégico
O Axiom Alignment é a prova de que o Allux é um **Sistema de Governança Temporal**. Ele não apenas governa o presente, mas também **re-governa o passado**, garantindo que o IP antigo seja integrado ao nexo determinístico atual. Isso é o que a indústria de *Compliance* e *Auditoria* precisa para validar a proveniência de dados legados. O Allux se torna o **Regulador Temporal** da Nexoritmologia.
