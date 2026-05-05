#!/usr/bin/env python3
"""
Script de Migração do Kit Principal de POPs
POPs+MBP_Farmácias_de_Manipulação → VISADOCS

Este é o kit PRINCIPAL com 181 POPs de operações padrão de farmácia de manipulação.
"""

import shutil
import json
from pathlib import Path
from datetime import datetime

# Paths
SOURCE_PATH = Path("C:/Users/Usuario/Desktop/POPs+MBP_Farmácias_de_Manipulação")
DEST_PATH = Path("C:/Users/Usuario/visadocs-360-mvp/pops_kits/99_pops_principais_manipulacao")
INDEX_PATH = Path("C:/Users/Usuario/visadocs-360-mvp/pops_kits/pops_index.json")

def migrate_main_kit():
    """Migra o kit principal de POPs"""
    print("=" * 60)
    print("🚀 Migrando Kit Principal de POPs")
    print("=" * 60)
    print(f"📂 Origem: {SOURCE_PATH}")
    print(f"📂 Destino: {DEST_PATH}")
    
    if not SOURCE_PATH.exists():
        print("❌ Pasta de origem não encontrada!")
        return False
    
    # Criar estrutura
    (DEST_PATH / "POPs").mkdir(parents=True, exist_ok=True)
    (DEST_PATH / "MBP").mkdir(parents=True, exist_ok=True)
    (DEST_PATH / "Regulatórios").mkdir(parents=True, exist_ok=True)
    
    # Contar POPs
    pops_source = SOURCE_PATH / "POPs_Farmácia_de_Manipulação"
    pop_count = 0
    
    if pops_source.exists():
        # Copiar cada pasta de POP
        for pop_folder in pops_source.iterdir():
            if pop_folder.is_dir() and "POP" in pop_folder.name:
                dest = DEST_PATH / "POPs" / pop_folder.name
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(pop_folder, dest)
                pop_count += 1
                if pop_count % 20 == 0:
                    print(f"  ✅ Copiados {pop_count} POPs...")
    
    print(f"✅ Total de POPs copiados: {pop_count}")
    
    # Atualizar índice
    update_index(pop_count)
    
    print("\n✅ Migração do kit principal concluída!")
    return True

def update_index(pop_count: int):
    """Atualiza o índice JSON"""
    print("\n📊 Atualizando índice...")
    
    try:
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            index = json.load(f)
    except:
        index = {
            "generated_at": datetime.now().isoformat(),
            "total_kits": 0,
            "total_pops": 0,
            "kits": []
        }
    
    # Adicionar novo kit
    kit_info = {
        "name": "POPs+MBP_Farmácias_de_Manipulação",
        "folder": "99_pops_principais_manipulacao",
        "category": "Farmácia de Manipulação - Principal",
        "priority": 99,
        "expected_pops": 181,
        "found_pops": pop_count,
        "description": "Kit principal com POPs de operações padrão de farmácia de manipulação - RDC 67/2007",
        "path": str(DEST_PATH),
        "is_main_kit": True
    }
    
    # Verificar se já existe
    existing = [k for k in index.get("kits", []) if k["folder"] == "99_pops_principais_manipulacao"]
    if existing:
        index["kits"] = [k for k in index["kits"] if k["folder"] != "99_pops_principais_manipulacao"]
    
    index["kits"].append(kit_info)
    index["total_kits"] = len(index["kits"])
    index["total_pops"] = sum(k.get("found_pops", 0) for k in index["kits"])
    index["updated_at"] = datetime.now().isoformat()
    
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
    
    print(f"  ✅ Índice atualizado: {index['total_pops']} POPs totais")

if __name__ == "__main__":
    success = migrate_main_kit()
    exit(0 if success else 1)
