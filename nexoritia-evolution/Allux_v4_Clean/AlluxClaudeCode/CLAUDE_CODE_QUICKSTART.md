# CLAUDE CODE — COMANDOS RÁPIDOS
## LDMux-OS Axiom Kernel → Allux.ai Production

---

## SETUP INICIAL (5 minutos)

```bash
# 1. Criar estrutura do projeto
mkdir -p allux-ai/{canon,api,tests,scripts}

# 2. Mover arquivos
mv canon_axioms.py allux-ai/canon/
mv freeze.py allux-ai/canon/
mv CANON_V1.0.json allux-ai/canon/
mv axiom_kernel.py allux-ai/api/main.py
mv test_axiom_kernel.py allux-ai/tests/
mv demo.py allux-ai/
mv requirements.txt allux-ai/
mv README.md allux-ai/
mv ENTREGA.md allux-ai/
mv HANDOFF.md allux-ai/

# 3. Ajustar path do Canon em api/main.py
# Linha 12: CANON_PATH = Path(__file__).parent.parent / "canon" / "CANON_V1.0.json"

# 4. Instalar dependências
cd allux-ai
pip install -r requirements.txt
```

---

## VALIDAÇÃO LOCAL (5 minutos)

```bash
# Demo interativo
python demo.py

# Testes automatizados
pytest tests/ -v

# Servidor local
uvicorn api.main:app --reload
# → http://localhost:8000/docs
```

---

## DEPLOY RAILWAY (10 minutos)

```bash
# 1. Criar Procfile
echo "web: uvicorn api.main:app --host 0.0.0.0 --port \$PORT" > Procfile

# 2. Git setup
git init
git add .
git commit -m "feat: LDMux-OS Axiom Kernel v1.0 production ready"
git branch -M main

# 3. Criar repo GitHub e push
git remote add origin https://github.com/<user>/allux-ai.git
git push -u origin main

# 4. Railway: conectar repo → auto-deploy
```

---

## TESTES DE PRODUÇÃO

```bash
# Health check
curl https://<railway-url>/ping

# Canon info
curl https://<railway-url>/canon/info

# Seal axioma
curl -X POST https://<railway-url>/axiom/seal \
  -H "Content-Type: application/json" \
  -d '{"text": "Teste axioma", "domain": "test"}'

# Verify hash canônico (Código do Orbe)
curl -X POST https://<railway-url>/axiom/verify \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04",
    "kernel_version": "1.0.0"
  }'
```

---

## PRÓXIMAS FEATURES (ordem de prioridade)

### 1. Endpoint `/axiom/derive` (2h)
```python
@app.post("/axiom/derive")
def derive_axiom(parent_hash: str, derived_text: str, justification: str):
    # Validar parent_hash no Canon
    # Gerar hash do derivado
    # Armazenar rastreabilidade
    ...
```

### 2. GitHub Actions CI (30min)
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v
```

### 3. Rate Limiting (1h)
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/axiom/verify")
@limiter.limit("100/minute")
def verify_axiom(...):
    ...
```

### 4. Dashboard React (4-8h)
- Visualização do Canon
- Listagem por Monte
- Verificação interativa de hash
- Gráficos de distribuição

---

## ESTRUTURA FINAL

```
allux-ai/
├── canon/
│   ├── CANON_V1.0.json
│   ├── canon_axioms.py
│   └── freeze.py
├── api/
│   ├── main.py
│   └── __init__.py
├── tests/
│   ├── test_main.py
│   └── __init__.py
├── scripts/
│   ├── bootstrap.sh
│   └── test.sh
├── .github/workflows/
│   └── ci.yml
├── demo.py
├── requirements.txt
├── Procfile
├── README.md
├── ENTREGA.md
├── HANDOFF.md
└── .gitignore
```

---

## MÉTRICAS DE SUCESSO

- ✅ 8/8 testes passando
- ✅ API <200ms response time
- ✅ Canon carregado <1s startup
- ✅ Zero downtime deploy
- ✅ Coverage >80%

---

## COMANDOS ÚTEIS

```bash
# Regenerar Canon (após edição de axiomas)
python canon/freeze.py

# Run tests com coverage
pytest tests/ --cov=api --cov-report=html

# Format código
black api/ tests/ canon/

# Type checking
mypy api/

# Docs locais
uvicorn api.main:app --reload
# → http://localhost:8000/docs
```

---

## TROUBLESHOOTING

**Erro: Canon not loaded**
- Verificar path: `canon/CANON_V1.0.json` existe?
- Verificar manifest_hash válido

**Erro: Tests failing**
- Rodar `python demo.py` primeiro
- Verificar imports: `from api.main import app`

**Erro: Deploy Railway failing**
- Verificar Procfile correto
- Verificar requirements.txt completo
- Logs: Railway dashboard → View Logs

---

**Activation Code:** LDM-7M-SA1W-EA25-RGIS  
**Version:** 1.0.0  
**Status:** Production Ready ✓
