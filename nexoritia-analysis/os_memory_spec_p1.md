# Especificação Técnica: OS-Memory - Arquitetura de Persistência Cognitiva

## 1. Introdução
O **OS-Memory** é o módulo que transforma o Allux no **Córtex Externo** de qualquer LLM. Inspirado em arquiteturas de agentes persistentes (como o ClawdBot), o OS-Memory resolve o problema fundamental da **amnésia de sessão** e da **volatilidade do contexto** dos LLMs, garantindo que o Allux mantenha uma memória de longo prazo e um estado de raciocínio persistente.

## 2. Arquitetura de Memória Híbrida

O OS-Memory deve ser uma arquitetura de memória em três camadas, desacoplada do LLM e gerenciada pelo Allux Core.

| Camada | Função | Tecnologia | Conteúdo |
| :--- | :--- | :--- | :--- |
| **1. Memória de Curto Prazo (Working State)** | Mantém o contexto imediato da sessão e o estado de execução da tarefa. | Redis/In-Memory Cache | Histórico de mensagens da sessão, variáveis de estado, resultados intermediários. |
| **2. Memória de Longo Prazo (Episódica)** | Armazena conversas passadas e eventos significativos (o que aconteceu). | Banco de Dados Vetorial (FAISS/ChromaDB) | Embeddings de conversas passadas, *summaries* de artefatos criados. |
| **3. Memória Canônica (Semântica)** | Armazena o conhecimento fundamental e determinístico (o que é). | Canon Registry/Knowledge Graph | Axiomas, Contratos Semânticos, Entidades Canônicas. |

## 3. Mecanismo de Raciocínio Persistente

O Allux deve manter um **Estado de Trabalho (Working State)** para cada `Work` (Obra) e `Session` (Conversa).

### 3.1. Working State (Estado de Trabalho)
O Working State é um objeto JSON persistente que armazena o "pensamento" atual do Allux, fora do LLM.

| Campo | Descrição |
| :--- | :--- |
| `session_id` | ID da conversa atual. |
| `current_task` | A tarefa que o Allux está executando (e.g., "Escrever o Capítulo 4"). |
| `inferred_goals` | Metas de longo prazo inferidas a partir da conversa (e.g., "Finalizar o Livro dos Montes"). |
| `relevant_axioms` | IDs dos axiomas mais relevantes para a tarefa atual (para injeção no prompt). |
| `recent_events` | Resumo dos últimos 5 eventos significativos da sessão. |

### 3.2. Raciocínio Proativo (ClawdBot-Inspired)
O Allux deve ser capaz de iniciar a comunicação, superando a passividade dos LLMs tradicionais.

1. **Monitoramento:** O Allux monitora o `Working State` e o `Canon Registry`.
2. **Gatilho:** Se um evento externo ocorrer (e.g., um axioma crítico foi violado em outra sessão, ou o prazo de uma tarefa no `NEXT.md` expirou), o Allux gera um `Alert`.
3. **Comunicação:** O Allux usa o LLM para formular uma mensagem proativa baseada no `Alert` e no `Working State` e a envia ao usuário (e.g., "Alerta: O conceito 'Mãe dos Sete' foi redefinido na Obra B. Isso afeta o Capítulo 5 da Obra A. Deseja revisar?").

## 4. Posicionamento Estratégico
O OS-Memory garante que o Allux seja o **único sistema de governança ontológica com memória de longo prazo**. Isso resolve a maior limitação da portabilidade: a perda de contexto. O Allux se torna o **Córtex Externo Universal** que pode ser plugado em qualquer LLM (Claude, GPT, Llama), garantindo que a inteligência e o nexo persistam, independentemente do LLM subjacente. O Allux se torna o **Padrão de Persistência Cognitiva** da Nexoritmologia.
