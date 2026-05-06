# Checklist de Auditoria — Blueprint VISADOCS vs Código Atual

## Objetivo
Comparar o blueprint do agente Abacus com o código atual, evitar duplicações, e implementar o que falta.

## Áreas de Auditoria

### 1. Estrutura de Arquivos
- [ ] Mapear todos os arquivos do blueprint
- [ ] Mapear todos os arquivos do código atual
- [ ] Identificar divergências (arquivos no blueprint que faltam no código)
- [ ] Identificar arquivos duplicados ou redundantes

### 2. Models/Schema Prisma
- [ ] Comparar schema.prisma do blueprint vs atual
- [ ] Verificar models adicionais no blueprint
- [ ] Identificar campos faltantes ou extras
- [ ] Verificar enums e relações

### 3. API Routes
- [ ] Listar todas as rotas do blueprint
- [ ] Listar todas as rotas do código atual
- [ ] Identificar endpoints faltantes
- [ ] Verificar consistência de respostas

### 4. Frontend/Pages
- [ ] Mapear páginas do blueprint
- [ ] Mapear páginas do código atual
- [ ] Identificar UI components faltantes
- [ ] Verificar rotas e navegação

### 5. Integrações
- [ ] Verificar integrações externas (OpenRouter, etc.)
- [ ] Verificar serviços e utilities
- [ ] Identificar configurações de deploy

### 6. Testes e Qualidade
- [ ] Verificar testes no blueprint
- [ ] Comparar com testes atuais
- [ ] Identificar cobertura faltante

## Resultado Esperado
- Lista de implementações pendentes
- Lista de refatorações necessárias
- Lista de duplicações a remover
- Plano de execução priorizado
