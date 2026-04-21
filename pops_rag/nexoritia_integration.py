"""Nexoritia OS Integration - Conexão entre POPs RAG e Nexoritia OS
Integração completa com Canon Registry, OS-RADAR e OS-Notarius
"""

import sys
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

# Adicionar path do Nexoritia OS
nexoritia_path = Path(__file__).parent.parent / "ABACUS_DEPLOY" / "1_NEXORITIA_OS_CORE"
sys.path.insert(0, str(nexoritia_path))

try:
    from canon_registry import CanonRegistry
    from os_radar import OSRADAR
    from os_notarius import OSNotarius
    from models import ValidationRequest, ValidationResponse
    NEXORITIA_AVAILABLE = True
except ImportError:
    NEXORITIA_AVAILABLE = False
    print("AVISO: Nexoritia OS não disponível. Usando modo de simulação.")

from .pop_canon_registry import POPCanonRegistry, POPDocument, POPCategory
from .pop_validation_engine import POPValidationEngine, ValidationReport
from .pop_semantic_index import POPSemanticIndex
from .pop_knowledge_base import POPKnowledgeBase

class POPNexoritiaIntegration:
    """Integração completa entre POPs RAG e Nexoritia OS"""
    
    def __init__(self, pop_db_path: str = "data/pops_canon.db", 
                 nexoritia_db_path: str = "data/nexoritia.db"):
        self.pop_registry = POPCanonRegistry(pop_db_path)
        self.validation_engine = POPValidationEngine()
        self.semantic_index = POPSemanticIndex(pop_db_path)
        self.knowledge_base = POPKnowledgeBase(pop_db_path)
        
        # Inicializar Nexoritia OS se disponível
        if NEXORITIA_AVAILABLE:
            try:
                self.nexoritia_registry = CanonRegistry(nexoritia_db_path)
                self.os_radar = OSRADAR(self.nexoritia_registry)
                self.os_notarius = OSNotarius()
                self.nexoritia_enabled = True
            except Exception as e:
                print(f"Erro ao inicializar Nexoritia OS: {e}")
                self.nexoritia_enabled = False
        else:
            self.nexoritia_enabled = False
    
    def validate_pop_with_nexoritia(self, pop_doc: POPDocument) -> Dict[str, Any]:
        """Validação completa usando Nexoritia OS + POPs RAG"""
        result = {
            "pop_validation": None,
            "nexoritia_validation": None,
            "combined_status": "pending",
            "compliance_score": 0.0,
            "recommendations": [],
            "proofs": []
        }
        
        # 1. Validação específica de POPs
        pop_report = self.validation_engine.validate_pop_document(pop_doc)
        result["pop_validation"] = {
            "status": pop_report.overall_status.value,
            "score": pop_report.compliance_score,
            "issues": len(pop_report.issues),
            "critical_issues": len([i for i in pop_report.issues if i.severity.value == "critical"])
        }
        
        # 2. Validação com Nexoritia OS (se disponível)
        if self.nexoritia_enabled:
            try:
                # Criar request para Nexoritia
                validation_request = ValidationRequest(
                    content=pop_doc.conteudo,
                    domain=self._map_category_to_domain(pop_doc.categoria),
                    strict_mode=True
                )
                
                # Validar com OS-RADAR
                nexoritia_result = self.os_radar.validate_content(validation_request)
                result["nexoritia_validation"] = {
                    "valid": nexoritia_result.valid,
                    "coherent": nexoritia_result.coherent,
                    "confidence": nexoritia_result.confidence_score,
                    "axioms_found": len(nexoritia_result.axioms_found),
                    "violations": len(nexoritia_result.violations)
                }
                
                # Gerar prova AUTH-AI
                if nexoritia_result.valid:
                    try:
                        from models import AuthRequest
                        auth_request = AuthRequest(
                            artifact_id=pop_doc.id,
                            content=pop_doc.conteudo,
                            artifact_type="pop_document",
                            title=pop_doc.titulo,
                            include_tsa=True
                        )
                        
                        proof = self.os_notarius.authenticate_artifact(auth_request)
                        result["proofs"].append({
                            "type": "AUTH-AI",
                            "artifact_id": proof.artifact_id,
                            "content_hash": proof.content_hash,
                            "signature": proof.author_signature,
                            "timestamp": proof.tsa_timestamp
                        })
                    except Exception as e:
                        print(f"Erro ao gerar prova AUTH-AI: {e}")
                
            except Exception as e:
                print(f"Erro na validação Nexoritia: {e}")
                result["nexoritia_validation"] = {"error": str(e)}
        
        # 3. Combinar resultados
        result["combined_status"] = self._combine_validations(
            result["pop_validation"], 
            result["nexoritia_validation"]
        )
        
        # 4. Calcular score combinado
        result["compliance_score"] = self._calculate_combined_score(result)
        
        # 5. Gerar recomendações combinadas
        result["recommendations"] = self._generate_combined_recommendations(result, pop_doc)
        
        return result
    
    def _map_category_to_domain(self, category: POPCategory) -> str:
        """Mapeia categoria POP para domínio Nexoritia"""
        mapping = {
            POPCategory.RECEBIMENTO: "farmacia_manipulacao",
            POPCategory.PESAGEM: "farmacia_manipulacao",
            POPCategory.MANIPULACAO: "farmacia_manipulacao",
            POPCategory.CONTROLE_QUALIDADE: "documentos_regulatorios",
            POPCategory.EQUIPAMENTOS: "documentos_regulatorios",
            POPCategory.LIMPEZA: "farmacia_manipulacao",
            POPCategory.DISPENSACAO: "documentos_regulatorios",
            POPCategory.SEGURANCA: "documentos_regulatorios",
            POPCategory.ADMINISTRATIVO: "documentos_regulatorios"
        }
        return mapping.get(category, "geral")
    
    def _combine_validations(self, pop_val: Dict, nexoritia_val: Dict) -> str:
        """Combina status das validações"""
        if not pop_val or pop_val["status"] == "non_compliant":
            return "non_compliant"
        
        if not nexoritia_val or "error" in nexoritia_val:
            return pop_val["status"]
        
        if (pop_val["status"] == "compliant" and 
            nexoritia_val.get("valid", False) and 
            nexoritia_val.get("coherent", False)):
            return "compliant"
        
        if (pop_val["critical_issues"] > 0 or 
            not nexoritia_val.get("valid", False)):
            return "non_compliant"
        
        return "warning"
    
    def _calculate_combined_score(self, result: Dict) -> float:
        """Calcula score de conformidade combinado"""
        pop_score = result["pop_validation"]["score"] if result["pop_validation"] else 0.0
        
        if result["nexoritia_validation"] and "error" not in result["nexoritia_validation"]:
            nexoritia_score = result["nexoritia_validation"]["confidence"]
            # Ponderar: 60% POPs, 40% Nexoritia
            combined_score = (pop_score * 0.6) + (nexoritia_score * 0.4)
        else:
            combined_score = pop_score
        
        return round(combined_score, 3)
    
    def _generate_combined_recommendations(self, result: Dict, pop_doc: POPDocument) -> List[str]:
        """Gera recomendações combinadas"""
        recommendations = []
        
        # Recomendações da validação de POPs
        if result["pop_validation"] and result["pop_validation"]["critical_issues"] > 0:
            recommendations.append("CORREÇÃO IMEDIATA: Resolver issues críticos de POPs")
        
        # Recomendações do Nexoritia
        if (result["nexoritia_validation"] and 
            not result["nexoritia_validation"].get("valid", False)):
            recommendations.append("REVISAR CONTEÚDO: Alinhar com axiomas do Canon")
        
        # Recomendações específicas por categoria
        if result["combined_status"] == "non_compliant":
            recommendations.append(f"PRIORIDADE ALTA: Revisar POP {pop_doc.codigo} completamente")
        elif result["combined_status"] == "warning":
            recommendations.append(f"PRIORIDADE MÉDIA: Melhorar POP {pop_doc.codigo}")
        
        # Recomendações de conhecimento
        if result["compliance_score"] < 0.7:
            recommendations.append("TREINAMENTO: Revisar melhores práticas para esta categoria")
        
        return recommendations
    
    def search_pops_with_nexoritia(self, query: str, category: Optional[POPCategory] = None,
                                  tenant_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Busca semântica com Nexoritia OS"""
        results = []
        
        # 1. Busca semântica de POPs
        pop_matches = self.semantic_index.semantic_search(query, category, tenant_id, limit)
        
        for match in pop_matches:
            result = {
                "type": "pop_document",
                "id": match.document_id,
                "codigo": match.codigo,
                "titulo": match.titulo,
                "categoria": match.categoria.value,
                "relevance_score": match.relevance_score,
                "match_reasons": match.match_reasons,
                "snippet": match.content_snippet,
                "nexoritia_validation": None
            }
            
            # 2. Validar com Nexoritia se disponível
            if self.nexoritia_enabled:
                try:
                    pop_doc = self.pop_registry.get_pop_by_codigo(match.codigo, tenant_id or "default")
                    if pop_doc:
                        validation_result = self.validate_pop_with_nexoritia(pop_doc)
                        result["nexoritia_validation"] = validation_result["nexoritia_validation"]
                except Exception as e:
                    print(f"Erro na validação Nexoritia para {match.codigo}: {e}")
            
            results.append(result)
        
        # 3. Buscar na base de conhecimento
        kb_matches = self.knowledge_base.search_knowledge(query, category, limit=5)
        for match in kb_matches:
            result = {
                "type": "knowledge_entry",
                "id": match.id,
                "title": match.title,
                "category": match.category.value,
                "entry_type": match.entry_type,
                "relevance_score": match.relevance_score,
                "content": match.content[:300] + "...",
                "tags": match.tags
            }
            results.append(result)
        
        # 4. Ordenar por relevância
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return results[:limit]
    
    def generate_compliance_report(self, tenant_id: str) -> Dict[str, Any]:
        """Gera relatório completo de conformidade"""
        report = {
            "tenant_id": tenant_id,
            "generated_at": datetime.now().isoformat(),
            "summary": {},
            "by_category": {},
            "nexoritia_analysis": {},
            "recommendations": [],
            "knowledge_insights": {}
        }
        
        # 1. Estatísticas POPs
        pop_stats = self.pop_registry.get_statistics(tenant_id)
        report["summary"] = pop_stats
        
        # 2. Análise por categoria
        for category in POPCategory:
            pops = self.pop_registry.get_pops_by_category(category, tenant_id)
            if pops:
                category_analysis = {
                    "total_pops": len(pops),
                    "validation_results": [],
                    "compliance_scores": [],
                    "nexoritia_alignment": []
                }
                
                for pop in pops:
                    validation = self.validate_pop_with_nexoritia(pop)
                    category_analysis["validation_results"].append(validation)
                    category_analysis["compliance_scores"].append(validation["compliance_score"])
                    
                    if validation["nexoritia_validation"]:
                        category_analysis["nexoritia_alignment"].append(
                            validation["nexoritia_validation"].get("valid", False)
                        )
                
                # Calcular médias
                if category_analysis["compliance_scores"]:
                    category_analysis["avg_compliance"] = sum(category_analysis["compliance_scores"]) / len(category_analysis["compliance_scores"])
                
                if category_analysis["nexoritia_alignment"]:
                    category_analysis["nexoritia_alignment_rate"] = sum(category_analysis["nexoritia_alignment"]) / len(category_analysis["nexoritia_alignment"])
                
                report["by_category"][category.value] = category_analysis
        
        # 3. Análise Nexoritia
        if self.nexoritia_enabled:
            report["nexoritia_analysis"] = {
                "canon_loaded": self.nexoritia_registry.canon is not None,
                "total_axioms": len(self.nexoritia_registry.canon.axioms) if self.nexoritia_registry.canon else 0,
                "domains_available": list(self.os_radar.contracts.keys()) if self.nexoritia_enabled else []
            }
        
        # 4. Análise de conhecimento
        kb_analysis = self.knowledge_base.analyze_pop_compliance(
            [self.pop_registry.get_pop_by_codigo(pop["codigo"], tenant_id) 
             for pop in self.pop_registry.get_pops_by_category(POPCategory.MANIPULACAO, tenant_id)]
        )
        report["knowledge_insights"] = kb_analysis
        
        # 5. Recomendações gerais
        report["recommendations"] = self._generate_global_recommendations(report)
        
        return report
    
    def _generate_global_recommendations(self, report: Dict) -> List[str]:
        """Gera recomendações globais baseadas no relatório"""
        recommendations = []
        
        # Análise de conformidade geral
        total_pops = report["summary"].get("total_pops", 0)
        if total_pops == 0:
            recommendations.append("URGENTE: Criar POPs essenciais para operação")
            return recommendations
        
        # Verificar conformidade por categoria
        low_compliance_categories = []
        for category, analysis in report["by_category"].items():
            avg_score = analysis.get("avg_compliance", 0)
            if avg_score < 0.8:
                low_compliance_categories.append(category)
        
        if low_compliance_categories:
            recommendations.append(f"PRIORIDADE ALTA: Melhorar conformidade em {', '.join(low_compliance_categories)}")
        
        # Verificar alinhamento Nexoritia
        for category, analysis in report["by_category"].items():
            alignment = analysis.get("nexoritia_alignment_rate", 0)
            if alignment < 0.7:
                recommendations.append(f"REVISAR: Alinhar POPs de {category} com axiomas Nexoritia")
        
        # Recomendações de conhecimento
        knowledge_gaps = report["knowledge_insights"].get("knowledge_gaps", [])
        if knowledge_gaps:
            high_priority_gaps = [gap for gap in knowledge_gaps if gap.get("severity") == "high"]
            if high_priority_gaps:
                recommendations.append("IMPLEMENTAR: Completar POPs obrigatórios faltantes")
        
        # Recomendação geral
        overall_score = sum(
            analysis.get("avg_compliance", 0) 
            for analysis in report["by_category"].values()
        ) / len(report["by_category"]) if report["by_category"] else 0
        
        if overall_score < 0.9:
            recommendations.append("MELHORIA CONTÍNUA: Implementar programa de melhoria de POPs")
        
        return recommendations
    
    def create_pop_from_template(self, template_type: str, category: POPCategory,
                                title: str, tenant_id: str) -> POPDocument:
        """Cria POP a partir de template com validação Nexoritia"""
        # Buscar template na base de conhecimento
        templates = self.knowledge_base.search_knowledge(
            f"template {template_type}", 
            entry_type="template"
        )
        
        if not templates:
            raise ValueError(f"Template '{template_type}' não encontrado")
        
        template = templates[0]
        
        # Gerar código automático
        category_pops = self.pop_registry.get_pops_by_category(category, tenant_id)
        next_number = len(category_pops) + 1
        codigo = f"POP.{next_number:03d}"
        
        # Criar documento POP
        pop_doc = POPDocument(
            id=f"pop_{datetime.now().timestamp()}",
            codigo=codigo,
            title=title,
            tipo=template.entry_type.upper(),
            categoria=category,
            conteudo=template.content,
            versao="1.0",
            status="draft",
            axioms_applied=[],
            rdc_compliance={},
            created_at=datetime.now(),
            updated_at=datetime.now(),
            tenant_id=tenant_id
        )
        
        # Validar com Nexoritia antes de salvar
        validation_result = self.validate_pop_with_nexoritia(pop_doc)
        
        if validation_result["combined_status"] == "non_compliant":
            # Adicionar recomendações ao conteúdo
            recommendations = "\n\n## RECOMENDAÇÕES DE VALIDAÇÃO:\n"
            for rec in validation_result["recommendations"]:
                recommendations += f"- {rec}\n"
            
            pop_doc.conteudo += recommendations
        
        return pop_doc
    
    def export_to_nexoritia_format(self, tenant_id: str) -> Dict[str, Any]:
        """Exporta dados para formato compatível com Nexoritia OS"""
        export_data = {
            "export_date": datetime.now().isoformat(),
            "tenant_id": tenant_id,
            "version": "1.0",
            "pops": [],
            "knowledge_entries": [],
            "validation_reports": []
        }
        
        # Exportar POPs
        for category in POPCategory:
            pops = self.pop_registry.get_pops_by_category(category, tenant_id)
            for pop in pops:
                validation = self.validate_pop_with_nexoritia(pop)
                
                pop_data = {
                    "id": pop.id,
                    "codigo": pop.codigo,
                    "titulo": pop.titulo,
                    "tipo": pop.tipo.value,
                    "categoria": pop.categoria.value,
                    "conteudo": pop.conteudo,
                    "versao": pop.versao,
                    "status": pop.status.value,
                    "created_at": pop.created_at.isoformat(),
                    "updated_at": pop.updated_at.isoformat(),
                    "nexoritia_validation": validation
                }
                export_data["pops"].append(pop_data)
        
        # Exportar entradas de conhecimento
        all_entries = self.knowledge_base.search_knowledge("", limit=100)
        for entry in all_entries:
            entry_data = {
                "id": entry.id,
                "title": entry.title,
                "content": entry.content,
                "category": entry.category.value,
                "entry_type": entry.entry_type,
                "source": entry.source,
                "relevance_score": entry.relevance_score,
                "tags": entry.tags
            }
            export_data["knowledge_entries"].append(entry_data)
        
        return export_data
