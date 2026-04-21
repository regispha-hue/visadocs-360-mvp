"""POP Validation Engine - Validação RDC 67/2007 e conformidade
Integração com Nexoritia OS OS-RADAR para validação Fail-Closed
"""

import re
import json
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
from pathlib import Path
from .pop_canon_registry import POPDocument, POPCategory, POPType

class ValidationSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class ValidationStatus(Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    WARNING = "warning"
    PENDING_REVIEW = "pending_review"

@dataclass
class ValidationRule:
    """Regra de validação específica"""
    id: str
    name: str
    description: str
    rdc_reference: str
    severity: ValidationSeverity
    validator: callable
    category: Optional[POPCategory] = None

@dataclass
class ValidationIssue:
    """Issue encontrado na validação"""
    rule_id: str
    severity: ValidationSeverity
    message: str
    suggestion: str
    location: Optional[str] = None
    line_number: Optional[int] = None

@dataclass
class ValidationReport:
    """Relatório completo de validação"""
    document_id: str
    document_codigo: str
    validation_date: datetime
    overall_status: ValidationStatus
    compliance_score: float
    issues: List[ValidationIssue]
    recommendations: List[str]
    next_review_date: Optional[datetime] = None

class POPValidationEngine:
    """Motor de validação especializado para POPs RDC 67/2007"""
    
    def __init__(self):
        self.rules = self._load_validation_rules()
        self.rdc_requirements = self._load_rdc_requirements()
    
    def _load_validation_rules(self) -> List[ValidationRule]:
        """Carrega regras de validação RDC 67/2007"""
        rules = [
            # Regras críticas de estrutura
            ValidationRule(
                id="pop_001",
                name="Código do POP",
                description="Todo POP deve ter código único",
                rdc_reference="RDC 67/2007 Art. 13",
                severity=ValidationSeverity.CRITICAL,
                validator=self._validate_codigo
            ),
            ValidationRule(
                id="pop_002",
                name="Título do POP",
                description="Todo POP deve ter título claro",
                rdc_reference="RDC 67/2007 Art. 13",
                severity=ValidationSeverity.CRITICAL,
                validator=self._validate_titulo
            ),
            ValidationRule(
                id="pop_003",
                name="Versão do POP",
                description="Todo POP deve ter número de versão",
                rdc_reference="RDC 67/2007 Art. 13",
                severity=ValidationSeverity.CRITICAL,
                validator=self._validate_versao
            ),
            ValidationRule(
                id="pop_004",
                name="Data de elaboração",
                description="Todo POP deve ter data de elaboração",
                rdc_reference="RDC 67/2007 Art. 13",
                severity=ValidationSeverity.CRITICAL,
                validator=self._validate_data_elaboracao
            ),
            ValidationRule(
                id="pop_005",
                name="Responsável técnico",
                description="POP deve ser assinado pelo responsável técnico",
                rdc_reference="RDC 67/2007 Art. 14",
                severity=ValidationSeverity.CRITICAL,
                validator=self._validate_responsavel_tecnico
            ),
            
            # Regras de conteúdo
            ValidationRule(
                id="pop_006",
                name="Objetivo do POP",
                description="POP deve ter objetivo claro",
                rdc_reference="BPMF",
                severity=ValidationSeverity.HIGH,
                validator=self._validate_objetivo
            ),
            ValidationRule(
                id="pop_007",
                name="Setor responsável",
                description="POP deve identificar setor responsável",
                rdc_reference="BPMF",
                severity=ValidationSeverity.HIGH,
                validator=self._validate_setor
            ),
            ValidationRule(
                id="pop_008",
                name="Procedimentos detalhados",
                description="POP deve ter procedimentos passo a passo",
                rdc_reference="RDC 67/2007 Art. 13",
                severity=ValidationSeverity.HIGH,
                validator=self._validate_procedimentos
            ),
            ValidationRule(
                id="pop_009",
                name="Materiais e equipamentos",
                description="POP deve listar materiais e equipamentos necessários",
                rdc_reference="BPMF",
                severity=ValidationSeverity.MEDIUM,
                validator=self._validate_materiais
            ),
            ValidationRule(
                id="pop_010",
                name="EPIs obrigatórios",
                description="POP deve especificar EPIs quando aplicável",
                rdc_reference="NR 32",
                severity=ValidationSeverity.HIGH,
                category=POPCategory.MANIPULACAO,
                validator=self._validate_epis
            ),
            
            # Regras específicas por categoria
            ValidationRule(
                id="pop_011",
                name="Controle de temperatura",
                description="POP de armazenamento deve especificar controle de temperatura",
                rdc_reference="RDC 67/2007 Art. 20",
                severity=ValidationSeverity.HIGH,
                category=POPCategory.RECEBIMENTO,
                validator=self._validate_temperatura
            ),
            ValidationRule(
                id="pop_012",
                name="Calibração de balanças",
                description="POP de pesagem deve incluir calibração de balanças",
                rdc_reference="RDC 67/2007 Art. 24",
                severity=ValidationSeverity.CRITICAL,
                category=POPCategory.PESAGEM,
                validator=self._validate_calibracao_balancas
            ),
            ValidationRule(
                id="pop_013",
                name="Paramentação para manipulação",
                description="POP de manipulação deve detalhar paramentação",
                rdc_reference="RDC 67/2007 Art. 31",
                severity=ValidationSeverity.CRITICAL,
                category=POPCategory.MANIPULACAO,
                validator=self._validate_paramentacao
            ),
            ValidationRule(
                id="pop_014",
                name="Controle de qualidade da água",
                description="POP deve incluir controle de qualidade da água",
                rdc_reference="RDC 67/2007 Art. 33",
                severity=ValidationSeverity.HIGH,
                category=POPCategory.CONTROLE_QUALIDADE,
                validator=self._validate_agua_qualidade
            ),
            ValidationRule(
                id="pop_015",
                name="Limpeza e sanitização",
                description="POP deve incluir procedimentos de limpeza",
                rdc_reference="RDC 67/2007 Art. 37",
                severity=ValidationSeverity.HIGH,
                category=POPCategory.LIMPEZA,
                validator=self._validate_limpeza
            ),
            
            # Regras de documentação
            ValidationRule(
                id="pop_016",
                name="Registros obrigatórios",
                description="POP deve especificar registros necessários",
                rdc_reference="RDC 67/2007 Art. 17",
                severity=ValidationSeverity.HIGH,
                validator=self._validate_registros
            ),
            ValidationRule(
                id="pop_017",
                name="Prazo de validade",
                description="POP deve ter prazo de validade definido",
                rdc_reference="RDC 67/2007 Art. 18",
                severity=ValidationSeverity.MEDIUM,
                validator=self._validate_prazo_validade
            ),
            ValidationRule(
                id="pop_018",
                name="Literatura consultada",
                description="POP deve referenciar literatura consultada",
                rdc_reference="BPMF",
                severity=ValidationSeverity.LOW,
                validator=self._validate_literatura
            )
        ]
        return rules
    
    def _load_rdc_requirements(self) -> Dict[str, Any]:
        """Carrega requisitos específicos da RDC 67/2007"""
        return {
            "mandatory_sections": [
                "cabeçalho", "objetivo", "setor", "procedimentos",
                "materiais", "registros", "aprovacao"
            ],
            "critical_elements": {
                "codigo": r"POP\.\d{3}",
                "versao": r"versão\s*\d+\.\d+",
                "data": r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",
                "responsavel": r"responsável\s*técnico|farmacêutico\s*responsável"
            },
            "category_requirements": {
                "recebimento_armazenamento": ["temperatura", "umidade", "inspeção", "quarentena"],
                "pesagem_balancas": ["balança", "calibração", "precisão", "verificação"],
                "manipulacao": ["paramentação", "epi", "higiene", "procedimento"],
                "controle_qualidade": ["teste", "análise", "especificação", "resultado"],
                "equipamentos": ["operação", "limpeza", "manutenção", "calibração"],
                "limpeza_sanitizacao": ["sanitização", "desinfecção", "procedimento", "frequência"],
                "dispensacao": ["avaliação", "prescrição", "orientação", "registro"],
                "seguranca": ["epi", "risco", "emergência", "procedimento"],
                "administrativo": ["registro", "controle", "treinamento", "revisão"]
            }
        }
    
    def validate_pop_document(self, pop_doc: POPDocument) -> ValidationReport:
        """Valida documento POP completo"""
        issues = []
        
        # Aplicar regras de validação
        for rule in self.rules:
            # Filtrar regras por categoria se aplicável
            if rule.category and rule.category != pop_doc.categoria:
                continue
            
            try:
                rule_issues = rule.validator(pop_doc, rule)
                issues.extend(rule_issues)
            except Exception as e:
                # Log erro mas continuar validação
                issues.append(ValidationIssue(
                    rule_id=rule.id,
                    severity=ValidationSeverity.LOW,
                    message=f"Erro na validação da regra {rule.name}: {str(e)}",
                    suggestion="Verificar formato do documento"
                ))
        
        # Calcular score de conformidade
        compliance_score = self._calculate_compliance_score(issues)
        
        # Determinar status geral
        overall_status = self._determine_overall_status(issues, compliance_score)
        
        # Gerar recomendações
        recommendations = self._generate_recommendations(issues, pop_doc)
        
        # Calcular próxima data de revisão
        next_review = self._calculate_next_review_date(pop_doc, overall_status)
        
        return ValidationReport(
            document_id=pop_doc.id,
            document_codigo=pop_doc.codigo,
            validation_date=datetime.now(),
            overall_status=overall_status,
            compliance_score=compliance_score,
            issues=issues,
            recommendations=recommendations,
            next_review_date=next_review
        )
    
    def _validate_codigo(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida código do POP"""
        issues = []
        
        if not pop_doc.codigo:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="POP não possui código",
                suggestion="Adicionar código no formato POP.XXX"
            ))
        elif not re.match(r"^POP\.\d{3}$", pop_doc.codigo):
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message=f"Código {pop_doc.codigo} não segue padrão POP.XXX",
                suggestion="Formatar código como POP.001, POP.002, etc."
            ))
        
        return issues
    
    def _validate_titulo(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida título do POP"""
        issues = []
        
        if not pop_doc.titulo or len(pop_doc.titulo.strip()) < 10:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Título muito curto ou ausente",
                suggestion="Adicionar título descritivo com mínimo 10 caracteres"
            ))
        
        return issues
    
    def _validate_versao(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida versão do POP"""
        issues = []
        
        if not pop_doc.versao:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="POP não possui versão",
                suggestion="Adicionar versão no formato X.X (ex: 1.0)"
            ))
        elif not re.match(r"^\d+\.\d+$", pop_doc.versao):
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message=f"Versão {pop_doc.versao} não segue padrão X.X",
                suggestion="Formatar versão como 1.0, 2.1, etc."
            ))
        
        return issues
    
    def _validate_data_elaboracao(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida data de elaboração"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        # Buscar padrões de data
        date_patterns = [
            r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
            r"\b\d{2,4}[/-]\d{1,2}[/-]\d{1,2}\b",
            r"\b\d{1,2}\s*de\s*\w+\s*de\s*\d{4}\b"
        ]
        
        has_date = any(re.search(pattern, content) for pattern in date_patterns)
        
        if not has_date:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrada data de elaboração",
                suggestion="Adicionar data no formato DD/MM/YYYY ou similar"
            ))
        
        return issues
    
    def _validate_responsavel_tecnico(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida responsável técnico"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        # Buscar indicações de responsável
        responsibility_patterns = [
            r"responsável\s*técnico",
            r"farmacêutico\s*responsável",
            r"assinatura\s*do\s*responsável",
            r"aprovação\s*do\s*responsável"
        ]
        
        has_responsible = any(re.search(pattern, content) for pattern in responsibility_patterns)
        
        if not has_responsible:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrado responsável técnico",
                suggestion="Adicionar seção de assinatura/aprovação do responsável técnico"
            ))
        
        return issues
    
    def _validate_objetivo(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida objetivo do POP"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        objective_patterns = [
            r"objetivo\s*[:\-]",
            r"finalidade\s*[:\-]",
            r"propósito\s*[:\-]"
        ]
        
        has_objective = any(re.search(pattern, content) for pattern in objective_patterns)
        
        if not has_objective:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrado objetivo do POP",
                suggestion="Adicionar seção 'Objetivo' descrevendo o propósito do procedimento"
            ))
        
        return issues
    
    def _validate_setor(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida setor responsável"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        sector_patterns = [
            r"setor\s*[:\-]",
            r"área\s*[:\-]",
            r"local\s*[:\-]"
        ]
        
        has_sector = any(re.search(pattern, content) for pattern in sector_patterns)
        
        if not has_sector:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrado setor responsável",
                suggestion="Adicionar seção 'Setor' identificando área responsável"
            ))
        
        return issues
    
    def _validate_procedimentos(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida procedimentos detalhados"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        # Buscar indicadores de procedimentos
        procedure_indicators = [
            r"passo\s*\d+",
            r"etapa\s*\d+",
            r"\d+\.\s*[a-z]",
            r"procedimento\s*[:\-]"
        ]
        
        procedure_count = sum(len(re.findall(pattern, content)) for pattern in procedure_indicators)
        
        if procedure_count < 3:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="POP com poucos procedimentos detalhados",
                suggestion="Detalhar procedimentos passo a passo (mínimo 3 passos)"
            ))
        
        return issues
    
    def _validate_materiais(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida materiais e equipamentos"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        materials_patterns = [
            r"materiais\s*[:\-]",
            r"equipamentos\s*[:\-]",
            r"insumos\s*[:\-]",
            r"utensílios\s*[:\-]"
        ]
        
        has_materials = any(re.search(pattern, content) for pattern in materials_patterns)
        
        if not has_materials:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrada lista de materiais/equipamentos",
                suggestion="Adicionar seção 'Materiais e Equipamentos' necessários"
            ))
        
        return issues
    
    def _validate_epis(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida EPIs obrigatórios"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        epi_patterns = [
            r"epi\s*[:\-]",
            r"equipamento\s*de\s*proteção",
            r"paramentação\s*[:\-]",
            r"luvas",
            r"máscara",
            r"jaleco"
        ]
        
        has_epis = any(re.search(pattern, content) for pattern in epi_patterns)
        
        if not has_epis:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrados EPIs obrigatórios",
                suggestion="Adicionar seção 'EPIs' com equipamentos de proteção individual"
            ))
        
        return issues
    
    def _validate_temperatura(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida controle de temperatura"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        temp_patterns = [
            r"temperatura\s*[:\-]",
            r"controle\s*de\s*temperatura",
            r"\d+°c",
            r"\d+\s*graus"
        ]
        
        has_temp = any(re.search(pattern, content) for pattern in temp_patterns)
        
        if not has_temp:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrado controle de temperatura",
                suggestion="Adicionar especificação de temperatura e controle"
            ))
        
        return issues
    
    def _validate_calibracao_balancas(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida calibração de balanças"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        calibration_patterns = [
            r"calibração\s*[:\-]",
            r"verificação\s*[:\-]",
            r"balança\s*analítica",
            r"peso\s*padrão"
        ]
        
        has_calibration = any(re.search(pattern, content) for pattern in calibration_patterns)
        
        if not has_calibration:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrado procedimento de calibração",
                suggestion="Adicionar procedimento de calibração e verificação de balanças"
            ))
        
        return issues
    
    def _validate_paramentacao(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida paramentação"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        paramentacao_patterns = [
            r"paramentação\s*[:\-]",
            r"roupa\s*protetora",
            r"luvas",
            r"máscara",
            r"touca",
            r"propés"
        ]
        
        has_paramentacao = any(re.search(pattern, content) for pattern in paramentacao_patterns)
        
        if not has_paramentacao:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrado procedimento de paramentação",
                suggestion="Adicionar procedimento detalhado de paramentação"
            ))
        
        return issues
    
    def _validate_agua_qualidade(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida controle de qualidade da água"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        water_patterns = [
            r"água\s*purificada",
            r"controle\s*de\s*qualidade",
            r"teste\s*da\s*água",
            r"ph\s*da\s*água",
            r"condutividade"
        ]
        
        has_water_control = any(re.search(pattern, content) for pattern in water_patterns)
        
        if not has_water_control:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrado controle de qualidade da água",
                suggestion="Adicionar procedimento de controle de qualidade da água purificada"
            ))
        
        return issues
    
    def _validate_limpeza(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida procedimentos de limpeza"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        cleaning_patterns = [
            r"limpeza\s*[:\-]",
            r"sanitização\s*[:\-]",
            r"desinfecção",
            r"produto\s*de\s*limpeza",
            r"frequência"
        ]
        
        has_cleaning = any(re.search(pattern, content) for pattern in cleaning_patterns)
        
        if not has_cleaning:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrados procedimentos de limpeza",
                suggestion="Adicionar procedimento detalhado de limpeza e sanitização"
            ))
        
        return issues
    
    def _validate_registros(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida registros obrigatórios"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        record_patterns = [
            r"registro\s*[:\-]",
            r"livro\s*de\s*registro",
            r"planilha\s*de\s*controle",
            r"documentação"
        ]
        
        has_records = any(re.search(pattern, content) for pattern in record_patterns)
        
        if not has_records:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrados registros obrigatórios",
                suggestion="Especificar registros necessários para o procedimento"
            ))
        
        return issues
    
    def _validate_prazo_validade(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida prazo de validade"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        validity_patterns = [
            r"validade\s*[:\-]",
            r"prazo\s*de\s*validade",
            r"revisão\s*em",
            r"vigência"
        ]
        
        has_validity = any(re.search(pattern, content) for pattern in validity_patterns)
        
        if not has_validity:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrado prazo de validade",
                suggestion="Adicionar prazo de validade do POP (geralmente 2 anos)"
            ))
        
        return issues
    
    def _validate_literatura(self, pop_doc: POPDocument, rule: ValidationRule) -> List[ValidationIssue]:
        """Valida literatura consultada"""
        issues = []
        content = pop_doc.conteudo.lower()
        
        literature_patterns = [
            r"literatura\s*consultada",
            r"referências\s*bibliográficas",
            r"bibliografia",
            r"rdc\s*\d+"
        ]
        
        has_literature = any(re.search(pattern, content) for pattern in literature_patterns)
        
        if not has_literature:
            issues.append(ValidationIssue(
                rule_id=rule.id,
                severity=rule.severity,
                message="Não encontrada literatura consultada",
                suggestion="Adicionar referências bibliográficas e normativas"
            ))
        
        return issues
    
    def _calculate_compliance_score(self, issues: List[ValidationIssue]) -> float:
        """Calcula score de conformidade (0-1)"""
        if not issues:
            return 1.0
        
        # Pesos por severidade
        severity_weights = {
            ValidationSeverity.CRITICAL: 0.4,
            ValidationSeverity.HIGH: 0.3,
            ValidationSeverity.MEDIUM: 0.2,
            ValidationSeverity.LOW: 0.1,
            ValidationSeverity.INFO: 0.0
        }
        
        total_weight = 0
        penalty_weight = 0
        
        for issue in issues:
            weight = severity_weights.get(issue.severity, 0.1)
            total_weight += weight
            penalty_weight += weight
        
        # Score base: 1.0 - penalidade
        base_score = 1.0 - penalty_weight
        
        # Ajustar para escala 0-1
        return max(0.0, min(1.0, base_score))
    
    def _determine_overall_status(self, issues: List[ValidationIssue], compliance_score: float) -> ValidationStatus:
        """Determina status geral da validação"""
        critical_issues = [i for i in issues if i.severity == ValidationSeverity.CRITICAL]
        high_issues = [i for i in issues if i.severity == ValidationSeverity.HIGH]
        
        if critical_issues:
            return ValidationStatus.NON_COMPLIANT
        elif high_issues or compliance_score < 0.7:
            return ValidationStatus.WARNING
        elif compliance_score < 0.9:
            return ValidationStatus.PENDING_REVIEW
        else:
            return ValidationStatus.COMPLIANT
    
    def _generate_recommendations(self, issues: List[ValidationIssue], pop_doc: POPDocument) -> List[str]:
        """Gera recomendações baseadas nos issues"""
        recommendations = []
        
        # Agrupar issues por tipo
        critical_issues = [i for i in issues if i.severity == ValidationSeverity.CRITICAL]
        high_issues = [i for i in issues if i.severity == ValidationSeverity.HIGH]
        
        if critical_issues:
            recommendations.append("CORREÇÃO IMEDIATA: Resolver todos os issues críticos antes do uso")
        
        if high_issues:
            recommendations.append("PRIORIDADE ALTA: Resolver issues de alta prioridade na próxima revisão")
        
        # Recomendações específicas por categoria
        if pop_doc.categoria == POPCategory.MANIPULACAO:
            recommendations.append("Revisar procedimentos de paramentação e segurança")
        elif pop_doc.categoria == POPCategory.CONTROLE_QUALIDADE:
            recommendations.append("Verificar todos os procedimentos de teste e análise")
        elif pop_doc.categoria == POPCategory.RECEBIMENTO:
            recommendations.append("Confirmar todos os controles de temperatura e umidade")
        
        # Recomendação geral
        if len(issues) > 5:
            recommendations.append("Considerar revisão completa do documento para melhorar conformidade")
        
        return recommendations
    
    def _calculate_next_review_date(self, pop_doc: POPDocument, status: ValidationStatus) -> Optional[datetime]:
        """Calcula próxima data de revisão baseada no status"""
        from datetime import timedelta
        
        if status == ValidationStatus.NON_COMPLIANT:
            return datetime.now() + timedelta(days=30)  # Revisar em 30 dias
        elif status == ValidationStatus.WARNING:
            return datetime.now() + timedelta(days=90)  # Revisar em 3 meses
        elif status == ValidationStatus.PENDING_REVIEW:
            return datetime.now() + timedelta(days=180)  # Revisar em 6 meses
        else:
            return datetime.now() + timedelta(days=730)  # Revisar em 2 anos (padrão)
    
    def get_validation_summary(self, tenant_id: str) -> Dict[str, Any]:
        """Resumo estatístico de validações"""
        # Esta função seria implementada com banco de dados para buscar histórico
        # Por ora, retorna estrutura esperada
        return {
            "total_validated": 0,
            "by_status": {
                "compliant": 0,
                "non_compliant": 0,
                "warning": 0,
                "pending_review": 0
            },
            "average_compliance_score": 0.0,
            "most_common_issues": [],
            "next_reviews_pending": []
        }
