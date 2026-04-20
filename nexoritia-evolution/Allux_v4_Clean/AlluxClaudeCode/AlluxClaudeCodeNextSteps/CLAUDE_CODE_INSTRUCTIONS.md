# CLAUDE CODE — INSTRUÇÕES DE EXECUÇÃO
## LDMux-OS Axiom Kernel → Deploy Produtivo

---

## CHECKPOINT: O QUE VOCÊ TEM

✅ Repositório GitHub com todos os arquivos  
✅ 12 arquivos (84KB) — Canon, API, testes, docs  
✅ Sistema 100% funcional e testado  

**Confirme que você tem estes arquivos:**
```
CANON_V1.0.json
axiom_kernel.py
canon_axioms.py
freeze.py
test_axiom_kernel.py
demo.py
requirements.txt
README.md
ENTREGA.md
HANDOFF.md
CLAUDE_CODE_QUICKSTART.md
SUMARIO_EXECUTIVO.md
```

---

## AÇÃO 1: VALIDAÇÃO LOCAL (5 minutos)

### 1.1 Instalar Dependências
```bash
pip install -r requirements.txt
```

### 1.2 Executar Demo
```bash
python demo.py
```

**Resultado esperado:**
- 6 demonstrações executam sem erro
- Mostra estrutura do Canon
- Demonstra hash SHA256
- Exibe fluxos de verificação

### 1.3 Rodar Testes
```bash
pytest test_axiom_kernel.py -v
```

**Resultado esperado:**
```
test_ping PASSED
test_seal_canonical_axiom PASSED
test_seal_new_axiom PASSED
test_verify_valid_hash PASSED
test_verify_invalid_hash PASSED
test_verify_version_mismatch PASSED
test_canon_info PASSED
test_list_axioms PASSED

8 passed in X.XXs
```

### 1.4 Iniciar Servidor Local
```bash
python axiom_kernel.py
```

**Validar:**
- Servidor roda em http://localhost:8000
- Acessar http://localhost:8000/docs
- Testar endpoint GET /ping
- Testar endpoint GET /canon/info

**Se todos os 4 passos acima funcionaram → PROSSIGA**

---

## AÇÃO 2: ESTRUTURAR PARA PRODUÇÃO (10 minutos)

### 2.1 Criar Estrutura de Diretórios
```bash
mkdir -p canon api tests scripts .github/workflows

# Mover arquivos
mv canon_axioms.py freeze.py CANON_V1.0.json canon/
mv axiom_kernel.py api/main.py
touch api/__init__.py
mv test_axiom_kernel.py tests/test_main.py
touch tests/__init__.py
```

### 2.2 Ajustar Imports em `api/main.py`

**Encontre a linha (~12):**
```python
CANON_PATH = Path(__file__).parent / "CANON_V1.0.json"
```

**Substitua por:**
```python
CANON_PATH = Path(__file__).parent.parent / "canon" / "CANON_V1.0.json"
```

### 2.3 Criar Procfile
```bash
cat > Procfile << 'EOF'
web: uvicorn api.main:app --host 0.0.0.0 --port $PORT
EOF
```

### 2.4 Criar .gitignore
```bash
cat > .gitignore << 'EOF'
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
*.egg-info/
dist/
build/
.pytest_cache/
.coverage
htmlcov/
.env
.DS_Store
EOF
```

### 2.5 Validar Nova Estrutura
```bash
# Rodar testes novamente
pytest tests/test_main.py -v

# Iniciar servidor
uvicorn api.main:app --reload
```

**Se funcionar → PROSSIGA**

---

## AÇÃO 3: CRIAR CI/CD (10 minutos)

### 3.1 GitHub Actions

Criar `.github/workflows/ci.yml`:
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
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        pytest tests/ -v --tb=short
    
    - name: Validate Canon
      run: |
        python -c "import json; canon = json.load(open('canon/CANON_V1.0.json')); assert canon['total_axioms'] == 21"
```

### 3.2 Commit e Push
```bash
git add .
git commit -m "feat: estrutura produção + CI/CD"
git push origin main
```

### 3.3 Verificar GitHub Actions
- Ir para repositório no GitHub
- Aba "Actions"
- Verificar que workflow executou
- Confirmar que testes passaram

**Se CI passou → PROSSIGA**

---

## AÇÃO 4: DEPLOY RAILWAY (15 minutos)

### 4.1 Configurar Railway

**Opção A: Via GitHub Integration (recomendado)**
1. Ir para https://railway.app/
2. Login
3. "New Project" → "Deploy from GitHub repo"
4. Selecionar seu repositório
5. Railway detecta Procfile automaticamente
6. Deploy inicia

**Opção B: Via Railway CLI**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 4.2 Configurar Variáveis (se necessário)
- `PORT` — Auto-definida pelo Railway (não precisa configurar)
- `ENVIRONMENT=production` — Opcional

### 4.3 Validar Deploy

Railway fornece URL tipo: `https://seu-app.railway.app`

**Testar endpoints:**
```bash
# Health check
curl https://seu-app.railway.app/ping

# Canon info
curl https://seu-app.railway.app/canon/info

# Seal axioma
curl -X POST https://seu-app.railway.app/axiom/seal \
  -H "Content-Type: application/json" \
  -d '{"text": "Teste de axioma em produção", "domain": "test"}'

# Verify hash canônico (Código do Orbe)
curl -X POST https://seu-app.railway.app/axiom/verify \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04",
    "kernel_version": "1.0.0"
  }'
```

**Resultado esperado:**
- Todos os endpoints respondem 200 OK
- `/canon/info` mostra 21 axiomas
- `/axiom/verify` com hash do Código do Orbe retorna `valid: true`, `in_canon: true`

**Se deploy funcionou → SISTEMA EM PRODUÇÃO ✓**

---

## AÇÃO 5: PRIMEIRA EXTENSÃO — ENDPOINT `/axiom/derive` (1-2 horas)

Agora que o sistema base está em produção, implementar primeira feature nova.

### 5.1 Criar `api/models.py`
```python
from pydantic import BaseModel, Field
from typing import Optional

class DeriveRequest(BaseModel):
    """Request para derivar um novo axioma."""
    parent_hash: str = Field(..., description="Hash do axioma pai (deve estar no Canon)")
    derived_text: str = Field(..., description="Texto do axioma derivado")
    justification: str = Field(..., description="Justificativa da derivação")
    domain: str = Field(default="derived", description="Domínio ontológico")
    
class DeriveResponse(BaseModel):
    """Response da derivação."""
    parent_key: str
    parent_id: int
    parent_hash: str
    derived_hash: str
    derived_text: str
    justification: str
    domain: str
    kernel_version: str
    derived_at: str
```

### 5.2 Adicionar Endpoint em `api/main.py`

Importar models:
```python
from api.models import DeriveRequest, DeriveResponse
```

Adicionar endpoint:
```python
@app.post("/axiom/derive", response_model=DeriveResponse)
def derive_axiom(request: DeriveRequest):
    """
    Deriva um novo axioma a partir de um axioma canônico.
    
    O axioma pai deve existir no Canon. O axioma derivado
    recebe seu próprio hash e mantém rastreabilidade.
    """
    # Verificar se parent_hash existe no Canon
    if not CANON:
        raise HTTPException(status_code=503, detail="Canon not loaded")
    
    parent_match = None
    for key, axiom in CANON["axioms"].items():
        if axiom["hash"] == request.parent_hash:
            parent_match = (key, axiom)
            break
    
    if not parent_match:
        raise HTTPException(
            status_code=404,
            detail=f"Parent axiom not found in Canon. Hash: {request.parent_hash}"
        )
    
    parent_key, parent_axiom = parent_match
    
    # Gerar hash do axioma derivado
    derived_hash = hashlib.sha256(request.derived_text.encode('utf-8')).hexdigest()
    
    return DeriveResponse(
        parent_key=parent_key,
        parent_id=parent_axiom["id"],
        parent_hash=request.parent_hash,
        derived_hash=derived_hash,
        derived_text=request.derived_text,
        justification=request.justification,
        domain=request.domain,
        kernel_version="1.0.0",
        derived_at=datetime.now(timezone.utc).isoformat()
    )
```

### 5.3 Criar Teste em `tests/test_main.py`
```python
def test_derive_from_canonical():
    """Testa derivação de axioma canônico."""
    # Hash do Código do Orbe
    parent_hash = "5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04"
    
    payload = {
        "parent_hash": parent_hash,
        "derived_text": "O rasgo que funda também limita; toda criação carrega sua própria fronteira.",
        "justification": "Derivação do Código do Orbe: explora a relação entre fundação e limite",
        "domain": "derived_foundational"
    }
    
    response = client.post("/axiom/derive", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["parent_key"] == "codigo_do_orbe"
    assert data["parent_id"] == 0
    assert data["parent_hash"] == parent_hash
    assert len(data["derived_hash"]) == 64  # SHA256
    assert data["justification"] == payload["justification"]
```

### 5.4 Validar e Deploy
```bash
# Testar localmente
pytest tests/test_main.py::test_derive_from_canonical -v

# Commit
git add .
git commit -m "feat: endpoint /axiom/derive para axiomas derivados"
git push origin main

# Railway faz auto-deploy
# Aguardar ~2 minutos

# Testar em produção
curl -X POST https://seu-app.railway.app/axiom/derive \
  -H "Content-Type: application/json" \
  -d '{
    "parent_hash": "5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04",
    "derived_text": "O rasgo que funda também limita.",
    "justification": "Derivação do Código do Orbe",
    "domain": "derived"
  }'
```

---

## AÇÃO 6: PRÓXIMAS EXTENSÕES (Prioridade)

### 6.1 Rate Limiting (1h)
```bash
pip install slowapi
```

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/axiom/verify")
@limiter.limit("100/minute")
def verify_axiom(request: Request, verify_req: VerifyRequest):
    ...
```

### 6.2 Logging Estruturado (1h)
```bash
pip install structlog
```

```python
import structlog

logger = structlog.get_logger()

@app.post("/axiom/verify")
def verify_axiom(request: VerifyRequest):
    logger.info("axiom_verification_requested", hash=request.hash)
    # ... lógica
    logger.info("axiom_verification_completed", valid=result.valid)
    return result
```

### 6.3 Métricas Prometheus (2h)
```bash
pip install prometheus-client
```

```python
from prometheus_client import Counter, Histogram, make_asgi_app

verify_counter = Counter('axiom_verify_total', 'Total axiom verifications', ['result'])
verify_latency = Histogram('axiom_verify_duration_seconds', 'Verification latency')

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

### 6.4 Dashboard React (4-8h)
- Criar frontend separado
- Visualizar Canon (lista, gráficos)
- Interface para seal/verify
- Histórico de verificações

---

## TROUBLESHOOTING

### Problema: Testes falhando após reestruturação
```bash
# Verificar imports
python -c "from api.main import app; print('OK')"

# Verificar Canon path
python -c "from api.main import CANON; print(f'Canon loaded: {bool(CANON)}')"

# Rodar pytest com output detalhado
pytest tests/ -v --tb=long
```

### Problema: Deploy Railway falhou
1. Verificar logs no Railway Dashboard
2. Confirmar Procfile correto: `web: uvicorn api.main:app --host 0.0.0.0 --port $PORT`
3. Verificar requirements.txt completo
4. Testar build local: `uvicorn api.main:app`

### Problema: Canon not loaded em produção
1. Verificar estrutura de diretórios
2. Confirmar que `canon/CANON_V1.0.json` existe no repositório
3. Verificar path em `api/main.py` linha ~12
4. Logs do Railway: procurar por "Canon not loaded"

---

## CHECKPOINT FINAL

Após completar AÇÃO 1-4, você terá:

✅ Sistema validado localmente  
✅ Estrutura de produção  
✅ CI/CD automatizado  
✅ Deploy em produção (Railway)  
✅ Endpoints funcionando publicamente  

Após completar AÇÃO 5:

✅ Feature nova: `/axiom/derive`  
✅ Testes cobrindo derivação  
✅ Deploy automático via Git push  

---

## COMUNICAÇÃO DE STATUS

Após cada AÇÃO, reporte:

**Formato:**
```
AÇÃO X: [COMPLETA/FALHOU]
- Duração: X minutos
- Resultado: [descrição breve]
- Problemas: [se houver]
- Próximo passo: AÇÃO Y
```

**Exemplo:**
```
AÇÃO 1: COMPLETA
- Duração: 4 minutos
- Resultado: Demo executou 6 testes, todos passaram
- Problemas: nenhum
- Próximo passo: AÇÃO 2
```

---

## RESUMO EXECUTIVO

**Você está em:** Repositório pronto, aguardando deploy  
**Próximo passo:** AÇÃO 1 (validação local)  
**Meta:** Sistema em produção em 40 minutos  
**Depois:** Extensões conforme roadmap  

**Comece agora: AÇÃO 1.1** ↑

---

**Activation Code:** LDM-7M-SA1W-EA25-RGIS  
**Kernel Version:** 1.0.0  
**Status:** Ready to Deploy 🚀
