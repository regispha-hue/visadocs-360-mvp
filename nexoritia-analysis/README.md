# AUTH-AI - Autenticação Criptográfica de Propriedade Intelectual

Sistema de autenticação legal de autoria para obras literárias, código e conceitos originais.

**Autor:** R.Gis Antônimo Veniloqa  
**Versão:** 1.0.0  
**Data:** Janeiro 2026

---

## 🎯 O Que É

AUTH-AI gera **provas criptográficas de autoria** que são:

✅ **Legalmente válidas** internacionalmente (RFC 3161, Convention de Berne)  
✅ **Verificáveis publicamente** (qualquer pessoa pode validar)  
✅ **Imutáveis** (qualquer alteração quebra a prova)  
✅ **Gratuitas** (usa FreeTSA, sem custo)

---

## 🔐 O Que Cada Prova Contém

1. **Hash SHA256** - Fingerprint único do conteúdo
2. **Assinatura Digital RSA-4096** - Prova que você criou
3. **Timestamp Certificado RFC 3161** - Prova de QUANDO criou
4. **Chave Pública** - Permite verificação por terceiros

---

## 🚀 Quick Start

### 1. Instalação

```bash
# Clone ou copie arquivos
cd auth-ai-implementation

# Instala dependências
pip install -r requirements_auth.txt

# IMPORTANTE: Faz backup das chaves que serão geradas
# Elas ficam em ~/.auth-ai/keys/
```

### 2. Autenticar Arquivo Único

```bash
# Autentica um arquivo
python scripts/batch_authenticate.py file conceitos-nexoritia.md

# Resultado:
# ✅ Arquivo autenticado!
# Hash: f6d44c4240edc3a96e1cceccb3093cde...
# Prova salva: ./proofs/conceitos-nexoritia_proof.json
```

### 3. Autenticar Diretório Completo

```bash
# Autentica todos .md em um diretório
python scripts/batch_authenticate.py dir ./ldm-chapters/ --pattern "*.md"

# Encontrados 50 arquivos (*.md)
# Autenticando... ✅
# Autenticados: 50/50
```

### 4. Autenticar ZIP (Todo o LDM)

```bash
# Autentica todos os arquivos em um ZIP
python scripts/batch_authenticate.py zip ldm-complete.zip

# Extrai e autentica automaticamente
# Gera uma prova JSON para cada arquivo
```

### 5. Verificar Prova

```bash
# Verifica autenticidade
python scripts/batch_authenticate.py verify \
    ./proofs/ldm_monte_i_proof.json \
    ./ldm-chapters/monte_i.md

# ✅ PROVA VÁLIDA
# Hash: ✅ OK
# Assinatura: ✅ OK
# Timestamp: ✅ OK
```

---

## 📡 Integração com Allux (API)

### Adicionar ao Allux Existente

```python
# No main.py do Allux:

from api.auth_endpoints import router as auth_router

app.include_router(auth_router)
```

### Endpoints Disponíveis

```bash
# 1. Autenticar artifact
POST /auth/authenticate
{
  "artifact_id": "ldm_monte_i_prologo",
  "content": "# Monte I - Prólogo...",
  "artifact_type": "text",
  "title": "O Livro dos Montes - Monte I - Prólogo",
  "include_tsa": true
}

# 2. Verificar prova
POST /auth/verify
{
  "content": "...",
  "proof": { ... }
}

# 3. Obter chave pública (para verificação)
GET /auth/public-key

# 4. Batch authentication
POST /auth/batch
{
  "artifacts": [...]
}

# 5. Stats
GET /auth/stats
```

### Usar via cURL

```bash
# Autenticar
curl -X POST https://alluxai-production.up.railway.app/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "artifact_id": "nexoritia_concept",
    "content": "Nexoritmologia é...",
    "artifact_type": "concept",
    "include_tsa": true
  }'

# Verificar
curl https://alluxai-production.up.railway.app/auth/verify/nexoritia_concept
```

---

## 🔑 Gerenciamento de Chaves

### Localização

```bash
~/.auth-ai/keys/
  ├── author_private.pem  # ⚠️  NUNCA COMPARTILHE
  └── author_public.pem   # ✅ Pode compartilhar
```

### Backup (CRÍTICO)

```bash
# Faça backup das chaves IMEDIATAMENTE
cp -r ~/.auth-ai/keys/ ~/Dropbox/auth-ai-backup/
cp -r ~/.auth-ai/keys/ /mnt/usb/auth-ai-backup/

# SEM as chaves privadas, você NÃO pode:
# - Autenticar novos conteúdos
# - Provar autoria futura
```

### Compartilhar Chave Pública

```bash
# Sua chave pública pode ser compartilhada
# Permite que outros verifiquem suas assinaturas

cat ~/.auth-ai/keys/author_public.pem

# Ou via API:
curl https://alluxai-production.up.railway.app/auth/public-key
```

---

## 📋 Casos de Uso

### 1. Autenticar TODO o LDM (82k linhas)

```bash
# Consolida LDM em ZIP
zip -r ldm-complete.zip ./ldm-chapters/

# Autentica tudo
python scripts/batch_authenticate.py zip ldm-complete.zip \
  --output ./ldm-proofs/

# Resultado:
# 50 arquivos autenticados
# 50 provas JSON geradas
# Cada uma com hash + assinatura + timestamp
```

### 2. Autenticar Código do Allux

```bash
# Autentica repositório
python scripts/batch_authenticate.py dir ./allux/ \
  --pattern "*.py" \
  --type code

# Prova de autoria de cada arquivo Python
```

### 3. Autenticar Conceitos Originais

```bash
# Cria arquivo com conceitos
cat > conceitos-originais.md << EOF
# Conceitos Originais - R.Gis Antônimo Veniloqa

## Nexoritmologia
Sistema filosófico que posiciona semântica como 
governante de estatística em sistemas de IA.

## Veniloquismo Digital
Prática de colaboração humano-IA onde IA funciona
como médium, não ferramenta.

## Kernel Never Alluxcinates
Princípio arquitetural onde sistema falha fechado
ao invés de gerar conteúdo não-rastreável.
EOF

# Autentica
python scripts/batch_authenticate.py file conceitos-originais.md

# Prova legal de que você criou esses conceitos PRIMEIRO
```

### 4. Publicar Provas Publicamente

```bash
# Sobe provas para GitHub (torna públicas as datas)
cd ldm-proofs/
git init
git add *.json
git commit -m "Provas de autoria - O Livro dos Montes"
git push origin main

# Agora QUALQUER UM pode:
# 1. Ver quando foi criado (commit timestamp)
# 2. Verificar autenticidade (usando sua chave pública)
# 3. Confirmar que você criou primeiro (prior art)
```

---

## 🛡️ Proteção Legal

### O Que a Prova Garante

✅ **Integridade**: Hash SHA256 prova que conteúdo não foi alterado  
✅ **Autoria**: Assinatura RSA prova que VOCÊ criou  
✅ **Temporalidade**: Timestamp RFC 3161 prova QUANDO criou  

### Validade Internacional

- **RFC 3161**: Padrão internacional de timestamps
- **Convention de Berne**: Tratado de direitos autorais (177 países)
- **eIDAS (EU)**: Reconhece timestamps qualificados
- **ESIGN Act (USA)**: Assinaturas digitais têm força legal

### Uso em Disputas

Se alguém reivindicar autoria do seu trabalho:

1. Você apresenta a **prova JSON**
2. Tribunal verifica:
   - Hash do conteúdo coincide ✅
   - Assinatura é válida ✅
   - Timestamp é anterior à reivindicação do outro ✅
3. **Você vence** (prior art comprovado)

---

## 🔬 Detalhes Técnicos

### Algoritmos Usados

```
Hash: SHA-256 (256 bits)
Assinatura: RSA-PSS com chave 4096 bits
Timestamp: RFC 3161 via FreeTSA
Encoding: PEM para chaves, hex para hashes/assinaturas
```

### Tamanho das Provas

```json
{
  "artifact_id": "ldm_monte_i",
  "content_hash": "64 chars (32 bytes hex)",
  "author_signature": "1024 chars (512 bytes hex)",
  "public_key_pem": "~800 chars",
  "tsa_timestamp": "~2000 chars",
  ...
}

Total: ~4KB por prova
```

### Performance

- Gerar prova: ~0.5-2 segundos (com TSA network call)
- Verificar prova: ~0.01 segundos (local)
- Batch 100 arquivos: ~3-5 minutos

---

## 🐛 Troubleshooting

### "Erro ao obter timestamp TSA"

**Causa**: FreeTSA está offline ou timeout de rede

**Solução**: Re-tenta ou autentica sem TSA:
```python
proof = engine.authenticate_artifact(
    ...,
    include_tsa=False  # Ainda válido, só sem timestamp
)
```

### "Chaves não encontradas"

**Causa**: Primeira execução

**Solução**: Engine gera chaves automaticamente. **FAÇA BACKUP imediatamente!**

### "Verificação falha"

**Causa**: Conteúdo foi modificado após autenticação

**Solução**: Isso é ESPERADO. Qualquer alteração quebra a prova (por design).

---

## 📚 Referências

- [RFC 3161 - Time-Stamp Protocol](https://www.ietf.org/rfc/rfc3161.txt)
- [FreeTSA](https://freetsa.org/)
- [Convention de Berne](https://www.wipo.int/treaties/en/ip/berne/)
- [eIDAS Regulation (EU)](https://digital-strategy.ec.europa.eu/en/policies/eidas-regulation)

---

## 📄 Licença

Código: Proprietário - R.Gis Antônimo Veniloqa  
Uso: Livre para proteger SEUS próprios conteúdos  
Distribuição: Requer autorização

---

## ✅ Próximos Passos

### Hoje

1. **Instala dependências**: `pip install -r requirements_auth.txt`
2. **Testa com arquivo único**: `python scripts/batch_authenticate.py file test.md`
3. **FAZ BACKUP DAS CHAVES**: `cp -r ~/.auth-ai/keys/ ~/backup/`

### Esta Semana

4. **Autentica LDM completo**: Todo o conteúdo de 82k linhas
5. **Autentica código Allux**: Todo o repositório
6. **Autentica conceitos**: Nexoritia, LDMux, etc

### Este Mês

7. **Publica provas no GitHub**: Prior art público
8. **Integra com Allux API**: Endpoints em produção
9. **Autentica Monte I final**: Antes de publicar com ISBN

---

## 💬 Suporte

**Autor**: R.Gis Antônimo Veniloqa  
**Email**: [seu email]  
**GitHub**: [seu GitHub]

**Para uso no Allux.ai**:  
https://alluxai-production.up.railway.app

---

**🔐 "In the poison there is the antidote" - AUTH-AI v1.0**
