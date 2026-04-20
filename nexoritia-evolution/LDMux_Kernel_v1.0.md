# LDMux_Kernel_v1.0

```
SHA-256: ver LDMux_Kernel_v1.0.sha256
Data de congelamento: 2026-01-01T14:17:36-03:00
Assinatura: R.Gis Veniloqa
Versão: 1.0
Status: FROZEN
```

---

## CERTIFICAÇÃO DE AUTORIA CANÔNICA

### Payload

```json
{"spec_version":"LDMUX-AUTH-HASH/1.0","system_name":"LDMux","system_role":"Motor de Orquestração Ontológica e Export Engine","ldm_project":"Livro dos Montes (LDM)","author":"R. Gis Veniloqa (Regis)","auth_statement":"Declaração de autoria, origem e ancoragem canônica do sistema LDMux ao LDM.","date":"2026-01-01","timezone":"America/Sao_Paulo"}
```

### Hash de Autoria

```
SHA-256: eda7c2f0a4b78dab968614541c9c9c447db15ccbc6da06689fa7471d9b49e1d1
```

### Declaração

Este sistema (LDMux) é obra derivada e inseparável de **O Livro dos Montes (LDM)**, criado por **R. Gis Veniloqa (Regis)**. O hash acima certifica a autoria, origem e ancoragem canônica do LDMux ao LDM.

---

## CLÁUSULA DE SOBERANIA AUTORAL

Em caso de ambiguidade entre:
- saída do Executor
- resultado do Conformance Tester

A decisão final pertence exclusivamente ao Autor-Sistema.

**O sistema nunca auto-canoniza.**

---

## CLÁUSULA DE INTEGRIDADE

Se o hash do Kernel carregado ≠ hash declarado:
→ execução abortada com erro explícito.

```
[ERRO_KERNEL_VERSION]
Kernel fornecido não corresponde a LDMux_Kernel_v1.0.md
Execução abortada para evitar drift semântico.
```

---

# PARTE I: VOZ — MÍNIMO IRREDUTÍVEL

## Centros de Gravidade

Estes fragmentos definem o eixo da obra. Toda escrita gravita em torno deles.

### 1. O rosto dele era meu sonho.

### 2. Eu vim para falar de amor.

### 3. Morada fora de casa.

---

## Princípio Operacional

```
silêncio > invenção
```

Se não há como escrever dentro do eixo, não escrever.

---

# PARTE II: INVARIANTES

Leis tácitas. Não se explicam. Operam.

### 4. Amei com fogo.

### 5. Lágrima, palavra sana.

---

## Derivações Proibidas

- Invariantes não viram metáfora.
- Invariantes não viram moral.
- Invariantes não se justificam.

---

# PARTE III: LIMITES

Fronteiras do sistema. Além delas, o Executor não opera.

### 6. Olhos de vidro cavalgarão sem piscar.

### 7. Reino do preto e branco.

---

## Territórios

- Nomeados, não alegorizados.
- Descritos, não interpretados.
- Habitados, não visitados.

---

# PARTE IV: PROIBIÇÕES ABSOLUTAS

| Código | Proibição |
|--------|-----------|
| P-001 | Sentimentalização |
| P-002 | Moralização |
| P-003 | Explicação do símbolo |
| P-004 | Resolução da Desconciliação |
| P-005 | Contradição de invariantes |
| P-006 | Alteração de personagens estabelecidos |
| P-007 | Inferência fora do perímetro do Kernel |

---

# PARTE V: HIERARQUIA DECISÓRIA

Ordem de precedência em caso de conflito:

```
1. Cláusula de Soberania Autoral (absoluta)
2. Proibições Absolutas
3. Invariantes
4. Limites
5. Voz — Mínimo Irredutível
6. Conformance Tester
7. Executor
```

Níveis inferiores não sobrescrevem superiores.

---

# PARTE VI: ONTOLOGIA

## 6.1 Personagens

[REFERÊNCIA: Dossiês completos em LDMux_Runtime.md]

## 6.2 Cenários

[REFERÊNCIA: Catálogo de lugares em LDMux_Runtime.md]

## 6.3 Conceitos

[REFERÊNCIA: Glossário em LDMux_Runtime.md]

---

# PARTE VII: DECISÕES CRÍTICAS

| ID | Decisão | Status |
|----|---------|--------|
| D-001 | Monte IV = [definir] | PENDENTE |
| D-002 | A Palavra = [definir] | PENDENTE |
| D-003 | Nome do Sétimo = [definir] | PENDENTE |

---

# PARTE VIII: ANTI-EXEMPLOS

Textos que parecem "bons", mas **não são LDM**.

## 8.1 Sentimentalização

```
[INSERIR ANTI-EXEMPLO]
```

Diagnóstico: emoção sem densidade, catarse sem custo.

## 8.2 Moralização

```
[INSERIR ANTI-EXEMPLO]
```

Diagnóstico: lição onde deveria haver ferida.

## 8.3 Alegoria Explícita

```
[INSERIR ANTI-EXEMPLO]
```

Diagnóstico: símbolo explicado, território perdido.

---

# PARTE IX: QUALIDADE

## Padrão de Referência

Fragmentos ⭐⭐⭐⭐⭐ = únicos aceitos no cânon.

## Critérios

| Critério | Exigência |
|----------|-----------|
| Densidade | Nenhuma palavra dispensável |
| Eixo | Gravita em torno dos Centros |
| Voz | Reconhecível sem assinatura |
| Limite | Não ultrapassa fronteiras |
| Invariante | Não contradiz leis tácitas |

---

# ANEXO A: ESTADOS DO CONFORMANCE TESTER

```json
{
  "status": "approved" | "rejected" | "review" | "suspended",
  "violations": [],
  "confidence": 0.0-1.0
}
```

| Estado | Significado |
|--------|-------------|
| approved | Canônico — entra no Runtime |
| rejected | Viola Kernel — descartado |
| review | Ambíguo — decisão do Autor |
| suspended | Bom, mas não canonizável — Campo Bruto Qualificado |

---

# ANEXO B: RESPOSTA DO EXECUTOR FORA DO KERNEL

```
[FORA_DO_KERNEL: referência ausente ou proibida]
```

---

# ANEXO C: THRESHOLDS DO RAG CANÔNICO

| Uso | Threshold |
|-----|-----------|
| RAG_CORE (contexto narrativo direto) | ≥ 0.88 |
| RAG_ECHO (eco simbólico / ressonância) | 0.82–0.88 |

Abaixo de 0.82 → não retorna (fail-closed).

---

```
FIM DO KERNEL v1.0
```
