# Especificação Técnica: OS-Notarius - Kernel de Fé Pública Digital

## 1. Introdução
O **OS-Notarius** é a evolução do módulo OS-AUTH (Cryptographic Proofs) do Allux, transformando-o em um **Kernel de Fé Pública Digital**. Seu objetivo é registrar a Propriedade Intelectual (IP) de artefatos gerados (texto, código, ontologias) desde a primeira linha do chat, garantindo **imutabilidade**, **rastreabilidade** e **validade legal** (Fé Pública Digital).

## 2. Arquitetura de Registro de IP em Tempo Real

O OS-Notarius opera como um *middleware* de persistência e autenticação, injetado no fluxo de trabalho do Allux, idealmente no momento da criação do `Artifact` no `Canon Registry`.

### 2.1. Fluxo de Registro (End-to-End)

| Etapa | Subsistema Envolvido | Ação | Output |
| :--- | :--- | :--- | :--- |
| **1. Criação** | LLM Executor (e.g., Claude) | Gera um fragmento de conteúdo (texto, código). | `Artifact` (status `DRAFT`) |
| **2. Hashing** | OS-Notarius Core | Calcula o hash criptográfico do conteúdo (SHA-256). | `Artifact.hash` |
| **3. Assinatura** | OS-Notarius Core | Assina o `Artifact.hash` com a chave privada do usuário (Ed25519). | `AuthProof.signature` |
| **4. Ancoragem** | OS-Notarius Blockchain Client | Envia o `AuthProof.hash` para a rede blockchain. | `AuthProof.anchor_tx_id` (ID da transação) |
| **5. Indexação** | Canon Registry | Armazena o `Artifact` e o `AuthProof` (hash, signature, tx_id, timestamp). | `Artifact` (status `SEALED`) |
| **6. Certificação** | OS-Notarius API | Gera um certificado digital (PDF/JSON-LD) para o usuário. | `Certificate.pdf` |

### 2.2. Estrutura de Dados do AuthProof (Evolução do OS-AUTH)

O `AuthProof` é o registro de fé pública.

```json
{
  "artifact_id": "UUID do Artifact no Canon Registry",
  "artifact_hash": "SHA256 do conteúdo (prova de integridade)",
  "author_public_key": "Chave pública Ed25519 do autor (prova de autoria)",
  "author_signature": "Assinatura digital do hash (prova de não-repúdio)",
  "timestamp_utc": "Timestamp de criação (prova de anterioridade)",
  "anchor_tx_id": "ID da transação na Blockchain (prova de imutabilidade)",
  "blockchain_network": "Rede utilizada (e.g., Polygon, Bitcoin L2)",
  "certificate_uri": "URI para verificação pública do certificado"
}
```

## 3. Integração com o Fluxo de Conversação (MCP-First)

Para garantir o registro "desde a primeira linha do chat", o OS-Notarius deve ser invocado automaticamente pelo *middleware* do Allux.

### 3.1. Invocação Automática (MCP Tool)
O Allux deve expor um novo *tool* via MCP (Model Context Protocol) para o LLM:

```typescript
// MCP Tool Definition
{
  "name": "os_notarius_seal_artifact",
  "description": "Registra criptograficamente um artefato no Canon Registry, gerando um AuthProof com hash e assinatura.",
  "parameters": {
    "type": "object",
    "properties": {
      "content": { "type": "string", "description": "O conteúdo completo do artefato a ser registrado." },
      "metadata": { "type": "object", "description": "Metadados do artefato (e.g., 'Monte I', 'Capítulo 3')." }
    },
    "required": ["content"]
  }
}
```

### 3.2. Workflow de Conversação
1. **Usuário:** "Claude, escreva o próximo parágrafo do Monte I sobre a Mãe dos Sete."
2. **LLM (Claude):** Gera o parágrafo.
3. **LLM (Claude):** *Self-Correction/Chain-of-Thought* decide que o conteúdo é canônico e invoca o tool: `os_notarius_seal_artifact(content="...", metadata={...})`.
4. **Allux API:** Recebe a chamada, executa o Hashing, Assinatura e Ancoragem.
5. **Allux API:** Retorna o `AuthProof.certificate_uri` para o LLM.
6. **LLM (Claude):** Apresenta o parágrafo ao usuário, anexando o URI de certificação.

Este fluxo garante que o registro de IP seja um **subproduto automático** da criação, e não uma etapa manual posterior.

## 4. Posicionamento Estratégico
O OS-Notarius posiciona o Allux como o **único Kernel de IA que resolve o problema de autoria e proveniência** na era da co-criação. Ele transforma a incerteza jurídica em **Fé Pública Digital**, tornando-o indispensável para criadores de IP, estúdios e corporações que precisam de uma trilha de auditoria legalmente defensável. O Allux se torna o **Notário Digital** da Nexoritmologia.
