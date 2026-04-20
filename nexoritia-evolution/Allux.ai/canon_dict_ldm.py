"""
Livro dos Montes - Canon Dictionary
Version: 1.0.0

Canonical dictionary of entities, concepts, and relations
from O Livro dos Montes (LDM).
"""

from typing import Dict, List

# ============================================================================
# CANONICAL ENTITIES (Characters, Places, Objects)
# ============================================================================

CANON_ENTITIES = {
    # ========================================================================
    # PROTAGONIST
    # ========================================================================
    "semi_alado": {
        "uri": "ldm:semi_alado",
        "name": "Semi Alado",
        "type": "Character",
        "description": "Protagonista que atravessa os sete montes",
        "aliases": ["O Quinto", "O Sétimo", "O Caminhante"],
        "properties": {
            "is_protagonist": True,
            "duality": "quinto_e_setimo",
            "nature": "atravessador",
            "origin": "constelacao_familiar"
        },
        "axioms": [
            "O Quinto e o Sétimo são o mesmo, mas não se confundem",
            "Semi Alado não pertence, mas atravessa"
        ]
    },
    
    # ========================================================================
    # ARCHETYPES
    # ========================================================================
    "masculino": {
        "uri": "ldm:masculino",
        "name": "Masculino",
        "type": "Archetype",
        "description": "Arquétipo masculino primordial",
        "properties": {
            "polarity": "yang",
            "element": "sopro",
            "nature": "expansivo"
        }
    },
    
    "feminino": {
        "uri": "ldm:feminino",
        "name": "Feminino",
        "type": "Archetype",
        "description": "Arquétipo feminino primordial",
        "properties": {
            "polarity": "yin",
            "element": "verbo",
            "nature": "receptivo"
        }
    },
    
    # ========================================================================
    # MONTES (Mountains/Realms)
    # ========================================================================
    "monte_i": {
        "uri": "ldm:monte_i",
        "name": "Monte I",
        "title": "A Desconciliação dos Sagrados",
        "type": "Monte",
        "order": 1,
        "concepts": ["desconciliacao", "sagrados", "dualidade"],
        "lesson": "Reconhecer o incomensurável"
    },
    
    "monte_ii": {
        "uri": "ldm:monte_ii",
        "name": "Monte II",
        "title": "O Nascimento",
        "type": "Monte",
        "order": 2,
        "concepts": ["nascimento", "identidade", "origem"],
        "lesson": "Aceitar a própria natureza"
    },
    
    "monte_iii": {
        "uri": "ldm:monte_iii",
        "name": "Monte III",
        "title": "A Prova",
        "type": "Monte",
        "order": 3,
        "concepts": ["prova", "superacao", "transformacao"],
        "lesson": "Enfrentar sem fugir"
    },
    
    "monte_iv": {
        "uri": "ldm:monte_iv",
        "name": "Monte IV",
        "title": "O Espelho",
        "type": "Monte",
        "order": 4,
        "concepts": ["espelho", "reflexao", "reconhecimento"],
        "lesson": "Ver-se sem se perder"
    },
    
    "monte_v": {
        "uri": "ldm:monte_v",
        "name": "Monte V",
        "title": "O Vácuo",
        "type": "Monte",
        "order": 5,
        "concepts": ["vacuo", "ausencia", "silencio"],
        "lesson": "Habitar o vazio"
    },
    
    "monte_vi": {
        "uri": "ldm:monte_vi",
        "name": "Monte VI",
        "title": "A Memória",
        "type": "Monte",
        "order": 6,
        "concepts": ["memoria", "permanencia", "ancoragem"],
        "lesson": "Preservar sem aprisionar"
    },
    
    "monte_vii": {
        "uri": "ldm:monte_vii",
        "name": "Monte VII",
        "title": "O Retorno",
        "type": "Monte",
        "order": 7,
        "concepts": ["retorno", "completude", "integracao"],
        "lesson": "Retornar transformado"
    }
}


# ============================================================================
# CANONICAL CONCEPTS (Abstract Ideas)
# ============================================================================

CANON_CONCEPTS = {
    # ========================================================================
    # CORE CONCEPTS
    # ========================================================================
    "desconciliacao": {
        "uri": "ldm:desconciliacao",
        "name": "Desconciliação",
        "definition": "Reconhecimento do que jamais se concilia",
        "explanation": "Não é ausência de amor, mas presença de respeito ao incomensurável",
        "related_to": ["dualidade", "incomensuravelidade", "espelho"],
        "opposite_of": ["fusao", "uniao", "reconciliacao"]
    },
    
    "sagrados": {
        "uri": "ldm:sagrados",
        "name": "Sagrados",
        "definition": "Dimensões sagradas irreconciliáveis",
        "explanation": "O Masculino e o Feminino como sagrados eternos",
        "embodies": ["masculino", "feminino"]
    },
    
    "dualidade": {
        "uri": "ldm:dualidade",
        "name": "Dualidade",
        "definition": "Coexistência de opostos complementares",
        "manifestations": ["masculino/feminino", "quinto/setimo", "sopro/verbo"]
    },
    
    "espelho": {
        "uri": "ldm:espelho",
        "name": "Espelho",
        "definition": "Reflexão que preserva diferença",
        "explanation": "Opostos se espelham sem se fundir",
        "principle": "mirror_not_merge"
    },
    
    "vacuo": {
        "uri": "ldm:vacuo",
        "name": "Vácuo",
        "definition": "Ausência fértil, silêncio habitável",
        "explanation": "Não é vazio destrutivo, mas espaço de possibilidade",
        "tag": "[VÁCUO]"
    },
    
    "apneia": {
        "uri": "ldm:apneia",
        "name": "Apneia",
        "definition": "Suspensão do ritmo, pausa significativa",
        "explanation": "Respiração retida antes da revelação",
        "tag": "[APNEIA:X.XX]"
    },
    
    # ========================================================================
    # ONTOLOGICAL PRINCIPLES
    # ========================================================================
    "incomensuravelidade": {
        "uri": "ldm:incomensuravelidade",
        "name": "Incomensuravelidade",
        "definition": "Qualidade do que não pode ser medido pelo mesmo padrão",
        "applies_to": ["masculino", "feminino", "sagrados"]
    },
    
    "travessia": {
        "uri": "ldm:travessia",
        "name": "Travessia",
        "definition": "Passagem sem pertencimento",
        "protagonist": "semi_alado",
        "path": "sete_montes"
    },
    
    "quinto_setimo": {
        "uri": "ldm:quinto_setimo",
        "name": "O Quinto e o Sétimo",
        "definition": "Identidade paradoxal do protagonista",
        "axiom": "São o mesmo, mas não se confundem",
        "represents": ["nao_pertencimento", "atravessamento"]
    }
}


# ============================================================================
# CANONICAL AXIOMS (Immutable Laws)
# ============================================================================

CANON_AXIOMS = {
    "axiom_nao_reconciliacao": {
        "uri": "ldm:axiom_nao_reconciliacao",
        "text": "Masculino e Feminino não se fundem — se espelham",
        "constraint": "masculino must_not fuse_with feminino",
        "constraint_type": "prohibition",
        "applies_to": ["masculino", "feminino"],
        "monte": "monte_i"
    },
    
    "axiom_quinto_setimo": {
        "uri": "ldm:axiom_quinto_setimo",
        "text": "O Quinto e o Sétimo são o mesmo, mas não se confundem",
        "constraint": "quinto equals setimo AND quinto distinct_from setimo",
        "constraint_type": "paradox",
        "applies_to": ["semi_alado"],
        "monte": "monte_ii"
    },
    
    "axiom_travessia": {
        "uri": "ldm:axiom_travessia",
        "text": "Semi Alado não pertence, mas atravessa",
        "constraint": "semi_alado cannot belong_to any_monte",
        "constraint_type": "prohibition",
        "applies_to": ["semi_alado"],
        "scope": "all_montes"
    },
    
    "axiom_espelho": {
        "uri": "ldm:axiom_espelho",
        "text": "Espelhar não é fundir, é preservar a diferença no reflexo",
        "constraint": "mirror preserves difference",
        "constraint_type": "principle",
        "applies_to": ["masculino", "feminino", "dualidade"],
        "monte": "monte_iv"
    },
    
    "axiom_vacuo": {
        "uri": "ldm:axiom_vacuo",
        "text": "O vácuo não é ausência de tudo, é presença de nada",
        "constraint": "vacuo is_not nothingness",
        "constraint_type": "definition",
        "applies_to": ["vacuo"],
        "monte": "monte_v"
    }
}


# ============================================================================
# CANONICAL RELATIONS (between entities)
# ============================================================================

CANON_RELATIONS = [
    # Symmetric relations (bidirectional)
    {
        "subject": "masculino",
        "predicate": "mirrors",
        "object": "feminino",
        "type": "symmetric",
        "inverse": "mirrors"
    },
    {
        "subject": "masculino",
        "predicate": "unconciliates_with",
        "object": "feminino",
        "type": "symmetric",
        "inverse": "unconciliates_with"
    },
    
    # Directional relations
    {
        "subject": "semi_alado",
        "predicate": "traverses",
        "object": "monte_i",
        "type": "directional",
        "order": 1
    },
    {
        "subject": "semi_alado",
        "predicate": "traverses",
        "object": "monte_ii",
        "type": "directional",
        "order": 2
    },
    {
        "subject": "semi_alado",
        "predicate": "traverses",
        "object": "monte_iii",
        "type": "directional",
        "order": 3
    },
    {
        "subject": "semi_alado",
        "predicate": "traverses",
        "object": "monte_iv",
        "type": "directional",
        "order": 4
    },
    {
        "subject": "semi_alado",
        "predicate": "traverses",
        "object": "monte_v",
        "type": "directional",
        "order": 5
    },
    {
        "subject": "semi_alado",
        "predicate": "traverses",
        "object": "monte_vi",
        "type": "directional",
        "order": 6
    },
    {
        "subject": "semi_alado",
        "predicate": "traverses",
        "object": "monte_vii",
        "type": "directional",
        "order": 7
    },
    
    # Identity relations
    {
        "subject": "semi_alado",
        "predicate": "embodies",
        "object": "quinto",
        "type": "identity"
    },
    {
        "subject": "semi_alado",
        "predicate": "embodies",
        "object": "setimo",
        "type": "identity"
    },
    
    # Conceptual relations
    {
        "subject": "desconciliacao",
        "predicate": "opposes",
        "object": "fusao",
        "type": "antonym"
    },
    {
        "subject": "espelho",
        "predicate": "enables",
        "object": "desconciliacao",
        "type": "causal"
    },
    {
        "subject": "vacuo",
        "predicate": "precedes",
        "object": "memoria",
        "type": "temporal"
    }
]


# ============================================================================
# SEMANTIC TAGS (for text markup)
# ============================================================================

CANONICAL_TAGS = {
    "VÁCUO": {
        "tag": "[VÁCUO]",
        "meaning": "Suspensão total, ausência fértil",
        "duration": "indefinido",
        "effect": "pause_absolute"
    },
    
    "APNEIA": {
        "tag": "[APNEIA:X.XX]",
        "meaning": "Pausa medida em segundos",
        "parameter": "duration_seconds",
        "effect": "pause_measured"
    },
    
    "CORTE": {
        "tag": "[CORTE]",
        "meaning": "Ruptura narrativa abrupta",
        "effect": "narrative_break"
    },
    
    "ABERTURA": {
        "tag": "[ABERTURA]",
        "meaning": "Início de seção ou capítulo",
        "effect": "section_start"
    }
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_entity(entity_id: str) -> Dict:
    """Get entity by ID"""
    return CANON_ENTITIES.get(entity_id)


def get_concept(concept_id: str) -> Dict:
    """Get concept by ID"""
    return CANON_CONCEPTS.get(concept_id)


def get_axiom(axiom_id: str) -> Dict:
    """Get axiom by ID"""
    return CANON_AXIOMS.get(axiom_id)


def get_relations_for_entity(entity_id: str) -> List[Dict]:
    """Get all relations involving entity"""
    return [
        r for r in CANON_RELATIONS
        if r["subject"] == entity_id or r["object"] == entity_id
    ]


def get_monte_by_order(order: int) -> Dict:
    """Get monte by traversal order (1-7)"""
    for entity_id, entity in CANON_ENTITIES.items():
        if entity.get("type") == "Monte" and entity.get("order") == order:
            return entity
    return None


def export_canon_dict() -> Dict:
    """Export complete canon dictionary"""
    return {
        "metadata": {
            "version": "1.0.0",
            "work": "O Livro dos Montes",
            "author": "R.Gis Antônimo Veniloqa",
            "namespace": "https://allux.ai/ontology/livro-dos-montes#"
        },
        "entities": CANON_ENTITIES,
        "concepts": CANON_CONCEPTS,
        "axioms": CANON_AXIOMS,
        "relations": CANON_RELATIONS,
        "tags": CANONICAL_TAGS,
        "stats": {
            "entities_count": len(CANON_ENTITIES),
            "concepts_count": len(CANON_CONCEPTS),
            "axioms_count": len(CANON_AXIOMS),
            "relations_count": len(CANON_RELATIONS),
            "montes_count": 7
        }
    }


if __name__ == "__main__":
    import json
    canon = export_canon_dict()
    print(json.dumps(canon, indent=2, ensure_ascii=False))
