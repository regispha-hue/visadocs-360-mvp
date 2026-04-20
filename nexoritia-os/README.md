# Nexoritia OS - Sistema Operacional de Governança IA

## 🎯 Visão Geral

Nexoritia OS é um **Sistema Operacional completo** que implementa governança determinística sobre sistemas de Inteligência Artificial, transformando saídas probabilísticas em artefatos auditáveis e conformes.

### **Arquitetura Core**
```
┌─────────────────────────────────────────────────────────────┐
│                NEXORITIA OS v2.0                     │
├─────────────────────────────────────────────────────────────┤
│  Kernel de Governança (Allux Core)                    │
│  ├── Canon Registry (21 axiomas)                      │
│  ├── OS-RADAR (Validação em tempo real)              │
│  ├── OS-Notarius (AUTH-AI Criptográfico)             │
│  └── OS-Memory (Estado persistente)                     │
├─────────────────────────────────────────────────────────────┤
│  Camada de Raciocínio (LLM Gateway)                   │
│  ├── Multi-LLM Support (Claude/GPT/Llama)              │
│  ├── Axiom Embedding (Contexto escalável)              │
│  └── Fail-Closed Validation                             │
├─────────────────────────────────────────────────────────────┤
│  Camada de Execução (OS-Agent)                          │
│  ├── Shell Commands                                     │
│  ├── File Operations                                    │
│  ├── Web Automation                                    │
│  └── API Integration                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Estrutura do Projeto

```
nexoritia-os/
├── core/                          # Kernel de Governança
│   ├── canon_registry.py          # Gestão do Canon de Axiomas
│   ├── os_radar.py               # Validação em tempo real
│   ├── os_notarius.py            # AUTH-AI Criptográfico
│   ├── os_memory.py              # Estado persistente
│   └── models.py                # Pydantic models
├── llm/                          # Gateway LLM
│   ├── llm_gateway.py            # Multi-LLM interface
│   ├── axiom_embedding.py        # Contexto escalável
│   └── prompt_engine.py          # Prompt governado
├── agent/                        # Camada de Execução
│   ├── os_agent.py               # Motor de execução
│   ├── shell_executor.py         # Comandos shell
│   ├── file_manager.py          # Operações de arquivos
│   └── web_automation.py        # Automação web
├── api/                          # API REST
│   ├── main.py                   # FastAPI server
│   ├── auth_endpoints.py         # AUTH-AI endpoints
│   ├── canon_endpoints.py       # Canon endpoints
│   └── agent_endpoints.py       # OS-Agent endpoints
├── data/                         # Dados
│   ├── canon_v1.0.json          # 21 axiomas congelados
│   └── nexoritia.db             # SQLite database
├── tests/                        # Testes automatizados
├── docs/                         # Documentação
└── requirements.txt              # Dependências
```

---

## 🔧 Componentes Principais

### **1. Canon Registry**
- **21 axiomas fundamentais** do Livro dos Montes
- **Hash SHA256** para integridade
- **Versionamento git-like**
- **Full-text search (FTS5)**

### **2. OS-RADAR**
- **Validação em tempo real** de saídas LLM
- **Contratos semânticos** por domínio
- **Fail-closed principle** (bloqueia inválidos)
- **Axiom embedding** para contexto escalável

### **3. OS-Notarius (AUTH-AI)**
- **RSA-4096** assinaturas digitais
- **RFC 3161** timestamps certificados
- **Provas legais** internacionalmente válidas
- **Custo $0** (FreeTSA)

### **4. OS-Memory**
- **Estado persistente** entre sessões
- **Working state** para contexto
- **Audit trail** completo
- **Multi-tenant** support

### **5. LLM Gateway**
- **Multi-LLM support**: Claude, GPT, Llama
- **Axiom embedding** para contexto grande
- **Prompt governado** automaticamente
- **Rate limiting** e monitoring

### **6. OS-Agent**
- **Shell execution** segura e isolada
- **File operations** com validação
- **Web automation** controlada
- **API integration** rastreável

---

## 🚀 Quick Start

### **Instalação**
```bash
# Clonar repositório
git clone https://github.com/regispha-hue/nexoritia-os.git
cd nexoritia-os

# Instalar dependências
pip install -r requirements.txt

# Inicializar database
python -c "from core.canon_registry import CanonRegistry; CanonRegistry().init_db()"
```

### **Execução**
```bash
# Iniciar OS completo
python api/main.py

# Acessar interface
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
# Dashboard: http://localhost:8000/dashboard
```

### **Exemplo de Uso**
```python
from nexoritia_os import NexoritiaOS

# Inicializar OS
os = NexoritiaOS()

# Validar axioma
result = os.validate_axiom(
    text="Toda criação nasce de um rasgo",
    domain="criacao"
)

# Gerar prova AUTH-AI
proof = os.generate_proof(
    artifact_id="pop_001",
    content="# POP 001 - Manipulação",
    include_tsa=True
)

# Executar comando governado
output = os.execute_command(
    command="npm run build",
    context="web_deployment",
    validation_required=True
)
```

---

## 📊 APIs Principais

### **Canon APIs**
```
GET  /canon/info              # Informações do Canon
GET  /canon/axioms            # Listar axiomas
POST /canon/validate           # Validar texto
POST /canon/seal              # Selar axioma
```

### **AUTH-AI APIs**
```
POST /auth/authenticate         # Gerar prova
POST /auth/verify             # Verificar prova
GET  /auth/public-key         # Chave pública
POST /auth/batch              # Batch authentication
```

### **OS-Agent APIs**
```
POST /agent/execute           # Executar comando
POST /agent/file             # Operação de arquivo
POST /agent/web              # Automação web
GET  /agent/status           # Status do agente
```

### **LLM APIs**
```
POST /llm/prompt             # Prompt governado
POST /llm/embed             # Axiom embedding
GET  /llm/models            # Modelos disponíveis
POST /llm/validate          # Validar saída
```

---

## 🛡️ Princípios de Governança

### **1. Fail-Closed**
- Nada publica sem validação completa
- Testes devem PASSAR obrigatoriamente
- Erros bloqueiam processo

### **2. Imutabilidade**
- Artefatos nunca sobrescritos
- Mudanças criam novas versões
- Patches aplicados atomicamente

### **3. Provenance**
- Tudo rastreável até fonte original
- Audit trail completo mantido
- Hash criptográfico garante integridade

### **4. Determinismo**
- Mesmo input = mesmo output
- Canon pode ser reconstruído
- Sem estado oculto

---

## 🎯 Casos de Uso

### **1. Visadocs 360 Integration**
```python
# Validar POP automaticamente
validation = os.validate_document(
    content=pop.descricao,
    domain="farmacia_manipulacao",
    regulations=["RDC_67_2007", "BPM"]
)

# Gerar certificado com prova
certificate = os.generate_certificate(
    training_id=treinamento.id,
    include_auth_ai=True
)
```

### **2. Chatbot Governado**
```python
# Resposta com validação
response = os.llm_prompt(
    query="Como validar lotes?",
    context="farmacia",
    validate_output=True
)

# Garante conformidade com RDC 67/2007
assert response.is_compliant
```

### **3. Auditoria Automática**
```python
# Analisar conformidade
audit = os.audit_compliance(
    documents=lista_pops,
    regulations=["RDC_67_2007"],
    generate_report=True
)
```

---

## 📈 Métricas e Monitoramento

### **Performance**
- **<100ms** resposta API
- **<2s** geração de provas
- **99.9%** uptime

### **Qualidade**
- **Zero alucinações** (fail-closed)
- **100%** conformidade regulatória
- **Traceability** completa

### **Uso**
- **API calls** por dia
- **Validações** realizadas
- **Provas** geradas
- **Compliance rate**

---

## 🔒 Segurança

### **Criptografia**
- **RSA-4096** para assinaturas
- **SHA-256** para hashes
- **AES-256** para dados sensíveis

### **Autenticação**
- **API keys** rotativas
- **JWT tokens** com expiração
- **Rate limiting** por cliente

### **Auditoria**
- **Log completo** de todas as ações
- **Assinatura digital** de logs
- **Backup automático** criptografado

---

## 🚀 Roadmap Futuro

### **v2.1 (Próximo mês)**
- [ ] Dashboard React completo
- [ ] Multi-tenant avançado
- [ ] Blockchain anchoring
- [ ] Mobile app (React Native)

### **v2.2 (3 meses)**
- [ ] Enterprise features
- [ ] Advanced analytics
- [ ] Custom domains
- [ ] White-label deployment

### **v3.0 (6 meses)**
- [ ] Quantum-resistant crypto
- [ ] Distributed consensus
- [ ] AI model training
- [ ] Global marketplace

---

## 📄 Licença

**Proprietário - R.Gis Antônimo Veniloqa**  
Uso livre para projetos próprios  
Distribuição requer autorização

---

**🔐 "In determinism there is compliance" - Nexoritia OS v2.0**
