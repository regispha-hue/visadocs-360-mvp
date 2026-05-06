# Análise: Biblioteca RAG/Canon vs Estrutura de POPs

## Status Atual: NÃO IMPLEMENTADO

---

## 1. Google Drive Referenciado

**Link:** https://drive.google.com/drive/folders/1l9-azGOsrbmNdly_MrVLZ0Mqh3_Me2GL?usp=sharing

**Conteúdo:** Pastas de POPs organizadas por categoria (acesso restrito)

---

## 2. Implementação Atual Visadocs 360 MVP

### 2.1 Estrutura de Documentos
```
app/(dashboard)/dashboard/documentos/page.tsx
- Interface para visualização de documentos
- Organização por tipo: RQ, MBP, ANEXO
- Relacionamento com POPs (1:1)

app/api/documentos/route.ts
- API para buscar documentos
- Include POP relacionado
- Filtragem por tenant
```

### 2.2 Base de Conhecimento
```
kb_docs/
- 05_POPs_Farmacia_Manipulacao.md (guia geral)
- 01_RDC_67_2007_Boas_Praticas_Manipulacao.md
- Documentos normativos
- Sem estrutura RAG/Canon específica
```

---

## 3. Nexoritia OS - Capacidades RAG/Canon

### 3.1 Canon Registry
- 21 axiomas do Livro dos Montes
- Validação de conteúdo semântico
- Busca full-text (FTS5)
- Categorização por domínio

### 3.2 OS-RADAR
- Validação Fail-Closed
- Contratos semânticos por domínio
- Detecção automática de categoria
- Verificação de conformidade RDC 67/2007

---

## 4. GAPS IDENTIFICADOS

### 4.1 Estrutura RAG não Implementada
- [ ] Nenhuma biblioteca RAG específica para POPs
- [ ] Sem integração com Canon Registry
- [ ] Sem validação semântica de POPs
- [ ] Sem organização por kits de POPs

### 4.2 Organização de POPs
- [ ] Sem estrutura de pastas por categoria
- [ ] Sem sistema de "kits" de POPs
- [ ] Sem indexação semântica
- [ ] Sem busca contextual

### 4.3 Validação Automática
- [ ] Sem verificação de conformidade automática
- [ ] Sem detecção de violações
- [ ] Sem sugestões de melhorias
- [ ] Sem integração com Nexoritia OS

---

## 5. Recomendações de Implementação

### 5.1 Estrutura RAG para POPs
```
pops_rag/
- canon_pop_registry.py          # Registry específico para POPs
- pop_semantic_index.py          # Indexação semântica
- pop_validation_engine.py       # Validação específica
- pop_knowledge_base.py          # Base de conhecimento
```

### 5.2 Integração com Nexoritia OS
- Mapear POPs para axiomas do Canon
- Criar contratos semânticos para cada categoria
- Implementar validação RDC 67/2007
- Gerar provas de conformidade

### 5.3 Organização por Kits
```
pops_kits/
- kit_recebimento_armazenamento/
- kit_pesagem_balancas/
- kit_manipulacao_capsulas/
- kit_manipulacao_cremes/
- kit_controle_qualidade/
- kit_limpeza_sanitizacao/
- kit_dispensacao/
- kit_seguranca/
```

---

## 6. Plano de Ação

### Fase 1: Estrutura Base
1. Criar `pops_rag/` com Canon Registry específico
2. Mapear POPs existentes para estrutura semântica
3. Implementar indexação full-text

### Fase 2: Validação
1. Integrar com OS-RADAR
2. Criar contratos para cada categoria
3. Implementar validação RDC 67/2007

### Fase 3: Interface
1. Criar interface para gestão de POPs
2. Implementar busca contextual
3. Adicionar validação em tempo real

---

## 7. Benefícios Esperados

- **Conformidade 100%** com RDC 67/2007
- **Busca semântica** de POPs
- **Validação automática** de conteúdo
- **Geração de provas** de conformidade
- **Organização inteligente** por kits
- **Integração completa** com Nexoritia OS

---

## 8. Status: PENDENTE IMPLEMENTAÇÃO

**Necessário:** Criar biblioteca RAG/Canon específica para POPs conforme estrutura do Google Drive referenciado.
