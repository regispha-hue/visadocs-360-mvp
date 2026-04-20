"""
Allux Controlled Vocabulary v1
Version: 1.0.0

Canonical vocabulary for Allux Core Ontology.
Defines classes, properties, and relationships.
"""

from enum import Enum
from typing import Dict, List


# ============================================================================
# CORE CLASSES (OWL Classes)
# ============================================================================

class AlluxClass(str, Enum):
    """Core ontological classes in Allux"""
    
    # Artifacts
    ARTIFACT = "allux:Artifact"
    CHAPTER = "allux:Chapter"
    SCENE = "allux:Scene"
    FRAGMENT = "allux:Fragment"
    LAW = "allux:Law"
    ONTOLOGY = "allux:Ontology"
    
    # Versioning
    PATCH = "allux:Patch"
    VERSION = "allux:Version"
    
    # Provenance
    SOURCE = "allux:Source"
    CHAT_SOURCE = "allux:ChatSource"
    DOCUMENT_SOURCE = "allux:DocumentSource"
    
    # Governance
    TEST_RESULT = "allux:TestResult"
    AUTH_PROOF = "allux:AuthProof"
    
    # Ontological Elements
    ENTITY = "allux:Entity"
    CONCEPT = "allux:Concept"
    AXIOM = "allux:Axiom"
    RELATION = "allux:Relation"
    
    # Translation
    TRANSLATION = "allux:Translation"
    LANGUAGE_PROFILE = "allux:LanguageProfile"


# ============================================================================
# PROPERTIES (OWL Properties)
# ============================================================================

class AlluxProperty(str, Enum):
    """Core properties in Allux"""
    
    # Identity
    HAS_ID = "allux:hasId"
    HAS_TITLE = "allux:hasTitle"
    HAS_VERSION = "allux:hasVersion"
    HAS_HASH = "allux:hasHash"
    
    # Content
    HAS_CONTENT = "allux:hasContent"
    HAS_TEXT = "allux:hasText"
    
    # Status
    HAS_STATUS = "allux:hasStatus"
    IS_FROZEN = "allux:isFrozen"
    IS_CANON = "allux:isCanon"
    
    # Provenance
    HAS_SOURCE = "allux:hasSource"
    DERIVED_FROM = "allux:derivedFrom"
    CREATED_BY = "allux:createdBy"
    CREATED_AT = "allux:createdAt"
    
    # Ontological Relations
    HAS_AXIOM = "allux:hasAxiom"
    HAS_ENTITY = "allux:hasEntity"
    HAS_CONCEPT = "allux:hasConcept"
    REFERENCES_ONTOLOGY = "allux:referencesOntology"
    
    # Versioning
    HAS_PATCH = "allux:hasPatch"
    APPLIES_TO = "allux:appliesTo"
    SUPERSEDES = "allux:supersedes"
    
    # Validation
    HAS_TEST_RESULT = "allux:hasTestResult"
    PASSES_CONFORMANCE = "allux:passesConformance"
    PASSES_ONTOLOGY = "allux:passesOntology"
    PASSES_EDITORIAL = "allux:passesEditorial"
    
    # Translation
    HAS_TRANSLATION = "allux:hasTranslation"
    TRANSLATES_TO = "allux:translatesTo"
    IN_LANGUAGE = "allux:inLanguage"
    SEMANTICALLY_EQUIVALENT = "allux:semanticallyEquivalent"
    
    # Cryptographic
    HAS_PROOF = "allux:hasProof"
    SIGNED_BY = "allux:signedBy"
    ANCHORED_TO = "allux:anchoredTo"


# ============================================================================
# RELATION TYPES
# ============================================================================

class RelationType(str, Enum):
    """Types of relations between entities"""
    
    # Hierarchical
    IS_A = "is_a"
    PART_OF = "part_of"
    CONTAINS = "contains"
    
    # Semantic
    RELATED_TO = "related_to"
    OPPOSITE_OF = "opposite_of"
    EQUIVALENT_TO = "equivalent_to"
    
    # Temporal
    BEFORE = "before"
    AFTER = "after"
    DURING = "during"
    
    # Causal
    CAUSES = "causes"
    ENABLES = "enables"
    PREVENTS = "prevents"
    
    # Custom (Livro dos Montes)
    DESCENDS_FROM = "descends_from"
    MIRRORS = "mirrors"
    UNCONCILIATES = "unconciliates"


# ============================================================================
# NAMESPACES
# ============================================================================

NAMESPACES = {
    "allux": "https://allux.ai/ontology/core#",
    "ldm": "https://allux.ai/ontology/livro-dos-montes#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "owl": "http://www.w3.org/2002/07/owl#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "dc": "http://purl.org/dc/elements/1.1/",
    "dcterms": "http://purl.org/dc/terms/",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "schema": "http://schema.org/",
}


# ============================================================================
# STATUS VALUES
# ============================================================================

class ArtifactStatus(str, Enum):
    """Canonical status values"""
    DRAFT = "draft"
    CANON = "canon"
    FROZEN = "frozen"


class TestStatus(str, Enum):
    """Test result values"""
    PASS = "pass"
    FAIL = "fail"


# ============================================================================
# LANGUAGE PROFILES
# ============================================================================

LANGUAGE_PROFILES = {
    "pt-BR": {
        "name": "Português Brasileiro",
        "iso": "pt-BR",
        "register": "canônico"
    },
    "en-LIT": {
        "name": "English (Literary)",
        "iso": "en",
        "register": "literary-philosophical"
    },
    "pt-PT": {
        "name": "Português Europeu",
        "iso": "pt-PT",
        "register": "internacional"
    },
    "es-INT": {
        "name": "Español Internacional",
        "iso": "es",
        "register": "neutro"
    },
    "fr-PHI": {
        "name": "Français (Philosophique)",
        "iso": "fr",
        "register": "ensaístico"
    }
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_prefixed_uri(namespace: str, local_name: str) -> str:
    """Generate prefixed URI"""
    if namespace not in NAMESPACES:
        raise ValueError(f"Unknown namespace: {namespace}")
    return f"{NAMESPACES[namespace]}{local_name}"


def get_class_uri(class_name: AlluxClass) -> str:
    """Get full URI for class"""
    return class_name.value.replace("allux:", NAMESPACES["allux"])


def get_property_uri(property_name: AlluxProperty) -> str:
    """Get full URI for property"""
    return property_name.value.replace("allux:", NAMESPACES["allux"])


def expand_prefixed_uri(prefixed: str) -> str:
    """Expand prefixed URI to full URI"""
    if ":" not in prefixed:
        return prefixed
    
    prefix, local = prefixed.split(":", 1)
    
    if prefix not in NAMESPACES:
        raise ValueError(f"Unknown prefix: {prefix}")
    
    return NAMESPACES[prefix] + local


# ============================================================================
# VOCABULARY METADATA
# ============================================================================

VOCABULARY_METADATA = {
    "version": "1.0.0",
    "title": "Allux Core Vocabulary",
    "description": "Controlled vocabulary for Allux ontological AI governance system",
    "publisher": "R.Gis Antônimo Veniloqa",
    "license": "Proprietary",
    "created": "2026-01-15",
    "namespaces": NAMESPACES,
    "classes_count": len(AlluxClass),
    "properties_count": len(AlluxProperty),
    "relation_types_count": len(RelationType)
}


# ============================================================================
# EXPORT FUNCTIONS
# ============================================================================

def export_vocabulary_json() -> Dict:
    """Export vocabulary as JSON"""
    return {
        "metadata": VOCABULARY_METADATA,
        "namespaces": NAMESPACES,
        "classes": {c.name: c.value for c in AlluxClass},
        "properties": {p.name: p.value for p in AlluxProperty},
        "relation_types": {r.name: r.value for r in RelationType},
        "language_profiles": LANGUAGE_PROFILES
    }


if __name__ == "__main__":
    import json
    vocab = export_vocabulary_json()
    print(json.dumps(vocab, indent=2, ensure_ascii=False))
