# Especificação Técnica: OS-Recruiter - Kernel de Herança Ontológica

## 1. Introdução
O **OS-Recruiter** (ou **OS-Library**) é o módulo do Allux responsável por gerenciar a **Biblioteca Interna de IP** e facilitar a **Herança Ontológica** entre diferentes obras. Ele permite que artefatos, axiomas e estruturas de uma obra anterior (e.g., *O Livro dos Montes*) sejam "recrutados" como fontes canônicas para uma nova obra (e.g., *Homem Reverso*).

## 2. Arquitetura de Bibliotecas Internas

### 2.1. O Conceito de "Obra" (Work)
No Canon Registry do Allux, um novo tipo de entidade deve ser introduzido: `Work`.

| Entidade | Descrição |
| :--- | :--- |
| `Work` | Um contêiner de alto nível que agrupa `Artifacts`, `Axioms` e `Knowledge Graphs` relacionados (e.g., "O Livro dos Montes", "Homem Reverso"). |
| `Artifact` | O conteúdo individual (e.g., "Capítulo 3", "Axioma LDM-001"). |

### 2.2. Schema da Entidade `Work`
A nova tabela `Works` no banco de dados do Allux deve incluir:

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `work_id` | UUID | Identificador único da obra. |
| `title` | String | Título da obra (e.g., "O Livro dos Montes"). |
| `status` | Enum | `ACTIVE`, `ARCHIVED`, `RECRUITABLE`. |
| `root_ontology_id` | UUID | ID do Knowledge Graph raiz desta obra. |
| `recruited_works` | JSON Array | Lista de `work_id`s de obras recrutadas. |

### 2.3. Estrutura de Diretórios (File System)
Para suportar o recrutamento de arquivos, pastas e ZIPs, o Allux deve adotar uma estrutura de diretórios padronizada para cada obra.

```
/allux_data/
├── works/
│   ├── work_ldm/
│   │   ├── artifacts/       # Arquivos individuais (MD, Typst, etc.)
│   │   ├── canon/           # Axiomas e Contratos Semânticos
│   │   └── knowledge_graph/ # Dados do KG (triplas, constraints)
│   ├── work_homem_reverso/
│   │   ├── artifacts/
│   │   ├── canon/
││   └── knowledge_graph/
└── library/
    └── recruited_assets/    # Local de cópia/link simbólico de artefatos recrutados
```

## 3. Mecanismo de Recrutamento (Recruitment)

O recrutamento é o processo de declarar que uma nova obra (Obra B) utilizará o IP canônico de uma obra anterior (Obra A).

### 3.1. Herança Ontológica
Ao iniciar a Obra B, o usuário pode recrutar a Obra A.

*   **Axiomas:** Os axiomas da Obra A são automaticamente injetados no pool de axiomas da Obra B, mas com um *namespace* (`LDM:Axioma-001`).
*   **Knowledge Graph:** O KG da Obra B herda o KG da Obra A. As triplas da Obra A tornam-se **imutáveis** na Obra B, a menos que um novo axioma na Obra B explicitamente as redefina (com rastreamento de conflito).

### 3.2. Recrutamento de Artefatos (RAG)
*   **Indexação:** Todos os `Artifacts` da Obra A são indexados no RAG da Obra B.
*   **Prioridade:** O RAG da Obra B deve priorizar a busca nos artefatos da Obra B. Se a similaridade for baixa, ele consulta os artefatos recrutados da Obra A.

## 4. Posicionamento Estratégico
O OS-Recruiter posiciona o Allux como o **Kernel de Herança Ontológica**, permitindo que criadores de IP construam universos narrativos complexos e interconectados com coerência garantida. Isso é crucial para estúdios de mídia e franquias que precisam manter a fidelidade canônica em múltiplos produtos (livros, filmes, jogos). O Allux se torna o **Motor de Coerência de Franquias** da Nexoritmologia.
