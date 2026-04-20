# 🚀 START HERE — Claude Code

## Você recebeu o LDMux-OS Axiom Kernel v1.0

Sistema de validação ontológica **completo e testado**. Pronto para deploy.

---

## ⚡ AÇÃO IMEDIATA (escolha uma)

### Opção A: Validar Rapidamente (2 minutos)
```bash
python demo.py
```
Veja o sistema funcionando. 6 demonstrações executam.

### Opção B: Seguir Roteiro Completo (40 minutos)
```bash
# Abrir instruções detalhadas
cat CLAUDE_CODE_INSTRUCTIONS.md
```
Roteiro passo-a-passo: validação → estruturação → CI/CD → deploy Railway.

---

## 📋 CHECKLIST RÁPIDO

**Você tem tudo?**
- [ ] 12 arquivos no repositório
- [ ] `CANON_V1.0.json` (8.7KB)
- [ ] `axiom_kernel.py` (6.3KB)
- [ ] `test_axiom_kernel.py` (6.7KB)
- [ ] Documentação completa (5 docs)

**Sistema funciona?**
- [ ] `python demo.py` → 6 demos executam
- [ ] `pytest test_axiom_kernel.py -v` → 8/8 testes passam
- [ ] `python axiom_kernel.py` → servidor roda em :8000

**Se tudo acima ✓ → Sistema validado. Prossiga com deploy.**

---

## 🎯 SEQUÊNCIA RECOMENDADA

**Fase 1: Validação (agora)**
1. Execute `python demo.py`
2. Execute `pytest test_axiom_kernel.py -v`
3. Confirme: sistema funciona localmente

**Fase 2: Deploy (depois)**
4. Leia `CLAUDE_CODE_INSTRUCTIONS.md`
5. Execute AÇÃO 1-4 (validação → estrutura → CI → deploy)
6. Sistema em produção em ~40 minutos

**Fase 3: Extensões (opcional)**
7. Implementar `/axiom/derive` (AÇÃO 5)
8. Rate limiting, logging, métricas (AÇÃO 6)
9. Dashboard React (futuro)

---

## 📚 DOCUMENTOS DISPONÍVEIS (ordem de leitura)

**1. START_HERE.md** ← Você está aqui  
**2. SUMARIO_EXECUTIVO.md** — Visão geral (5 min de leitura)  
**3. CLAUDE_CODE_INSTRUCTIONS.md** — Roteiro executável (siga linha por linha)  
**4. CLAUDE_CODE_QUICKSTART.md** — Comandos rápidos (referência)  
**5. HANDOFF.md** — Contexto técnico completo (leia se tiver dúvidas)  

---

## 🔥 COMANDO DE INÍCIO

Escolha um:

```bash
# Ver o sistema funcionando
python demo.py

# Seguir roteiro completo
less CLAUDE_CODE_INSTRUCTIONS.md

# Começar imediatamente o deploy
pip install -r requirements.txt && pytest test_axiom_kernel.py -v
```

---

## ❓ DÚVIDAS FREQUENTES

**Q: O que é este sistema?**  
A: Kernel de validação ontológica baseado nos 20 Axiomas do Livro dos Montes. Valida que axiomas usados por LLMs são canônicos (anti-alucinação).

**Q: Está pronto para produção?**  
A: Sim. 8/8 testes passando. Canon congelado. API funcional. Falta apenas deploy.

**Q: Quanto tempo leva o deploy?**  
A: ~40 minutos seguindo `CLAUDE_CODE_INSTRUCTIONS.md` (validação + estrutura + CI/CD + Railway).

**Q: Preciso mudar algo no código?**  
A: Apenas 1 linha: ajustar path do Canon após reestruturar diretórios (AÇÃO 2.2).

**Q: E se algo falhar?**  
A: Seção "TROUBLESHOOTING" em `CLAUDE_CODE_INSTRUCTIONS.md` tem soluções.

---

## ✅ PRÓXIMO PASSO

**Execute agora:**
```bash
python demo.py
```

Se executar sem erros → Leia `CLAUDE_CODE_INSTRUCTIONS.md` e comece AÇÃO 1.

---

**Activation Code:** LDM-7M-SA1W-EA25-RGIS  
**Status:** Ready to Deploy 🚀  
**Versão:** 1.0.0
