"""POP Canon Registry - Registry especializado para POPs farmacêuticos
Integração com Nexoritia OS Canon Registry para validação RDC 67/2007
"""

import sqlite3
import json
import hashlib
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

class POPCategory(Enum):
    RECEBIMENTO = "recebimento_armazenamento"
    PESAGEM = "pesagem_balancas"
    MANIPULACAO = "manipulacao"
    CONTROLE_QUALIDADE = "controle_qualidade"
    EQUIPAMENTOS = "equipamentos"
    LIMPEZA = "limpeza_sanitizacao"
    DISPENSACAO = "dispensacao"
    SEGURANCA = "seguranca"
    ADMINISTRATIVO = "administrativo"

class POPStatus(Enum):
    DRAFT = "draft"
    VALIDATING = "validating"
    VALIDATED = "validated"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class POPType(Enum):
    RQ = "RQ"  # Registro da Qualidade
    MBP = "MBP"  # Manual de Boas Práticas
    ANEXO = "ANEXO"

@dataclass
class POPAxiom:
    """Axioma específico para POPs farmacêuticos"""
    id: str
    text: str
    hash: str
    category: POPCategory
    priority: str
    rdc_reference: Optional[str] = None
    validation_rule: Optional[str] = None

@dataclass
class POPDocument:
    """Documento POP com metadados semânticos"""
    id: str
    codigo: str
    titulo: str
    tipo: POPType
    categoria: POPCategory
    conteudo: str
    versao: str
    status: POPStatus
    axioms_applied: List[str]
    rdc_compliance: Dict[str, bool]
    created_at: datetime
    updated_at: datetime
    tenant_id: str

class POPCanonRegistry:
    """Registry especializado para POPs com integração Nexoritia OS"""
    
    def __init__(self, db_path: str = "data/pops_canon.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_database()
        self._load_pop_axioms()
    
    def init_database(self):
        """Inicializa banco de dados SQLite com schema especializado"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS pop_documents (
                    id TEXT PRIMARY KEY,
                    codigo TEXT UNIQUE NOT NULL,
                    titulo TEXT NOT NULL,
                    tipo TEXT NOT NULL,
                    categoria TEXT NOT NULL,
                    conteudo TEXT NOT NULL,
                    versao TEXT NOT NULL,
                    status TEXT NOT NULL,
                    axioms_applied TEXT,
                    rdc_compliance TEXT,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    tenant_id TEXT NOT NULL
                );
                
                CREATE TABLE IF NOT EXISTS pop_axioms (
                    id TEXT PRIMARY KEY,
                    text TEXT NOT NULL,
                    hash TEXT UNIQUE NOT NULL,
                    category TEXT NOT NULL,
                    priority TEXT NOT NULL,
                    rdc_reference TEXT,
                    validation_rule TEXT,
                    created_at TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS pop_semantic_index (
                    document_id TEXT,
                    keyword TEXT,
                    relevance_score REAL,
                    category TEXT,
                    FOREIGN KEY (document_id) REFERENCES pop_documents(id)
                );
                
                CREATE VIRTUAL TABLE IF NOT EXISTS pop_search USING fts5(
                    codigo, titulo, conteudo, categoria, tipo
                );
                
                CREATE TRIGGER IF NOT EXISTS pop_search_insert AFTER INSERT ON pop_documents
                BEGIN INSERT INTO pop_search(rowid, codigo, titulo, conteudo, categoria, tipo)
                VALUES (new.id, new.codigo, new.titulo, new.conteudo, new.categoria, new.tipo);
                END;
                
                CREATE TRIGGER IF NOT EXISTS pop_search_delete AFTER DELETE ON pop_documents
                BEGIN DELETE FROM pop_search WHERE rowid = old.id; END;
                
                CREATE TRIGGER IF NOT EXISTS pop_search_update AFTER UPDATE ON pop_documents
                BEGIN DELETE FROM pop_search WHERE rowid = old.id;
                INSERT INTO pop_search(rowid, codigo, titulo, conteudo, categoria, tipo)
                VALUES (new.id, new.codigo, new.titulo, new.conteudo, new.categoria, new.tipo);
                END;
            """)
    
    def _load_pop_axioms(self):
        """Carrega axiomas específicos para POPs farmacêuticos"""
        axioms = [
            # Axiomas RDC 67/2007
            POPAxiom(
                id="pop_rdc_001",
                text="Toda farmácia de manipulação deve possuir POPs para todas as atividades críticas",
                hash=hashlib.sha256("Toda farmácia de manipulação deve possuir POPs para todas as atividades críticas".encode()).hexdigest(),
                category=POPCategory.ADMINISTRATIVO,
                priority="critical",
                rdc_reference="RDC 67/2007 Art. 13",
                validation_rule="must_have_pop_for_critical_activities"
            ),
            POPAxiom(
                id="pop_rdc_002", 
                text="Os POPs devem ser elaborados, aprovados e datados pelo responsável técnico",
                hash=hashlib.sha256("Os POPs devem ser elaborados, aprovados e datados pelo responsável técnico".encode()).hexdigest(),
                category=POPCategory.ADMINISTRATIVO,
                priority="critical",
                rdc_reference="RDC 67/2007 Art. 14",
                validation_rule="must_be_approved_by_responsible_technician"
            ),
            POPAxiom(
                id="pop_rdc_003",
                text="Os POPs devem estar disponíveis nos locais de trabalho",
                hash=hashlib.sha256("Os POPs devem estar disponíveis nos locais de trabalho".encode()).hexdigest(),
                category=POPCategory.ADMINISTRATIVO,
                priority="critical",
                rdc_reference="RDC 67/2007 Art. 15",
                validation_rule="must_be_available_at_workplace"
            ),
            # Axiomas de Recebimento
            POPAxiom(
                id="pop_rec_001",
                text="Toda matéria-prima deve ser inspecionada no recebimento",
                hash=hashlib.sha256("Toda matéria-prima deve ser inspecionada no recebimento".encode()).hexdigest(),
                category=POPCategory.RECEBIMENTO,
                priority="high",
                validation_rule="must_inspect_raw_materials"
            ),
            POPAxiom(
                id="pop_rec_002",
                text="Materiais reprovados devem ser segregados e identificados",
                hash=hashlib.sha256("Materiais reprovados devem ser segregados e identificados".encode()).hexdigest(),
                category=POPCategory.RECEBIMENTO,
                priority="high",
                validation_rule="must_segregate_rejected_materials"
            ),
            # Axiomas de Pesagem
            POPAxiom(
                id="pop_pes_001",
                text="Balanças devem ser calibradas e verificadas periodicamente",
                hash=hashlib.sha256("Balanças devem ser calibradas e verificadas periodicamente".encode()).hexdigest(),
                category=POPCategory.PESAGEM,
                priority="critical",
                validation_rule="must_calibrate_scales"
            ),
            # Axiomas de Manipulação
            POPAxiom(
                id="pop_man_001",
                text="Paramentação é obrigatória para entrada na área de manipulação",
                hash=hashlib.sha256("Paramentação é obrigatória para entrada na área de manipulação".encode()).hexdigest(),
                category=POPCategory.MANIPULACAO,
                priority="critical",
                validation_rule="must_use_ppe"
            ),
            POPAxiom(
                id="pop_man_002",
                text="Cada manipulação deve ter registro de lote e responsável",
                hash=hashlib.sha256("Cada manipulação deve ter registro de lote e responsável".encode()).hexdigest(),
                category=POPCategory.MANIPULACAO,
                priority="critical",
                validation_rule="must_record_batch_and_responsible"
            ),
            # Axiomas de Controle de Qualidade
            POPAxiom(
                id="pop_cq_001",
                text="Água purificada deve ser testada diariamente",
                hash=hashlib.sha256("Água purificada deve ser testada diariamente".encode()).hexdigest(),
                category=POPCategory.CONTROLE_QUALIDADE,
                priority="high",
                validation_rule="must_test_purified_water_daily"
            ),
            # Axiomas de Limpeza
            POPAxiom(
                id="pop_lim_001",
                text="Áreas limpas e sujas devem ser segregadas",
                hash=hashlib.sha256("Áreas limpas e sujas devem ser segregadas".encode()).hexdigest(),
                category=POPCategory.LIMPEZA,
                priority="critical",
                validation_rule="must_segregate_clean_dirty_areas"
            ),
            # Axiomas de Dispensação
            POPAxiom(
                id="pop_disp_001",
                text="Prescrições devem ser avaliadas antes da dispensação",
                hash=hashlib.sha256("Prescrições devem ser avaliadas antes da dispensação".encode()).hexdigest(),
                category=POPCategory.DISPENSACAO,
                priority="critical",
                validation_rule="must_evaluate_prescriptions"
            )
        ]
        
        with sqlite3.connect(self.db_path) as conn:
            for axiom in axioms:
                conn.execute("""
                    INSERT OR REPLACE INTO pop_axioms 
                    (id, text, hash, category, priority, rdc_reference, validation_rule, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    axiom.id, axiom.text, axiom.hash, axiom.category.value,
                    axiom.priority, axiom.rdc_reference, axiom.validation_rule, datetime.now()
                ))
    
    def create_pop_document(self, pop_doc: POPDocument) -> str:
        """Cria novo documento POP com validação semântica"""
        with sqlite3.connect(self.db_path) as conn:
            # Validar conformidade RDC
            rdc_compliance = self._validate_rdc_compliance(pop_doc)
            
            # Aplicar axiomas relevantes
            axioms_applied = self._apply_axioms(pop_doc)
            
            conn.execute("""
                INSERT INTO pop_documents 
                (id, codigo, titulo, tipo, categoria, conteudo, versao, status, 
                 axioms_applied, rdc_compliance, created_at, updated_at, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pop_doc.id, pop_doc.codigo, pop_doc.titulo, pop_doc.tipo.value,
                pop_doc.categoria.value, pop_doc.conteudo, pop_doc.versao,
                pop_doc.status.value, json.dumps(axioms_applied),
                json.dumps(rdc_compliance), pop_doc.created_at, pop_doc.updated_at,
                pop_doc.tenant_id
            ))
            
            # Indexar semanticamente
            self._index_semantic_content(pop_doc.id, pop_doc.conteudo, pop_doc.categoria)
            
            conn.commit()
        return pop_doc.id
    
    def _validate_rdc_compliance(self, pop_doc: POPDocument) -> Dict[str, bool]:
        """Valida conformidade com RDC 67/2007"""
        compliance = {
            "has_codigo": bool(pop_doc.codigo),
            "has_titulo": bool(pop_doc.titulo),
            "has_versao": bool(pop_doc.versao),
            "has_responsible": "responsável" in pop_doc.conteudo.lower(),
            "has_date": any(char.isdigit() for char in pop_doc.conteudo),
            "has_signature": "assinatura" in pop_doc.conteudo.lower() or "rubrica" in pop_doc.conteudo.lower(),
            "has_validation": "validação" in pop_doc.conteudo.lower() or "aprovado" in pop_doc.conteudo.lower()
        }
        return compliance
    
    def _apply_axioms(self, pop_doc: POPDocument) -> List[str]:
        """Aplica axiomas relevantes ao documento"""
        applied_axioms = []
        
        with sqlite3.connect(self.db_path) as conn:
            category_axioms = conn.execute(
                "SELECT id, text FROM pop_axioms WHERE category = ? OR category = 'administrativo'",
                (pop_doc.categoria.value,)
            ).fetchall()
            
            content_lower = pop_doc.conteudo.lower()
            
            for axiom_id, axiom_text in category_axioms:
                # Verificar se o conteúdo segue o axioma
                if self._content_follows_axiom(content_lower, axiom_text):
                    applied_axioms.append(axiom_id)
        
        return applied_axioms
    
    def _content_follows_axiom(self, content: str, axiom: str) -> bool:
        """Verifica se o conteúdo segue um axioma específico"""
        # Lógica simplificada - pode ser expandida com NLP
        axiom_keywords = axiom.lower().split()
        content_words = set(content.split())
        
        # Verificar se palavras-chave do axioma estão no conteúdo
        matches = sum(1 for word in axiom_keywords if word in content_words)
        return matches >= len(axiom_keywords) * 0.3  # 30% de match
    
    def _index_semantic_content(self, doc_id: str, content: str, category: POPCategory):
        """Indexa conteúdo semanticamente para busca"""
        # Extrair palavras-chave relevantes
        keywords = self._extract_keywords(content)
        
        with sqlite3.connect(self.db_path) as conn:
            for keyword, score in keywords:
                conn.execute("""
                    INSERT INTO pop_semantic_index 
                    (document_id, keyword, relevance_score, category)
                    VALUES (?, ?, ?, ?)
                """, (doc_id, keyword, score, category.value))
    
    def _extract_keywords(self, content: str) -> List[Tuple[str, float]]:
        """Extrai palavras-chave com scores de relevância"""
        # Palavras-chave farmacêuticas importantes
        important_keywords = [
            "paramentação", "epi", "balança", "calibração", "pesagem",
            "manipulação", "cápsula", "creme", "pomada", "solução",
            "controle", "qualidade", "teste", "análise", "lote",
            "registro", "responsável", "validação", "aprovação",
            "temperatura", "umidade", "limpeza", "sanitização",
            "dispensação", "prescrição", "paciente", "farmacêutico"
        ]
        
        content_lower = content.lower()
        keywords = []
        
        for keyword in important_keywords:
            count = content_lower.count(keyword)
            if count > 0:
                score = min(count * 0.1, 1.0)  # Score até 1.0
                keywords.append((keyword, score))
        
        return sorted(keywords, key=lambda x: x[1], reverse=True)[:20]
    
    def search_pops(self, query: str, category: Optional[POPCategory] = None, 
                   tenant_id: Optional[str] = None) -> List[POPDocument]:
        """Busca POPs com suporte full-text e semântico"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            sql = """
                SELECT d.*, 
                       rank FROM pop_search 
                WHERE pop_search MATCH ?
            """
            params = [query]
            
            if category:
                sql += " AND categoria = ?"
                params.append(category.value)
            
            if tenant_id:
                sql += " AND tenant_id = ?"
                params.append(tenant_id)
            
            sql += " ORDER BY rank"
            
            results = conn.execute(sql, params).fetchall()
            
            pops = []
            for row in results:
                pop = POPDocument(
                    id=row["id"],
                    codigo=row["codigo"],
                    titulo=row["titulo"],
                    tipo=POPType(row["tipo"]),
                    categoria=POPCategory(row["categoria"]),
                    conteudo=row["conteudo"],
                    versao=row["versao"],
                    status=POPStatus(row["status"]),
                    axioms_applied=json.loads(row["axioms_applied"] or "[]"),
                    rdc_compliance=json.loads(row["rdc_compliance"] or "{}"),
                    created_at=datetime.fromisoformat(row["created_at"]),
                    updated_at=datetime.fromisoformat(row["updated_at"]),
                    tenant_id=row["tenant_id"]
                )
                pops.append(pop)
            
            return pops
    
    def get_pop_by_codigo(self, codigo: str, tenant_id: str) -> Optional[POPDocument]:
        """Busca POP por código específico"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT * FROM pop_documents WHERE codigo = ? AND tenant_id = ?",
                (codigo, tenant_id)
            ).fetchone()
            
            if not row:
                return None
            
            return POPDocument(
                id=row["id"],
                codigo=row["codigo"],
                titulo=row["titulo"],
                tipo=POPType(row["tipo"]),
                categoria=POPCategory(row["categoria"]),
                conteudo=row["conteudo"],
                versao=row["versao"],
                status=POPStatus(row["status"]),
                axioms_applied=json.loads(row["axioms_applied"] or "[]"),
                rdc_compliance=json.loads(row["rdc_compliance"] or "{}"),
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
                tenant_id=row["tenant_id"]
            )
    
    def get_pops_by_category(self, category: POPCategory, tenant_id: str) -> List[POPDocument]:
        """Lista POPs por categoria"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT * FROM pop_documents WHERE categoria = ? AND tenant_id = ? ORDER BY codigo",
                (category.value, tenant_id)
            ).fetchall()
            
            return [
                POPDocument(
                    id=row["id"],
                    codigo=row["codigo"],
                    titulo=row["titulo"],
                    tipo=POPType(row["tipo"]),
                    categoria=POPCategory(row["categoria"]),
                    conteudo=row["conteudo"],
                    versao=row["versao"],
                    status=POPStatus(row["status"]),
                    axioms_applied=json.loads(row["axioms_applied"] or "[]"),
                    rdc_compliance=json.loads(row["rdc_compliance"] or "{}"),
                    created_at=datetime.fromisoformat(row["created_at"]),
                    updated_at=datetime.fromisoformat(row["updated_at"]),
                    tenant_id=row["tenant_id"]
                )
                for row in rows
            ]
    
    def get_axioms_by_category(self, category: POPCategory) -> List[POPAxiom]:
        """Lista axiomas por categoria"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT * FROM pop_axioms WHERE category = ? OR category = 'administrativo' ORDER BY priority DESC",
                (category.value,)
            ).fetchall()
            
            return [
                POPAxiom(
                    id=row["id"],
                    text=row["text"],
                    hash=row["hash"],
                    category=POPCategory(row["category"]),
                    priority=row["priority"],
                    rdc_reference=row["rdc_reference"],
                    validation_rule=row["validation_rule"]
                )
                for row in rows
            ]
    
    def get_statistics(self, tenant_id: str) -> Dict[str, Any]:
        """Estatísticas dos POPs"""
        with sqlite3.connect(self.db_path) as conn:
            stats = {}
            
            # Total por categoria
            category_stats = conn.execute("""
                SELECT categoria, COUNT(*) as count 
                FROM pop_documents 
                WHERE tenant_id = ?
                GROUP BY categoria
            """, (tenant_id,)).fetchall()
            
            stats["by_category"] = {row["categoria"]: row["count"] for row in category_stats}
            
            # Total por status
            status_stats = conn.execute("""
                SELECT status, COUNT(*) as count 
                FROM pop_documents 
                WHERE tenant_id = ?
                GROUP BY status
            """, (tenant_id,)).fetchall()
            
            stats["by_status"] = {row["status"]: row["count"] for row in status_stats}
            
            # Conformidade RDC
            compliance_stats = conn.execute("""
                SELECT 
                    AVG(CAST(json_extract(rdc_compliance, '$.has_codigo') AS INTEGER)) as has_codigo,
                    AVG(CAST(json_extract(rdc_compliance, '$.has_titulo') AS INTEGER)) as has_titulo,
                    AVG(CAST(json_extract(rdc_compliance, '$.has_versao') AS INTEGER)) as has_versao,
                    AVG(CAST(json_extract(rdc_compliance, '$.has_responsible') AS INTEGER)) as has_responsible,
                    AVG(CAST(json_extract(rdc_compliance, '$.has_date') AS INTEGER)) as has_date
                FROM pop_documents 
                WHERE tenant_id = ?
            """, (tenant_id,)).fetchone()
            
            stats["rdc_compliance_avg"] = {
                "has_codigo": compliance_stats["has_codigo"] or 0,
                "has_titulo": compliance_stats["has_titulo"] or 0,
                "has_versao": compliance_stats["has_versao"] or 0,
                "has_responsible": compliance_stats["has_responsible"] or 0,
                "has_date": compliance_stats["has_date"] or 0
            }
            
            stats["total_pops"] = conn.execute(
                "SELECT COUNT(*) FROM pop_documents WHERE tenant_id = ?", 
                (tenant_id,)
            ).fetchone()[0]
            
            return stats
