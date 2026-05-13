# Política de Independência de Fornecedores — VISADOCS 360 MVP

Versão: 1.0
Data: 2026-05-13
Status: Aprovado para uso interno e decisões arquiteturais
Próxima revisão: antes da adoção de novo fornecedor crítico, novo subprocessador de dados ou alteração relevante de arquitetura

---

## 1. Propósito

Este documento define a política interna de independência de fornecedores do VISADOCS 360 MVP.

O objetivo é preservar a portabilidade arquitetural do produto, reduzir risco de vendor lock-in e impedir que qualquer fornecedor externo se torne indispensável para o funcionamento essencial do SaaS.

Esta política orienta decisões sobre deploy, banco de dados, armazenamento, geração de PDF, inteligência artificial, autenticação, logs, backup, documentos e integrações futuras.

---

## 2. Princípio fundamental

O VISADOCS deve ser portável por desenho.

Nenhum fornecedor, plataforma, API, runtime proprietário ou serviço de terceiro deve ser tratado como fundamento permanente do produto.

Fornecedores podem ser utilizados quando forem úteis, estáveis e economicamente adequados, desde que permaneçam substituíveis, documentados e desacoplados do núcleo do sistema.

---

## 3. Núcleo portável do VISADOCS

O núcleo técnico considerado portável é composto por:

| Camada | Diretriz |
|---|---|
| Código-fonte | Repositório Git exportável |
| Aplicação | Next.js com possibilidade de execução fora da Vercel |
| Banco de dados | PostgreSQL padrão, com schema exportável |
| ORM | Prisma, sem dependência de provider proprietário |
| Documentos | Arquivos e registros exportáveis em formatos abertos |
| Deploy | Deve admitir alternativa via Docker ou runtime equivalente |
| Configuração | Variáveis de ambiente documentadas e migráveis |
| IA futura | Integração por adapter pattern, nunca acoplamento direto |
| PDF | Geração controlada pelo servidor ou por componente auditável |

---

## 4. Fornecedores aceitáveis como táticos

| Fornecedor ou camada | Uso aceitável | Condição obrigatória |
|---|---|---|
| Vercel | Deploy tático do MVP | Não usar recursos proprietários críticos sem plano de saída |
| Neon ou PostgreSQL gerenciado | Banco PostgreSQL | Manter compatibilidade com PostgreSQL padrão |
| GitHub | Repositório principal | Código deve continuar exportável por Git |
| Storage S3-compatible | Armazenamento futuro | Preferir interface compatível com S3 ou MinIO |
| Provedores de LLM | IA futura | Usar adapters e permitir troca de fornecedor |
| Serviços de e-mail | Notificações futuras | Manter templates e lógica no VISADOCS |
| Serviços de autenticação | Apenas se necessário | Exigir plano de exportação de usuários e metadados |

---

## 5. Fornecedores proibidos como dependência crítica

| Fornecedor, serviço ou padrão | Restrição | Motivo |
|---|---|---|
| Abacus.AI em runtime produtivo | Proibido como dependência core | Projeto deve sair de qualquer dependência operacional do Abacus |
| API externa de HTML2PDF sem contrato adequado | Proibido para dados sensíveis ou documentos de cliente | Pode expor conteúdo regulado a subprocessador não controlado |
| Storage proprietário sem exportação completa | Proibido | Risco de bloqueio, perda de dados e migração onerosa |
| Banco não PostgreSQL sem justificativa formal | Proibido no MVP | Reduz portabilidade e aumenta custo de migração |
| IA acoplada diretamente ao produto | Proibido | Dificulta substituição, auditoria e governança |
| Recursos proprietários da Vercel sem alternativa | Restrito | Podem transformar deploy tático em dependência estrutural |
| Motor proprietário de governança de IA como fundamento regulatório | Proibido | Conformidade não pode depender de caixa-preta algorítmica |

---

## 6. Classificação de fornecedores

Todo fornecedor deve ser classificado antes da adoção.

| Classe | Definição | Exigência |
|---|---|---|
| Essencial | Sem ele o sistema não opera | Exige plano de saída documentado |
| Importante | Afeta funcionalidade relevante, mas não todo o sistema | Exige alternativa técnica identificada |
| Conveniente | Facilita operação, mas pode ser removido | Exige baixo acoplamento |
| Experimental | Usado apenas em teste ou protótipo | Não pode tocar dados reais de cliente sem aprovação |

---

## 7. Critérios mínimos para novo subprocessador

Antes de adotar fornecedor que processe dados de clientes, documentos internos, registros de treinamento ou conteúdo potencialmente sensível, devem ser avaliados:

| Critério | Exigência |
|---|---|
| Contrato de tratamento de dados | DPA ou instrumento contratual equivalente, quando aplicável |
| Finalidade do processamento | Deve ser específica, documentada e limitada |
| Localização de dados | Deve ser conhecida ou contratualmente delimitada |
| Retenção de dados | Deve haver regra de retenção, exclusão ou não retenção |
| Exportabilidade | Deve permitir retirada dos dados em formato utilizável |
| Segurança | Deve apresentar controles técnicos compatíveis com o risco |
| Subprocessadores | Deve informar, quando aplicável, terceiros envolvidos |
| Custo de saída | Deve ser estimável antes da adoção |
| Plano de contingência | Deve haver alternativa manual, técnica ou operacional |

---

## 8. Regras para inteligência artificial e LLM

Integrações com IA generativa, busca semântica, RAG, copilotos ou assistentes virtuais devem seguir estas regras:

| Regra | Descrição |
|---|---|
| Adapter pattern obrigatório | O código deve permitir troca de fornecedor LLM |
| Prompt como ativo interno | Prompts, políticas e templates pertencem ao VISADOCS |
| Fail-closed no servidor | Bloqueios críticos devem ocorrer na aplicação, não apenas no fornecedor |
| Registro auditável | Interações relevantes devem gerar log interno quando a função estiver ativa |
| Sem promessa de precisão absoluta | Não usar claims como zero alucinação ou 100% precisão |
| Sem substituição do RT | IA não deve aprovar POP, validar RDC ou emitir parecer autônomo |
| Fontes rastreáveis | Respostas regulatórias devem apontar fonte quando aplicável |
| Desativação possível | Módulos de IA devem poder ser desligados sem derrubar o core documental |

---

## 9. Regras para geração de PDF

| Regra | Descrição |
|---|---|
| Geração controlada | PDFs devem ser gerados por componente controlado pelo VISADOCS |
| Terceiros restritos | SaaS externo de PDF só pode ser usado com análise formal de risco |
| Dados de cliente | Não devem trafegar por API externa não aprovada |
| Alternativas preferenciais | PDFKit, React-PDF, Puppeteer self-hosted, Playwright self-hosted ou equivalente |
| Reprodutibilidade | O layout deve ser versionável junto ao código |
| Auditoria | PDFs críticos devem preservar metadados mínimos de origem e versão |

---

## 10. Regras para deploy e infraestrutura

| Regra | Descrição |
|---|---|
| Vercel como tática | Vercel é aceitável como deploy atual do MVP, não como arquitetura definitiva |
| Docker como saída | O projeto deve manter caminho técnico para execução containerizada |
| Variáveis documentadas | Ambientes devem ser reproduzíveis por documentação |
| Banco desacoplado | Aplicação não deve depender de extensão proprietária não essencial |
| Sem deploy manual improvisado | Mudanças de produção devem seguir fluxo Git |
| Sem acoplamento invisível | Dependências externas devem estar documentadas |

---

## 11. Regras para dados e exportação

O VISADOCS deve preservar a capacidade de exportar dados essenciais do tenant.

Devem ser exportáveis, quando aplicável:

- usuários;
- tenants;
- POPs;
- versões de POPs;
- Lista Mestra;
- registros de treinamento;
- registros de ciência;
- anexos;
- metadados documentais;
- logs funcionais relevantes;
- configurações essenciais do tenant.

A exportação deve priorizar formatos abertos ou amplamente utilizáveis, como CSV, JSON, PDF e arquivos originais.

---

## 12. Relação com Nexoritia, Allux e PromptGuard

Nexoritia, Allux, PromptGuard ou mecanismos similares podem existir futuramente como camada interna de governança, desde que não sejam dependência crítica do VISADOCS MVP.

Podem atuar em:

- governança de prompts;
- bloqueio de claims proibidos;
- validação sintática ou citacional;
- logs de auditoria;
- fail-closed semântico;
- apoio a RAG.

Não podem ser apresentados como:

- fundamento de conformidade regulatória;
- prova legal plena;
- substituto do Responsável Técnico;
- certificador sanitário;
- validador automático de RDC;
- garantia de ausência de alucinação;
- argumento comercial de aprovação regulatória.

---

## 13. Responsabilidades

| Papel | Responsabilidade |
|---|---|
| Product Owner | Aprovar ou bloquear fornecedor crítico |
| Arquitetura | Documentar acoplamentos, riscos e plano de saída |
| Desenvolvimento | Implementar abstrações, adapters e portabilidade |
| Compliance | Avaliar riscos contratuais, regulatórios e de dados quando aplicável |
| Operação | Manter backups, exportações e procedimentos de contingência |

---

## 14. Critério de bloqueio

A adoção de novo fornecedor deve ser bloqueada quando:

- não houver clareza sobre tratamento de dados;
- não houver possibilidade razoável de exportação;
- a integração exigir acoplamento direto irreversível;
- o fornecedor processar dados sensíveis sem base contratual adequada;
- a funcionalidade puder ser implementada internamente com risco menor;
- o fornecedor induzir claims comerciais não sustentáveis;
- a dependência impedir migração futura do VISADOCS.

---

## 15. Revisão e versionamento

Esta política é versionada em:

docs/vendor-independence-policy.md

Revisão obrigatória antes de:

- adoção de novo subprocessador crítico;
- contratação de serviço externo para PDF, IA, storage ou autenticação;
- ativação de IA em produção;
- onboarding do primeiro cliente pagante;
- due diligence técnica, regulatória ou comercial;
- migração relevante de infraestrutura;
- internacionalização do produto.

---

## 16. Limite do documento

Este documento é uma política interna de arquitetura e governança técnica.

Não substitui parecer jurídico, análise formal de segurança da informação, relatório de adequação LGPD, auditoria independente ou avaliação contratual específica.

Fim da política.