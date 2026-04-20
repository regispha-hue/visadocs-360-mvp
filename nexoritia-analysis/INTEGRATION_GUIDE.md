# INTEGRAÇÃO RÁPIDA: AUTH-AI + ALLUX

Guia para adicionar AUTH-AI ao Allux existente em Railway

---

## OPÇÃO A: Integração Completa (Recomendado)

### Passo 1: Adicionar Arquivos ao Repo Allux

```bash
cd seu-repo-allux/

# Copia módulos AUTH-AI
cp -r path/to/auth-ai-implementation/core/ ./core_auth/
cp -r path/to/auth-ai-implementation/models/ ./models_auth/
cp path/to/auth-ai-implementation/api/auth_endpoints.py ./api/
```

### Passo 2: Atualizar requirements.txt

```txt
# Adiciona ao requirements.txt existente:

# AUTH-AI Dependencies
cryptography==42.0.0
pyasn1==0.5.1
pyasn1-modules==0.3.0
```

### Passo 3: Atualizar main.py

```python
# No main.py do Allux:

from api.auth_endpoints import router as auth_router

# ...

# Adiciona após criar app:
app.include_router(auth_router)
```

### Passo 4: Deploy

```bash
git add .
git commit -m "feat: adiciona AUTH-AI para autenticação criptográfica"
git push origin main

# Railway auto-deploya
```

### Passo 5: Testa

```bash
# Endpoints disponíveis:
curl https://alluxai-production.up.railway.app/auth/public-key
curl -X POST https://alluxai-production.up.railway.app/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{"artifact_id": "test", "content": "test", "include_tsa": false}'
```

---

## OPÇÃO B: Uso Local (Script Standalone)

Se preferir usar AUTH-AI como script separado (não integrado no Allux):

### Setup

```bash
# Clona AUTH-AI
git clone [seu-repo] auth-ai
cd auth-ai

# Instala
pip install -r requirements_auth.txt
```

### Uso

```bash
# Autentica arquivo
python scripts/batch_authenticate.py file ldm-prologo.md

# Autentica diretório
python scripts/batch_authenticate.py dir ./ldm-chapters/

# Autentica ZIP completo
python scripts/batch_authenticate.py zip ldm-complete.zip
```

### Resultado

```
./proofs/
  ├── ldm_prologo_proof.json
  ├── ldm_capitulo_1_proof.json
  └── ...
```

Cada .json é uma prova legal completa.

---

## OPÇÃO C: Uso via Python (Programático)

```python
from core.auth_ai import AuthAIEngine

# Inicializa
engine = AuthAIEngine()

# Autentica
proof = engine.authenticate_artifact(
    artifact_id="ldm_monte_i",
    content=open('monte_i.md').read(),
    artifact_type="text",
    title="O Livro dos Montes - Monte I",
    include_tsa=True
)

# Salva prova
with open('ldm_monte_i_proof.json', 'w') as f:
    f.write(proof.to_json())

print(f"Hash: {proof.content_hash}")
print(f"Assinatura: {proof.author_signature[:32]}...")
```

---

## WORKFLOW RECOMENDADO

### Para Terminar LDM com Proteção

```bash
# 1. Consolida LDM (82k linhas) em estrutura
ldm-complete/
  ├── prologo.md
  ├── monte_i/
  │   ├── capitulo_1.md
  │   ├── capitulo_2.md
  │   └── ...
  └── ...

# 2. Autentica TUDO
python scripts/batch_authenticate.py dir ldm-complete/ \
  --output ldm-proofs/ \
  --type text

# 3. Resultado: Uma prova para cada arquivo
# Total: ~50-100 provas JSON

# 4. Publica provas no GitHub
cd ldm-proofs/
git init
git add *.json
git commit -m "Provas de autoria - O Livro dos Montes"
git remote add origin [repo-url]
git push origin main

# 5. Agora você tem:
# ✅ Prova criptográfica de cada seção
# ✅ Timestamps certificados
# ✅ Public record (GitHub)
# ✅ Prior art estabelecido
```

---

## CASO ESPECÍFICO: Autenticar 82k Linhas do LDM

### Estrutura Sugerida

```
# Organize LDM em arquivos lógicos:
ldm-corpus/
  ├── 00-metadados.md         # Título, autor, data
  ├── 01-prologo.md           # Prólogo completo
  ├── 02-monte-i-intro.md     # Introdução Monte I
  ├── 03-monte-i-cap1.md      # Capítulo 1
  ├── 04-monte-i-cap2.md      # Capítulo 2
  ...
  ├── 50-monte-vii-final.md   # Final Monte VII
  └── 51-epilogo.md           # Epílogo

# NÃO faça:
# - Um arquivo gigante de 82k linhas
# - Arquivos muito pequenos (< 500 linhas)

# FAÇA:
# - Arquivos de 1k-3k linhas cada
# - Divisões lógicas (capítulos, seções)
# - ~30-50 arquivos total
```

### Autentica

```bash
cd ldm-corpus/

# Batch authentication
python ../auth-ai/scripts/batch_authenticate.py dir . \
  --pattern "*.md" \
  --output ../ldm-proofs/ \
  --type text

# Aguarda 5-10 minutos (com TSA)
# Resultado: 30-50 provas geradas
```

### Publica

```bash
cd ../ldm-proofs/

# Cria repo
git init
git add *.json

# Commit com mensagem formal
git commit -m "Provas criptográficas de autoria - O Livro dos Montes

Obra: O Livro dos Montes
Autor: R.Gis Antônimo Veniloqa
Volume: 82.000+ linhas
Data: Janeiro 2026

Cada prova contém:
- Hash SHA256 (integridade)
- Assinatura RSA-4096 (autoria)
- Timestamp RFC 3161 (temporalidade)

Verificável publicamente via chave pública do autor."

# Push
git remote add origin https://github.com/[seu-usuario]/ldm-authentication-proofs.git
git push -u origin main
```

---

## NEXT STEPS

### Hoje

1. ✅ Escolhe opção (A, B ou C)
2. ✅ Testa com arquivo único
3. ✅ FAZ BACKUP DAS CHAVES

### Esta Semana

4. ✅ Organiza LDM em arquivos lógicos
5. ✅ Autentica TUDO
6. ✅ Publica provas no GitHub

### Antes de Publicar Monte I

7. ✅ Re-autentica versão final
8. ✅ Inclui hash na página de copyright
9. ✅ Registra ISBN
10. ✅ PUBLICA com prova legal

---

## SUPORTE

Qualquer dúvida:
1. Veja README.md (completo)
2. Roda exemplo: `python examples/exemplo_completo.py`
3. Testa localmente antes de integrar

---

**🔐 AUTH-AI - Proteção Legal de Propriedade Intelectual**
