# LDMux-OS Axiom Kernel v1.0

Sistema de validação ontológica baseado nos 20 Axiomas Fundamentais do **Livro dos Montes**.

## Estrutura

```
.
├── canon_axioms.py          # Definição dos 20 axiomas do LDM
├── freeze.py                # Script de geração do Canon congelado
├── CANON_V1.0.json          # Manifesto imutável do Canon (gerado)
├── axiom_kernel.py          # FastAPI server com endpoints
├── test_axiom_kernel.py     # Suite de testes automatizados
└── README.md                # Esta documentação
```

## Canon v1.0

### Estrutura dos Axiomas

- **1 Lei-Matriz**: Código do Orbe (Axioma Zero)
- **7 Leis Estruturais**: Nominativa Sagrada, Casa Viva, Mortos Não Nascidos, Interseção, Retorno, Dupla Leitura, Fenda Fundadora
- **12 Leis de Consequência**: Não-Neutralidade, Presença/Troca, Saturação, Peso Ontológico, Espiral, Transmissão Silenciosa, Correção do Campo, Sacola Vazia, Corpo/Registro, Escolha Inevitável, Impossibilidade da Inocência, Consequência Longa, Travessia Permanente

### Prioridades

- **Critical**: 9 axiomas (colapso ontológico se violados)
- **High**: 10 axiomas (risco de incoerência)
- **Medium**: 2 axiomas (recomendação forte)

### Distribuição por Monte

- **Pre-Monte**: 1 axioma (Código do Orbe)
- **Monte I**: 7 axiomas (fundação)
- **Monte II-VII**: 13 axiomas (consequências)

## Endpoints

### `GET /ping`

Health check do kernel.

**Response:**
```json
{
  "status": "active",
  "kernel": "LDMux-OS",
  "version": "1.0.0",
  "canon_loaded": true,
  "canon_axioms": 21
}
```

### `POST /axiom/seal`

Sela um axioma gerando hash SHA256 e verifica se existe no Canon.

**Request:**
```json
{
  "text": "Tudo o que existe é regido por uma incompletude dinâmica...",
  "domain": "lei_matriz",
  "category": "fundacional",
  "priority": "critical"
}
```

**Response:**
```json
{
  "text": "Tudo o que existe é regido por uma incompletude dinâmica...",
  "hash": "5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04",
  "domain": "lei_matriz",
  "category": "fundacional",
  "priority": "critical",
  "kernel_version": "1.0.0",
  "sealed_at": "2026-01-21T13:18:17.280549Z",
  "canon_match": {
    "key": "codigo_do_orbe",
    "id": 0,
    "monte": "pre_monte",
    "canonical": true
  }
}
```

### `POST /axiom/verify`

Verifica se um hash corresponde a axioma canônico.

**Request:**
```json
{
  "hash": "5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04",
  "kernel_version": "1.0.0"
}
```

**Response:**
```json
{
  "valid": true,
  "coherent": true,
  "reason": "Valid canonical axiom",
  "axiom": {
    "key": "codigo_do_orbe",
    "id": 0,
    "text": "Tudo o que existe é regido por uma incompletude dinâmica...",
    "domain": "lei_matriz",
    "category": "fundacional",
    "priority": "critical",
    "monte": "pre_monte"
  },
  "canon_info": {
    "version": "1.0.0",
    "author": "R.Gis Veniloqa",
    "work": "Livro dos Montes",
    "frozen_at": "2026-01-21T13:18:17.280549Z",
    "manifest_hash": "1edd1675444dcf59...9ee69fbca3a3314e"
  }
}
```

### `GET /canon/info`

Retorna metadados do Canon carregado.

**Response:**
```json
{
  "version": "1.0.0",
  "author": "R.Gis Veniloqa",
  "work": "Livro dos Montes",
  "frozen_at": "2026-01-21T13:18:17.280549Z",
  "activation_code": "LDM-7M-SA1W-EA25-RGIS",
  "total_axioms": 21,
  "manifest_hash": "1edd1675444dcf59...9ee69fbca3a3314e",
  "metadata": {
    "structure": { "lei_matriz": 1, "estrutural": 7, "consequencia": 12 },
    "category_distribution": { ... },
    "monte_distribution": { ... },
    "priority_levels": { "critical": 9, "high": 10, "medium": 2 }
  }
}
```

### `GET /canon/axioms`

Lista axiomas com filtros opcionais.

**Query Parameters:**
- `monte`: Filtrar por Monte (ex: `monte_i`)
- `priority`: Filtrar por prioridade (ex: `critical`)
- `category`: Filtrar por categoria (ex: `fundacional`)

**Response:**
```json
{
  "total": 7,
  "filters": { "monte": "monte_i", "priority": null, "category": null },
  "axioms": { ... }
}
```

## Instalação e Uso

### 1. Gerar Canon Congelado

```bash
python freeze.py
```

Gera `CANON_V1.0.json` com hash SHA256 de cada axioma e hash do manifesto completo.

### 2. Iniciar Server

```bash
python axiom_kernel.py
```

Server roda em `http://localhost:8000`

### 3. Executar Testes

```bash
pip install requests
python test_axiom_kernel.py
```

## Casos de Uso

### 1. Validar Axioma em Sistema Externo

Sistema externo (LLM, backend, etc) envia hash do axioma usado. Kernel valida se pertence ao Canon.

```python
import requests

response = requests.post("http://localhost:8000/axiom/verify", json={
    "hash": "5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04",
    "kernel_version": "1.0.0"
})

if response.json()["valid"]:
    print("Axioma válido e canônico")
```

### 2. Selar Novo Axioma

Sistema gera novo axioma e obtém hash para posterior verificação.

```python
response = requests.post("http://localhost:8000/axiom/seal", json={
    "text": "Nova lei ontológica derivada...",
    "domain": "derivado",
    "priority": "high"
})

axiom_hash = response.json()["hash"]
# Armazenar hash para validação futura
```

### 3. Auditoria de Conformidade

Verificar quais axiomas de uma lista são canônicos.

```python
hashes = [hash1, hash2, hash3, ...]

for h in hashes:
    response = requests.post("http://localhost:8000/axiom/verify", json={"hash": h})
    data = response.json()
    if data["valid"]:
        print(f"✓ {data['axiom']['key']}")
    else:
        print(f"✗ Hash não reconhecido")
```

## Segurança e Imutabilidade

1. **Canon Congelado**: `CANON_V1.0.json` é imutável. Qualquer modificação invalida o `manifest_hash`.

2. **Hash SHA256**: Cada axioma tem hash único. Mudança de 1 caractere gera hash completamente diferente.

3. **Verificação de Versão**: Kernel valida compatibilidade de versão para evitar drift semântico.

## Próximos Passos

- [ ] Endpoint `/axiom/derive` para gerar axiomas derivados
- [ ] Suporte para múltiplas versões do Canon (backward compatibility)
- [ ] Sistema de assinatura digital (GPG/RSA) para manifesto
- [ ] API de comparação semântica entre axiomas
- [ ] Dashboard web para visualização do Canon

## Licenciamento

Sistema proprietário. Canon baseado em **O Livro dos Montes** de R.Gis Veniloqa.

Código de Ativação: `LDM-7M-SA1W-EA25-RGIS`
