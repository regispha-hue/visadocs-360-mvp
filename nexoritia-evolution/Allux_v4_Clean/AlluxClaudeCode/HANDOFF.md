# HANDOFF DOCUMENT — LDMux-OS Axiom Kernel → Allux.ai Integration
## Para: Claude Code | Status: PRONTO PARA DEPLOY | Data: 2026-01-21

---

## CONTEXTO EXECUTIVO

Sistema de validação ontológica **LDMux-OS Axiom Kernel v1.0** está completo e funcional, baseado nos 20 Axiomas Fundamentais do Livro dos Montes. A próxima fase é integrar este kernel no sistema **Allux.ai** e realizar deploy para produção.

---

## RESUMO DO QUE FOI CONCLUÍDO

### Chat Anterior (antes de travar)

**O que estava implementado:**
1. ✅ Repositório base com estrutura FastAPI
2. ✅ Endpoint `/axiom/verify` básico (verificava formato de hash + versão)
3. ✅ Testes com pytest para endpoints básicos
4. ✅ CI/CD configurado (GitHub Actions)
5. ✅ Scripts de automação (bootstrap.sh/ps1, test.sh/ps1)
6. ✅ Procfile para Railway deploy
7. ✅ README com instruções de setup

**O que estava pendente:**
1. ❌ Canon não estava congelado (CANON_V1.0.json faltando)
2. ❌ Endpoint `/axiom/seal` não implementado
3. ❌ Script `freeze.py` com erro de execução
4. ❌ Verificação contra Canon não funcionava
5. ❌ Sistema incompleto (ciclo seal → verify quebrado)

**Motivo da falha:** Tool chain quebrada durante execução do freeze.py, causando estado corrupto no chat que impediu continuação.

---

### Este Chat (reconstrução completa)

**O que foi implementado com sucesso:**

#### 1. Canon Congelado (`CANON_V1.0.json`)
- ✅ 21 axiomas estruturados (1 Lei-Matriz + 7 Estruturais + 13 Consequência)
- ✅ Hash SHA256 individual para cada axioma
- ✅ Hash do manifesto completo (manifest_hash)
- ✅ Metadados completos: Monte, prioridade, categoria, domínio
- ✅ Imutável e criptograficamente seguro
- ✅ Tamanho: 8.834 bytes

**Manifest Hash:** `1edd1675444dcf59737ae333959ab8c5d924dc74f1617f9d9ee69fbca3a3314e`

#### 2. Estrutura de Dados Python (`canon_axioms.py`)
- ✅ Definição completa dos 21 axiomas
- ✅ Funções de consulta: por ID, Monte, categoria, prioridade
- ✅ Função para axiomas críticos
- ✅ Pronto para importação em qualquer módulo Python

#### 3. Script de Freeze (`freeze.py`)
- ✅ Gera CANON_V1.0.json com hashing SHA256
- ✅ Calcula metadados automaticamente
- ✅ Sumário executivo formatado
- ✅ Testado e funcional: `python freeze.py` executa sem erros

#### 4. API REST FastAPI (`axiom_kernel.py`)
- ✅ **5 endpoints implementados:**
  - `GET /ping` — Health check do kernel
  - `POST /axiom/seal` — Selar axiomas (gera hash + verifica se é canônico)
  - `POST /axiom/verify` — Verificar hash contra Canon
  - `GET /canon/info` — Metadados do Canon carregado
  - `GET /canon/axioms` — Listar axiomas com filtros (monte, priority, category)
- ✅ Carrega Canon automaticamente no startup
- ✅ Validação rigorosa de hash (formato + hex válido)
- ✅ Detecta match com Canon (retorna key, id, monte)

#### 5. Suite de Testes (`test_axiom_kernel.py`)
- ✅ **8 testes automatizados:**
  - Health check
  - Seal axioma canônico (com match)
  - Seal axioma novo (sem match)
  - Verify hash válido
  - Verify hash inválido
  - Verify com versão incompatível
  - Info do Canon
  - Listagem com filtros
- ✅ **Resultado: 8/8 testes passando ✓**

#### 6. Demo Interativo (`demo.py`)
- ✅ **6 demonstrações práticas:**
  1. Estrutura do Canon (contadores, distribuição)
  2. Distribuição por Monte (I a VII)
  3. Computação de hash SHA256 (sensibilidade)
  4. Arquivo CANON_V1.0.json (estrutura)
  5. Fluxo de verificação completo
  6. Fluxo de selo completo
- ✅ Executável: `python demo.py` — output formatado

#### 7. Documentação Completa
- ✅ `README.md` — Documentação técnica (arquitetura, endpoints, exemplos)
- ✅ `ENTREGA.md` — Documento executivo (casos de uso, testes, métricas)
- ✅ `requirements.txt` — Dependências (FastAPI, Uvicorn, Pydantic, Requests)

#### 8. Arquivos Finais Entregues
```
Total: 9 arquivos
- canon_axioms.py (7.0 KB)
- freeze.py (5.2 KB)
- CANON_V1.0.json (8.7 KB)
- axiom_kernel.py (6.3 KB)
- test_axiom_kernel.py (6.7 KB)
- demo.py (6.3 KB)
- README.md (6.3 KB)
- ENTREGA.md (7.8 KB)
- requirements.txt (67 bytes)
```

---

## ARQUITETURA ATUAL

### Fluxo de Validação Ontológica

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA ALLUX.AI                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [LLM/Backend]  →  POST /axiom/seal                         │
│                    - Recebe: texto do axioma                 │
│                    - Retorna: hash SHA256 + canon_match     │
│                                                              │
│  [Sistema Externo] →  POST /axiom/verify                    │
│                       - Recebe: hash                         │
│                       - Valida contra CANON_V1.0.json       │
│                       - Retorna: valid + coherent + axiom   │
│                                                              │
│  [Auditoria]  →  GET /canon/axioms?monte=monte_i            │
│                  - Lista axiomas com filtros                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    CANON_V1.0.json
                    (21 axiomas congelados)
                    Manifest Hash: 1edd1675...
```

### Estrutura de Diretórios (Recomendada para Allux.ai)

```
allux-ai-production/
├── canon/
│   ├── CANON_V1.0.json          # Canon congelado
│   ├── canon_axioms.py          # Estrutura de dados
│   └── freeze.py                # Script de geração
├── api/
│   ├── main.py                  # FastAPI app (renomeado de axiom_kernel.py)
│   └── __init__.py
├── tests/
│   ├── test_main.py             # Suite completa
│   ├── test_canon.py            # Testes específicos do Canon
│   └── __init__.py
├── scripts/
│   ├── bootstrap.sh             # Setup Linux/macOS
│   ├── bootstrap.ps1            # Setup Windows
│   ├── test.sh                  # Run tests Linux/macOS
│   └── test.ps1                 # Run tests Windows
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions
├── demo.py                      # Demonstração interativa
├── requirements.txt             # Dependências
├── Procfile                     # Railway/Heroku deploy
├── README.md                    # Documentação técnica
├── HANDOFF.md                   # Este documento
└── .env.example                 # Variáveis de ambiente (se necessário)
```

---

## TAREFAS PARA CLAUDE CODE

### Fase 1: Integração e Setup (30 min)

#### 1.1 Criar Estrutura do Projeto
```bash
# Criar diretórios
mkdir -p allux-ai-production/{canon,api,tests,scripts,.github/workflows}

# Copiar arquivos base
cp canon_axioms.py allux-ai-production/canon/
cp freeze.py allux-ai-production/canon/
cp CANON_V1.0.json allux-ai-production/canon/
cp axiom_kernel.py allux-ai-production/api/main.py
cp test_axiom_kernel.py allux-ai-production/tests/test_main.py
cp demo.py allux-ai-production/
cp requirements.txt allux-ai-production/
cp README.md allux-ai-production/
cp ENTREGA.md allux-ai-production/
```

#### 1.2 Ajustar Imports em `api/main.py`
```python
# Mudar de:
CANON_PATH = Path(__file__).parent / "CANON_V1.0.json"

# Para:
CANON_PATH = Path(__file__).parent.parent / "canon" / "CANON_V1.0.json"
```

#### 1.3 Criar Procfile
```
web: uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

#### 1.4 Criar GitHub Actions CI (.github/workflows/ci.yml)
```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      - name: Run tests
        run: pytest tests/ -v --tb=short
```

### Fase 2: Validação Local (15 min)

#### 2.1 Executar Demo
```bash
cd allux-ai-production
python demo.py
# Verificar: 6 demos executam sem erro
```

#### 2.2 Executar Testes
```bash
pip install -r requirements.txt
pytest tests/ -v
# Verificar: 8/8 testes passam
```

#### 2.3 Iniciar API Localmente
```bash
uvicorn api.main:app --reload
# Verificar: http://localhost:8000/docs acessível
# Testar: GET /ping → status 200
# Testar: POST /axiom/seal → gera hash
# Testar: POST /axiom/verify → valida hash
```

### Fase 3: Deploy Railway (30 min)

#### 3.1 Setup Git Repository
```bash
cd allux-ai-production
git init
git add .
git commit -m "feat: LDMux-OS Axiom Kernel v1.0 with Canon integration"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

#### 3.2 Configurar Railway
1. Conectar repositório GitHub ao Railway
2. Configurar variáveis (se necessário):
   - `PORT` — Auto-definida pelo Railway
   - `ENVIRONMENT` — "production"
3. Deploy automático via push

#### 3.3 Validar Deploy
```bash
# Endpoint base
curl https://<railway-url>/

# Health check
curl https://<railway-url>/ping

# Info do Canon
curl https://<railway-url>/canon/info

# Seal axioma
curl -X POST https://<railway-url>/axiom/seal \
  -H "Content-Type: application/json" \
  -d '{"text": "Teste de axioma", "domain": "test"}'

# Verify hash
curl -X POST https://<railway-url>/axiom/verify \
  -H "Content-Type: application/json" \
  -d '{"hash": "sha256:5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04", "kernel_version": "1.0.0"}'
```

### Fase 4: Extensões Allux.ai (2-4 horas)

#### 4.1 Endpoint para Axiomas Derivados
Criar `/axiom/derive` para gerar axiomas derivados com rastreabilidade:
```python
class DeriveRequest(BaseModel):
    parent_hash: str  # Hash do axioma pai (deve estar no Canon)
    derived_text: str
    justification: str

class DeriveResponse(BaseModel):
    parent_key: str
    parent_hash: str
    derived_hash: str
    derived_text: str
    justification: str
    sealed_at: str
```

#### 4.2 Sistema de Assinatura Digital
Implementar assinatura GPG do manifesto para autenticidade:
```python
import gnupg

def sign_canon(canon_path: str, gpg_key: str) -> str:
    """Assina Canon com chave GPG."""
    gpg = gnupg.GPG()
    with open(canon_path, 'rb') as f:
        signed = gpg.sign_file(f, keyid=gpg_key, detach=True)
    return str(signed)
```

#### 4.3 Dashboard Web (React/Next.js)
Interface para visualização do Canon:
- Listagem de axiomas por Monte
- Visualização de distribuição (gráficos)
- Verificação interativa de hash
- Histórico de verificações

#### 4.4 Métricas e Observabilidade
Adicionar Prometheus + Grafana:
```python
from prometheus_client import Counter, Histogram

verify_counter = Counter('axiom_verify_total', 'Total axiom verifications')
verify_latency = Histogram('axiom_verify_duration_seconds', 'Verification latency')
```

#### 4.5 Rate Limiting
Proteger endpoints com rate limiting:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/axiom/verify")
@limiter.limit("100/minute")
def verify_axiom(request: VerifyRequest):
    ...
```

---

## CASOS DE USO PRIORITÁRIOS

### 1. Validação de Respostas LLM
**Objetivo:** Garantir que LLM não alucina ao citar axiomas do Canon.

**Fluxo:**
1. LLM gera resposta citando axioma
2. Sistema extrai hash do axioma mencionado
3. Backend chama `POST /axiom/verify` com hash
4. Se `valid=true` e `in_canon=true` → Resposta válida
5. Se `valid=false` ou `in_canon=false` → Alerta de alucinação

**Implementação sugerida:**
```python
def validate_llm_response(response_text: str) -> bool:
    # Extrair hashes da resposta (regex ou parser)
    axiom_hashes = extract_axiom_hashes(response_text)
    
    for hash_value in axiom_hashes:
        result = requests.post(f"{KERNEL_URL}/axiom/verify", json={
            "hash": hash_value,
            "kernel_version": "1.0.0"
        }).json()
        
        if not result["valid"] or not result["coherent"]:
            log_hallucination(hash_value)
            return False
    
    return True
```

### 2. Auditoria de Conformidade
**Objetivo:** Auditar milhares de interações para medir taxa de conformidade.

**Fluxo:**
```python
interaction_logs = load_logs(start_date, end_date)
canonical_count = 0
total_count = len(interaction_logs)

for log in interaction_logs:
    axiom_hashes = log.get("axiom_references", [])
    for hash_value in axiom_hashes:
        result = verify_axiom(hash_value)
        if result["valid"]:
            canonical_count += 1

conformity_rate = (canonical_count / total_count) * 100
print(f"Taxa de conformidade: {conformity_rate:.2f}%")
```

### 3. Proposição de Axiomas v2.0
**Objetivo:** Permitir que usuários proponham novos axiomas para Canon v2.0.

**Fluxo:**
1. Usuário propõe axioma novo
2. Sistema sela com `POST /axiom/seal`
3. Armazena hash + texto + metadados
4. Comitê revisa propostas
5. Axiomas aprovados entram em CANON_V2.0.json

---

## MÉTRICAS DE SUCESSO

### Técnicas
- [ ] Todos os testes passando (8/8) ✓
- [ ] API respondendo em <200ms
- [ ] Canon carregado em <1s no startup
- [ ] Zero downtime no deploy
- [ ] Coverage de testes >80%

### Funcionais
- [ ] Endpoint `/axiom/seal` criando hashes válidos
- [ ] Endpoint `/axiom/verify` validando contra Canon
- [ ] Match canônico detectado corretamente
- [ ] Filtros de listagem funcionando (monte, priority, category)
- [ ] Demo executando sem erros

### Negócio
- [ ] Taxa de conformidade LLM >95%
- [ ] Alucinações detectadas <5% das interações
- [ ] Tempo de validação <100ms por axioma
- [ ] Sistema escalável para 10k req/min

---

## PRÓXIMOS MARCOS (Roadmap)

### Curto Prazo (1-2 semanas)
- [ ] Deploy Railway com CD automático
- [ ] Dashboard básico (read-only)
- [ ] Endpoint `/axiom/derive`
- [ ] Documentação OpenAPI completa
- [ ] Integração com logging (Sentry/LogRocket)

### Médio Prazo (1 mês)
- [ ] Canon v2.0 com axiomas derivados aprovados
- [ ] Sistema de assinatura GPG
- [ ] API de comparação semântica entre axiomas
- [ ] Métricas com Prometheus/Grafana
- [ ] Rate limiting por IP

### Longo Prazo (3-6 meses)
- [ ] Canon multi-idioma (EN, PT, ES)
- [ ] Marketplace de axiomas derivados
- [ ] ML para detecção de desvios ontológicos
- [ ] Integrações nativas (OpenAI, Anthropic, etc)
- [ ] SDK Python/JS para desenvolvedores

---

## DEPENDÊNCIAS TÉCNICAS

### Runtime
- Python 3.11+
- FastAPI 0.115.6
- Uvicorn 0.34.0
- Pydantic 2.10.5

### Development
- pytest para testes
- requests para chamadas HTTP
- black para formatting
- mypy para type checking

### Infraestrutura
- Railway (recomendado) ou Heroku
- GitHub Actions para CI/CD
- Sentry para error tracking (opcional)
- Prometheus para métricas (opcional)

---

## RISCOS E MITIGAÇÕES

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Canon corrompido | Alto | Baixo | Manifest hash detecta alterações |
| Deploy quebrado | Alto | Médio | CI/CD com testes obrigatórios |
| Performance degradada | Médio | Baixo | Cache de Canon em memória |
| Alucinação não detectada | Alto | Médio | Double-check com hash + texto |

---

## CONTATOS E SUPORTE

**Autor do Canon:** R.Gis Veniloqa  
**Obra Base:** Livro dos Montes  
**Activation Code:** LDM-7M-SA1W-EA25-RGIS

**Documentação Técnica:** README.md  
**Documento Executivo:** ENTREGA.md  
**Este Documento:** HANDOFF.md

**Para questões de implementação:**
- Executar `python demo.py` para entender fluxos
- Consultar `test_axiom_kernel.py` para exemplos de uso
- API Docs disponível em `/docs` após iniciar servidor

---

## CHECKPOINT FINAL

✅ **Canon congelado** — CANON_V1.0.json validado  
✅ **API funcional** — 5 endpoints operacionais  
✅ **Testes passando** — 8/8 testes ✓  
✅ **Demo executável** — 6 demonstrações práticas  
✅ **Documentação completa** — README + ENTREGA + HANDOFF  

**Sistema pronto para assumir. Claude Code: você tem tudo para:**
1. Estruturar projeto Allux.ai
2. Fazer deploy Railway
3. Implementar extensões (derive, signature, dashboard)
4. Integrar com pipelines existentes

**Comando de início:**
```bash
python demo.py  # Entender o sistema
pytest tests/ -v  # Validar integridade
uvicorn api.main:app --reload  # Rodar localmente
```

**Let's ship it.** 🚀
