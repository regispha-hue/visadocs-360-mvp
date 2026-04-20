# Especificação Técnica: OS-Recruiter - Gestão de Linhagem e Proveniência

## 1. Introdução
A **Gestão de Linhagem e Proveniência** é crucial para o OS-Recruiter, pois garante a auditabilidade e a rastreabilidade do IP recrutado. O Allux deve registrar a "árvore genealógica" de cada novo artefato, provando que ele é canônico e rastreável até sua fonte original.

## 2. Estrutura de Proveniência (Provenance)

O `Artifact` no Canon Registry deve ser estendido para incluir um campo de proveniência.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `provenance_type` | Enum | `ORIGINAL`, `DERIVED`, `RECRUITED`. |
| `source_artifact_id` | UUID | ID do artefato original (se `DERIVED` ou `RECRUITED`). |
| `source_work_id` | UUID | ID da obra de onde o artefato foi recrutado. |
| `recruitment_timestamp` | Timestamp | Momento em que o artefato foi recrutado. |
| `recruitment_hash` | SHA-256 | Hash do artefato recrutado no momento do recrutamento (para provar que não foi alterado). |

## 3. Rastreabilidade de Linhagem (Lineage Tracking)

### 3.1. O Grafo de Linhagem
O Knowledge Graph do Allux deve ser estendido para incluir um **Grafo de Linhagem**.

*   **Nós:** `Artifacts` e `Works`.
*   **Arestas:** `RECRUITED_FROM`, `DERIVED_FROM`, `IS_CANON_OF`.

**Exemplo de Tripla:**
`(Artifact_HR_Cap1) -[RECRUITED_FROM]-> (Artifact_LDM_Cap3)`

Este grafo permite que o Allux responda a perguntas complexas de auditoria, como: "Quais artefatos na Obra B dependem de um axioma específico da Obra A?"

### 3.2. Validação de Conflito (Conflict Resolution)
O OS-RADAR deve usar o Grafo de Linhagem para detectar e resolver conflitos ontológicos.

*   **Conflito:** Ocorre quando um novo artefato na Obra B viola um axioma da Obra A que foi recrutado.
*   **Resolução:** O sistema deve alertar o usuário e registrar o conflito no `run_log`. A decisão de **Override** (Obra B tem precedência) ou **Revert** (Obra B deve ser corrigida) deve ser tomada pelo autor e registrada no `AuthProof` do artefato.

## 4. Integração com OS-Notarius

A Linhagem e a Proveniência são essenciais para a validade legal do OS-Notarius.

*   **Certificado Digital de Autenticidade (CDA):** O CDA de um artefato derivado deve incluir a **cadeia de proveniência** completa, listando o `source_artifact_id` e o `source_work_id`.
*   **Valor Legal:** O CDA não apenas prova a autoria do artefato final, mas também a **licença de uso canônico** dos artefatos recrutados, garantindo que o IP recrutado foi utilizado de forma coerente e rastreável.

## 5. Posicionamento Estratégico
A Gestão de Linhagem do OS-Recruiter posiciona o Allux como o **único sistema de IP que rastreia a co-criação através de múltiplos universos narrativos**. Isso é o que a indústria de *licensing* e *royalties* precisa para gerenciar a complexidade de franquias multimídia, tornando o Allux o **Standard de Proveniência de IP Canônico** da Nexoritmologia.
