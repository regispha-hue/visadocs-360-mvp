# Manual do Usuário - VISADOCS

## O que é o VISADOCS?
O VISADOCS é uma plataforma SaaS (Software as a Service) de gestão documental desenvolvida especificamente para farmácias de manipulação. O sistema centraliza a gestão de Procedimentos Operacionais Padrão (POPs), treinamentos de colaboradores, matérias-primas, lotes, fornecedores e documentos regulatórios, garantindo conformidade com a RDC 67/2007 da ANVISA e demais normas vigentes.

## Acesso ao Sistema

### Login
1. Acesse o endereço do VISADOCS no navegador
2. Insira seu e-mail e senha cadastrados
3. Clique em "Entrar"
4. Você será direcionado ao Dashboard

### Perfis de Usuário
| Perfil | Acesso |
|--------|--------|
| **ADMIN_FARMACIA** | Acesso total ao painel da farmácia |
| **RT (Responsável Técnico)** | Acesso total ao painel, aprovação de POPs |
| **ANALISTA_CQ** | Controle de qualidade, relatórios, análises |
| **OPERADOR** | Acesso básico, visualização e execução |
| **SUPER_ADMIN** | Gerenciamento de todas as farmácias (painel administrativo) |

## Módulos do Sistema

### 1. Dashboard
**Caminho:** Menu lateral > Dashboard

Visão geral da farmácia com indicadores-chave:
- Total de POPs cadastrados e status (ativos, em revisão, rascunho)
- Total de treinamentos e taxa de conclusão
- Total de matérias-primas cadastradas
- Lotes próximos ao vencimento
- Alertas importantes

### 2. POPs (Procedimentos Operacionais Padrão)
**Caminho:** Menu lateral > POPs

#### Listagem de POPs
- Visualize todos os POPs cadastrados
- Filtre por setor (Controle de Qualidade, Manipulação, Limpeza, etc.)
- Filtre por status (Rascunho, Em Revisão, Aprovado, Obsoleto)
- Pesquise por código ou título

#### Criar Novo POP
1. Clique no botão "Novo POP"
2. Preencha os campos obrigatórios:
   - **Código:** Código único (ex: POP.001)
   - **Título:** Nome descritivo do procedimento
   - **Setor:** Setor responsável
   - **Versão:** Número da versão atual
   - **Objetivos:** Propósito do procedimento
   - **Descrição:** Passo a passo detalhado
3. Preencha os campos opcionais (recomendado):
   - **Equipe Técnica Envolvida:** Profissionais que executam o procedimento
   - **Glossário:** Termos técnicos utilizados
   - **Literatura Consultada:** Referências normativas e bibliográficas
   - **Validação:** Aprovado por, Implantado por, Data de Implantação, Validade em anos
4. Clique em "Salvar"

#### Editar POP
1. Na listagem, clique no POP desejado
2. Na página de detalhes, clique em "Editar"
3. Faça as alterações necessárias
4. Salve as modificações

#### Download DOCX
- Na listagem ou na página de detalhes, clique no botão de download
- O sistema gera automaticamente um documento Word seguindo o modelo padrão:
  - Cabeçalho com título e código
  - Seções: Objetivos, Setor/Equipe, Glossário, Descrição, Literatura, Controle de Alterações
  - Rodapé com validação

#### Status dos POPs
- **RASCUNHO:** POP em elaboração, ainda não validado
- **EM_REVISAO:** POP submetido para revisão/aprovação
- **APROVADO:** POP aprovado e vigente para uso
- **OBSOLETO:** POP descontinuado, substituído por nova versão

### 3. Biblioteca de POPs
**Caminho:** Menu lateral > Biblioteca POPs

Acervo centralizado de todos os POPs aprovados/ativos:
- Organizado por setor para fácil localização
- Busca por título ou código
- Filtro por setor
- Botões de download DOCX e impressão em cada POP
- Link direto para a página de detalhes

**Dica:** Use esta seção para disponibilizar POPs para consulta rápida durante inspeções da Vigilância Sanitária.

### 4. Treinamentos
**Caminho:** Menu lateral > Treinamentos

#### Registrar Treinamento
1. Clique em "Novo Treinamento"
2. Selecione o POP relacionado
3. Selecione o(s) colaborador(es)
4. Defina a data do treinamento
5. Defina o status:
   - **AGENDADO:** Treinamento planejado
   - **EM_ANDAMENTO:** Treinamento em curso
   - **CONCLUIDO:** Treinamento finalizado com sucesso
   - **CANCELADO:** Treinamento cancelado
6. Adicione observações se necessário
7. Salve o registro

#### Acompanhamento
- Visualize todos os treinamentos e seus status
- Filtre por status ou colaborador
- Identifique treinamentos pendentes
- Verifique a cobertura de treinamentos por POP

### 5. Colaboradores
**Caminho:** Menu lateral > Colaboradores

#### Cadastro
1. Clique em "Novo Colaborador"
2. Preencha: nome, função, setor, registro profissional
3. Defina se o colaborador está ativo
4. Salve o cadastro

#### Página de Detalhes
- Informações pessoais e profissionais
- Histórico de treinamentos
- **Pasta Pessoal:** Seção que mostra todos os POPs em que o colaborador foi treinado (treinamentos concluídos), com opção de download do DOCX de cada POP

**Dica:** A Pasta Pessoal é ideal para inspeções, pois comprova que o colaborador foi devidamente treinado nos POPs relevantes.

### 6. Matérias-Primas
**Caminho:** Menu lateral > Matérias-Primas

#### Cadastro de Matéria-Prima
1. Clique em "Nova Matéria-Prima"
2. Preencha os dados:
   - **Nome** e **Código**: Identificação única
   - **CAS:** Número de registro CAS (Chemical Abstracts Service)
   - **DCI:** Denominação Comum Internacional
   - **Categoria:** Ativo, Excipiente, Embalagem, Matéria-Prima Vegetal, etc.
   - **Unidade:** Unidade de medida (kg, g, mg, L, mL)
   - **Estoque mínimo:** Quantidade mínima em estoque
   - **Especificações físico-químicas:** Aspecto, pH, densidade, teor, etc.
3. Salve o cadastro

#### Vincular POPs
- Na página de detalhes da matéria-prima, vincule POPs relacionados
- Exemplo: vincular o POP de análise de matéria-prima ao insumo específico

#### Status
- **APROVADA:** Matéria-prima aprovada para uso
- **QUARENTENA:** Aguardando análise de controle de qualidade
- **REPROVADA:** Não atende às especificações
- **INATIVA:** Descontinuada

### 7. Fichas de Matérias-Primas
**Caminho:** Menu lateral > Fichas de MP

Biblioteca de fichas de especificação:
- Organizada por categoria
- Busca por nome, código ou CAS
- Download de ficha em formato DOCX
- Link para detalhes da matéria-prima

### 8. Controle de Lotes
**Caminho:** Menu lateral > Controle de Lotes

#### Registrar Lote
1. Clique em "Novo Lote"
2. Selecione a matéria-prima
3. Preencha:
   - Número do lote (fornecedor) e lote interno
   - Datas: fabricação, validade, recebimento
   - Quantidade e preço
   - Fornecedor
   - Nota fiscal
   - Resultados de análise: aspecto, pH, densidade, teor, umidade
   - Conformidade
4. Salve o registro

#### Alertas de Vencimento
- O sistema alerta automaticamente sobre lotes próximos ao vencimento (7, 15, 30 dias)
- Lotes vencidos são destacados em vermelho
- Filtro rápido por status de vencimento

#### Status dos Lotes
- **QUARENTENA:** Lote recebido, aguardando análise
- **APROVADO:** Lote aprovado para uso
- **REPROVADO:** Lote não conforme
- **EM_ANALISE:** Análise em andamento
- **VENCIDO:** Prazo de validade expirado

### 9. Fornecedores
**Caminho:** Menu lateral > Fornecedores

#### Cadastro
1. Clique em "Novo Fornecedor"
2. Preencha: nome/razão social, CNPJ, e-mail, telefone, endereço, contato, observações
3. Defina se está ativo
4. Salve

#### Qualificação de Fornecedores
A RDC 67/2007 exige qualificação de fornecedores. Use o VISADOCS para:
- Manter cadastro atualizado
- Registrar histórico de lotes recebidos
- Monitorar qualidade dos insumos fornecidos
- Vincular lotes aos respectivos fornecedores

### 10. Relatórios
**Caminho:** Menu lateral > Relatórios
(Disponível para: Admin Farmácia, RT, Analista CQ)

Métricas consolidadas:
- Totais de matérias-primas, lotes e fornecedores
- Alertas de lotes vencendo nos próximos 30 dias
- Gráficos de treinamentos por status
- Indicadores de POPs por setor

### 11. VISA Assistente
**Caminho:** Menu lateral > VISA Assistente

Assistente inteligente com IA para:
- **Legislação:** Tire dúvidas sobre RDCs, ANVISA, Vigilância Sanitária e normas
- **Uso do VISADOCS:** Aprenda a usar cada módulo do sistema
- **Sugestões e Suporte:** Envie melhorias, reporte problemas, solicite ajuda

### 12. Perfil do Usuário
**Caminho:** Clique no seu nome no menu lateral > Perfil

- Visualize seus dados
- Altere sua senha
- Veja informações da sua farmácia

## Dicas de Otimização

### Para Inspeções da Vigilância Sanitária
1. Mantenha todos os POPs aprovados e atualizados na Biblioteca
2. Garanta que todos os colaboradores tenham treinamentos concluídos registrados
3. Verifique a Pasta Pessoal de cada colaborador
4. Mantenha lotes com análises documentadas
5. Baixe os DOCX dos POPs e fichas de MP para apresentação

### Para Gestão do Dia a Dia
1. Use o Dashboard como ponto de partida diário
2. Monitore alertas de vencimento de lotes regularmente
3. Registre treinamentos imediatamente após a realização
4. Atualize o status das matérias-primas conforme análises
5. Revise POPs próximos ao vencimento (validade de 2 anos)

### Para Conformidade com a RDC 67/2007
1. Mantenha POPs para TODAS as atividades listadas no Anexo I
2. Registre treinamentos de todos os funcionários, incluindo limpeza
3. Documente todas as análises de matérias-primas e lotes
4. Qualifique fornecedores e mantenha registros atualizados
5. Realize auto-inspeção anual e documente os resultados

## Suporte
- Utilize o **VISA Assistente** para dúvidas rápidas
- Para sugestões de melhoria, converse com o VISA Assistente
- Para problemas técnicos, entre em contato com o administrador do sistema
