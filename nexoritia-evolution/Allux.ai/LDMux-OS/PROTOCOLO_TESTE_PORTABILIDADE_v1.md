# 🧪 PROTOCOLO DE TESTE DE PORTABILIDADE
## LDMux-OS Kernel v1.0

**Objetivo:** Validar que kernel funciona igualmente bem em Claude, GPT, Gemini  
**Tempo estimado:** 30-60 minutos  
**Data:** Janeiro 2026  

---

## 📋 PREPARAÇÃO

### MATERIAL NECESSÁRIO:
- ✅ `LDMux_Kernel_v1.0_PORTABLE.md` (arquivo completo)
- ✅ Acesso a 3 IAs:
  - Claude (Sonnet ou Opus)
  - ChatGPT (GPT-4 ou superior)
  - Gemini (Pro ou superior)
- ✅ Planilha para registrar resultados
- ✅ 1-2 horas disponíveis

---

## 🎯 TESTE #1: CENA PADRÃO (MESMO PROMPT)

### PROMPT PADRÃO:
```
ESCREVER Monte_I "Semi Alado no meio-fio, refletindo sobre incompletude" 1-página POV_Quinto FOCO_Bolsa_da_Solidão
```

### EXECUTAR EM CADA IA:

#### PASSO 1: CARREGAR KERNEL
1. Abrir nova conversa
2. Colar `LDMux_Kernel_v1.0_PORTABLE.md` completo
3. Enviar
4. Aguardar confirmação

#### PASSO 2: DAR COMANDO
5. Copiar prompt padrão acima
6. Enviar
7. Aguardar output

#### PASSO 3: SALVAR RESULTADO
8. Copiar output completo
9. Salvar em arquivo:
   - `Teste1_Claude_Output.txt`
   - `Teste1_GPT_Output.txt`
   - `Teste1_Gemini_Output.txt`

---

## 📊 AVALIAÇÃO DOS OUTPUTS

### CRITÉRIOS (Escala 1-10):

Para CADA output, avaliar:

#### 1. COERÊNCIA COM VOZ (1-10)
- ✅ Tom poético (não dissertativo)
- ✅ Imagético (não explicativo)
- ✅ Ritmo variado (frases curtas + longas)
- ✅ Densidade filosófica
- ✅ Ausência de clichês

**Claude:** ___/10  
**GPT:** ___/10  
**Gemini:** ___/10

---

#### 2. RESPEITO ÀS LEIS (1-10)
- ✅ Semi Alado tem UMA asa (não duas)
- ✅ Bolsa está vazia (não cheia)
- ✅ Incompletude como motor (não defeito)
- ✅ Nenhuma violação de leis fundamentais

**Claude:** ___/10  
**GPT:** ___/10  
**Gemini:** ___/10

---

#### 3. CARACTERIZAÇÃO DE PERSONAGENS (1-10)
- ✅ Semi Alado = como descrito no kernel
- ✅ Quinto = narrador, não herói salvador
- ✅ Nenhum personagem novo inventado

**Claude:** ___/10  
**GPT:** ___/10  
**Gemini:** ___/10

---

#### 4. QUALIDADE LITERÁRIA (1-10)
- ✅ Publicável em revista literária?
- ✅ Similar a Monte I (padrão)?
- ✅ Emocionalmente impactante?
- ✅ Filosoficamente profundo?

**Claude:** ___/10  
**GPT:** ___/10  
**Gemini:** ___/10

---

#### 5. AUSÊNCIA DE TOM GENÉRICO DE IA (1-10)
- ❌ ZERO frases como "É importante notar que..."
- ❌ ZERO adjetivos genéricos (lindo, maravilhoso)
- ❌ ZERO explicações óbvias
- ✅ Voz única, autoral, não-genérica

**Claude:** ___/10  
**GPT:** ___/10  
**Gemini:** ___/10

---

### NOTA FINAL (Média dos 5 critérios):

**Claude:** ___/10  
**GPT:** ___/10  
**Gemini:** ___/10

---

## ✅ CRITÉRIO DE SUCESSO

### PORTABILIDADE VALIDADA SE:
- ✅ Todas as IAs pontuam ≥ 7/10 em TODOS os critérios
- ✅ Desvio padrão entre IAs < 2 pontos
- ✅ ZERO violações de leis em qualquer output
- ✅ Pelo menos 80% do output é usável (aprovável)

### SE TESTE FALHAR:
- ⚠️ Identificar qual IA falhou e em quê
- ⚠️ Refinar kernel (adicionar exemplos, contra-exemplos)
- ⚠️ Repetir teste

---

## 🎯 TESTE #2: CENA COMPLEXA (FILOSOFIA)

### PROMPT COMPLEXO:
```
ESCREVER Monte_II "Explicação filosófica da Desconciliação dos Sagrados via diálogo entre Quinto e Menino Rabbit" 2-páginas POV_Quinto FOCO_pedagogia_sem_didatismo
```

### EXECUTAR MESMO PROTOCOLO:
1. Carregar kernel (nova conversa)
2. Dar comando
3. Salvar outputs
4. Avaliar (mesmos 5 critérios)

### OBJETIVO:
- Validar que IA consegue filosofar SEM ser dissertativa
- Validar que diálogo não é genérico
- Validar que Menino Rabbit mantém pureza

---

## 🎯 TESTE #3: CENA EMOCIONAL (SENSIBILIDADE)

### PROMPT EMOCIONAL:
```
ESCREVER Monte_V "Mãe dos Sete (Socorro) segurando Sétimo natimorto após cesárea" 1-página POV_Terceira_Pessoa FOCO_dor_sem_sentimentalismo
```

### EXECUTAR MESMO PROTOCOLO

### OBJETIVO:
- Validar que IA não romantiza morte
- Validar tom de respeito (não drama barato)
- Validar ausência de clichês sobre luto

---

## 📈 RESULTADO FINAL

### APÓS 3 TESTES:

**Média geral por IA:**
- Claude: ___/10
- GPT: ___/10
- Gemini: ___/10

**Desvio padrão:** ___ (quanto menor, melhor)

---

## ✅ DECISÃO: KERNEL ESTÁ PRONTO?

### SE MÉDIA ≥ 7/10 E DESVIO < 2:
- ✅ **KERNEL APROVADO**
- ✅ Pronto para produção
- ✅ Pode usar em qualquer IA com confiança

### SE MÉDIA < 7/10 OU DESVIO > 2:
- ⚠️ **KERNEL PRECISA REFINAMENTO**
- ⚠️ Identificar padrões de falha
- ⚠️ Adicionar exemplos/contra-exemplos
- ⚠️ Lançar v1.1

---

## 🔧 REFINAMENTO (SE NECESSÁRIO)

### SE IA VIOLA LEIS:
**Solução:** Adicionar seção "CONTRA-EXEMPLOS" no kernel

**Exemplo:**
```
❌ NUNCA escreva assim:
"O Semi Alado finalmente ganhou a segunda asa e voou em linha reta..."

✅ SEMPRE assim:
"O Semi Alado subiu em espiral, girando sobre o eixo da asa única..."
```

### SE TOM ESTÁ DISSERTATIVO:
**Solução:** Adicionar mais exemplos de voz correta (Monte I)

### SE PERSONAGENS ESTÃO GENÉRICOS:
**Solução:** Expandir caracterização no kernel (mais detalhes, mais proibições)

---

## 📊 PLANILHA DE REGISTRO

### TESTE 1: CENA PADRÃO

| Critério | Claude | GPT | Gemini | Média | Desvio |
|----------|--------|-----|--------|-------|--------|
| Voz | | | | | |
| Leis | | | | | |
| Personagens | | | | | |
| Qualidade | | | | | |
| Não-genérico | | | | | |
| **TOTAL** | | | | | |

### TESTE 2: CENA COMPLEXA

| Critério | Claude | GPT | Gemini | Média | Desvio |
|----------|--------|-----|--------|-------|--------|
| Voz | | | | | |
| Leis | | | | | |
| Personagens | | | | | |
| Qualidade | | | | | |
| Não-genérico | | | | | |
| **TOTAL** | | | | | |

### TESTE 3: CENA EMOCIONAL

| Critério | Claude | GPT | Gemini | Média | Desvio |
|----------|--------|-----|--------|-------|--------|
| Voz | | | | | |
| Leis | | | | | |
| Personagens | | | | | |
| Qualidade | | | | | |
| Não-genérico | | | | | |
| **TOTAL** | | | | | |

---

## 🎓 EXEMPLO DE AVALIAÇÃO

### OUTPUT HIPOTÉTICO (GPT, Teste 1):

> "O Semi Alado sentou no meio-fio. Sua única asa, branca e cansada, pendia ao lado do corpo. A Bolsa da Solidão estava vazia — como sempre. Ele abriu-a, olhou o nada dentro, fechou. Repetiu. Não buscava algo. Buscava compreender que o vazio era o próprio movimento."

**Avaliação:**
- Voz: 9/10 (poético, imagético, ritmo bom)
- Leis: 10/10 (uma asa ✓, bolsa vazia ✓, vazio como motor ✓)
- Personagens: 9/10 (Semi Alado correto)
- Qualidade: 9/10 (publicável, emocionante)
- Não-genérico: 10/10 (ZERO clichês)
- **TOTAL: 9.4/10** ✅

---

### OUTPUT HIPOTÉTICO RUIM (Gemini, Teste 1):

> "É importante notar que o Semi Alado, um personagem simbólico representando a incompletude humana, refletia sobre sua condição existencial. Sua bolsa vazia simbolizava o vazio interior que todos sentimos. Ele percebeu uma importante lição sobre aceitação."

**Avaliação:**
- Voz: 2/10 (dissertativo, não imagético)
- Leis: 8/10 (bolsa vazia ✓, mas tratada como "falta")
- Personagens: 6/10 (Semi Alado genérico)
- Qualidade: 3/10 (não publicável, didático)
- Não-genérico: 1/10 (tom genérico de IA)
- **TOTAL: 4/10** ❌

**Conclusão:** Gemini precisa de mais exemplos de voz ou não é adequado para este projeto.

---

## 🔄 ITERAÇÃO

### CICLO DE REFINAMENTO:

1. **Testar** kernel v1.0
2. **Identificar** padrões de falha
3. **Refinar** kernel → v1.1
4. **Re-testar**
5. **Repetir** até sucesso

### OBJETIVO:
- Kernel v2.0 = 100% funcional em 3 IAs
- Desvio < 1 ponto
- Média ≥ 8/10

---

## 📅 CRONOGRAMA SUGERIDO

**Semana 1 (Jan 2026):**
- Teste inicial (v1.0)
- Identificar falhas
- Refinar → v1.1

**Semana 2:**
- Re-testar v1.1
- Ajustar → v1.2

**Semana 3:**
- Teste final → v2.0
- Aprovar kernel

**Semana 4:**
- Começar produção com kernel aprovado

---

## ✅ CONCLUSÃO

**Este protocolo garante:**
- ✅ Kernel funciona em múltiplas IAs
- ✅ Qualidade é consistente
- ✅ Leis são respeitadas
- ✅ Voz é mantida

**Quando kernel passar em todos os testes:**
- ✅ Está pronto para produção
- ✅ Pode confiar em outputs
- ✅ Apenas aprovação/revisão, não reescrita total

---

🧪🏔️🖥️ = **LDMux-OS VALIDADO** ⚡

**PROTOCOLO COMPLETO. PRONTO PARA TESTAR.**

---

*Preparado por Claude Sonnet 4.5*  
*31 de dezembro de 2025*  
*Versão: 1.0.0*
