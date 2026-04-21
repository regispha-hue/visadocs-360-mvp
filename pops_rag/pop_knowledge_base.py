"""POP Knowledge Base - Gestão centralizada de conhecimento farmacêutico
Base de conhecimento especializada com integração RAG e Nexoritia OS
"""

import sqlite3
import json
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from .pop_canon_registry import POPDocument, POPCategory, POPType
from .pop_semantic_index import POPSemanticIndex
from .pop_validation_engine import POPValidationEngine, ValidationReport

@dataclass
class KnowledgeEntry:
    """Entrada na base de conhecimento"""
    id: str
    title: str
    content: str
    category: POPCategory
    entry_type: str  # "best_practice", "regulation", "warning", "template"
    source: str
    relevance_score: float
    created_at: datetime
    updated_at: datetime
    tags: List[str]
    related_pops: List[str]

@dataclass
class POPKit:
    """Kit de POPs por categoria"""
    id: str
    name: str
    category: POPCategory
    description: str
    required_pops: List[str]  # Códigos dos POPs obrigatórios
    optional_pops: List[str]  # Códigos dos POPs opcionais
    compliance_score: float
    created_at: datetime
    updated_at: datetime

class POPKnowledgeBase:
    """Base de conhecimento especializada para POPs farmacêuticos"""
    
    def __init__(self, db_path: str = "data/pops_knowledge.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_database()
        self.semantic_index = POPSemanticIndex()
        self.validation_engine = POPValidationEngine()
        self._load_initial_knowledge()
    
    def init_database(self):
        """Inicializa banco de dados da base de conhecimento"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS knowledge_entries (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    category TEXT NOT NULL,
                    entry_type TEXT NOT NULL,
                    source TEXT NOT NULL,
                    relevance_score REAL,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    tags TEXT,
                    related_pops TEXT
                );
                
                CREATE TABLE IF NOT EXISTS pop_kits (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    description TEXT NOT NULL,
                    required_pops TEXT,
                    optional_pops TEXT,
                    compliance_score REAL,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS learning_insights (
                    id TEXT PRIMARY KEY,
                    insight_type TEXT NOT NULL,
                    category TEXT,
                    content TEXT NOT NULL,
                    confidence_score REAL,
                    source_documents TEXT,
                    created_at TIMESTAMP
                );
                
                CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_search USING fts5(
                    title, content, category, entry_type, tags
                );
                
                CREATE TRIGGER IF NOT EXISTS knowledge_search_insert AFTER INSERT ON knowledge_entries
                BEGIN INSERT INTO knowledge_search(rowid, title, content, category, entry_type, tags)
                VALUES (new.id, new.title, new.content, new.category, new.entry_type, new.tags);
                END;
                
                CREATE TRIGGER IF NOT EXISTS knowledge_search_delete AFTER DELETE ON knowledge_entries
                BEGIN DELETE FROM knowledge_search WHERE rowid = old.id; END;
                
                CREATE TRIGGER IF NOT EXISTS knowledge_search_update AFTER UPDATE ON knowledge_entries
                BEGIN DELETE FROM knowledge_search WHERE rowid = old.id;
                INSERT INTO knowledge_search(rowid, title, content, category, entry_type, tags)
                VALUES (new.id, new.title, new.content, new.category, new.entry_type, new.tags);
                END;
            """)
    
    def _load_initial_knowledge(self):
        """Carrega conhecimento inicial farmacêutico"""
        initial_entries = [
            # Melhores práticas
            KnowledgeEntry(
                id="bp_001",
                title="Paramentação para Área de Manipulação",
                content="""
                BEST PRACTICE: Paramentação completa é obrigatória para entrada em área de manipulação.
                
                PROCEDIMENTO:
                1. Trocar roupas pessoais por uniforme completo
                2. Colocar propés (touca)
                3. Vestir jaleco fechado
                4. Colocar máscara cirúrgica
                5. Colocar luvas estéreis (se aplicável)
                6. Realizar lavagem das mãos
                
                VERIFICAÇÃO:
                - Todos os EPIs devem estar em perfeito estado
                - Paramentação deve ser verificada por supervisor
                - Registro em livro de paramentação
                
                RDC 67/2007 Art. 31: Exigência de paramentação completa.
                """,
                category=POPCategory.MANIPULACAO,
                entry_type="best_practice",
                source="RDC 67/2007",
                relevance_score=1.0,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                tags=["paramentação", "epi", "segurança", "manipulação"],
                related_pops=[]
            ),
            KnowledgeEntry(
                id="bp_002",
                title="Calibração de Balanças Analíticas",
                content="""
                BEST PRACTICE: Calibração diária de balanças é essencial para precisão.
                
                FREQUÊNCIA:
                - Verificação diária com peso padrão
                - Calibração completa semanal
                - Calibração por técnico especializado mensal
                
                PROCEDIMENTO:
                1. Limpar balança
                2. Nivelar equipamento
                3. Verificar peso padrão (ex: 100g)
                4. Ajustar se necessário
                5. Registrar em livro de calibração
                
                TOLERÂNCIA:
                - Balança analítica: ±0.1mg
                - Balança semi-analítica: ±1mg
                
                RDC 67/2007 Art. 24: Exigência de calibração regular.
                """,
                category=POPCategory.PESAGEM,
                entry_type="best_practice",
                source="RDC 67/2007",
                relevance_score=1.0,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                tags=["balança", "calibração", "precisão", "pesagem"],
                related_pops=[]
            ),
            KnowledgeEntry(
                id="bp_003",
                title="Controle de Temperatura e Umidade",
                content="""
                BEST PRACTICE: Monitoramento constante de condições ambientais.
                
                PARÂMETROS:
                - Temperatura: 15-30°C (variável por produto)
                - Umidade relativa: 40-75%
                
                MONITORAMENTO:
                - Registrar a cada 4 horas
                - Alarme para desvios
                - Ação corretiva imediata fora dos limites
                
                EQUIPAMENTOS:
                - Termômetros calibrados
                - Higrômetros verificados
                - Sistema de alarme
                
                RDC 67/2007 Art. 20: Controle ambiental obrigatório.
                """,
                category=POPCategory.RECEBIMENTO,
                entry_type="best_practice",
                source="RDC 67/2007",
                relevance_score=1.0,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                tags=["temperatura", "umidade", "climatização", "monitoramento"],
                related_pops=[]
            ),
            # Regulamentações
            KnowledgeEntry(
                id="reg_001",
                title="RDC 67/2007 - Requisitos Obrigatórios",
                content="""
                REGULATION: Resolução RDC 67/2007 - Boas Práticas de Manipulação.
                
                REQUISITOS OBRIGATÓRIOS:
                1. POPs para todas as atividades críticas
                2. Manual de Boas Práticas
                3. Registros de todas as operações
                4. Controle de matérias-primas
                5. Qualificação de fornecedores
                6. Controle de processo
                7. Avaliação final do produto
                8. Garantia de qualidade
                9. Atendimento a reclamações
                10. Recolhimento de produtos
                
                SANÇÕES:
                - Multa: R$ 2.000 a R$ 200.000
                - Suspensão: até 6 meses
                - Cassação: em casos graves
                
                VIGÊNCIA: Desde 08/10/2007
                """,
                category=POPCategory.ADMINISTRATIVO,
                entry_type="regulation",
                source="ANVISA",
                relevance_score=1.0,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                tags=["rdc", "anvisa", "regulamentação", "multa"],
                related_pops=[]
            ),
            KnowledgeEntry(
                id="reg_002",
                title="Portaria 344/1998 - Substâncias Controladas",
                content="""
                REGULATION: Portaria 344/1998 - Controle de substâncias entorpecentes.
                
                REQUISITOS:
                1. Licença especial
                2. Receituário em 2 vias
                3. Registro eletrônico
                4. Balanço mensal
                5. Notificação de compra
                6. Armazenamento seguro
                
                CATEGORIAS:
                - A1: Proibidas
                - A2: Uso controlado
                - A3: Psicotrópicos
                - B: Antibióticos
                - C: Outras
                
                PENALIDADES:
                - Crime: 6 a 12 anos de prisão
                - Multa: 2.000 a 50.000 UFIR
                
                VIGÊNCIA: Desde 12/05/1998
                """,
                category=POPCategory.DISPENSACAO,
                entry_type="regulation",
                source="ANVISA",
                relevance_score=1.0,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                tags=["portaria", "344", "controlado", "psicotrópicos"],
                related_pops=[]
            ),
            # Alertas e avisos
            KnowledgeEntry(
                id="warn_001",
                title="ALERTA: Contaminação Cruzada",
                content="""
                WARNING: Risco de contaminação cruzada em áreas de manipulação.
                
                SITUAÇÕES DE RISCO:
                - Manipulação simultânea de múltiplos produtos
                - Equipamentos compartilhados sem limpeza adequada
                - Pessoal circulando entre áreas limpas/sujas
                - Ventilação inadequada
                
                PREVENÇÃO:
                1. Segregar produtos por tipo
                2. Limpeza rigorosa entre manipulações
                3. Usar equipamentos dedicados quando possível
                4. Controlar fluxo de pessoal
                
                SINTOMAS DE CONTAMINAÇÃO:
                - Reações alérgicas inesperadas
                - Eficácia reduzida
                - Alterações organolépticas
                
                AÇÃO: Interromper uso imediatamente e investigar causa.
                """,
                category=POPCategory.MANIPULACAO,
                entry_type="warning",
                source="Best Practice",
                relevance_score=0.9,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                tags=["contaminação", "cruzada", "risco", "segurança"],
                related_pops=[]
            ),
            KnowledgeEntry(
                id="warn_002",
                title="ALERTA: Desvio de Qualidade",
                content="""
                WARNING: Procedimento para desvios de qualidade detectados.
                
                TIPOS DE DESVIO:
                - Fora de especificação
                - Contaminação microbiana
                - Alteração física
                - Eficácia comprometida
                
                AÇÃO IMEDIATA:
                1. Isolar lote afetado
                2. Notificar responsável técnico
                3. Iniciar investigação
                4. Registrar desvio
                
                INVESTIGAÇÃO:
                - Análise de causa raiz
                - Avaliação de impacto
                - Plano de ação corretiva
                
                COMUNICAÇÃO:
                - Interno: Equipe qualidade
                - Externo: Cliente (se necessário)
                - Autoridades: Se grave
                
                PREVENÇÃO:
                - Revisar POPs relacionados
                - Treinar equipe
                - Melhorar controles
                """,
                category=POPCategory.CONTROLE_QUALIDADE,
                entry_type="warning",
                source="Best Practice",
                relevance_score=0.9,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                tags=["desvio", "qualidade", "investigação", "ação corretiva"],
                related_pops=[]
            ),
            # Templates
            KnowledgeEntry(
                id="tpl_001",
                title="Template POP - Estrutura Básica",
                content="""
                TEMPLATE: Estrutura padrão para POPs farmacêuticos.
                
                CABEÇALHO:
                - Código: POP.XXX
                - Título: [Descrição clara do procedimento]
                - Versão: X.X
                - Data: DD/MM/YYYY
                - Setor: [Nome do setor]
                - Páginas: N/N
                
                SEÇÕES OBRIGATÓRIAS:
                1. OBJETIVO
                   [Descrição clara do propósito]
                
                2. SETOR E EQUIPE
                   - Setor responsável
                   - Equipe técnica envolvida
                   - Responsabilidades
                
                3. GLOSSÁRIO
                   [Definições de termos técnicos]
                
                4. MATERIAIS E EQUIPAMENTOS
                   - Lista completa
                   - Especificações técnicas
                   - Quantidades
                
                5. PROCEDIMENTO DETALHADO
                   - Passo a passo
                   - Pontos críticos
                   - Ações corretivas
                
                6. REGISTROS OBRIGATÓRIOS
                   [Formulários e documentos]
                
                7. REFERÊNCIAS
                   [Literatura e normativas]
                
                RODAPÉ:
                - Elaborado por: [Nome/Cargo]
                - Aprovado por: [Nome/Cargo]
                - Data de implantação: DD/MM/YYYY
                - Próxima revisão: DD/MM/YYYY
                """,
                category=POPCategory.ADMINISTRATIVO,
                entry_type="template",
                source="Best Practice",
                relevance_score=0.8,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                tags=["template", "estrutura", "padrão", "pop"],
                related_pops=[]
            )
        ]
        
        # Inserir entradas iniciais
        with sqlite3.connect(self.db_path) as conn:
            for entry in initial_entries:
                conn.execute("""
                    INSERT OR REPLACE INTO knowledge_entries 
                    (id, title, content, category, entry_type, source, relevance_score, 
                     created_at, updated_at, tags, related_pops)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    entry.id, entry.title, entry.content, entry.category.value,
                    entry.entry_type, entry.source, entry.relevance_score,
                    entry.created_at, entry.updated_at, json.dumps(entry.tags),
                    json.dumps(entry.related_pops)
                ))
        
        # Criar kits de POPs
        self._create_pop_kits()
    
    def _create_pop_kits(self):
        """Cria kits de POPs por categoria"""
        kits = [
            POPKit(
                id="kit_001",
                name="Kit Recebimento e Armazenamento",
                category=POPCategory.RECEBIMENTO,
                description="POPs essenciais para recebimento e armazenamento de matérias-primas",
                required_pops=["POP.001", "POP.002", "POP.003", "POP.004", "POP.005"],
                optional_pops=["POP.006", "POP.007"],
                compliance_score=0.95,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            POPKit(
                id="kit_002",
                name="Kit Pesagem e Balanças",
                category=POPCategory.PESAGEM,
                description="POPs para operações de pesagem e controle de balanças",
                required_pops=["POP.008", "POP.009", "POP.010"],
                optional_pops=["POP.011"],
                compliance_score=0.98,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            POPKit(
                id="kit_003",
                name="Kit Manipulação Farmacêutica",
                category=POPCategory.MANIPULACAO,
                description="POPs para todas as etapas de manipulação",
                required_pops=["POP.012", "POP.013", "POP.014", "POP.015", "POP.016", "POP.017", "POP.018"],
                optional_pops=["POP.019", "POP.020"],
                compliance_score=0.92,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            POPKit(
                id="kit_004",
                name="Kit Controle de Qualidade",
                category=POPCategory.CONTROLE_QUALIDADE,
                description="POPs para controle de qualidade de produtos",
                required_pops=["POP.021", "POP.022", "POP.023", "POP.024", "POP.025"],
                optional_pops=["POP.026"],
                compliance_score=0.96,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            POPKit(
                id="kit_005",
                name="Kit Equipamentos",
                category=POPCategory.EQUIPAMENTOS,
                description="POPs para operação e manutenção de equipamentos",
                required_pops=["POP.027", "POP.028", "POP.029", "POP.030", "POP.031"],
                optional_pops=["POP.032"],
                compliance_score=0.94,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            POPKit(
                id="kit_006",
                name="Kit Limpeza e Sanitização",
                category=POPCategory.LIMPEZA,
                description="POPs para limpeza e sanitização de áreas e equipamentos",
                required_pops=["POP.033", "POP.034", "POP.035", "POP.036", "POP.037"],
                optional_pops=[],
                compliance_score=0.97,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            POPKit(
                id="kit_007",
                name="Kit Dispensação",
                category=POPCategory.DISPENSACAO,
                description="POPs para dispensação de medicamentos",
                required_pops=["POP.038", "POP.039", "POP.040", "POP.041"],
                optional_pops=[],
                compliance_score=0.93,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            POPKit(
                id="kit_008",
                name="Kit Segurança",
                category=POPCategory.SEGURANCA,
                description="POPs para segurança ocupacional",
                required_pops=["POP.042", "POP.043", "POP.044", "POP.045"],
                optional_pops=[],
                compliance_score=0.99,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            POPKit(
                id="kit_009",
                name="Kit Administrativo",
                category=POPCategory.ADMINISTRATIVO,
                description="POPs para gestão administrativa",
                required_pops=["POP.046", "POP.047", "POP.048", "POP.049", "POP.050"],
                optional_pops=[],
                compliance_score=0.91,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]
        
        with sqlite3.connect(self.db_path) as conn:
            for kit in kits:
                conn.execute("""
                    INSERT OR REPLACE INTO pop_kits 
                    (id, name, category, description, required_pops, optional_pops, 
                     compliance_score, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    kit.id, kit.name, kit.category.value, kit.description,
                    json.dumps(kit.required_pops), json.dumps(kit.optional_pops),
                    kit.compliance_score, kit.created_at, kit.updated_at
                ))
    
    def add_knowledge_entry(self, entry: KnowledgeEntry) -> str:
        """Adiciona nova entrada na base de conhecimento"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO knowledge_entries 
                (id, title, content, category, entry_type, source, relevance_score, 
                 created_at, updated_at, tags, related_pops)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                entry.id, entry.title, entry.content, entry.category.value,
                entry.entry_type, entry.source, entry.relevance_score,
                entry.created_at, entry.updated_at, json.dumps(entry.tags),
                json.dumps(entry.related_pops)
            ))
            conn.commit()
        
        # Indexar semanticamente
        self.semantic_index.index_document(entry.id, entry.content, entry.category)
        
        return entry.id
    
    def search_knowledge(self, query: str, category: Optional[POPCategory] = None,
                        entry_type: Optional[str] = None, limit: int = 20) -> List[KnowledgeEntry]:
        """Busca na base de conhecimento"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            sql = """
                SELECT * FROM knowledge_entries 
                WHERE 1=1
            """
            params = []
            
            if category:
                sql += " AND category = ?"
                params.append(category.value)
            
            if entry_type:
                sql += " AND entry_type = ?"
                params.append(entry_type)
            
            if query:
                sql += " AND (title LIKE ? OR content LIKE ?)"
                params.extend([f"%{query}%", f"%{query}%"])
            
            sql += " ORDER BY relevance_score DESC, created_at DESC LIMIT ?"
            params.append(limit)
            
            results = conn.execute(sql, params).fetchall()
            
            return [
                KnowledgeEntry(
                    id=row["id"],
                    title=row["title"],
                    content=row["content"],
                    category=POPCategory(row["category"]),
                    entry_type=row["entry_type"],
                    source=row["source"],
                    relevance_score=row["relevance_score"],
                    created_at=datetime.fromisoformat(row["created_at"]),
                    updated_at=datetime.fromisoformat(row["updated_at"]),
                    tags=json.loads(row["tags"] or "[]"),
                    related_pops=json.loads(row["related_pops"] or "[]")
                )
                for row in results
            ]
    
    def get_pop_kit(self, category: POPCategory) -> Optional[POPKit]:
        """Busca kit de POPs por categoria"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT * FROM pop_kits WHERE category = ?",
                (category.value,)
            ).fetchone()
            
            if not row:
                return None
            
            return POPKit(
                id=row["id"],
                name=row["name"],
                category=POPCategory(row["category"]),
                description=row["description"],
                required_pops=json.loads(row["required_pops"] or "[]"),
                optional_pops=json.loads(row["optional_pops"] or "[]"),
                compliance_score=row["compliance_score"],
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"])
            )
    
    def analyze_pop_compliance(self, pop_docs: List[POPDocument]) -> Dict[str, Any]:
        """Analisa conformidade dos POPs com base de conhecimento"""
        analysis = {
            "total_pops": len(pop_docs),
            "by_category": {},
            "compliance_scores": {},
            "missing_pops": {},
            "recommendations": [],
            "knowledge_gaps": []
        }
        
        # Agrupar por categoria
        pops_by_category = {}
        for pop in pop_docs:
            if pop.categoria not in pops_by_category:
                pops_by_category[pop.categoria] = []
            pops_by_category[pop.categoria].append(pop)
        
        # Analisar cada categoria
        for category, pops in pops_by_category.items():
            kit = self.get_pop_kit(category)
            if not kit:
                continue
            
            pop_codigos = [pop.codigo for pop in pops]
            
            # Verificar POPs obrigatórios
            missing_required = [pop for pop in kit.required_pops if pop not in pop_codigos]
            missing_optional = [pop for pop in kit.optional_pops if pop not in pop_codigos]
            
            # Calcular score de conformidade
            required_count = len(kit.required_pops)
            present_count = required_count - len(missing_required)
            compliance_score = present_count / required_count if required_count > 0 else 0
            
            analysis["by_category"][category.value] = {
                "total_pops": len(pops),
                "required_pops": required_count,
                "present_pops": present_count,
                "missing_required": missing_required,
                "missing_optional": missing_optional,
                "compliance_score": compliance_score
            }
            
            analysis["compliance_scores"][category.value] = compliance_score
            analysis["missing_pops"][category.value] = {
                "required": missing_required,
                "optional": missing_optional
            }
        
        # Gerar recomendações
        for category, data in analysis["by_category"].items():
            if data["compliance_score"] < 0.8:
                analysis["recommendations"].append(
                    f"Priorizar criação dos POPs obrigatórios faltantes em {category}"
                )
            
            if data["missing_required"]:
                analysis["recommendations"].append(
                    f"Criar POPs: {', '.join(data['missing_required'][:3])}"
                )
        
        # Identificar gaps de conhecimento
        for category, data in analysis["by_category"].items():
            if data["compliance_score"] < 0.5:
                analysis["knowledge_gaps"].append({
                    "category": category,
                    "gap": "Baixa conformidade com POPs obrigatórios",
                    "severity": "high"
                })
            elif data["missing_optional"]:
                analysis["knowledge_gaps"].append({
                    "category": category,
                    "gap": "POPs opcionais não implementados",
                    "severity": "medium"
                })
        
        return analysis
    
    def get_learning_insights(self, category: Optional[POPCategory] = None,
                           days: int = 30) -> List[Dict[str, Any]]:
        """Gera insights de aprendizado baseados nos dados"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            sql = """
                SELECT * FROM learning_insights 
                WHERE created_at >= datetime('now', '-{} days')
            """.format(days)
            params = []
            
            if category:
                sql += " AND category = ?"
                params.append(category.value)
            
            sql += " ORDER BY confidence_score DESC"
            
            results = conn.execute(sql, params).fetchall()
            
            return [
                {
                    "id": row["id"],
                    "type": row["insight_type"],
                    "category": row["category"],
                    "content": row["content"],
                    "confidence": row["confidence_score"],
                    "sources": json.loads(row["source_documents"] or "[]"),
                    "created_at": row["created_at"]
                }
                for row in results
            ]
    
    def generate_learning_insights(self, pop_docs: List[POPDocument]) -> List[Dict[str, Any]]:
        """Gera insights automáticos baseados nos POPs analisados"""
        insights = []
        
        # Analisar padrões de não conformidade
        validation_reports = []
        for pop in pop_docs:
            report = self.validation_engine.validate_pop_document(pop)
            validation_reports.append((pop.codigo, report))
        
        # Identificar problemas comuns
        issue_counts = {}
        for codigo, report in validation_reports:
            for issue in report.issues:
                issue_type = issue.rule_id
                if issue_type not in issue_counts:
                    issue_counts[issue_type] = 0
                issue_counts[issue_type] += 1
        
        # Gerar insights para problemas frequentes
        for issue_type, count in issue_counts.items():
            if count >= 3:  # Problema aparece em 3+ POPs
                insight = {
                    "id": f"insight_{datetime.now().timestamp()}",
                    "type": "pattern_detection",
                    "content": f"Problema '{issue_type}' detectado em {count} POPs. Considerar treinamento específico.",
                    "confidence": min(count / len(pop_docs), 1.0),
                    "sources": [codigo for codigo, _ in validation_reports],
                    "created_at": datetime.now()
                }
                insights.append(insight)
        
        # Salvar insights no banco
        with sqlite3.connect(self.db_path) as conn:
            for insight in insights:
                conn.execute("""
                    INSERT INTO learning_insights 
                    (id, insight_type, content, confidence_score, source_documents, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    insight["id"], insight["type"], insight["content"],
                    insight["confidence"], json.dumps(insight["sources"]),
                    insight["created_at"]
                ))
            conn.commit()
        
        return insights
    
    def get_knowledge_statistics(self) -> Dict[str, Any]:
        """Estatísticas da base de conhecimento"""
        with sqlite3.connect(self.db_path) as conn:
            stats = {}
            
            # Total de entradas por tipo
            entry_stats = conn.execute("""
                SELECT entry_type, COUNT(*) as count 
                FROM knowledge_entries 
                GROUP BY entry_type
            """).fetchall()
            
            stats["by_type"] = {row["entry_type"]: row["count"] for row in entry_stats}
            
            # Total de entradas por categoria
            category_stats = conn.execute("""
                SELECT category, COUNT(*) as count 
                FROM knowledge_entries 
                GROUP BY category
            """).fetchall()
            
            stats["by_category"] = {row["category"]: row["count"] for row in category_stats}
            
            # Kits disponíveis
            kit_stats = conn.execute("""
                SELECT category, COUNT(*) as count 
                FROM pop_kits 
                GROUP BY category
            """).fetchall()
            
            stats["kits_available"] = {row["category"]: row["count"] for row in kit_stats}
            
            # Score médio de relevância
            avg_relevance = conn.execute(
                "SELECT AVG(relevance_score) FROM knowledge_entries"
            ).fetchone()[0]
            
            stats["avg_relevance"] = avg_relevance or 0.0
            
            return stats
