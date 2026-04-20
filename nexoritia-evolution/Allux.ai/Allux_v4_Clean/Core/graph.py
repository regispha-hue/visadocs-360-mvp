"""
Allux.ai v2.5 - GraphRAG
Grafo de Conhecimento para entidades e relações

MVP com SQLite (sem Neo4j) - estrutura de grafo real
com nós (entidades) e arestas (relações).

Exemplo: "Cinzel" (Monte II) --[DEFINE_ESTILO]--> "Atômico"
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from enum import Enum
import sqlite3
import json


class NodeType(str, Enum):
    """Tipos de nó no grafo"""
    MONTE = "monte"
    PERSONAGEM = "personagem"
    CONCEITO = "conceito"
    ESTILO = "estilo"
    EVENTO = "evento"
    OBJETO = "objeto"


class EdgeType(str, Enum):
    """Tipos de relação no grafo"""
    PERTENCE_A = "pertence_a"
    DEFINE = "define"
    ACONTECE_EM = "acontece_em"
    RELACIONA_COM = "relaciona_com"
    MENCIONA = "menciona"
    CONTRADIZ = "contradiz"


class GraphNode(BaseModel):
    """Nó no grafo de conhecimento"""
    node_id: str
    type: NodeType
    name: str
    properties: Dict[str, Any] = {}


class GraphEdge(BaseModel):
    """Aresta (relação) no grafo"""
    edge_id: str
    source_node: str
    target_node: str
    type: EdgeType
    properties: Dict[str, Any] = {}


class KnowledgeGraph:
    """
    Grafo de Conhecimento do LDM
    
    Armazena entidades e relações para navegação semântica.
    Resolve o problema de "Cinzel no cap 1" = "Gume no cap 40".
    """
    
    def __init__(self, db_path: str = "allux.db"):
        self.db_path = db_path
        self._init_graph_tables()
    
    def _init_graph_tables(self):
        """Inicializa tabelas de grafo"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Tabela de nós
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS graph_nodes (
                node_id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                properties TEXT
            )
        """)
        
        # Tabela de arestas
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS graph_edges (
                edge_id TEXT PRIMARY KEY,
                source_node TEXT NOT NULL,
                target_node TEXT NOT NULL,
                type TEXT NOT NULL,
                properties TEXT,
                FOREIGN KEY (source_node) REFERENCES graph_nodes(node_id),
                FOREIGN KEY (target_node) REFERENCES graph_nodes(node_id)
            )
        """)
        
        # Índices para queries rápidas
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_edges_source 
            ON graph_edges(source_node)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_edges_target 
            ON graph_edges(target_node)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_nodes_name 
            ON graph_nodes(name)
        """)
        
        conn.commit()
        conn.close()
    
    def add_node(self, node: GraphNode) -> bool:
        """Adiciona nó ao grafo"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT OR REPLACE INTO graph_nodes VALUES (?, ?, ?, ?)
            """, (
                node.node_id,
                node.type.value,
                node.name,
                json.dumps(node.properties)
            ))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error adding node: {e}")
            return False
        finally:
            conn.close()
    
    def add_edge(self, edge: GraphEdge) -> bool:
        """Adiciona aresta ao grafo"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT OR REPLACE INTO graph_edges VALUES (?, ?, ?, ?, ?)
            """, (
                edge.edge_id,
                edge.source_node,
                edge.target_node,
                edge.type.value,
                json.dumps(edge.properties)
            ))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error adding edge: {e}")
            return False
        finally:
            conn.close()
    
    def get_node(self, node_id: str) -> Optional[GraphNode]:
        """Recupera nó por ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM graph_nodes WHERE node_id = ?", (node_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        return GraphNode(
            node_id=row[0],
            type=NodeType(row[1]),
            name=row[2],
            properties=json.loads(row[3]) if row[3] else {}
        )
    
    def get_neighbors(
        self,
        node_id: str,
        edge_type: Optional[EdgeType] = None,
        direction: str = "both"  # "out", "in", "both"
    ) -> List[GraphNode]:
        """
        Recupera vizinhos de um nó
        
        Args:
            node_id: ID do nó central
            edge_type: Filtrar por tipo de aresta (opcional)
            direction: Direção ("out"=saída, "in"=entrada, "both"=ambos)
        
        Returns:
            Lista de nós vizinhos
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        queries = []
        
        # Vizinhos de saída (A -> B)
        if direction in ["out", "both"]:
            sql = """
                SELECT n.* FROM graph_nodes n
                JOIN graph_edges e ON n.node_id = e.target_node
                WHERE e.source_node = ?
            """
            if edge_type:
                sql += " AND e.type = ?"
                cursor.execute(sql, (node_id, edge_type.value))
            else:
                cursor.execute(sql, (node_id,))
            queries.extend(cursor.fetchall())
        
        # Vizinhos de entrada (B -> A)
        if direction in ["in", "both"]:
            sql = """
                SELECT n.* FROM graph_nodes n
                JOIN graph_edges e ON n.node_id = e.source_node
                WHERE e.target_node = ?
            """
            if edge_type:
                sql += " AND e.type = ?"
                cursor.execute(sql, (node_id, edge_type.value))
            else:
                cursor.execute(sql, (node_id,))
            queries.extend(cursor.fetchall())
        
        conn.close()
        
        neighbors = []
        for row in queries:
            neighbors.append(GraphNode(
                node_id=row[0],
                type=NodeType(row[1]),
                name=row[2],
                properties=json.loads(row[3]) if row[3] else {}
            ))
        
        return neighbors
    
    def find_path(
        self,
        start_node: str,
        end_node: str,
        max_depth: int = 3
    ) -> Optional[List[GraphNode]]:
        """
        Encontra caminho entre dois nós (BFS)
        
        Args:
            start_node: Nó inicial
            end_node: Nó final
            max_depth: Profundidade máxima de busca
        
        Returns:
            Lista de nós no caminho (ou None se não encontrar)
        """
        from collections import deque
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # BFS
        queue = deque([(start_node, [start_node])])
        visited = {start_node}
        
        while queue:
            current, path = queue.popleft()
            
            if len(path) > max_depth:
                continue
            
            if current == end_node:
                # Encontrou! Recuperar nós do caminho
                nodes = []
                for node_id in path:
                    cursor.execute("SELECT * FROM graph_nodes WHERE node_id = ?", (node_id,))
                    row = cursor.fetchone()
                    if row:
                        nodes.append(GraphNode(
                            node_id=row[0],
                            type=NodeType(row[1]),
                            name=row[2],
                            properties=json.loads(row[3]) if row[3] else {}
                        ))
                conn.close()
                return nodes
            
            # Expandir vizinhos
            cursor.execute("""
                SELECT target_node FROM graph_edges WHERE source_node = ?
                UNION
                SELECT source_node FROM graph_edges WHERE target_node = ?
            """, (current, current))
            
            for (neighbor,) in cursor.fetchall():
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
        
        conn.close()
        return None
    
    def query_by_concept(self, concept: str) -> List[GraphNode]:
        """Busca nós por conceito (nome similar)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM graph_nodes 
            WHERE name LIKE ?
        """, (f"%{concept}%",))
        
        rows = cursor.fetchall()
        conn.close()
        
        nodes = []
        for row in rows:
            nodes.append(GraphNode(
                node_id=row[0],
                type=NodeType(row[1]),
                name=row[2],
                properties=json.loads(row[3]) if row[3] else {}
            ))
        
        return nodes
    
    def get_subgraph(
        self,
        center_node: str,
        radius: int = 1
    ) -> Dict[str, Any]:
        """
        Extrai subgrafo ao redor de um nó
        
        Args:
            center_node: Nó central
            radius: Raio de vizinhança (níveis de distância)
        
        Returns:
            Dict com nós e arestas do subgrafo
        """
        from collections import deque
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # BFS para coletar nós
        queue = deque([(center_node, 0)])
        visited = {center_node}
        nodes_in_subgraph = {center_node}
        
        while queue:
            current, depth = queue.popleft()
            
            if depth >= radius:
                continue
            
            # Vizinhos
            cursor.execute("""
                SELECT target_node FROM graph_edges WHERE source_node = ?
                UNION
                SELECT source_node FROM graph_edges WHERE target_node = ?
            """, (current, current))
            
            for (neighbor,) in cursor.fetchall():
                if neighbor not in visited:
                    visited.add(neighbor)
                    nodes_in_subgraph.add(neighbor)
                    queue.append((neighbor, depth + 1))
        
        # Recuperar nós
        nodes = []
        for node_id in nodes_in_subgraph:
            cursor.execute("SELECT * FROM graph_nodes WHERE node_id = ?", (node_id,))
            row = cursor.fetchone()
            if row:
                nodes.append({
                    "node_id": row[0],
                    "type": row[1],
                    "name": row[2],
                    "properties": json.loads(row[3]) if row[3] else {}
                })
        
        # Recuperar arestas
        edges = []
        cursor.execute("""
            SELECT * FROM graph_edges 
            WHERE source_node IN ({})
            AND target_node IN ({})
        """.format(
            ','.join('?' * len(nodes_in_subgraph)),
            ','.join('?' * len(nodes_in_subgraph))
        ), list(nodes_in_subgraph) * 2)
        
        for row in cursor.fetchall():
            edges.append({
                "edge_id": row[0],
                "source_node": row[1],
                "target_node": row[2],
                "type": row[3],
                "properties": json.loads(row[4]) if row[4] else {}
            })
        
        conn.close()
        
        return {
            "nodes": nodes,
            "edges": edges
        }
