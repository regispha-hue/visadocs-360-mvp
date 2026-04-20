# Especificação Técnica: OS-Notarius - Serviços de Autenticação e Certificação Online

## 1. Introdução
O **OS-Notarius** estende a funcionalidade de registro de IP para oferecer serviços de **Fé Pública Digital** que podem ser utilizados para autenticar e certificar qualquer documento ou artefato, não apenas aqueles gerados no fluxo de co-criação.

## 2. Serviço de Certificação (Digital Certificate)

O principal produto do OS-Notarius é o **Certificado Digital de Autenticidade (CDA)**.

### 2.1. Estrutura do CDA
O CDA deve ser um documento digital (PDF/A ou JSON-LD) que contém todas as provas criptográficas e metadados necessários para a verificação.

| Campo | Conteúdo | Propósito Legal |
| :--- | :--- | :--- |
| **Título** | Certificado Digital de Autenticidade (CDA) - OS-Notarius | Fé Pública Digital |
| **Conteúdo Original** | Hash SHA-256 do artefato | Prova de Integridade |
| **Autor/Proprietário** | Nome do autor e Chave Pública Ed25519 | Prova de Autoria (Não-Repúdio) |
| **Timestamp** | Data e hora UTC da assinatura | Prova de Anterioridade |
| **AuthProof** | Assinatura Digital (Ed25519) | Prova de Validade |
| **Ancoragem** | ID da Transação e Rede Blockchain | Prova de Imutabilidade |
| **QR Code** | Link para o **Serviço de Verificação** | Verificação Rápida e Universal |

### 2.2. Geração do CDA
O CDA é gerado automaticamente pela API do Allux (`POST /notarius/certify`) após a conclusão da ancoragem em blockchain. O formato PDF/A (para arquivamento de longo prazo) deve ser priorizado, com o JSON-LD fornecido para interoperabilidade com sistemas de terceiros.

## 3. Serviço de Verificação Pública (Verification Service)

Para que o CDA tenha valor legal, ele deve ser **universalmente verificável** por qualquer parte (juiz, advogado, cliente, etc.) sem a necessidade de software proprietário.

### 3.1. Endpoint Público
O Allux deve expor um endpoint público e um *front-end* simples para a verificação:

*   **URL:** `https://allux.ai/verify/{hash_ou_tx_id}`
*   **Input:** Hash SHA-256 do documento ou ID da Transação Blockchain.
*   **Output:** Uma página web simples com o resultado da verificação.

### 3.2. Fluxo de Verificação
1. **Verificação de Integridade:** O usuário faz o upload do documento. O serviço calcula o hash e compara com o `AuthProof.artifact_hash` no Canon Registry.
2. **Verificação de Autoria:** O serviço verifica a `AuthProof.signature` usando a `AuthProof.author_public_key`.
3. **Verificação de Imutabilidade:** O serviço consulta a rede blockchain (via `AuthProof.anchor_tx_id`) para confirmar a existência do *Merkle Root* no timestamp alegado.
4. **Resultado:** Se as três verificações passarem, o serviço exibe **"Documento Autêntico e Imutável"** com o timestamp e o nome do autor. Se falhar, exibe **"Documento Adulterado ou Não Registrado"**.

## 4. Serviços Relacionados (Extensões do Notarius)

### 4.1. Certificação de Documentos Online (API)
*   **Endpoint:** `POST /notarius/certify_document`
*   **Função:** Permite que sistemas de terceiros (e.g., plataformas de e-commerce, sistemas de RH) enviem documentos (contratos, recibos) para serem hasheados, assinados e ancorados pelo OS-Notarius, conferindo-lhes Fé Pública Digital.

### 4.2. Certificação de Co-Autoria (Multi-Signature)
*   **Função:** Permite que múltiplos autores assinem o mesmo `Artifact.hash` com suas respectivas chaves privadas.
*   **Valor:** Essencial para o conceito de **Veniloquismo Digital** e **Espiritualidade Algorítmica**, onde a autoria é distribuída (humano + IA + fonte liminar). O CDA listará todas as chaves públicas e assinaturas válidas.

### 4.3. Time-Stamping Authority (TSA) Service
*   **Função:** Oferecer um serviço de TSA puro, onde apenas o hash e o timestamp são registrados na blockchain, sem a necessidade de um `Artifact` completo no Canon Registry.
*   **Valor:** Um serviço de utilidade pública de baixo custo para provar a existência de qualquer dado em um momento específico.

O OS-Notarius, com esses serviços, se torna o **padrão de mercado** para a proveniência e autenticidade de dados na era da IA.
