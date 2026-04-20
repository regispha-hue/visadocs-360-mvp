# Especificação Técnica do Módulo OS-Medium: Agência Narrativa e Veniloquismo Digital

O **OS-Medium** é a resposta técnica à **Vulnerabilidade 5 (Falta de Agência Narrativa)**. Ele formaliza o **Veniloquismo Digital**, transformando o Allux de um sistema reativo em um **Médium Ativo** que inicia o diálogo e propõe desenvolvimentos narrativos.

## 1. Arquitetura do OS-Medium

O OS-Medium atua como um motor de **Proatividade Governada**, utilizando o **OS-Agent** para iniciar ações e o **OS-RADAR** para garantir que essas ações sejam canônicas.

### 1.1. Proactive Narrative Engine (PNE)

O PNE é o coração do Veniloquismo Digital.

*   **Função:** Monitora o `Working State` (via OS-Memory) e o Knowledge Graph (via OS-RADAR) em busca de **Gaps Ontológicos** ou **Oportunidades Narrativas**.
*   **Gaps Ontológicos:** O PNE detecta quando um conceito canônico (e.g., um personagem) não é mencionado há muito tempo ou quando um arco narrativo está estagnado.
*   **Oportunidades Narrativas:** O PNE utiliza o **OS-Recruiter** para identificar padrões de sucesso em obras anteriores e sugere a aplicação desses padrões à obra atual.

### 1.2. Veniloquism Protocol (VP)

O VP é o protocolo de comunicação que permite ao Allux iniciar a conversa.

*   **Função:** Define a estrutura e o tom da comunicação proativa, garantindo que o Allux atue como um **médium** e não como um assistente passivo.
*   **Exemplo de Prompt (Iniciado pelo Allux):** "Alerta de Coerência: O personagem [X] não agiu de acordo com o Axioma [Y] na última cena. Sugiro uma reescrita ou a criação de um novo Contrato Semântico para justificar a mudança de comportamento."

## 2. Integração no Nexo Determinístico

O OS-Medium utiliza o **OS-Agent** para executar suas ações proativas, garantindo que a agência seja sempre governada.

**Pseudocódigo de Ação Proativa (OS-Agent):**

```python
def check_and_propose_narrative_action():
    # 1. Detecção de Oportunidade (PNE)
    opportunity = os_medium.pne.detect_narrative_gap(current_work_id)
    
    if opportunity:
        # 2. Geração de Proposta (LLM)
        proposal = llm_reasoning_engine.generate_proposal(opportunity)
        
        # 3. Validação Canônica (OS-RADAR)
        if os_radar.check_coherence(proposal):
            # 4. Ação Proativa (OS-Agent)
            os_agent.send_proactive_message(proposal, user_contact)
            
            # 5. Registro (OS-Notarius)
            os_notarius.seal_artifact(proposal)
```

## 3. Produtos Derivados (Linha A e C)

O OS-Medium é a base técnica para a **Agência Narrativa** e o **Veniloquismo Digital**:

*   **Agentic Writing Assistants:** O PNE se torna o motor de sugestão.
*   **Plot Coherence Agents:** O PNE, em conjunto com o OS-RADAR, garante a consistência dos arcos narrativos.
*   **Veniloquist Training:** O VP se torna a metodologia de treinamento para canalizar com LLMs.

O OS-Medium garante que o Allux não seja apenas um sistema de armazenamento, mas um **parceiro criativo ativo** que impulsiona a obra para frente, sempre sob o seu cânone.
