# Especificação Técnica: Otimização do Nexo com Axiom Embedding e Compressão Semântica

## 1. Introdução
O desafio de escalar o Allux reside na gestão do **Context Window** do LLM. O seu "livro de 700 páginas de rascunho" e os 21 Axiomas Canônicos (e futuros) consomem tokens preciosos. A **Otimização do Nexo** visa compactar a informação semântica dos axiomas, garantindo que o LLM tenha acesso ao kernel completo sem sofrer de *context loss* ou *token overflow*.

A solução proposta é o **Axiom Embedding**, uma técnica de compressão semântica que transforma a densidade ontológica em um vetor de alta fidelidade.

## 2. Arquitetura de Axiom Embedding

### 2.1. O Processo de Compressão Semântica
Em vez de injetar o texto completo dos axiomas no prompt, injetamos uma representação vetorial (embedding) que o LLM pode usar para **ancoragem semântica**.

| Etapa | Descrição | Ferramenta/Tecnologia |
| :--- | :--- | :--- |
| **1. Formalização** | Converter o axioma de linguagem natural para o formato estruturado (`formal_logic` do Contrato Semântico). | JSON-LD, SHACL, Lógica de Primeira Ordem. |
| **2. Vetorização** | Gerar um embedding de alta dimensão a partir do texto formalizado e da descrição em linguagem natural. | Modelos de Embedding (e.g., `text-embedding-3-large`, modelos de código). |
| **3. Compressão** | Aplicar técnicas de compressão vetorial (e.g., PCA, Quantização) para reduzir a dimensionalidade e o custo de armazenamento/transmissão. | PCA (Principal Component Analysis), Quantização. |
| **4. Indexação** | Armazenar os vetores compactados em um banco de dados vetorial. | FAISS (já planejado no Allux), ChromaDB. |

### 2.2. Otimização do Prompt (Injeção do Nexo)
O prompt do LLM será otimizado para incluir o **Axiom Embedding** de duas formas:

#### A. Injeção Direta (Para Axiomas Críticos)
Para os axiomas `CRITICAL`, o prompt incluirá o vetor compactado e uma instrução para o LLM usar esse vetor como **restrição semântica** durante a geração.

```
# Prompt Otimizado (Exemplo)
Você é o Executor Ontológico do Allux.
Sua tarefa é gerar o Artefato, respeitando as seguintes Restrições Semânticas (Axiom Embeddings):
[VETOR_AXIOMA_CRITICO_1]
[VETOR_AXIOMA_CRITICO_2]

Instrução: [Instrução do Usuário]
```

#### B. RAG Ontológico (Para Axiomas de Contexto)
Para axiomas de contexto (`HIGH` e `MEDIUM`), o Allux fará uma busca RAG no banco de dados vetorial usando a instrução do usuário como *query*. O resultado será o **texto completo do axioma relevante**, injetado no prompt.

**Vantagem:** O LLM só recebe o texto dos axiomas que são **semanticamente relevantes** para a tarefa, economizando tokens e aumentando a precisão.

## 3. Implementação Técnica (Pseudocódigo)

```python
# Função para gerar e armazenar embeddings
def generate_and_store_axiom_embedding(axiom: Axiom):
    # 1. Concatenar dados para alta fidelidade
    text_to_embed = f"ID: {axiom.axiom_id}. Prioridade: {axiom.priority}. Regra: {axiom.natural_language}. Lógica Formal: {axiom.formal_logic}"
    
    # 2. Gerar embedding
    embedding = embedding_model.encode(text_to_embed)
    
    # 3. Compressão (Exemplo: PCA para 128 dimensões)
    compressed_embedding = pca_model.transform(embedding)
    
    # 4. Armazenar no FAISS
    faiss_index.add(compressed_embedding, metadata={"axiom_id": axiom.axiom_id, "priority": axiom.priority})

# Função para otimizar o prompt
def optimize_prompt_with_axioms(user_instruction: str, llm_model: str):
    # 1. RAG Ontológico: Buscar axiomas relevantes
    instruction_embedding = embedding_model.encode(user_instruction)
    relevant_axioms_ids = faiss_index.search(instruction_embedding, k=5)
    
    # 2. Separar por prioridade
    critical_axioms = []
    context_axioms_text = []
    
    for axiom_id in relevant_axioms_ids:
        axiom = canon_registry.get_axiom(axiom_id)
        if axiom.priority == "CRITICAL":
            # Injeção Direta do Vetor (simulada aqui pelo ID para simplificar)
            critical_axioms.append(f"[VETOR_AXIOMA_{axiom_id}]")
        else:
            # Injeção do Texto Completo (RAG)
            context_axioms_text.append(f"Axioma {axiom_id}: {axiom.natural_language}")

    # 3. Construir o prompt final
    prompt = f"""
    Você é o Executor Ontológico do Allux.
    Restrições Críticas (Nexo Determinístico): {critical_axioms}
    Contexto Ontológico (RAG): {context_axioms_text}
    
    Instrução do Usuário: {user_instruction}
    """
    return prompt
```

## 4. Posicionamento Estratégico
O **Axiom Embedding** permite que o Allux escale para milhares de axiomas sem comprometer a performance ou o determinismo. Isso o torna o único sistema capaz de gerenciar a **complexidade ontológica de grandes corporações** (e.g., regulamentações globais, catálogos de produtos massivos), garantindo que o LLM sempre opere dentro do universo de discurso definido pelo cliente. O Allux se torna o **único Kernel escalável para a Nexoritmologia**.
