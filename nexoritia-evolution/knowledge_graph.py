"""
Allux Knowledge Graph
Version: 1.0.0

In-memory Knowledge Graph for ontological inference and validation.
Uses NetworkX for graph operations (can migrate to Neo4j later).
"""

import networkx as nx
from typing import Dict, List, Tuple, Optional, Set
from datetime import datetime
import json

from ontology.vocabulary import (
    AlluxClass, AlluxProperty, RelationType,
    NAMESPACES, expand_prefixed_uri
)


# ============================================================================
# KNOWLEDGE GRAPH CORE
# ============================================================================

class KnowledgeGraph:
    """
    In-memory Knowledge Graph using NetworkX.
    
    Nodes = Entities (URIs)
    Edges = Relations (labeled)
    
    Triple format: (subject, predicate, object)
    """
    
    def __init__(self):
        self.graph = nx.MultiDiGraph()  # Allows multiple edges between nodes
        self.namespaces = NAMESPACES.copy()
        self.metadata = {
            "created_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "triple_count": 0
        }
    
    # ========================================================================
    # TRIPLE OPERATIONS
    # ========================================================================
    
    def add_triple(self, subject: str, predicate: str, obj: str) -> None:
        """
        Add RDF triple to graph.
        
        Args:
            subject: Subject URI (expanded)
            predicate: Predicate URI (expanded)
            obj: Object URI or literal (expanded if URI)
        """
        # Expand prefixed URIs
        subject = expand_prefixed_uri(subject)
        predicate = expand_prefixed_uri(predicate)
        
        # Object might be literal (don't expand if it doesn't have prefix)
        if ":" in obj and obj.split(":")[0] in self.namespaces:
            obj = expand_prefixed_uri(obj)
        
        # Add nodes if they don't exist
        if not self.graph.has_node(subject):
            self.graph.add_node(subject, uri=subject, type="entity")
        
        if not self.graph.has_node(obj):
            # Determine if object is URI or literal
            is_uri = obj.startswith("http://") or obj.startswith("https://")
            self.graph.add_node(
                obj,
                uri=obj if is_uri else None,
                type="entity" if is_uri else "literal",
                value=obj if not is_uri else None
            )
        
        # Add edge (relation)
        self.graph.add_edge(
            subject,
            obj,
            predicate=predicate,
            label=predicate.split("#")[-1] if "#" in predicate else predicate
        )
        
        self.metadata["triple_count"] += 1
    
    def add_triples(self, triples: List[Tuple[str, str, str]]) -> None:
        """Add multiple triples"""
        for s, p, o in triples:
            self.add_triple(s, p, o)
    
    def get_triples(
        self,
        subject: Optional[str] = None,
        predicate: Optional[str] = None,
        obj: Optional[str] = None
    ) -> List[Tuple[str, str, str]]:
        """
        Query triples with optional filters.
        
        Returns all triples matching the pattern.
        Use None as wildcard.
        """
        results = []
        
        for s, o, data in self.graph.edges(data=True):
            p = data.get("predicate")
            
            # Filter by pattern
            if subject and s != subject:
                continue
            if predicate and p != predicate:
                continue
            if obj and o != obj:
                continue
            
            results.append((s, p, o))
        
        return results
    
    # ========================================================================
    # ENTITY OPERATIONS
    # ========================================================================
    
    def add_entity(
        self,
        uri: str,
        rdf_type: str,
        properties: Optional[Dict[str, str]] = None
    ) -> None:
        """
        Add entity with type and properties.
        
        Generates triples:
        - (uri, rdf:type, rdf_type)
        - (uri, property, value) for each property
        """
        uri = expand_prefixed_uri(uri)
        rdf_type = expand_prefixed_uri(rdf_type)
        
        # Add type triple
        self.add_triple(uri, "rdf:type", rdf_type)
        
        # Add property triples
        if properties:
            for prop, value in properties.items():
                prop = expand_prefixed_uri(prop)
                self.add_triple(uri, prop, value)
    
    def get_entity_type(self, uri: str) -> Optional[str]:
        """Get RDF type of entity"""
        uri = expand_prefixed_uri(uri)
        
        triples = self.get_triples(
            subject=uri,
            predicate=expand_prefixed_uri("rdf:type")
        )
        
        if triples:
            return triples[0][2]  # Return object of first rdf:type triple
        return None
    
    def get_entity_properties(self, uri: str) -> Dict[str, List[str]]:
        """Get all properties of entity"""
        uri = expand_prefixed_uri(uri)
        
        properties = {}
        
        for s, p, o in self.get_triples(subject=uri):
            if p == expand_prefixed_uri("rdf:type"):
                continue  # Skip type triples
            
            if p not in properties:
                properties[p] = []
            properties[p].append(o)
        
        return properties
    
    # ========================================================================
    # QUERY OPERATIONS
    # ========================================================================
    
    def find_entities_by_type(self, rdf_type: str) -> List[str]:
        """Find all entities of given type"""
        rdf_type = expand_prefixed_uri(rdf_type)
        
        triples = self.get_triples(
            predicate=expand_prefixed_uri("rdf:type"),
            obj=rdf_type
        )
        
        return [t[0] for t in triples]
    
    def find_related(
        self,
        uri: str,
        relation: Optional[str] = None,
        direction: str = "outgoing"
    ) -> List[Tuple[str, str]]:
        """
        Find entities related to given URI.
        
        Args:
            uri: Subject URI
            relation: Predicate filter (None = all)
            direction: 'outgoing', 'incoming', or 'both'
        
        Returns:
            List of (related_uri, relation_type)
        """
        uri = expand_prefixed_uri(uri)
        if relation:
            relation = expand_prefixed_uri(relation)
        
        results = []
        
        # Outgoing relations
        if direction in ["outgoing", "both"]:
            for s, p, o in self.get_triples(subject=uri, predicate=relation):
                results.append((o, p))
        
        # Incoming relations
        if direction in ["incoming", "both"]:
            for s, p, o in self.get_triples(obj=uri, predicate=relation):
                results.append((s, p))
        
        return results
    
    def find_path(self, start_uri: str, end_uri: str) -> Optional[List[str]]:
        """Find shortest path between two entities"""
        start_uri = expand_prefixed_uri(start_uri)
        end_uri = expand_prefixed_uri(end_uri)
        
        try:
            path = nx.shortest_path(self.graph, start_uri, end_uri)
            return path
        except nx.NetworkXNoPath:
            return None
    
    # ========================================================================
    # AXIOM VALIDATION
    # ========================================================================
    
    def validate_axiom(self, axiom: str, context: Dict) -> bool:
        """
        Validate axiom against current KG state.
        
        Axiom format: "entity1 must_not relate_to entity2"
        
        Example: "masculino must_not fuse_with feminino"
        
        Returns True if axiom is satisfied, False if violated.
        """
        # Simple rule engine (can be expanded)
        
        if "must_not" in axiom:
            parts = axiom.split("must_not")
            subject_pattern = parts[0].strip()
            constraint = parts[1].strip()
            
            # Check if constraint is violated
            if "relate_to" in constraint or "fuse_with" in constraint:
                # Pattern: X must_not relate_to Y
                # Implementation: check for forbidden relations
                
                # Extract entities from context
                entities = context.get("entities", [])
                
                for entity_uri in entities:
                    related = self.find_related(entity_uri, direction="outgoing")
                    
                    # Check if any relation violates axiom
                    for related_uri, relation in related:
                        if self._matches_axiom_violation(
                            entity_uri, related_uri, relation, axiom
                        ):
                            return False  # Axiom violated
        
        return True  # Axiom satisfied
    
    def _matches_axiom_violation(
        self,
        subject: str,
        obj: str,
        relation: str,
        axiom: str
    ) -> bool:
        """Check if relation violates axiom (helper)"""
        # Simplified check - would need NLP for full implementation
        
        # Example axiom: "masculino must_not fuse_with feminino"
        if "fuse" in axiom and "fuse" in relation.lower():
            return True
        
        if "reconcile" in axiom and "reconcile" in relation.lower():
            return True
        
        return False
    
    # ========================================================================
    # EXPORT / IMPORT
    # ========================================================================
    
    def export_rdf_triples(self) -> List[Dict]:
        """Export all triples in JSON format"""
        triples = []
        
        for s, o, data in self.graph.edges(data=True):
            triples.append({
                "subject": s,
                "predicate": data.get("predicate"),
                "object": o
            })
        
        return triples
    
    def export_json_ld(self) -> Dict:
        """Export Knowledge Graph as JSON-LD"""
        return {
            "@context": self.namespaces,
            "@graph": self.export_rdf_triples(),
            "metadata": self.metadata
        }
    
    def get_stats(self) -> Dict:
        """Get Knowledge Graph statistics"""
        return {
            "nodes": self.graph.number_of_nodes(),
            "edges": self.graph.number_of_edges(),
            "triples": self.metadata["triple_count"],
            "density": nx.density(self.graph),
            "is_directed": self.graph.is_directed(),
            "created_at": self.metadata["created_at"]
        }
