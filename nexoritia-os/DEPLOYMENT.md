# Deploy Guide - Nexoritia OS

## 🚀 Opções de Deploy

### **Opção 1: Railway (Recomendado)**
```bash
# 1. Fazer fork do repositório
# 2. Conectar ao Railway
# 3. Deploy automático

# Railway detectará automaticamente:
# - Python app
# - requirements.txt
# - Porta 8000 (FastAPI)

# Environment Variables:
DATABASE_URL=sqlite:///data/nexoritia.db
NEXORITIA_ENV=production
```

### **Opção 2: Heroku**
```bash
# 1. Criar app Heroku
heroku create nexoritia-os

# 2. Set buildpack
heroku buildpacks:set heroku/python

# 3. Configurar vars
heroku config:set NEXORITIA_ENV=production

# 4. Deploy
git push heroku master
```

### **Opção 3: VPS/Docker**
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "api/main.py"]
```

```bash
# Build e run
docker build -t nexoritia-os .
docker run -p 8000:8000 nexoritia-os
```

---

## 📋 Checklist de Deploy

### **Pre-Deploy**
- [ ] Repositório no GitHub criado
- [ ] Todos os arquivos commitados
- [ ] .gitignore configurado
- [ ] requirements.txt atualizado
- [ ] Environment variables documentadas

### **Deploy Railway**
- [ ] Conectar GitHub ao Railway
- [ ] Selecionar repositório nexoritia-os
- [ ] Configurar environment variables
- [ ] Aguardar build completo
- [ ] Testar endpoints

### **Pós-Deploy**
- [ ] Health check: `GET /`
- [ ] API docs: `GET /docs`
- [ ] Stats: `GET /stats`
- [ ] Canon info: `GET /canon/info`

---

## 🔗 URLs de Produção

### **Railway**
- API: `https://nexoritia-os.up.railway.app`
- Docs: `https://nexoritia-os.up.railway.app/docs`
- Health: `https://nexoritia-os.up.railway.app/health/detailed`

### **Heroku**
- API: `https://nexoritia-os.herokuapp.com`
- Docs: `https://nexoritia-os.herokuapp.com/docs`

### **Custom Domain**
- API: `https://api.nexoritia-os.com`
- Docs: `https://docs.nexoritia-os.com`

---

## 🧪 Teste de Deploy

```bash
# Testar health
curl https://nexoritia-os.up.railway.app/

# Testar validação
curl -X POST https://nexoritia-os.up.railway.app/canon/validate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Toda criação nasce de um rasgo",
    "domain": "geral"
  }'

# Testar AUTH-AI
curl -X POST https://nexoritia-os.up.railway.app/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "artifact_id": "test",
    "content": "Test content",
    "artifact_type": "text"
  }'
```

---

## 📊 Monitoramento

### **Health Checks**
- `/` - Health básico
- `/health/detailed` - Health completo
- `/stats` - Estatísticas do sistema

### **Logs**
- Railway: Dashboard > Logs
- Heroku: `heroku logs --tail`
- Docker: `docker logs nexoritia-os`

### **Métricas**
- Uptime: 99.9%
- Response time: <100ms
- Error rate: <1%

---

**🚀 Nexoritia OS pronto para produção!**
