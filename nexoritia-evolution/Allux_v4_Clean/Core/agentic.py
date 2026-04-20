"""
Allux.ai v2.5 - Agentic RAG
Roteador de Contexto Autônomo

O agente DECIDE autonomamente qual fonte consultar:
- Kernel (leis imutáveis)
- Canon (fragmentos aprovados)
- Legacy (ZIP 700p)
- Sources (fontes externas)
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from enum import Enum
import anthropic
import os


class ContextSource(str, Enum):
    """Fontes de contexto disponíveis"""
    KERNEL = "kernel"
    CANON = "canon"
    LEGACY = "legacy"
    SOURCES = "sources"


class AgentDecision(BaseModel):
    """Decisão do agente sobre qual contexto usar"""
    sources_to_query: List[ContextSource]
    reasoning: str
    confidence: float


class AgenticRouter:
    """
    Roteador Agêntico de Contexto
    
    Decide AUTONOMAMENTE qual biblioteca consultar baseado na query.
    Não consulta tudo - só o necessário (economia de tokens).
    """
    
    def __init__(
        self,
        registry,
        rag,
        sources_vault,
        distiller,
        anthropic_api_key: Optional[str] = None
    ):
        self.registry = registry
        self.rag = rag
        self.sources_vault = sources_vault
        self.distiller = distiller
        
        # Claude para decisões de roteamento
        self.client = anthropic.Anthropic(
            api_key=anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY")
        )
    
    def route(self, query: str, monte: Optional[str] = None) -> AgentDecision:
        """
        Decide qual contexto consultar
        
        Args:
            query: Query do usuário
            monte: Monte atual (opcional)
        
        Returns:
            AgentDecision com fontes a consultar
        """
        # Prompt para o agente decidir
        routing_prompt = f"""Você é o roteador de contexto do Allux.ai.

Query do usuário: "{query}"
Monte atual: {monte or 'não especificado'}

Fontes disponíveis:
- KERNEL: Leis ontológicas imutáveis (ex: "ninguém respira no Monte II")
- CANON: Fragmentos já aprovados ⭐⭐⭐⭐⭐ (cenas validadas)
- LEGACY: Rascunhos originais (700 páginas) - contexto histórico
- SOURCES: Fontes externas (pesquisas, PDFs, referências)

DECISÃO: Quais fontes consultar? Escolha APENAS o necessário (economia).

Responda APENAS com JSON:
{{
  "sources_to_query": ["kernel", "canon"],
  "reasoning": "Preciso verificar leis ontológicas e ver cenas similares",
  "confidence": 0.9
}}
"""
        
        # Chamar Claude para decidir
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[
                {"role": "user", "content": routing_prompt}
            ]
        )
        
        # Parse resposta
        import json
        response_text = message.content[0].text
        
        # Remover markdown se presente
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        
        decision_data = json.loads(response_text)
        
        return AgentDecision(**decision_data)
    
    def gather_context(
        self,
        query: str,
        sources: List[ContextSource],
        monte: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Reúne contexto das fontes especificadas
        
        Args:
            query: Query
            sources: Fontes a consultar (decididas pelo agente)
            monte: Monte atual
        
        Returns:
            Dict com contexto de cada fonte
        """
        context = {}
        
        # KERNEL
        if ContextSource.KERNEL in sources:
            # Buscar invariantes do Kernel
            kernel_rules = self._get_kernel_rules(monte)
            context["kernel"] = kernel_rules
        
        # CANON
        if ContextSource.CANON in sources:
            # Buscar no RAG canônico
            canon_results = self.rag.retrieve(query, top_k=3)
            context["canon"] = canon_results
        
        # LEGACY
        if ContextSource.LEGACY in sources:
            # Buscar nos rascunhos originais (sources com type=legacy)
            legacy_sources = self.sources_vault.search_sources(
                query=query,
                monte=monte,
                limit=3
            )
            legacy_sources = [s for s in legacy_sources if s.type.value == "legacy"]
            context["legacy"] = [
                {
                    "title": s.title,
                    "excerpt": s.content[:500]
                }
                for s in legacy_sources
            ]
        
        # SOURCES
        if ContextSource.SOURCES in sources:
            # Buscar em fontes externas
            external = self.sources_vault.search_sources(
                query=query,
                monte=monte,
                limit=3
            )
            external = [s for s in external if s.type.value != "legacy"]
            context["sources"] = [
                {
                    "title": s.title,
                    "type": s.type.value,
                    "excerpt": s.content[:500]
                }
                for s in external
            ]
        
        return context
    
    def _get_kernel_rules(self, monte: Optional[str] = None) -> List[Dict]:
        """Recupera regras do Kernel aplicáveis"""
        from core.invariants import InvariantsDictionary, InvariantLayer
        
        invariants = InvariantsDictionary()
        kernel_rules = invariants.get_invariants(
            layer=InvariantLayer.KERNEL,
            monte=monte
        )
        
        return [
            {
                "invariant_id": r.invariant_id,
                "name": r.name,
                "description": r.description
            }
            for r in kernel_rules
        ]
    
    def execute(
        self,
        instruction: str,
        monte: Optional[str] = None,
        voz: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execução completa: roteamento + contexto + geração
        
        Args:
            instruction: Instrução do usuário (ex: "Escreva cena do encontro")
            monte: Monte atual
            voz: Voz (Lyra/Logos)
        
        Returns:
            Dict com decisão, contexto e resultado
        """
        # 1. Decidir quais fontes consultar
        decision = self.route(instruction, monte)
        
        # 2. Reunir contexto
        context = self.gather_context(
            query=instruction,
            sources=decision.sources_to_query,
            monte=monte
        )
        
        # 3. Montar prompt com contexto
        context_text = self._format_context(context)
        
        execution_prompt = f"""CONTEXTO REUNIDO:
{context_text}

INSTRUÇÃO: {instruction}

MONTE: {monte or 'não especificado'}
VOZ: {voz or 'Lyra'}

REGRAS:
- Fail-closed: silêncio > invenção
- Apneia: 30-60 palavras/parágrafo
- Cinzel: atômico, sem gordura
- Respeitar Kernel SEMPRE

EXECUTE a instrução usando APENAS o contexto acima.
"""
        
        # 4. Gerar resposta
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": execution_prompt}
            ]
        )
        
        result = message.content[0].text
        
        return {
            "decision": decision.model_dump(),
            "context": context,
            "result": result
        }
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """Formata contexto para o prompt"""
        parts = []
        
        if "kernel" in context:
            parts.append("=== KERNEL (Leis) ===")
            for rule in context["kernel"]:
                parts.append(f"- {rule['name']}: {rule['description']}")
        
        if "canon" in context:
            parts.append("\n=== CANON (Fragmentos Aprovados) ===")
            for item in context["canon"]:
                parts.append(f"- {item['content'][:200]}...")
        
        if "legacy" in context:
            parts.append("\n=== LEGACY (Rascunhos Originais) ===")
            for item in context["legacy"]:
                parts.append(f"- {item['title']}: {item['excerpt']}")
        
        if "sources" in context:
            parts.append("\n=== SOURCES (Fontes Externas) ===")
            for item in context["sources"]:
                parts.append(f"- {item['title']} ({item['type']}): {item['excerpt']}")
        
        return "\n".join(parts)
