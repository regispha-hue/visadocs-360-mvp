#!/usr/bin/env python3
"""
LDMux-OS Axiom Kernel - Demo Interativo
Demonstração prática do sistema de validação ontológica.
"""

import hashlib
import json
from pathlib import Path
from canon_axioms import CANON_AXIOMS, get_axioms_by_monte, get_critical_axioms


def print_header(title: str):
    """Imprime cabeçalho formatado."""
    print("\n" + "="*80)
    print(title)
    print("="*80 + "\n")


def demo_canon_structure():
    """Demonstra estrutura do Canon."""
    print_header("DEMO 1: Estrutura do Canon")
    
    print(f"Total de axiomas: {len(CANON_AXIOMS)}")
    
    # Contar por domínio
    domains = {}
    for axiom in CANON_AXIOMS.values():
        domains[axiom["domain"]] = domains.get(axiom["domain"], 0) + 1
    
    print("\nPor domínio:")
    for domain, count in domains.items():
        print(f"  {domain}: {count} axioma(s)")
    
    # Axiomas críticos
    critical = get_critical_axioms()
    print(f"\nAxiomas críticos: {len(critical)}")
    for key, axiom in list(critical.items())[:3]:
        print(f"  [{axiom['id']:02d}] {key}: {axiom['text'][:50]}...")


def demo_monte_distribution():
    """Demonstra distribuição por Monte."""
    print_header("DEMO 2: Distribuição por Monte")
    
    montes = ["pre_monte"] + [f"monte_{r}" for r in ["i", "ii", "iii", "iv", "v", "vi", "vii"]]
    
    for monte in montes:
        axioms = get_axioms_by_monte(monte)
        if axioms:
            print(f"\n{monte.replace('_', ' ').title()}: {len(axioms)} axioma(s)")
            for key, axiom in list(axioms.items())[:2]:
                print(f"  [{axiom['id']:02d}] {axiom['text'][:60]}...")


def demo_hash_computation():
    """Demonstra computação de hash."""
    print_header("DEMO 3: Computação de Hash SHA256")
    
    # Código do Orbe
    axiom = CANON_AXIOMS["codigo_do_orbe"]
    text = axiom["text"]
    
    print(f"Texto original:")
    print(f"  {text}\n")
    
    # Computar hash
    computed_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    print(f"Hash SHA256:")
    print(f"  {computed_hash}\n")
    
    # Demonstrar sensibilidade
    modified_text = text + "."  # Adiciona um ponto
    modified_hash = hashlib.sha256(modified_text.encode('utf-8')).hexdigest()
    
    print(f"Texto modificado (+ ponto final):")
    print(f"  {modified_text}\n")
    
    print(f"Hash modificado:")
    print(f"  {modified_hash}\n")
    
    print(f"Mudança de 1 caractere → hash completamente diferente")


def demo_canon_file():
    """Demonstra estrutura do arquivo Canon."""
    print_header("DEMO 4: Arquivo CANON_V1.0.json")
    
    canon_path = Path(__file__).parent / "CANON_V1.0.json"
    
    if not canon_path.exists():
        print("Arquivo CANON_V1.0.json não encontrado.")
        print("Execute: python freeze.py")
        return
    
    with open(canon_path, "r", encoding="utf-8") as f:
        canon = json.load(f)
    
    print(f"Versão: {canon['version']}")
    print(f"Autor: {canon['author']}")
    print(f"Obra: {canon['work']}")
    print(f"Congelado em: {canon['frozen_at']}")
    print(f"Total de axiomas: {canon['total_axioms']}")
    print(f"\nManifest Hash:")
    print(f"  {canon['manifest_hash']}\n")
    
    print(f"Metadados:")
    print(f"  Estrutura: {canon['metadata']['structure']}")
    print(f"  Prioridades: {canon['metadata']['priority_levels']}")
    
    # Exemplo de axioma no arquivo
    print(f"\nExemplo de axioma no arquivo:")
    first_axiom = list(canon['axioms'].values())[0]
    print(json.dumps(first_axiom, indent=2, ensure_ascii=False))


def demo_verification_flow():
    """Demonstra fluxo de verificação."""
    print_header("DEMO 5: Fluxo de Verificação")
    
    axiom = CANON_AXIOMS["lei_fenda_fundadora"]
    
    print("1. Axioma original:")
    print(f"   [{axiom['id']:02d}] {axiom['text']}\n")
    
    print("2. Sistema gera hash:")
    axiom_hash = hashlib.sha256(axiom['text'].encode('utf-8')).hexdigest()
    print(f"   {axiom_hash}\n")
    
    print("3. Sistema externo armazena hash e envia para validação")
    print(f"   POST /axiom/verify")
    print(f"   Body: {{ \"hash\": \"{axiom_hash[:32]}...\", \"kernel_version\": \"1.0.0\" }}\n")
    
    print("4. Kernel busca no Canon e retorna:")
    print(f"   {{")
    print(f"     \"valid\": true,")
    print(f"     \"coherent\": true,")
    print(f"     \"axiom\": {{")
    print(f"       \"key\": \"lei_fenda_fundadora\",")
    print(f"       \"id\": {axiom['id']},")
    print(f"       \"monte\": \"{axiom['monte']}\"")
    print(f"     }}")
    print(f"   }}\n")
    
    print("5. Sistema externo valida que está usando axioma canônico ✓")


def demo_seal_flow():
    """Demonstra fluxo de selo."""
    print_header("DEMO 6: Fluxo de Selo")
    
    print("1. Usuário cria novo axioma:")
    new_text = "O silêncio não é ausência, mas presença em repouso."
    print(f"   \"{new_text}\"\n")
    
    print("2. Sistema sela o axioma:")
    print(f"   POST /axiom/seal")
    print(f"   Body: {{")
    print(f"     \"text\": \"{new_text}\",")
    print(f"     \"domain\": \"derivado\",")
    print(f"     \"priority\": \"high\"")
    print(f"   }}\n")
    
    new_hash = hashlib.sha256(new_text.encode('utf-8')).hexdigest()
    
    print("3. Kernel retorna:")
    print(f"   {{")
    print(f"     \"hash\": \"{new_hash}\",")
    print(f"     \"sealed_at\": \"2026-01-21T13:30:00Z\",")
    print(f"     \"canon_match\": null  # Não está no Canon")
    print(f"   }}\n")
    
    print("4. Sistema armazena hash para verificações futuras")
    print("5. Axioma pode ser proposto para inclusão em Canon v2.0")


def run_all_demos():
    """Executa todas as demos."""
    print("\n" + "="*80)
    print("LDMUX-OS AXIOM KERNEL - DEMONSTRAÇÃO INTERATIVA")
    print("Canon v1.0 - Livro dos Montes")
    print("="*80)
    
    demo_canon_structure()
    demo_monte_distribution()
    demo_hash_computation()
    demo_canon_file()
    demo_verification_flow()
    demo_seal_flow()
    
    print("\n" + "="*80)
    print("DEMONSTRAÇÃO COMPLETA")
    print("="*80)
    print("\nPróximos passos:")
    print("  1. Iniciar servidor: python axiom_kernel.py")
    print("  2. Executar testes:  python test_axiom_kernel.py")
    print("  3. Usar API conforme documentado no README.md\n")


if __name__ == "__main__":
    run_all_demos()
