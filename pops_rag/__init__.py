"""POPs RAG/Canon Library for Visadocs 360 MVP
Biblioteca especializada para gerenciamento semântico de POPs farmacêuticos
Integração com Nexoritia OS para validação RDC 67/2007
"""

from .pop_canon_registry import POPCanonRegistry
from .pop_semantic_index import POPSemanticIndex
from .pop_validation_engine import POPValidationEngine
from .pop_knowledge_base import POPKnowledgeBase

__version__ = "1.0.0"
__author__ = "Nexoritia OS Integration Team"

__all__ = [
    "POPCanonRegistry",
    "POPSemanticIndex", 
    "POPValidationEngine",
    "POPKnowledgeBase"
]
