"""
Allux.ai v2.5 - Pipeline de Ingestão
Processa ZIP de 700 páginas e popula:
- Sources Vault (fontes legacy)
- Knowledge Graph (entidades + relações)
- RAG Canônico (fragmentos)

USO:
python ingest_legacy.py /path/to/rascunhos_700p.zip
"""

import sys
import zipfile
import os
from pathlib import Path
import re
import hashlib
from typing import List, Dict, Any

from core.sources import SourcesVault, SourceType
from core.graph import KnowledgeGraph, GraphNode, GraphEdge, NodeType, EdgeType


class LegacyIngestionPipeline:
    """
    Pipeline de Ingestão de Rascunhos Originais
    
    Processa o ZIP de 700 páginas e extrai:
    1. Textos completos → Sources Vault
    2. Entidades (personagens, conceitos) → Knowledge Graph
    3. Relações → Knowledge Graph
    4. Fragmentos importantes → RAG Canônico
    """
    
    def __init__(self, db_path: str = "allux.db"):
        self.sources_vault = SourcesVault(db_path)
        self.knowledge_graph = KnowledgeGraph(db_path)
    
    def ingest_zip(self, zip_path: str) -> Dict[str, int]:
        """
        Processa ZIP completo
        
        Args:
            zip_path: Caminho para o arquivo ZIP
        
        Returns:
            Estatísticas de ingestão
        """
        stats = {
            "files_processed": 0,
            "sources_created": 0,
            "nodes_created": 0,
            "edges_created": 0,
            "fragments_extracted": 0
        }
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Listar arquivos
            files = [f for f in zip_ref.namelist() if f.endswith(('.txt', '.md', '.docx'))]
            
            print(f"Encontrados {len(files)} arquivos no ZIP")
            
            for file_name in files:
                print(f"Processando: {file_name}")
                
                # Extrair conteúdo
                content = zip_ref.read(file_name).decode('utf-8', errors='ignore')
                
                # 1. Salvar como fonte legacy
                source_id = self._save_as_source(file_name, content)
                if source_id:
                    stats["sources_created"] += 1
                
                # 2. Extrair entidades e relações
                entities = self._extract_entities(content)
                stats["nodes_created"] += len(entities)
                
                for entity in entities:
                    self.knowledge_graph.add_node(entity)
                
                # 3. Criar relações entre entidades
                edges = self._create_relationships(content, entities)
                stats["edges_created"] += len(edges)
                
                for edge in edges:
                    self.knowledge_graph.add_edge(edge)
                
                # 4. Extrair fragmentos importantes
                fragments = self._extract_fragments(content)
                stats["fragments_extracted"] += len(fragments)
                
                stats["files_processed"] += 1
        
        print("\n=== INGESTÃO COMPLETA ===")
        print(f"Arquivos processados: {stats['files_processed']}")
        print(f"Fontes criadas: {stats['sources_created']}")
        print(f"Nós (entidades): {stats['nodes_created']}")
        print(f"Arestas (relações): {stats['edges_created']}")
        print(f"Fragmentos extraídos: {stats['fragments_extracted']}")
        
        return stats
    
    def _save_as_source(self, file_name: str, content: str) -> str:
        """Salva conteúdo como fonte legacy"""
        # Determinar monte pelo nome do arquivo (heurística)
        monte = None
        if "monte" in file_name.lower():
            match = re.search(r'monte[_\s]([iv]+)', file_name.lower())
            if match:
                monte = f"monte_{match.group(1)}"
        
        source = self.sources_vault.upload_text(
            content=content,
            title=f"Rascunho: {os.path.basename(file_name)}",
            source_type=SourceType.LEGACY,
            author="R.Gis Veniloqa",
            monte=monte,
            tags=["rascunho_original", "zip_700p"]
        )
        
        return source.source_id
    
    def _extract_entities(self, content: str) -> List[GraphNode]:
        """
        Extrai entidades do texto
        
        Heurísticas:
        - Palavras-chave conhecidas (Cinzel, Gume, Monte, etc)
        - Nomes próprios (maiúsculas)
        - Conceitos entre aspas
        """
        entities = []
        
        # Palavras-chave conhecidas
        keywords = {
            "cinzel": NodeType.ESTILO,
            "gume": NodeType.ESTILO,
            "apneia": NodeType.CONCEITO,
            "rarefeitia": NodeType.CONCEITO,
            "lastro": NodeType.CONCEITO,
            "vácuo": NodeType.CONCEITO,
            "silêncio": NodeType.CONCEITO,
            "nexoritmo": NodeType.CONCEITO,
            "desconciliação": NodeType.CONCEITO
        }
        
        for keyword, node_type in keywords.items():
            if keyword.lower() in content.lower():
                node_id = f"node_{hashlib.md5(keyword.encode()).hexdigest()[:12]}"
                entities.append(GraphNode(
                    node_id=node_id,
                    type=node_type,
                    name=keyword.capitalize(),
                    properties={"source": "legacy_zip"}
                ))
        
        # Detectar Montes
        monte_pattern = r'Monte\s+([IVX]+)'
        for match in re.finditer(monte_pattern, content):
            monte_name = f"Monte {match.group(1)}"
            node_id = f"node_{hashlib.md5(monte_name.encode()).hexdigest()[:12]}"
            
            entities.append(GraphNode(
                node_id=node_id,
                type=NodeType.MONTE,
                name=monte_name,
                properties={"numeral": match.group(1)}
            ))
        
        return entities
    
    def _create_relationships(
        self,
        content: str,
        entities: List[GraphNode]
    ) -> List[GraphEdge]:
        """
        Cria relações entre entidades
        
        Exemplo:
        - "Cinzel" DEFINE "Atômico"
        - "Cinzel" PERTENCE_A "Monte II"
        """
        edges = []
        
        # Relações baseadas em padrões textuais
        
        # Exemplo: "X define Y" ou "X é Y"
        define_pattern = r'(\w+)\s+(define|é|são)\s+(\w+)'
        for match in re.finditer(define_pattern, content, re.IGNORECASE):
            source_name = match.group(1)
            target_name = match.group(3)
            
            # Buscar entidades correspondentes
            source_node = next((e for e in entities if e.name.lower() == source_name.lower()), None)
            target_node = next((e for e in entities if e.name.lower() == target_name.lower()), None)
            
            if source_node and target_node:
                edge_id = f"edge_{hashlib.md5(f'{source_node.node_id}_{target_node.node_id}'.encode()).hexdigest()[:12]}"
                edges.append(GraphEdge(
                    edge_id=edge_id,
                    source_node=source_node.node_id,
                    target_node=target_node.node_id,
                    type=EdgeType.DEFINE
                ))
        
        # Relações Monte -> Conceito
        for entity in entities:
            if entity.type == NodeType.MONTE:
                # Encontrar conceitos no mesmo contexto
                monte_context = self._get_context(content, entity.name, window=500)
                
                for other in entities:
                    if other.type == NodeType.CONCEITO and other.name.lower() in monte_context.lower():
                        edge_id = f"edge_{hashlib.md5(f'{other.node_id}_{entity.node_id}'.encode()).hexdigest()[:12]}"
                        edges.append(GraphEdge(
                            edge_id=edge_id,
                            source_node=other.node_id,
                            target_node=entity.node_id,
                            type=EdgeType.PERTENCE_A
                        ))
        
        return edges
    
    def _get_context(self, text: str, keyword: str, window: int = 500) -> str:
        """Extrai contexto ao redor de uma palavra-chave"""
        pos = text.lower().find(keyword.lower())
        if pos == -1:
            return ""
        
        start = max(0, pos - window)
        end = min(len(text), pos + len(keyword) + window)
        
        return text[start:end]
    
    def _extract_fragments(self, content: str) -> List[str]:
        """
        Extrai fragmentos importantes
        
        Critérios:
        - Parágrafos curtos e densos (< 100 palavras)
        - Contém palavras-chave
        - Alta densidade de estilo (apneia)
        """
        paragraphs = content.split('\n\n')
        fragments = []
        
        keywords = ["cinzel", "apneia", "vácuo", "silêncio", "gume", "lastro"]
        
        for para in paragraphs:
            words = para.split()
            
            # Critérios
            if 20 < len(words) < 100:  # Tamanho ideal
                if any(kw in para.lower() for kw in keywords):  # Tem palavra-chave
                    fragments.append(para.strip())
        
        return fragments


def main():
    """Execução via linha de comando"""
    if len(sys.argv) < 2:
        print("Uso: python ingest_legacy.py /path/to/rascunhos_700p.zip")
        sys.exit(1)
    
    zip_path = sys.argv[1]
    
    if not os.path.exists(zip_path):
        print(f"Erro: Arquivo não encontrado: {zip_path}")
        sys.exit(1)
    
    print(f"Iniciando ingestão de: {zip_path}")
    
    pipeline = LegacyIngestionPipeline()
    stats = pipeline.ingest_zip(zip_path)
    
    print("\n✅ Ingestão completa!")


if __name__ == "__main__":
    main()
