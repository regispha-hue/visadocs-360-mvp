"""POP Semantic Index - Indexação semântica avançada para POPs
Busca contextual e recomendação de POPs similares
"""

import sqlite3
import json
import re
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from collections import Counter
from pathlib import Path
from .pop_canon_registry import POPDocument, POPCategory

@dataclass
class SemanticMatch:
    """Resultado de busca semântica"""
    document_id: str
    codigo: str
    titulo: str
    categoria: POPCategory
    relevance_score: float
    match_reasons: List[str]
    content_snippet: str

class POPSemanticIndex:
    """Motor de busca semântica especializado para POPs"""
    
    def __init__(self, db_path: str = "data/pops_canon.db"):
        self.db_path = Path(db_path)
        self._load_semantic_vocabulary()
    
    def _load_semantic_vocabulary(self):
        """Carrega vocabulário semântico farmacêutico"""
        self.pharmacological_terms = {
            # Medicamentos e formas
            "cápsulas": ["cápsula", "capsula", "gelatina", "dura", "mole"],
            "cremes": ["creme", "pomada", "unguento", "dermatológico", "tópico"],
            "soluções": ["solução", "xarope", "líquido", "suspensão", "emulsão"],
            "pós": ["pó", "granulado", "sólido", "partícula"],
            "supositórios": ["supositório", "óvulo", "retal", "vaginal"],
            "injetáveis": ["injetável", "ampola", "seringa", "intramuscular", "endovenoso"],
            
            # Processos
            "pesagem": ["pesar", "balança", "grama", "miligrama", "precisão"],
            "mistura": ["misturar", "homogeneizar", "agitar", "combinar"],
            "filtração": ["filtrar", "filtro", "membrana", "purificar"],
            "esterilização": ["esterilizar", "autoclave", "calor", "microorganismo"],
            "envase": ["envasar", "acondicionar", "recipiente", "frasco"],
            
            # Controles
            "temperatura": ["temperatura", "calor", "frio", "climatização"],
            "umidade": ["umidade", "umidade relativa", "clima", "secagem"],
            "pressão": ["pressão", "vácuo", "atmosfera", "compressão"],
            "ph": ["ph", "acidez", "alcalinidade", "neutralidade"],
            
            # Equipamentos
            "balança": ["balança", "analítica", "precisão", "calibração"],
            "autoclave": ["autoclave", "esterilização", "vapor", "pressão"],
            "capsuladora": ["capsuladora", "encapsuladora", "cápsula"],
            "homogeneizador": ["homogeneizador", "misturador", "agitador"],
            
            # Segurança
            "epi": ["epi", "equipamento", "proteção", "individual", "segurança"],
            "paramentação": ["paramentação", "roupa", "capacete", "luva", "máscara"],
            "contaminação": ["contaminação", "cruzada", "microorganismo", "higiene"],
            
            # Regulatórios
            "rdc": ["rdc", "resolução", "anvisa", "vigilância", "sanitária"],
            "lote": ["lote", "rastreabilidade", "controle", "sequência"],
            "validade": ["validade", "prazo", "data", "vencimento"]
        }
        
        self.action_verbs = [
            "verificar", "inspecionar", "analisar", "testar", "calibrar",
            "limpar", "sanitizar", "esterilizar", "desinfetar", "higienizar",
            "registrar", "documentar", "assinar", "aprovar", "validar",
            "segregar", "separar", "identificar", "rotular", "armazenar",
            "descartar", "utilizar", "aplicar", "administrar", "dispensar"
        ]
        
        self.quality_indicators = [
            "conformidade", "não conformidade", "desvio", "correção",
            "preventiva", "corretiva", "ação", "melhoria", "contínua",
            "auditoria", "inspeção", "verificação", "validação"
        ]
    
    def index_document(self, doc_id: str, content: str, category: POPCategory):
        """Indexa documento semanticamente"""
        # Extrair termos semânticos
        semantic_terms = self._extract_semantic_terms(content)
        
        # Calcular scores de relevância
        term_scores = self._calculate_term_scores(semantic_terms, content)
        
        # Identificar padrões de processo
        process_patterns = self._identify_process_patterns(content)
        
        # Detectar entidades regulatórias
        regulatory_entities = self._detect_regulatory_entities(content)
        
        # Salvar no banco
        with sqlite3.connect(self.db_path) as conn:
            # Limpar indexação anterior
            conn.execute("DELETE FROM pop_semantic_index WHERE document_id = ?", (doc_id,))
            
            # Inserir novos termos
            for term, score in term_scores.items():
                conn.execute("""
                    INSERT INTO pop_semantic_index 
                    (document_id, keyword, relevance_score, category)
                    VALUES (?, ?, ?, ?)
                """, (doc_id, term, score, category.value))
            
            # Salvar metadados semânticos
            metadata = {
                "process_patterns": process_patterns,
                "regulatory_entities": regulatory_entities,
                "term_count": len(semantic_terms),
                "complexity_score": self._calculate_complexity_score(content)
            }
            
            conn.execute("""
                UPDATE pop_documents 
                SET axioms_applied = COALESCE(axioms_applied, '{}') || ? 
                WHERE id = ?
            """, (json.dumps({"semantic_metadata": metadata}), doc_id))
            
            conn.commit()
    
    def _extract_semantic_terms(self, content: str) -> List[str]:
        """Extrai termos semânticos do conteúdo"""
        content_lower = content.lower()
        terms = []
        
        # Extrair termos farmacêuticos
        for category, synonyms in self.pharmacological_terms.items():
            for synonym in synonyms:
                if synonym in content_lower:
                    terms.append(category)
                    break
        
        # Extrair verbos de ação
        for verb in self.action_verbs:
            if verb in content_lower:
                terms.append(f"action_{verb}")
        
        # Extrair indicadores de qualidade
        for indicator in self.quality_indicators:
            if indicator in content_lower:
                terms.append(f"quality_{indicator}")
        
        # Extrair números e medidas
        numbers = re.findall(r'\b\d+(?:\.\d+)?\s*(?:°c|%|mg|g|ml|l|kg|mm|cm|ph|ppm)\b', content_lower)
        for number in numbers:
            terms.append(f"measurement_{number}")
        
        return list(set(terms))
    
    def _calculate_term_scores(self, terms: List[str], content: str) -> Dict[str, float]:
        """Calcula scores de relevância para termos"""
        content_lower = content.lower()
        content_words = content_lower.split()
        total_words = len(content_words)
        scores = {}
        
        for term in terms:
            # Contar frequência do termo
            if "_" in term:
                # Termos compostos
                parts = term.split("_")
                count = sum(content_lower.count(part) for part in parts)
            else:
                count = content_lower.count(term)
            
            # Calcular score baseado na frequência e importância
            frequency_score = count / total_words if total_words > 0 else 0
            
            # Boost para termos importantes
            importance_boost = 1.0
            if any(important in term for important in ["rdc", "lote", "validade", "epi", "paramentação"]):
                importance_boost = 2.0
            elif any(important in term for important in ["balança", "autoclave", "temperatura", "umidade"]):
                importance_boost = 1.5
            
            scores[term] = min(frequency_score * importance_boost, 1.0)
        
        return scores
    
    def _identify_process_patterns(self, content: str) -> List[str]:
        """Identifica padrões de processo no conteúdo"""
        patterns = []
        content_lower = content.lower()
        
        # Padrões sequenciais
        if "passo" in content_lower or "etapa" in content_lower:
            patterns.append("sequential_process")
        
        # Padrões de decisão
        if any(word in content_lower for word in ["se", "caso", "verificar", "inspecionar"]):
            patterns.append("decision_process")
        
        # Padrões de segurança
        if any(word in content_lower for word in ["segurança", "risco", "perigo", "atenção"]):
            patterns.append("safety_process")
        
        # Padrões de qualidade
        if any(word in content_lower for word in ["qualidade", "controle", "verificação", "teste"]):
            patterns.append("quality_process")
        
        # Padrões de documentação
        if any(word in content_lower for word in ["registrar", "documentar", "assinar", "aprovar"]):
            patterns.append("documentation_process")
        
        return patterns
    
    def _detect_regulatory_entities(self, content: str) -> Dict[str, List[str]]:
        """Detecta entidades regulatórias no conteúdo"""
        entities = {
            "rdc_references": [],
            "norm_numbers": [],
            "dates": [],
            "responsibilities": []
        }
        
        content_lower = content.lower()
        
        # RDC references
        rdc_matches = re.findall(r'rdc\s*(?:n\.?\s*)?(\d+(?:/\d+)?)', content_lower)
        entities["rdc_references"] = rdc_matches
        
        # Números de norma
        norm_matches = re.findall(r'(?:portaria|lei|decreto)\s*(?:n\.?\s*)?(\d+(?:/\d+)?)', content_lower)
        entities["norm_numbers"] = norm_matches
        
        # Datas
        date_matches = re.findall(r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b', content)
        entities["dates"] = date_matches
        
        # Responsabilidades
        responsibility_matches = re.findall(r'(?:responsável|farmacêutico|técnico|supervisor)[:\s]*([^\n.,;]+)', content_lower)
        entities["responsibilities"] = [match.strip() for match in responsibility_matches]
        
        return entities
    
    def _calculate_complexity_score(self, content: str) -> float:
        """Calcula score de complexidade do documento"""
        factors = {
            "length": min(len(content) / 5000, 1.0),  # Comprimento
            "technical_terms": len(re.findall(r'\b(?:parâmetro|especificação|procedimento|validação|calibração)\b', content.lower())) / 100,
            "steps": len(re.findall(r'\b(?:passo|etapa|fase)\b', content.lower())) / 50,
            "conditions": len(re.findall(r'\b(?:se|caso|quando|assim)\b', content.lower())) / 100,
            "measurements": len(re.findall(r'\b\d+(?:\.\d+)?\s*(?:°c|%|mg|g|ml|l|kg|mm|cm|ph)\b', content.lower())) / 50
        }
        
        return min(sum(factors.values()) / len(factors), 1.0)
    
    def semantic_search(self, query: str, category: Optional[POPCategory] = None,
                       tenant_id: Optional[str] = None, limit: int = 10) -> List[SemanticMatch]:
        """Busca semântica avançada"""
        # Extrair termos da query
        query_terms = self._extract_semantic_terms(query)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            # Construir SQL dinâmico
            sql = """
                SELECT DISTINCT d.id, d.codigo, d.titulo, d.categoria, d.conteudo,
                       GROUP_CONCAT(si.keyword, ',') as keywords,
                       AVG(si.relevance_score) as avg_score
                FROM pop_documents d
                LEFT JOIN pop_semantic_index si ON d.id = si.document_id
                WHERE 1=1
            """
            params = []
            
            # Filtrar por termos da query
            if query_terms:
                term_conditions = []
                for term in query_terms[:5]:  # Limitar para performance
                    term_conditions.append("si.keyword LIKE ?")
                    params.append(f"%{term}%")
                
                if term_conditions:
                    sql += f" AND ({' OR '.join(term_conditions)})"
            
            # Filtrar por categoria
            if category:
                sql += " AND d.categoria = ?"
                params.append(category.value)
            
            # Filtrar por tenant
            if tenant_id:
                sql += " AND d.tenant_id = ?"
                params.append(tenant_id)
            
            sql += " GROUP BY d.id ORDER BY avg_score DESC, d.codigo LIMIT ?"
            params.append(limit)
            
            results = conn.execute(sql, params).fetchall()
            
            matches = []
            for row in results:
                # Calcular relevância detalhada
                relevance_score = self._calculate_detailed_relevance(
                    query, row["conteudo"], row["keywords"] or ""
                )
                
                # Gerar razões do match
                match_reasons = self._generate_match_reasons(
                    query, row["conteudo"], row["keywords"] or ""
                )
                
                # Gerar snippet
                snippet = self._generate_content_snippet(query, row["conteudo"])
                
                match = SemanticMatch(
                    document_id=row["id"],
                    codigo=row["codigo"],
                    titulo=row["titulo"],
                    categoria=POPCategory(row["categoria"]),
                    relevance_score=relevance_score,
                    match_reasons=match_reasons,
                    content_snippet=snippet
                )
                matches.append(match)
            
            return sorted(matches, key=lambda x: x.relevance_score, reverse=True)
    
    def _calculate_detailed_relevance(self, query: str, content: str, keywords: str) -> float:
        """Calcula relevância detalhada"""
        query_lower = query.lower()
        content_lower = content.lower()
        keyword_list = keywords.split(",") if keywords else []
        
        # Score baseado em termos exatos
        exact_matches = sum(1 for word in query_lower.split() if word in content_lower)
        exact_score = exact_matches / len(query_lower.split()) if query_lower.split() else 0
        
        # Score baseado em termos semânticos
        semantic_matches = sum(1 for keyword in keyword_list if keyword and keyword in query_lower)
        semantic_score = semantic_matches / len(keyword_list) if keyword_list else 0
        
        # Score baseado em contexto
        context_score = 0
        if any(word in content_lower for word in ["procedimento", "pop", "instrução"]):
            context_score += 0.2
        if any(word in content_lower for word in ["passo", "etapa", "sequência"]):
            context_score += 0.1
        
        return min((exact_score * 0.5 + semantic_score * 0.3 + context_score * 0.2), 1.0)
    
    def _generate_match_reasons(self, query: str, content: str, keywords: str) -> List[str]:
        """Gera razões para o match"""
        reasons = []
        query_lower = query.lower()
        content_lower = content.lower()
        keyword_list = keywords.split(",") if keywords else []
        
        # Termos exatos
        exact_words = [word for word in query_lower.split() if word in content_lower]
        if exact_words:
            reasons.append(f"Termos exatos: {', '.join(exact_words[:3])}")
        
        # Termos semânticos
        semantic_matches = [kw for kw in keyword_list if kw and kw in query_lower]
        if semantic_matches:
            reasons.append(f"Termos semânticos: {', '.join(semantic_matches[:3])}")
        
        # Contexto farmacêutico
        if any(word in content_lower for word in ["farmácia", "manipulação", "medicamento"]):
            reasons.append("Contexto farmacêutico")
        
        # Processo similar
        if any(word in content_lower for word in ["procedimento", "etapa", "passo"]):
            reasons.append("Estrutura de processo")
        
        return reasons[:3]  # Limitar a 3 razões
    
    def _generate_content_snippet(self, query: str, content: str, max_length: int = 200) -> str:
        """Gera snippet do conteúdo destacando termos da query"""
        query_words = [word.lower() for word in query.split()]
        content_lower = content.lower()
        
        # Encontrar melhor snippet
        best_start = 0
        best_score = 0
        
        for i in range(len(content) - max_length):
            snippet = content[i:i + max_length]
            snippet_lower = snippet.lower()
            
            # Calcular score do snippet
            score = sum(1 for word in query_words if word in snippet_lower)
            
            if score > best_score:
                best_score = score
                best_start = i
        
        # Extrair melhor snippet
        snippet = content[best_start:best_start + max_length]
        
        # Adicionar elipses se necessário
        if best_start > 0:
            snippet = "..." + snippet
        if best_start + max_length < len(content):
            snippet = snippet + "..."
        
        return snippet
    
    def recommend_similar_pops(self, doc_id: str, limit: int = 5) -> List[SemanticMatch]:
        """Recomenda POPs similares baseado em conteúdo semântico"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            # Buscar documento original
            original = conn.execute(
                "SELECT * FROM pop_documents WHERE id = ?", (doc_id,)
            ).fetchone()
            
            if not original:
                return []
            
            # Buscar termos semânticos do original
            keywords = conn.execute(
                "SELECT keyword FROM pop_semantic_index WHERE document_id = ?",
                (doc_id,)
            ).fetchall()
            
            keyword_list = [kw["keyword"] for kw in keywords]
            
            # Buscar documentos similares
            sql = """
                SELECT DISTINCT d.id, d.codigo, d.titulo, d.categoria, d.conteudo,
                       COUNT(si.keyword) as common_terms
                FROM pop_documents d
                JOIN pop_semantic_index si ON d.id = si.document_id
                WHERE si.keyword IN ({}) AND d.id != ? AND d.tenant_id = ?
                GROUP BY d.id
                ORDER BY common_terms DESC, d.codigo
                LIMIT ?
            """.format(",".join(["?"] * len(keyword_list)))
            
            params = keyword_list + [doc_id, original["tenant_id"], limit]
            
            if keyword_list:  # Só executar se houver keywords
                results = conn.execute(sql, params).fetchall()
            else:
                results = []
            
            matches = []
            for row in results:
                match = SemanticMatch(
                    document_id=row["id"],
                    codigo=row["codigo"],
                    titulo=row["titulo"],
                    categoria=POPCategory(row["categoria"]),
                    relevance_score=row["common_terms"] / len(keyword_list) if keyword_list else 0,
                    match_reasons=[f"{row['common_terms']} termos em comum"],
                    content_snippet=row["conteudo"][:200] + "..." if len(row["conteudo"]) > 200 else row["conteudo"]
                )
                matches.append(match)
            
            return matches
    
    def get_semantic_statistics(self, tenant_id: str) -> Dict[str, Any]:
        """Estatísticas semânticas do sistema"""
        with sqlite3.connect(self.db_path) as conn:
            stats = {}
            
            # Termos mais comuns
            common_terms = conn.execute("""
                SELECT keyword, COUNT(*) as count, AVG(relevance_score) as avg_score
                FROM pop_semantic_index si
                JOIN pop_documents d ON si.document_id = d.id
                WHERE d.tenant_id = ?
                GROUP BY keyword
                ORDER BY count DESC
                LIMIT 20
            """, (tenant_id,)).fetchall()
            
            stats["most_common_terms"] = [
                {"term": row["keyword"], "count": row["count"], "avg_score": row["avg_score"]}
                for row in common_terms
            ]
            
            # Categorias mais indexadas
            category_stats = conn.execute("""
                SELECT d.categoria, COUNT(*) as doc_count, COUNT(DISTINCT si.keyword) as term_count
                FROM pop_documents d
                LEFT JOIN pop_semantic_index si ON d.id = si.document_id
                WHERE d.tenant_id = ?
                GROUP BY d.categoria
                ORDER BY doc_count DESC
            """, (tenant_id,)).fetchall()
            
            stats["by_category"] = [
                {
                    "category": row["categoria"],
                    "document_count": row["doc_count"],
                    "unique_terms": row["term_count"]
                }
                for row in category_stats
            ]
            
            # Complexidade média
            complexity = conn.execute("""
                SELECT AVG(
                    CAST(
                        CASE 
                            WHEN json_extract(axioms_applied, '$.semantic_metadata.complexity_score') IS NOT NULL
                            THEN json_extract(axioms_applied, '$.semantic_metadata.complexity_score')
                            ELSE 0.5
                        END AS REAL
                    )
                ) as avg_complexity
                FROM pop_documents 
                WHERE tenant_id = ?
            """, (tenant_id,)).fetchone()
            
            stats["avg_complexity"] = complexity["avg_complexity"] or 0.5
            
            return stats
