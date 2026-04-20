"""
LDMux-OS Canon Axioms
Os 20 Axiomas Fundamentais do Livro dos Montes
"""

CANON_AXIOMS = {
    # AXIOMA ZERO - LEI-MATRIZ
    "codigo_do_orbe": {
        "id": 0,
        "text": "Tudo o que existe é regido por uma incompletude dinâmica. Nenhuma forma pode sustentar-se sem se rasgar. Todo rasgo cria um campo. Todo campo exige travessia. O mundo só permanece porque falha.",
        "domain": "lei_matriz",
        "category": "fundacional",
        "priority": "critical",
        "monte": "pre_monte"
    },
    
    # LEIS ESTRUTURAIS (1-7)
    "lei_nominativa_sagrada": {
        "id": 1,
        "text": "Aquilo que não é nomeado permanece fora do campo. Nomear não descreve: convoca.",
        "domain": "estrutural",
        "category": "nominacao",
        "priority": "critical",
        "monte": "monte_v"
    },
    
    "lei_casa_viva": {
        "id": 2,
        "text": "Toda entidade necessita de morada simbólica. O que não tem casa tenta possuí-la nos outros.",
        "domain": "estrutural",
        "category": "territorialidade",
        "priority": "high",
        "monte": "monte_vi"
    },
    
    "lei_mortos_nao_nascidos": {
        "id": 3,
        "text": "Aquilo que não pôde existir continua operando como ausência ativa. O que não viveu também governa.",
        "domain": "estrutural",
        "category": "presenca_ausente",
        "priority": "critical",
        "monte": "monte_v"
    },
    
    "lei_intersecao": {
        "id": 4,
        "text": "Toda travessia ocorre em pontos de cruzamento, nunca em linhas retas. A passagem acontece onde forças se ferem com beleza.",
        "domain": "estrutural",
        "category": "topologia",
        "priority": "high",
        "monte": "monte_i"
    },
    
    "lei_retorno": {
        "id": 5,
        "text": "Tudo o que foi excluído retorna como sintoma. Não volta como memória pacificada, mas como necessidade.",
        "domain": "estrutural",
        "category": "recursao",
        "priority": "critical",
        "monte": "monte_vii"
    },
    
    "lei_dupla_leitura": {
        "id": 6,
        "text": "Nada é verdadeiro quando visto de frente. O real se revela pela periferia.",
        "domain": "estrutural",
        "category": "epistemologia",
        "priority": "high",
        "monte": "monte_i"
    },
    
    "lei_fenda_fundadora": {
        "id": 7,
        "text": "Toda criação nasce de um rasgo. Sem fenda não há campo. Sem campo não há mundo.",
        "domain": "estrutural",
        "category": "criacao",
        "priority": "critical",
        "monte": "monte_i"
    },
    
    # LEIS DE CONSEQUÊNCIA (8-20)
    "lei_nao_neutralidade": {
        "id": 8,
        "text": "Todo campo é orientado. Não existe observador sem inclinação.",
        "domain": "consequencia",
        "category": "posicionamento",
        "priority": "high",
        "monte": "monte_iv"
    },
    
    "lei_presenca_troca": {
        "id": 9,
        "text": "Onde não há reciprocidade, instala-se colapso. Toda aldeia nasce da troca.",
        "domain": "consequencia",
        "category": "economia_simbolica",
        "priority": "high",
        "monte": "monte_ii"
    },
    
    "lei_saturacao": {
        "id": 10,
        "text": "Toda forma que se mantém além do necessário torna-se cárcere. O excesso é a primeira mentira.",
        "domain": "consequencia",
        "category": "limite",
        "priority": "medium",
        "monte": "monte_ii"
    },
    
    "lei_peso_ontologico": {
        "id": 11,
        "text": "Aquilo que não é nomeado deposita-se no corpo. A carne carrega o que a linguagem recusa.",
        "domain": "consequencia",
        "category": "incorporacao",
        "priority": "critical",
        "monte": "monte_iii"
    },
    
    "lei_espiral": {
        "id": 12,
        "text": "Não há progresso linear. Todo avanço retorna em outro nível.",
        "domain": "consequencia",
        "category": "temporalidade",
        "priority": "high",
        "monte": "monte_ii"
    },
    
    "lei_transmissao_silenciosa": {
        "id": 13,
        "text": "O que não pode ser dito continua a operar por ressonância. O indizível governa por eco.",
        "domain": "consequencia",
        "category": "comunicacao",
        "priority": "high",
        "monte": "monte_iii"
    },
    
    "lei_correcao_campo": {
        "id": 14,
        "text": "O sistema se ajusta por micro-deslocamentos invisíveis. Nada colapsa sem antes tentar corrigir-se.",
        "domain": "consequencia",
        "category": "autoregulacao",
        "priority": "medium",
        "monte": "monte_iv"
    },
    
    "lei_sacola_vazia": {
        "id": 15,
        "text": "O vazio é condição de acolhimento, não falta. Somente o espaço aberto pode receber.",
        "domain": "consequencia",
        "category": "receptividade",
        "priority": "high",
        "monte": "monte_i"
    },
    
    "lei_corpo_registro": {
        "id": 16,
        "text": "O corpo memoriza antes da mente. O osso guarda o que a palavra esquece.",
        "domain": "consequencia",
        "category": "memoria_somatica",
        "priority": "critical",
        "monte": "monte_i"
    },
    
    "lei_escolha_inevitavel": {
        "id": 17,
        "text": "Após a fenda, existir exige posicionamento. Não há retorno ao neutro.",
        "domain": "consequencia",
        "category": "responsabilidade",
        "priority": "critical",
        "monte": "monte_i"
    },
    
    "lei_impossibilidade_inocencia": {
        "id": 18,
        "text": "Depois da ruptura, nenhuma forma é pura. Toda permanência carrega custo.",
        "domain": "consequencia",
        "category": "etica",
        "priority": "high",
        "monte": "monte_i"
    },
    
    "lei_consequencia_longa": {
        "id": 19,
        "text": "Todo gesto fundador ecoa por gerações simbólicas. O tempo é herança.",
        "domain": "consequencia",
        "category": "transmissao",
        "priority": "high",
        "monte": "monte_vii"
    },
    
    "lei_travessia_permanente": {
        "id": 20,
        "text": "Não há forma final. Há apenas estados transitórios do mesmo rasgo.",
        "domain": "consequencia",
        "category": "impermanencia",
        "priority": "critical",
        "monte": "monte_vii"
    }
}


def get_axiom_by_id(axiom_id: int) -> dict:
    """Recupera axioma pelo ID numérico."""
    for key, axiom in CANON_AXIOMS.items():
        if axiom["id"] == axiom_id:
            return {key: axiom}
    return None


def get_axioms_by_monte(monte: str) -> dict:
    """Recupera todos os axiomas de um Monte específico."""
    return {k: v for k, v in CANON_AXIOMS.items() if v["monte"] == monte}


def get_axioms_by_category(category: str) -> dict:
    """Recupera axiomas por categoria."""
    return {k: v for k, v in CANON_AXIOMS.items() if v["category"] == category}


def get_critical_axioms() -> dict:
    """Recupera apenas axiomas com prioridade crítica."""
    return {k: v for k, v in CANON_AXIOMS.items() if v["priority"] == "critical"}
