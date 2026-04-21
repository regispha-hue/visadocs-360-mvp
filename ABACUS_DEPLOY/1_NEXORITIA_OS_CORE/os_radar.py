"""Nexoritia OS - OS-RADAR | Otimizado para deploy"""
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from .models import ValidationRequest, ValidationResponse
from .canon_registry import CanonRegistry

@dataclass
class SemanticContract:
    domain: str
    required_axioms: List[str]
    forbidden_patterns: List[str]
    validation_rules: Dict[str, Any]
    strict_mode: bool = True

@dataclass
class Violation:
    type: str
    severity: str
    description: str
    axiom_id: Optional[str] = None

class OSMemory:
    def __init__(self):
        self.working_state, self.axiom_cache, self.validation_history = {}, {}, []
    def add_validation(self, v: Dict):
        self.validation_history.append({**v, "timestamp": datetime.now().isoformat()})
        if len(self.validation_history) > 1000: self.validation_history = self.validation_history[-1000:]

class OSRADAR:
    def __init__(self, canon_registry: CanonRegistry):
        self.canon = canon_registry
        self.memory = OSMemory()
        self.contracts = {
            "farmacia_manipulacao": SemanticContract("farmacia_manipulacao",
                ["lei_casa_viva", "lei_intersecao", "lei_fenda_fundadora"],
                [r"\bilegal\b", r"\bproibido\b", r"\bnao\s+autorizado\b"],
                {"max_concentration": 100, "temperature_range": (2, 25)}, True),
            "documentos_regulatorios": SemanticContract("documentos_regulatorios",
                ["codigo_do_orbe", "lei_nominativa_sagrada", "lei_retorno"],
                [r"\bsem\s+data\b", r"\bversao\s+0\.0\.0\b"],
                {"must_have_version": True, "must_have_date": True}, True),
            "treinamento_certificacao": SemanticContract("treinamento_certificacao",
                ["lei_escolha_inevitavel", "lei_impossibilidade_inocencia", "lei_consequencia_longa"],
                [r"\baprovacao\s+automatica\b", r"\btrilha\s+zero\b"],
                {"min_training_duration": 60, "min_passing_score": 70}, True),
            "geral": SemanticContract("geral", ["codigo_do_orbe"],
                [r"\balucinacao\b", r"\bsem\s+fonte\b"],
                {"min_coherence": 0.5}, False)
        }

    def detect_domain(self, content: str, context: Optional[Dict] = None) -> str:
        cl = content.lower()
        domains = {"farmacia_manipulacao": ["farmacia", "manipulacao", "medicamento", "rdc 67", "anvisa", "bpm", "pop", "lote"],
                   "documentos_regulatorios": ["rdc", "anvisa", "regulamento", "norma", "legislacao", "documento", "relatorio", "laudo"],
                   "treinamento_certificacao": ["treinamento", "certificacao", "curso", "avaliacao", "colaborador", "instrutor"]}
        scores = {d: sum(1 for k in keywords if k in cl) for d, keywords in domains.items()}
        if context and "domain" in context: return context["domain"]
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "geral"

    def validate_content(self, request: ValidationRequest) -> ValidationResponse:
        domain = request.domain or self.detect_domain(request.content, request.context)
        contract = self.contracts.get(domain, self.contracts["geral"])
        canon_val = self.canon.validate_text(request.content, strict_mode=request.strict_mode)
        violations = []

        # Check required axioms
        found_axioms = canon_val.get("axioms_found", [])
        for axiom in set(contract.required_axioms) - set(found_axioms):
            violations.append(Violation("missing_axiom", "critical", f"Axioma requerido ausente: {axiom}", axiom))

        # Check forbidden patterns
        for pattern in contract.forbidden_patterns:
            for match in re.finditer(pattern, request.content, re.IGNORECASE):
                violations.append(Violation("forbidden_pattern", "critical", f"Padrao proibido: {match.group()}"))

        # Domain-specific rules
        violations.extend(self._check_domain_rules(request.content, contract))

        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for v in violations: severity_counts[v.severity] += 1

        is_valid = severity_counts["critical"] == 0 and (not contract.strict_mode or severity_counts["high"] == 0)
        score = len(found_axioms) / max(len(violations) + len(found_axioms), 1)

        self.memory.add_validation({"domain": domain, "valid": is_valid, "coherent": score > 0.5,
                                     "violations_count": len(violations), "canon_axioms_found": found_axioms})

        return ValidationResponse(valid=is_valid, coherent=score > 0.5, axioms_found=found_axioms,
                                   axioms_missing=list(set(contract.required_axioms) - set(found_axioms)),
                                   violations=[v.description for v in violations], confidence_score=score)

    def _check_domain_rules(self, content: str, contract: SemanticContract) -> List[Violation]:
        violations = []
        rules = contract.validation_rules
        if contract.domain == "farmacia_manipulacao":
            for m in re.findall(r'(\d+(?:\.\d+)?)\s*%?\s*(?:concentracao|conc\.)', content, re.IGNORECASE):
                if float(m) > rules.get("max_concentration", 100):
                    violations.append(Violation("semantic_error", "high", f"Concentracao excede limite: {m}%"))
            for m in re.findall(r'(\d+(?:\.\d+)?)\s*°?[CFK]', content, re.IGNORECASE):
                temp = float(m)
                min_t, max_t = rules.get("temperature_range", (0, 50))
                if not (min_t <= temp <= max_t):
                    violations.append(Violation("semantic_error", "medium", f"Temperatura fora da faixa: {temp}°C"))
        elif contract.domain == "documentos_regulatorios":
            if rules.get("must_have_version") and not re.search(r'versao\s*:?\s*[\d\.]+', content, re.IGNORECASE):
                violations.append(Violation("semantic_error", "high", "Documento sem versao"))
            if rules.get("must_have_date") and not re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', content):
                violations.append(Violation("semantic_error", "high", "Documento sem data"))
        elif contract.domain == "treinamento_certificacao":
            for m in re.findall(r'(\d+)\s*(?:min|horas?)', content, re.IGNORECASE):
                if int(m) < rules.get("min_training_duration", 60):
                    violations.append(Violation("semantic_error", "high", f"Duracao abaixo do minimo: {m}min"))
            for m in re.findall(r'(\d+(?:\.\d+)?)\s*(?:pontos?|%)', content, re.IGNORECASE):
                if float(m) < rules.get("min_passing_score", 70):
                    violations.append(Violation("semantic_error", "high", f"Nota abaixo do minimo: {m}"))
        return violations

    def fail_closed_action(self, violations: List[Violation]) -> Dict[str, Any]:
        critical = [v for v in violations if v.severity == "critical"]
        high = [v for v in violations if v.severity == "high"]
        if critical:
            return {"action": "BLOCK", "reason": "Critical violations detected", "violations": [v.description for v in critical], "requires_human_review": True}
        elif high:
            return {"action": "FORCE_REWRITE", "reason": "High violations detected", "violations": [v.description for v in high]}
        return {"action": "ALLOW", "reason": "Content passes validation", "violations": []}
