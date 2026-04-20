# Especificação Técnica: OS-Notarius - Protocolo de Ancoragem e Assinatura Criptográfica

## 1. Introdução
A validade legal do **OS-Notarius** depende de dois pilares criptográficos: a **Assinatura Digital** (prova de autoria e não-repúdio) e a **Ancoragem em Blockchain** (prova de anterioridade e imutabilidade).

## 2. Assinatura Criptográfica (Ed25519)

### 2.1. Escolha do Algoritmo
O **Ed25519** (Edwards-curve Digital Signature Algorithm) é o algoritmo de escolha.

| Característica | Vantagem para o OS-Notarius |
| :--- | :--- |
| **Segurança** | Resistente a ataques quânticos e side-channel attacks. |
| **Performance** | Geração e verificação de assinaturas extremamente rápidas. |
| **Tamanho** | Chaves e assinaturas curtas (32 bytes), otimizando o armazenamento e a transmissão. |
| **Padrão** | Amplamente adotado (OpenSSH, TLS, IPFS), facilitando a interoperabilidade. |

### 2.2. Fluxo de Assinatura
1. **Geração de Chaves:** O usuário gera um par de chaves (pública/privada) Ed25519. A chave privada é armazenada de forma segura (e.g., *hardware wallet* ou *key vault*). A chave pública é registrada no `Canon Registry` do Allux.
2. **Hashing:** O conteúdo do artefato é hasheado (SHA-256).
3. **Assinatura:** A chave privada do usuário assina o hash SHA-256.
4. **Verificação:** Qualquer parte pode verificar a assinatura usando a chave pública do autor e o hash do conteúdo.

**Prova Legal:** A assinatura Ed25519 vincula o conteúdo (hash) à identidade do autor (chave pública) em um determinado momento (timestamp da ancoragem), estabelecendo o **não-repúdio**.

## 3. Protocolo de Ancoragem em Blockchain

A ancoragem garante que o registro de IP seja **imutável** e possua um **timestamp** globalmente verificável.

### 3.1. Escolha da Rede Blockchain
A rede deve priorizar **baixo custo**, **alta velocidade** e **imutabilidade**.

| Rede | Vantagem | Uso no OS-Notarius |
| :--- | :--- | :--- |
| **Bitcoin (via L2/Sidechain)** | Máxima segurança e imutabilidade. | Ancoragem de *merkle roots* de grandes lotes de `AuthProofs` (para custo-eficiência). |
| **Polygon (ou similar EVM)** | Baixo custo de transação, alta velocidade, suporte a contratos inteligentes. | Ancoragem individual de cada `AuthProof` (para rastreabilidade imediata). |

**Estratégia Híbrida:**
*   **Ancoragem Imediata (Polygon):** Cada `AuthProof` é enviado imediatamente para a Polygon, garantindo um timestamp rápido (em segundos).
*   **Ancoragem Periódica (Bitcoin L2):** O Allux agrupa milhares de `AuthProofs` em uma *Merkle Tree* e envia o *Merkle Root* para a Bitcoin L2 a cada 24 horas, garantindo a imutabilidade máxima.

### 3.2. Mecanismo de Ancoragem
1. **Merkle Tree:** O OS-Notarius coleta os hashes de todos os `AuthProofs` gerados em um período.
2. **Root Hash:** Calcula o *Merkle Root* (hash de todos os hashes).
3. **Transação:** O *Merkle Root* é escrito em uma transação na blockchain.
4. **Prova de Inclusão:** Para verificar um `AuthProof` individual, o usuário apresenta o `AuthProof.hash` e o *Merkle Proof* (o caminho de hashes até o *Merkle Root*). Se o *Merkle Root* for validado na blockchain, o `AuthProof` individual é provado como existente naquele momento.

## 4. Integração com o Canon Registry

O `Canon Registry` do Allux se torna o **Índice de Fé Pública**.

| Campo no Registry | Função Criptográfica |
| :--- | :--- |
| `Artifact.hash` | Prova de Integridade (SHA-256) |
| `AuthProof.signature` | Prova de Autoria (Ed25519) |
| `AuthProof.anchor_tx_id` | Prova de Anterioridade (Blockchain Timestamp) |

Esta arquitetura garante que o registro de IP do Allux seja **criptograficamente seguro** e **legalmente defensável** em qualquer jurisdição que reconheça assinaturas digitais e provas de anterioridade baseadas em blockchain.
