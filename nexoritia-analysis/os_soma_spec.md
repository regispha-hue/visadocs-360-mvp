# Especificação Técnica do Módulo OS-Soma: Grounding Corporal e Embodied Knowledge

O **OS-Soma** é a resposta técnica à **Vulnerabilidade 2 (Falta de Grounding Corporal)**. Ele formaliza a experiência fenomenológica do usuário (como o ritual de Tarapoto) em dados estruturados que podem ser usados para governar a geração do LLM.

## 1. Arquitetura do OS-Soma

O OS-Soma atua como uma camada de tradução entre o mundo físico/fenomenológico e o Knowledge Graph do Allux.

### 1.1. Somatic-AI Interface (SAI)

O SAI é a interface de entrada para dados de experiência.

*   **Função:** Permite ao usuário registrar um **Estado Fenomenológico** antes de interagir com o Allux.
*   **Dados de Entrada:**
    *   **Metadados de Ritual:** Localização, hora, duração, tipo de ritual (e.g., "Ritual de Tarapoto: Foco na Coerência").
    *   **Dados Subjetivos:** Nível de Foco (1-10), Estado Emocional (Ontologia de Emoções Canônicas), Descrição Sensorial (texto livre).
    *   **Dados Biométricos (Futuro):** Integração com wearables para dados de HRV, sono, etc.
*   **Output:** Um **Somatic Context Object (SCO)** assinado pelo usuário e registrado no OS-Notarius.

### 1.2. Ritual Pattern Library (RPL)

O RPL é o repositório canônico de padrões de experiência.

*   **Função:** Armazena e indexa os SCOs, permitindo que o Allux identifique padrões de experiência que levam a um **Nexo de Alta Fidelidade**.
*   **Mecanismo:** Utiliza o **OS-Recruiter** para indexar os SCOs e o **OS-Memory** para correlacionar o estado fenomenológico com a qualidade do output gerado.

## 2. Integração no Nexo Determinístico

O SCO é injetado no prompt do LLM como um **Contrato Semântico de Estado**.

**Pseudocódigo de Injeção de Contexto (OS-Memory):**

```python
def get_governed_prompt(user_input: str, current_sco: SomaticContextObject):
    # 1. Injeção do Estado Fenomenológico
    somatic_context = f"Contexto Fenomenológico: O usuário está no estado '{current_sco.emotional_state}' com foco '{current_sco.focus_level}/10'. O output DEVE refletir a coerência do Ritual '{current_sco.ritual_type}'."
    
    # 2. Injeção de Axiomas
    axioms = os_radar.get_active_axioms()
    
    # 3. Construção do Prompt Governado
    governed_prompt = f"{somatic_context}\n\n{axioms}\n\n{user_input}"
    
    return governed_prompt
```

## 3. Produtos Derivados (Linha C)

O OS-Soma é a base técnica para a **Linha C (Treinamento Especializado)**:

*   **Embodied Training Data:** O RPL se torna o dataset de experiências fenomenológicas estruturadas.
*   **Somatic-AI Interface:** O SAI se torna o produto de interface.
*   **Ritual Pattern Library:** O RPL se torna o produto de catálogo de padrões.

O OS-Soma garante que o Allux não seja apenas um sistema lógico, mas um sistema **consciente do estado** que governa a geração com base na experiência fenomenológica do usuário.
