# Nexoritia Skills Integration - VISADOCS

## 📋 Resumo da Implementação

Integração do sistema de **Skills Canônicas** (similar ao NotebookLM) ao VISADOCS, permitindo especialização dinâmica do assistente IA.

---

## 🎯 Benefícios Implementados

| Benefício | Descrição | Status |
|-----------|-----------|--------|
| **Multi-especialista** | Trocar comportamento via `skillSlug` | ✅ |
| **Fail-closed** | Erro claro se skill indisponível | ✅ |
| **Cache local** | 60s TTL para evitar chamadas repetidas | ✅ |
| **Skills locais** | Funciona sem Nexoritia OS rodando | ✅ |
| **Extensível** | Pronto para integrar com Nexoritia real | ✅ |

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
```
lib/skills/nexoritia-client.ts    # Client para buscar skills
lib/skills/skill-resolver.ts      # Resolver com cache
```

### Modificados
```
lib/ai-router.ts                  # + systemPrefix, callAIWithSkill
app/api/ai/chat/route.ts          # + skillSlug, useSkill, GET /skills
```

---

## 🧩 Skills Canônicas Disponíveis

| Slug | Especialidade | Status |
|------|---------------|--------|
| `assistente-rdc67` | Especialista RDC 67/2007 | CANON |
| `gerador-quiz-pop` | Gera questões de avaliação | CANON |
| `redator-pop` | Ajuda a redigir POPs | CANON |
| `auditor-qualidade` | Analisa não-conformidades | FROZEN |

---

## 🚀 Como Usar

### 1. Chat Normal (sem skill especializada)
```bash
POST /api/ai/chat
{
  "message": "Explique BPF",
  "useSkill": false
}
```

### 2. Chat com Skill Canônica
```bash
POST /api/ai/chat
{
  "message": "Explique BPF",
  "useSkill": true,
  "skillSlug": "assistente-rdc67"
}
```

### 3. Listar Skills Disponíveis
```bash
GET /api/ai/chat
→ { "skills": [...] }
```

---

## ⚡ Exemplo de Resposta

```json
{
  "success": true,
  "response": "Segundo a RDC 67/2007, BPF são...",
  "model": "deepseek/deepseek-chat",
  "tokensUsed": 245,
  "skillUsed": "assistente-rdc67"
}
```

---

## 🛡️ Fail-Closed Behavior

Se skill indisponível:
```json
{
  "error": "Skill indisponível",
  "detail": "Skill \"assistente-rdc67\" não encontrada",
  "availableSkills": [...]
}
```
HTTP 422

---

## 🔧 Arquitetura

```
Usuário → POST /api/ai/chat
              ↓
         skillSlug? → resolveSkill()
              ↓
         callAIWithSkill()
              ↓
         systemPrefix injetado
              ↓
         OpenRouter API
              ↓
         Resposta especializada
```

---

## 📝 Próximos Passos

1. **Integrar com Nexoritia OS real**: Mudar `USE_LOCAL_FALLBACK = false`
2. **Criar UI de seleção de skills**: Dropdown no chat
3. **Adicionar mais skills**: Análise de risco, Auditoria fiscalização
4. **Persistir skills**: Banco de dados local + sync com Nexoritia

---

## ✅ Limpeza de Redundâncias

O documento original continha:
- ❌ 3 explicações do mesmo conceito "fail-closed"
- ❌ Código HTML de estilização desnecessário
- ❌ Seções de teste excessivas
- ❌ Múltiplos fluxos equivalentes

**Implementação final**: 2 arquivos + 2 modificações = Código limpo e funcional.

---

## 🎉 Resultado

VISADOCS agora tem **Assistente IA multi-especialista** similar ao NotebookLM, pronto para:
- ✅ Treinamentos especializados
- ✅ Geração de quizzes inteligentes
- ✅ Redação técnica de POPs
- ✅ Auditoria de qualidade

**Zero código redundante. Máxima funcionalidade.**
