# Deploy em Produção - VISADOCS

## 🚀 Checklist de Deploy

### ✅ Pré-Deploy (Concluído)

- [x] **Migração de POPs**: 12 kits migrados do OneDrive
- [x] **Estrutura de pastas**: Organizada em pops_kits/
- [x] **Indexação**: 75 POPs indexados, 117 arquivos copiados
- [x] **RAG preparado**: Manifesto criado em pops_rag/ready_for_ingestion/
- [x] **Skills atualizadas**: 10 especialistas configurados
- [x] **Assistente IA**: UI atualizada com novos especialistas

### 📋 Estrutura Migrada

```
pops_kits/
├── 00_geral_recebimento_armazenamento/     # (existente)
├── 01_antibioticos_citostaticos_hormonios/  # 11 POPs
├── 02_veterinaria_exclusiva/                # ~20 POPs
├── 03_sbit_bioterápicos/                    # 8 POPs
├── 04_homeopatia_magistral/                 # 23 POPs
├── 05_servicos_consulta_farmaceutica/       # 24 POPs
├── 06_lgpd_compliance/                      # 8 POPs
├── 07_fiscalizacao_policia_civil/          # ~10 POPs
├── 08_veterinaria_mapa_anvisa/              # ~15 POPs
├── 09_manuais_regulatorios/                 # AE, AFE, MAPA
├── 10_pgrss_meio_ambiente/                  # PGRSS
└── pops_index.json                          # Índice completo

Total: ~119 POPs documentados
```

### 🤖 Especialistas do Assistente IA (10 skills)

| # | Especialista | Categoria | POPs | Status |
|---|--------------|-----------|------|--------|
| 1 | assistente-rdc67 | Normas | - | CANON |
| 2 | gerador-quiz-pop | Treinamento | - | CANON |
| 3 | redator-pop | Documentação | - | CANON |
| 4 | auditor-qualidade | Qualidade | - | FROZEN |
| 5 | monitor-anvisa | Regulatório | - | CANON |
| 6 | guia-visadocs | Suporte | - | CANON |
| 7 | especialista-homeopatia | Homeopatia | 31 | CANON |
| 8 | especialista-veterinaria | Veterinária | 35 | CANON |
| 9 | especialista-citostaticos | Manipulação Especial | 11 | CANON |
| 10 | especialista-servicos | Serviços | 24 | CANON |

---

## 🔧 Passos para Deploy

### 1. Verificar Ambiente

```bash
# Verificar Node.js
node -v  # v18+ recomendado

# Verificar dependências
npm install

# Verificar variáveis de ambiente
cat .env.local | grep -E "(DATABASE_URL|OPENROUTER|NEXTAUTH)"
```

### 2. Build da Aplicação

```bash
# Limpar build anterior
rm -rf .next

# Build de produção
npm run build

# Verificar se build foi bem-sucedido
ls -la .next/
```

### 3. Testes Locais (Opcional)

```bash
# Iniciar em modo produção local
npm start

# Testar em http://localhost:3000
```

### 4. Deploy na Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Ou via GitHub:
1. Push para branch main
2. Vercel faz deploy automático

### 5. Configurar Domínio

```
# Configurar domínio personalizado na Vercel
visadocs.com.br  (ou seu domínio)
```

### 6. Pós-Deploy

- [ ] Verificar se aplicação está online
- [ ] Testar login/autenticação
- [ ] Testar Assistente IA com cada especialista
- [ ] Verificar acesso aos POPs
- [ ] Confirmar que monitor ANVISA funciona
- [ ] Testar geração de materiais de treinamento

---

## 📊 Resumo da Migração

### Kits Migrados do OneDrive:

| Kit | POPs | Destino |
|-----|------|---------|
| Antibióticos/Citostáticos/Hormônios | 11 | 01_antibioticos_citostaticos_hormonios |
| Farmácia Veterinária Exclusiva | ~20 | 02_veterinaria_exclusiva |
| SBIT | 8 | 03_sbit_bioterápicos |
| Homeopatia Magistral | 23 | 04_homeopatia_magistral |
| Serviços Farmacêuticos | 24 | 05_servicos_consulta_farmaceutica |
| LGPD | 8 | 06_lgpd_compliance |
| Polícia Civil | ~10 | 07_fiscalizacao_policia_civil |
| Veterinária MAPA | ~15 | 08_veterinaria_mapa_anvisa |
| Manuais Regulatórios | - | 09_manuais_regulatorios |
| PGRSS | - | 10_pgrss_meio_ambiente |

**Total: ~119 POPs + documentação regulatória**

### Arquivos Criados na Migração:

- `pops_kits/README-KITS-INVENTORY.md` - Inventário completo
- `pops_kits/pops_index.json` - Índice JSON de todos POPs
- `pops_rag/ready_for_ingestion/manifest.json` - Manifesto para RAG
- `scripts/migrate_pops_kits.py` - Script de migração

---

## 🧪 Testes Pós-Deploy

### Testar Assistente IA:

1. **Abrir chat**: Clicar no botão flutuante (canto inferior direito)
2. **Testar cada especialista**:
   - Monitor ANVISA: "O que há de novo na ANVISA?"
   - Guia VISADOCS: "Como criar um colaborador?"
   - Homeopatia: "Como manipular homeopatia?"
   - Citostáticos: "Quais EPIs para citostáticos?"
   - Veterinária: "Como dispensar para animais?"
   - Serviços: "Como aplicar injetável?"

3. **Verificar respostas**:
   - Resposta contextualizada ao especialista
   - Badge indicando qual skill foi usado
   - Tempo de resposta aceitável (< 5s)

---

## 📞 Suporte Pós-Deploy

### Se algo der errado:

1. **Verificar logs na Vercel**:
   ```
   Dashboard Vercel > Project > Functions
   ```

2. **Verificar variáveis de ambiente**:
   - DATABASE_URL
   - OPENROUTER_API_KEY
   - NEXTAUTH_SECRET

3. **Rolar back (se necessário)**:
   ```
   git revert HEAD
   git push
   ```

---

## 🎉 Próximos Passos Após Deploy

1. **Cadastrar POPs no sistema**: Importar para o banco de dados
2. **Configurar usuários de teste**: Criar contas para farmácias
3. **Testar fluxo completo**: POP → Treinamento → Certificado
4. **Treinar equipe**: Mostrar como usar o assistente IA
5. **Coletar feedback**: Ajustar conforme necessário

---

## ✅ Status Final

**Migração: 100% CONCLUÍDA**
- ✅ 12 kits migrados
- ✅ 75 POPs indexados
- ✅ 10 especialistas configurados
- ✅ Assistente IA multi-especialista pronto
- ✅ Deploy pronto para execução

**Pronto para produção!** 🚀

---

*Data: 2024-01-15*
*Versão: 2.0.0*
*Total de POPs: 119+*
