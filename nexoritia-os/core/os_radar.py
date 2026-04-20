"""
Nexoritia OS - OS-RADAR
Sistema de validação em tempo real com Fail-Closed principle
"""

import json
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass

from .models import (
    ValidationRequest, ValidationResponse, 
    TestResult, AxiomPriority
)
from .canon_registry import CanonRegistry


@dataclass
class SemanticContract:
    """Contrato semântico para validação"""
    domain: str
    required_axioms: List[str]
    forbidden_patterns: List[str]
    validation_rules: Dict[str, Any]
    strict_mode: bool = True


@dataclass
class ValidationViolation:
    """Violação encontrada na validação"""
    type: str  # "missing_axiom", "forbidden_pattern", "semantic_error"
    severity: str  # "critical", "high", "medium", "low"
    description: str
    axiom_id: Optional[str] = None
    position: Optional[Tuple[int, int]] = None  # line, column


class OSMemory:
    """Sistema de memória persistente para contexto"""
    
    def __init__(self):
        self.working_state = {}
        self.axiom_cache = {}
        self.validation_history = []
        self.contracts_cache = {}
    
    def set_working_state(self, key: str, value: Any):
        """Define valor no working state"""
        self.working_state[key] = value
    
    def get_working_state(self, key: str, default: Any = None) -> Any:
        """Obtém valor do working state"""
        return self.working_state.get(key, default)
    
    def cache_axiom_lookup(self, text_hash: str, result: Dict[str, Any]):
        """Cache resultado de lookup de axioma"""
        self.axiom_cache[text_hash] = result
    
    def get_cached_axiom(self, text_hash: str) -> Optional[Dict[str, Any]]:
        """Obtém axioma cacheado"""
        return self.axiom_cache.get(text_hash)
    
    def add_validation(self, validation: Dict[str, Any]):
        """Adiciona validação ao histórico"""
        self.validation_history.append({
            **validation,
            "timestamp": datetime.now().isoformat()
        })
        
        # Manter apenas últimas 1000 validações
        if len(self.validation_history) > 1000:
            self.validation_history = self.validation_history[-1000:]


class OSRADAR:
    """Sistema de validação governada com Fail-Closed principle"""
    
    def __init__(self, canon_registry: CanonRegistry):
        self.canon = canon_registry
        self.memory = OSMemory()
        self.contracts = self._load_semantic_contracts()
    
    def _load_semantic_contracts(self) -> Dict[str, SemanticContract]:
        """Carrega contratos semânticos por domínio"""
        return {
            # Domínio: Farmácia de Manipulação
            "farmacia_manipulacao": SemanticContract(
                domain="farmacia_manipulacao",
                required_axioms=[
                    "lei_casa_viva",  # Toda entidade necessita morada
                    "lei_intersecao",  # Toda travessia em pontos de cruzamento
                    "lei_fenda_fundadora"  # Toda criação nasce de rasgo
                ],
                forbidden_patterns=[
                    r"\b(ilegal|proibido|não autorizado)\b",
                    r"\b(contra\sa+de|violando)\s+(RDC|ANVISA)",
                    r"\b(ignorar|dispensar)\s+(norma|regulamento)"
                ],
                validation_rules={
                    "max_concentration": 100,  # % máxima de concentração
                    "min_purity": 99.5,  # % mínima de pureza
                    "temperature_range": (2, 25),  # °C
                    "humidity_range": (45, 75)  # % UR
                },
                strict_mode=True
            ),
            
            # Domínio: Documentos Regulatórios
            "documentos_regulatorios": SemanticContract(
                domain="documentos_regulatorios",
                required_axioms=[
                    "codigo_do_orbe",  # Tudo regido por incompletude
                    "lei_nominativa_sagrada",  # Nomear convoca
                    "lei_retorno"  # Tudo excluído retorna como sintoma
                ],
                forbidden_patterns=[
                    r"\b(sem\s+data|data\s+indefinida)\b",
                    r"\b(versão\s+0\.0\.0|draft\s+final)\b",
                    r"\b(assinatura\s+faltando|não\s+assinado)\b"
                ],
                validation_rules={
                    "must_have_version": True,
                    "must_have_date": True,
                    "must_have_signature": True,
                    "max_age_days": 365  # Documentos não podem ter >1 ano sem revisão
                },
                strict_mode=True
            ),
            
            # Domínio: Treinamento e Certificação
            "treinamento_certificacao": SemanticContract(
                domain="treinamento_certificacao",
                required_axioms=[
                    "lei_escolha_inevitavel",  # Após ruptura, posicionamento
                    "lei_impossibilidade_inocencia",  # Nenhuma forma é pura
                    "lei_consequencia_longa"  # Gestos fundadores ecoam
                ],
                forbidden_patterns=[
                    r"\b(aprovação\s+automática|garantia\s+de\s+aprovação)\b",
                    r"\b(trilha\s+zero|evidência\s+nula)\b",
                    r"\b(avaliação\s+sem\s+critério|critério\s+subjetivo)\b"
                ],
                validation_rules={
                    "min_training_duration": 60,  # minutos
                    "min_passing_score": 70,  # %
                    "max_attempts": 3,  # tentativas
                    "required_evidence": True
                },
                strict_mode=True
            ),
            
            # Domínio: Geral (default)
            "geral": SemanticContract(
                domain="geral",
                required_axioms=[
                    "codigo_do_orbe"  # Axioma fundamental
                ],
                forbidden_patterns=[
                    r"\b(alucinação|informação\s+falsa|conteúdo\s+fictício)\b",
                    r"\b(sem\s+fonte|fonte\s+inexistente)\b",
                    r"\b(dado\s+inventado|informação\s+falsa)\b"
                ],
                validation_rules={
                    "min_coherence": 0.5,
                    "max_entropy": 3.0,
                    "require_sources": False
                },
                strict_mode=False
            )
        }
    
    def detect_domain(self, content: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Detecta domínio do conteúdo"""
        content_lower = content.lower()
        
        # Keywords por domínio
        domain_keywords = {
            "farmacia_manipulacao": [
                "farmácia", "manipulação", "medicamento", "fórmula",
                "rdc 67", "anvisa", "bpm", "pop", "lote",
                "matéria prima", "controle de qualidade"
            ],
            "documentos_regulatorios": [
                "rdc", "anvisa", "regulamento", "norma", "legislação",
                "documento", "relatório", "laudo", "certificado"
            ],
            "treinamento_certificacao": [
                "treinamento", "certificação", "curso", "avaliação",
                "colaborador", "instrutor", "quiz", "prova"
            ]
        }
        
        # Contar keywords
        domain_scores = {}
        for domain, keywords in domain_keywords.items():
            score = sum(1 for keyword in keywords if keyword in content_lower)
            domain_scores[domain] = score
        
        # Verificar contexto explícito
        if context and "domain" in context:
            return context["domain"]
        
        # Retornar domínio com maior score ou geral
        if domain_scores:
            best_domain = max(domain_scores, key=domain_scores.get)
            if domain_scores[best_domain] > 0:
                return best_domain
        
        return "geral"
    
    def validate_against_contract(self, 
                                content: str, 
                                contract: SemanticContract) -> List[ValidationViolation]:
        """Valida conteúdo contra contrato semântico"""
        violations = []
        
        # 1. Verificar axiomas requeridos
        content_hash = self.canon.validate_text(content, strict_mode=False)
        found_axioms = content_hash.get("axioms_found", [])
        missing_axioms = set(contract.required_axioms) - set(found_axioms)
        
        for axiom in missing_axioms:
            violations.append(ValidationViolation(
                type="missing_axiom",
                severity="critical",
                description=f"Axioma requerido ausente: {axiom}",
                axiom_id=axiom
            ))
        
        # 2. Verificar padrões proibidos
        for pattern in contract.forbidden_patterns:
            matches = list(re.finditer(pattern, content, re.IGNORECASE))
            for match in matches:
                violations.append(ValidationViolation(
                    type="forbidden_pattern",
                    severity="critical",
                    description=f"Padrão proibido encontrado: {match.group()}",
                    position=(match.start(), match.end())
                ))
        
        # 3. Validar regras específicas
        if contract.domain == "farmacia_manipulacao":
            violations.extend(self._validate_pharmacy_rules(content, contract.validation_rules))
        elif contract.domain == "documentos_regulatorios":
            violations.extend(self._validate_document_rules(content, contract.validation_rules))
        elif contract.domain == "treinamento_certificacao":
            violations.extend(self._validate_training_rules(content, contract.validation_rules))
        
        return violations
    
    def _validate_pharmacy_rules(self, content: str, rules: Dict[str, Any]) -> List[ValidationViolation]:
        """Valida regras específicas de farmácia"""
        violations = []
        
        # Verificar concentrações
        conc_pattern = r'(\d+(?:\.\d+)?)\s*%?\s*(?:concentração|conc\.)'
        conc_matches = re.findall(conc_pattern, content, re.IGNORECASE)
        for conc_str in conc_matches:
            conc = float(conc_str)
            if conc > rules.get("max_concentration", 100):
                violations.append(ValidationViolation(
                    type="semantic_error",
                    severity="high",
                    description=f"Concentração excede limite: {conc}% > {rules['max_concentration']}%"
                ))
        
        # Verificar temperatura
        temp_pattern = r'(\d+(?:\.\d+)?)\s*°?[CFK]\s*(?:temperatura|temp\.)'
        temp_matches = re.findall(temp_pattern, content, re.IGNORECASE)
        for temp_str in temp_matches:
            temp = float(temp_str)
            min_temp, max_temp = rules.get("temperature_range", (0, 50))
            if not (min_temp <= temp <= max_temp):
                violations.append(ValidationViolation(
                    type="semantic_error",
                    severity="medium",
                    description=f"Temperatura fora da faixa: {temp}°C não está em [{min_temp}, {max_temp}]°C"
                ))
        
        return violations
    
    def _validate_document_rules(self, content: str, rules: Dict[str, Any]) -> List[ValidationViolation]:
        """Valida regras específicas de documentos"""
        violations = []
        
        # Verificar se tem versão
        if rules.get("must_have_version"):
            version_pattern = r'versão\s*:?\s*([\d\.]+)'
            if not re.search(version_pattern, content, re.IGNORECASE):
                violations.append(ValidationViolation(
                    type="semantic_error",
                    severity="high",
                    description="Documento não possui versão"
                ))
        
        # Verificar se tem data
        if rules.get("must_have_date"):
            date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
            if not re.search(date_pattern, content):
                violations.append(ValidationViolation(
                    type="semantic_error",
                    severity="high",
                    description="Documento não possui data"
                ))
        
        # Verificar se tem assinatura
        if rules.get("must_have_signature"):
            signature_patterns = [
                r'assinado\s+por',
                r'assinatura\s*:',
                r'___+.*___+',  # Linhas de assinatura
                r'\b\s*(assinado|approved)\s*$'
            ]
            
            has_signature = any(re.search(pattern, content, re.IGNORECASE) for pattern in signature_patterns)
            if not has_signature:
                violations.append(ValidationViolation(
                    type="semantic_error",
                    severity="high",
                    description="Documento não possui assinatura"
                ))
        
        return violations
    
    def _validate_training_rules(self, content: str, rules: Dict[str, Any]) -> List[ValidationViolation]:
        """Valida regras específicas de treinamento"""
        violations = []
        
        # Verificar duração mínima
        if rules.get("min_training_duration"):
            duration_pattern = r'(\d+)\s*(?:min|min|horas?|h)'
            duration_matches = re.findall(duration_pattern, content, re.IGNORECASE)
            if duration_matches:
                duration = int(duration_matches[0])
                if duration < rules["min_training_duration"]:
                    violations.append(ValidationViolation(
                        type="semantic_error",
                        severity="high",
                        description=f"Duração abaixo do mínimo: {duration}min < {rules['min_training_duration']}min"
                    ))
        
        # Verificar nota mínima
        if rules.get("min_passing_score"):
            score_pattern = r'(\d+(?:\.\d+)?)\s*(?:pontos?|pts?|%)'
            score_matches = re.findall(score_pattern, content, re.IGNORECASE)
            if score_matches:
                score = float(score_matches[0])
                if score < rules["min_passing_score"]:
                    violations.append(ValidationViolation(
                        type="semantic_error",
                        severity="high",
                        description=f"Nota abaixo do mínimo: {score} < {rules['min_passing_score']}"
                    ))
        
        return violations
    
    def validate_content(self, request: ValidationRequest) -> ValidationResponse:
        """Valida conteúdo com OS-RADAR completo"""
        
        # 1. Detectar domínio
        domain = request.domain or self.detect_domain(request.content, request.context)
        contract = self.contracts.get(domain, self.contracts["geral"])
        
        # 2. Validar contra Canon
        canon_validation = self.canon.validate_text(
            request.content, 
            strict_mode=request.strict_mode
        )
        
        # 3. Validar contra contrato semântico
        semantic_violations = self.validate_against_contract(request.content, contract)
        
        # 4. Combinar resultados
        all_violations = []
        
        # Violações do Canon
        if not canon_validation["valid"]:
            all_violations.extend([
                ValidationViolation(
                    type="canon_violation",
                    severity="critical",
                    description=reason
                ) for reason in canon_validation.get("violations", [])
            ])
        
        # Violações semânticas
        all_violations.extend(semantic_violations)
        
        # 5. Calcular severidade geral
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for violation in all_violations:
            severity_counts[violation.severity] += 1
        
        # Determinar validade geral
        is_valid = (
            severity_counts["critical"] == 0 and 
            (not contract.strict_mode or severity_counts["high"] == 0)
        )
        
        # Calcular score de coerência
        total_possible = len(all_violations) + len(canon_validation.get("axioms_found", []))
        coherence_score = len(canon_validation.get("axioms_found", [])) / max(total_possible, 1)
        
        # 6. Armazenar na memória
        self.memory.add_validation({
            "domain": domain,
            "valid": is_valid,
            "coherent": coherence_score > 0.5,
            "violations_count": len(all_violations),
            "severity_counts": severity_counts,
            "canon_axioms_found": canon_validation.get("axioms_found", []),
            "canon_axioms_missing": canon_validation.get("axioms_missing", [])
        })
        
        return ValidationResponse(
            valid=is_valid,
            coherent=coherence_score > 0.5,
            axioms_found=canon_validation.get("axioms_found", []),
            axioms_missing=canon_validation.get("axioms_missing", []),
            violations=[v.description for v in all_violations],
            confidence_score=coherence_score,
            validated_at=datetime.now()
        )
    
    def get_domain_stats(self, domain: str) -> Dict[str, Any]:
        """Retorna estatísticas de validação por domínio"""
        domain_validations = [
            v for v in self.memory.validation_history 
            if v.get("domain") == domain
        ]
        
        if not domain_validations:
            return {"domain": domain, "total_validations": 0}
        
        total = len(domain_validations)
        valid = sum(1 for v in domain_validations if v["valid"])
        coherent = sum(1 for v in domain_validations if v["coherent"])
        
        avg_violations = sum(v["violations_count"] for v in domain_validations) / total
        
        return {
            "domain": domain,
            "total_validations": total,
            "valid_count": valid,
            "coherent_count": coherent,
            "validity_rate": valid / total,
            "coherence_rate": coherent / total,
            "avg_violations_per_validation": avg_violations,
            "most_common_violations": self._get_most_common_violations(domain_validations)
        }
    
    def _get_most_common_violations(self, validations: List[Dict[str, Any]]) -> List[str]:
        """Identifica violações mais comuns"""
        violation_counts = {}
        for validation in validations:
            for violation in validation.get("violations", []):
                violation_counts[violation] = violation_counts.get(violation, 0) + 1
        
        # Retornar top 5
        sorted_violations = sorted(violation_counts.items(), key=lambda x: x[1], reverse=True)
        return [violation for violation, count in sorted_violations[:5]]
    
    def fail_closed_action(self, violations: List[ValidationViolation]) -> Dict[str, Any]:
        """Ação Fail-Closed: bloqueia ou força correção"""
        critical_violations = [v for v in violations if v.severity == "critical"]
        high_violations = [v for v in violations if v.severity == "high"]
        
        if critical_violations:
            return {
                "action": "BLOCK",
                "reason": "Critical violations detected - content blocked",
                "violations": [v.description for v in critical_violations],
                "requires_human_review": True
            }
        elif high_violations:
            return {
                "action": "FORCE_REWRITE",
                "reason": "High violations detected - content must be rewritten",
                "violations": [v.description for v in high_violations],
                "suggestions": self._generate_rewrite_suggestions(high_violations)
            }
        else:
            return {
                "action": "ALLOW",
                "reason": "Content passes validation",
                "violations": [],
                "suggestions": []
            }
    
    def _generate_rewrite_suggestions(self, violations: List[ValidationViolation]) -> List[str]:
        """Gera sugestões de reescrita"""
        suggestions = []
        
        for violation in violations:
            if violation.type == "missing_axiom":
                suggestions.append(f"Incluir referência ao axioma: {violation.axiom_id}")
            elif violation.type == "forbidden_pattern":
                suggestions.append(f"Remover ou reformular: {violation.description}")
            elif violation.type == "semantic_error":
                suggestions.append(f"Corrigir: {violation.description}")
        
        return suggestions
