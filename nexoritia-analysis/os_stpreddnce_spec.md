# Especificação Técnica: Módulo OS-StpReddnce (Stop Redundance)

## 1. Introdução
O módulo **OS-StpReddnce** é um componente essencial do Kernel Allux, projetado para combater a entropia documental e a proliferação de artefatos redundantes, um subproduto comum da co-criação com IAs generativas. Sua função é impor uma **Governança Editorial Determinística**, garantindo que o repositório de conhecimento do Allux mantenha o princípio de *Single Source of Truth* (Fonte Única de Verdade).

## 2. Integração no Site (Marketing e Posicionamento)

A inclusão do OS-StpReddnce no site deve seguir um tom técnico e focado em valor, alinhado à estratégia de inevitabilidade industrial.

### 2.1. Home Page (Card em "Módulos do Allux")

**Localização:** Seção "Módulos do Allux" ou "Kernel Features".

**Conteúdo do Card:**

| Campo | Conteúdo |
| :--- | :--- |
| **Título** | **OS-StpReddnce** |
| **Subtítulo** | Governança Editorial Determinística |
| **Descrição** | O mecanismo anti-entropia documental do Allux: impede a proliferação de READMEs, manifestos e hand-offs redundantes gerados por humanos ou IA, mantendo o repositório governável e o custo cognitivo baixo. |
| **CTA** | Saiba Mais |

### 2.2. Página /solutions (Menção Curta)

**Localização:** Adicionar um bullet point na seção que descreve a proposta de valor do Allux.

**Conteúdo:**

> O Allux Kernel oferece **Governança Ontológica** (via Axiomas Canônicos) e **Governança Estrutural** (via **OS-StpReddnce**), garantindo que a saída da IA seja não apenas verdadeira, mas também organizada e não-redundante.

### 2.3. Landing Placeholder: `/modules/stopreddnce`

**Objetivo:** Criar uma landing page técnica para captura de leads B2B interessados em governança de repositórios.

**Estrutura da Página:**

| Seção | Conteúdo |
| :--- | :--- |
| **Hero** | **OS-StpReddnce: O Fim da Entropia Documental** |
| **Definição** | O OS-StpReddnce é o mecanismo anti-entropia documental do Allux: impede a proliferação de READMEs/manifestos/hand-offs redundantes gerados por humanos ou IA e mantém o repositório governável. |
| **Funcionalidades (3 Pilares)** | **1. Enforce “Single Source of Truth”:** Toda documentação ativa deve estar indexada em `docs/INDEX.md`; caso contrário, bloqueia PR/commit. **2. Consolida Governança Editorial:** `DECISIONS.md` e `NEXT.md` são arquivos únicos; proíbe duplicatas e placeholders sem Owner/Status/Next. **3. Fail-Safe Archive:** Conteúdo redundante/incerto é movido para `docs/archive-snapshots/` (snapshot) em vez de deletado. |
| **Valor para a Indústria** | Redução de custo cognitivo, auditabilidade de repositórios e controle do *output* induzido por IA. |
| **CTA** | **Request Early Access** (Formulário de Waitlist) |

## 3. Implementação Técnica (Lógica do Kernel)

O OS-StpReddnce deve ser implementado como um *pre-commit hook* ou um *middleware* na API do Allux, antes que qualquer artefato seja promovido a `CANON` ou `DRAFT`.

### 3.1. Fluxo de Validação (Pseudocódigo)

```python
def validate_artifact_for_redundancy(artifact: Artifact, canon_registry: CanonRegistry) -> bool:
    """
    Verifica se o artefato viola os princípios de Single Source of Truth (SSOT)
    e Governança Editorial do OS-StpReddnce.
    """
    
    # 1. Enforce Single Source of Truth (SSOT)
    if artifact.is_documentation and not artifact.is_indexed_in_ssot():
        # Verifica se o artefato é um documento e se está listado no INDEX.md canônico
        log_violation(artifact, "SSOT_VIOLATION", "Documento não indexado em docs/INDEX.md.")
        return False

    # 2. Consolida Governança Editorial (Arquivos Únicos)
    if artifact.filename in ["DECISIONS.md", "NEXT.md"]:
        # Verifica se já existe uma versão ATIVA no Canon Registry
        if canon_registry.get_active_artifact(artifact.filename):
            log_violation(artifact, "EDITORIAL_DUPLICATE", f"Arquivo {artifact.filename} já possui versão ativa.")
            return False
        
        # Verifica se placeholders obrigatórios estão preenchidos
        if artifact.filename == "NEXT.md" and not artifact.has_required_metadata(["Owner", "Status", "NextStep"]):
            log_violation(artifact, "METADATA_MISSING", "NEXT.md requer metadados Owner/Status/NextStep.")
            return False

    # 3. Fail-Safe Archive (Ação de Correção)
    if not is_valid(artifact):
        # Em vez de deletar, move o conteúdo para o arquivo de snapshot
        archive_content(artifact, "docs/archive-snapshots/")
        # O sistema deve retornar False para bloquear a promoção, mas a ação de arquivamento é a correção.
        return False

    return True # Passou na validação StpReddnce
```

### 3.2. Integração com o Kernel Existente

O `validate_artifact_for_redundancy` deve ser injetado no pipeline de validação do Allux, antes do `Ontology Test` e do `Editorial Test` (mencionado no `pasted_content.txt`, seção 4.1).

**Novo Pipeline de Validação (4 Dimensões):**

1. **Conformance Test** (Sintaxe e Estrutura)
2. **StpReddnce Test** (Governança Editorial e SSOT)
3. **Ontology Test** (Coerência com Axiomas Canônicos)
4. **Editorial Test** (Qualidade Literária/Voz)

A inclusão do StpReddnce eleva o Allux de um sistema de governança de conteúdo para um **Sistema de Governança de Repositório de Conhecimento**, tornando-o ainda mais atraente para a adoção industrial.
