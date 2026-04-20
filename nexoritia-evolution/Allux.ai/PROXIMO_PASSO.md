# ⚡ PRÓXIMO PASSO IMEDIATO — Claude Code

## STATUS ATUAL

Você acabou de executar:
```bash
cd /home/user/allux.ai/allux-claude-code
pip install -r requirements.txt  # ✓
python demo.py                   # ✓
pytest test_axiom_kernel.py -v   # ✓
```

**Se tudo passou → Sistema validado! Prossiga abaixo.**

---

## AÇÃO 2: ESTRUTURAR PARA PRODUÇÃO (10 minutos)

### 2.1 Criar Diretórios
```bash
mkdir -p canon api tests scripts .github/workflows
```

### 2.2 Mover Arquivos
```bash
# Mover para canon/
mv canon_axioms.py freeze.py CANON_V1.0.json canon/

# Mover para api/
mv axiom_kernel.py api/main.py
touch api/__init__.py

# Mover para tests/
mv test_axiom_kernel.py tests/test_main.py
touch tests/__init__.py
```

### 2.3 Ajustar Path do Canon

**Edite:** `api/main.py`

**Encontre (linha ~12):**
```python
CANON_PATH = Path(__file__).parent / "CANON_V1.0.json"
```

**Substitua por:**
```python
CANON_PATH = Path(__file__).parent.parent / "canon" / "CANON_V1.0.json"
```

### 2.4 Criar Procfile
```bash
echo "web: uvicorn api.main:app --host 0.0.0.0 --port \$PORT" > Procfile
```

### 2.5 Criar .gitignore
```bash
cat > .gitignore << 'EOF'
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
.venv/
*.egg-info/
.pytest_cache/
.coverage
.env
.DS_Store
EOF
```

### 2.6 Validar Nova Estrutura
```bash
# Rodar testes
pytest tests/test_main.py -v

# Iniciar servidor
uvicorn api.main:app --reload
```

**Resultado esperado:**
- 8/8 testes passam
- Servidor roda em http://localhost:8000
- GET /ping responde 200 OK

---

## AÇÃO 3: CI/CD (10 minutos)

### 3.1 Criar GitHub Actions

**Crie:** `.github/workflows/ci.yml`

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

### 3.3 Verificar CI
- Ir para GitHub → repositório → aba "Actions"
- Verificar workflow executou
- Confirmar testes passaram

---

## AÇÃO 4: DEPLOY RAILWAY (15 minutos)

### 4.1 Conectar Railway

**Via Dashboard:**
1. https://railway.app/
2. Login
3. "New Project" → "Deploy from GitHub repo"
4. Selecionar seu repositório
5. Railway detecta Procfile
6. Deploy inicia (~2 minutos)

### 4.2 Testar Deploy

Railway fornece URL: `https://seu-app.railway.app`

```bash
# Health check
curl https://seu-app.railway.app/ping

# Canon info
curl https://seu-app.railway.app/canon/info

# Seal axioma
curl -X POST https://seu-app.railway.app/axiom/seal \
  -H "Content-Type: application/json" \
  -d '{"text": "Teste produção", "domain": "test"}'

# Verify hash canônico
curl -X POST https://seu-app.railway.app/axiom/verify \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04",
    "kernel_version": "1.0.0"
  }'
```

---

## FORMATO DE RESPOSTA

Após cada AÇÃO, reporte:

```
AÇÃO 2: [COMPLETA/FALHOU]
- Duração: X minutos
- Resultado: [descrição]
- Problemas: [se houver]
- Próximo passo: AÇÃO 3
```

---

## TROUBLESHOOTING RÁPIDO

**Erro: Tests falharam após reestruturação**
```bash
# Verificar imports
python -c "from api.main import app; print('OK')"

# Verificar Canon path
python -c "from api.main import CANON; print(f'Canon: {bool(CANON)}')"

# Rodar com traceback completo
pytest tests/ -v --tb=long
```

**Erro: Procfile não funciona**
```bash
# Testar localmente
PORT=8000 uvicorn api.main:app --host 0.0.0.0 --port 8000
```

**Erro: CI falhou no GitHub**
- Verificar logs no Actions
- Confirmar requirements.txt completo
- Verificar paths de arquivos

---

## OBJETIVO

**Ao final de AÇÃO 2-4:**
- ✅ Estrutura organizada
- ✅ CI/CD automatizado
- ✅ Sistema em produção (Railway)
- ✅ Endpoints públicos funcionando

**Tempo total:** ~35-40 minutos

---

## COMEÇAR AGORA

Execute AÇÃO 2.1 (primeira linha):
```bash
mkdir -p canon api tests scripts .github/workflows
```

Depois siga sequencialmente até AÇÃO 2.6.

---

**Activation Code:** LDM-7M-SA1W-EA25-RGIS
**Status:** Pronto para AÇÃO 2 🚀
