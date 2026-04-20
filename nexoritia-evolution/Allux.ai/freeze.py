#!/usr/bin/env python3
"""
LDMux-OS Canon Freeze Script
Gera manifesto imutável CANON_V1.0.json com hash SHA256 de cada axioma.
"""

import json
import hashlib
from datetime import datetime
from pathlib import Path
from canon_axioms import CANON_AXIOMS


def compute_hash(text: str) -> str:
    """Computa hash SHA256 de um texto."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def freeze_canon() -> dict:
    """Gera manifesto congelado do Canon LDM."""
    
    # Processar cada axioma
    frozen_axioms = {}
    category_count = {}
    monte_distribution = {}
    
    for key, axiom in CANON_AXIOMS.items():
        # Hash individual do texto
        axiom_hash = compute_hash(axiom["text"])
        
        # Construir entrada congelada
        frozen_axioms[key] = {
            "id": axiom["id"],
            "text": axiom["text"],
            "hash": axiom_hash,
            "domain": axiom["domain"],
            "category": axiom["category"],
            "priority": axiom["priority"],
            "monte": axiom["monte"]
        }
        
        # Contadores
        category_count[axiom["category"]] = category_count.get(axiom["category"], 0) + 1
        monte_distribution[axiom["monte"]] = monte_distribution.get(axiom["monte"], 0) + 1
    
    # Construir manifesto
    manifest = {
        "version": "1.0.0",
        "frozen_at": datetime.utcnow().isoformat() + "Z",
        "author": "R.Gis Veniloqa",
        "work": "Livro dos Montes",
        "activation_code": "LDM-7M-SA1W-EA25-RGIS",
        "total_axioms": len(frozen_axioms),
        "axioms": frozen_axioms,
        "metadata": {
            "structure": {
                "lei_matriz": 1,
                "estrutural": 7,
                "consequencia": 12
            },
            "category_distribution": category_count,
            "monte_distribution": monte_distribution,
            "priority_levels": {
                "critical": sum(1 for a in frozen_axioms.values() if a["priority"] == "critical"),
                "high": sum(1 for a in frozen_axioms.values() if a["priority"] == "high"),
                "medium": sum(1 for a in frozen_axioms.values() if a["priority"] == "medium")
            }
        }
    }
    
    # Hash do manifesto completo (excluindo o próprio campo manifest_hash)
    manifest_str = json.dumps(manifest, sort_keys=True, ensure_ascii=False)
    manifest["manifest_hash"] = compute_hash(manifest_str)
    
    return manifest


def save_canon(canon: dict, output_path: str = "CANON_V1.0.json") -> Path:
    """Salva manifesto congelado em arquivo JSON."""
    output_file = Path(__file__).parent / output_path
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(canon, f, indent=2, ensure_ascii=False)
    
    return output_file


def print_summary(canon: dict):
    """Imprime sumário executivo do Canon congelado."""
    print("\n" + "="*80)
    print("LDMUX-OS CANON FREEZE v1.0 — MANIFESTO SEALED")
    print("="*80)
    
    print(f"\nAuthor:          {canon['author']}")
    print(f"Work:            {canon['work']}")
    print(f"Version:         {canon['version']}")
    print(f"Frozen at:       {canon['frozen_at']}")
    print(f"Activation Code: {canon['activation_code']}")
    print(f"Total Axioms:    {canon['total_axioms']}")
    
    print(f"\nManifest Hash:   {canon['manifest_hash'][:16]}...{canon['manifest_hash'][-16:]}")
    
    print("\n" + "-"*80)
    print("STRUCTURE")
    print("-"*80)
    for struct, count in canon['metadata']['structure'].items():
        print(f"  {struct.replace('_', ' ').title():20} {count} axiom(s)")
    
    print("\n" + "-"*80)
    print("PRIORITY DISTRIBUTION")
    print("-"*80)
    for priority, count in canon['metadata']['priority_levels'].items():
        print(f"  {priority.title():20} {count} axiom(s)")
    
    print("\n" + "-"*80)
    print("MONTE DISTRIBUTION")
    print("-"*80)
    for monte, count in sorted(canon['metadata']['monte_distribution'].items()):
        display_name = monte.replace('_', ' ').title()
        print(f"  {display_name:20} {count} axiom(s)")
    
    print("\n" + "-"*80)
    print("SAMPLE AXIOMS")
    print("-"*80)
    
    samples = ["codigo_do_orbe", "lei_fenda_fundadora", "lei_travessia_permanente"]
    for key in samples:
        axiom = canon['axioms'][key]
        text_preview = axiom['text'][:60] + "..." if len(axiom['text']) > 60 else axiom['text']
        print(f"\n[{axiom['id']:02d}] {key.replace('_', ' ').title()}")
        print(f"     Text: {text_preview}")
        print(f"     Hash: {axiom['hash'][:16]}...{axiom['hash'][-16:]}")
        print(f"     Monte: {axiom['monte']}")
    
    print("\n" + "="*80)
    print("CANON FROZEN AND SEALED ✓")
    print("="*80 + "\n")


def main():
    """Execução principal."""
    print("\nGenerating LDMux-OS Canon v1.0 from Livro dos Montes...")
    
    # Gerar Canon congelado
    frozen_canon = freeze_canon()
    
    # Salvar arquivo
    output_path = save_canon(frozen_canon)
    
    # Imprimir sumário
    print_summary(frozen_canon)
    
    print(f"Canon saved to: {output_path.absolute()}")
    print(f"File size: {output_path.stat().st_size:,} bytes\n")


if __name__ == "__main__":
    main()
