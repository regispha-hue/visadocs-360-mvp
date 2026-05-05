#!/usr/bin/env python3
"""
Script de Migração de Kits de POPs - OneDrive → VISADOCS
Organiza, migra e prepara para ingestão no RAG

Uso:
    python scripts/migrate_pops_kits.py

Requisitos:
    - Acesso à pasta C:/Users/Usuario/Desktop/POPs OneDrive
    - Permissão de escrita em pops_kits/
"""

import os
import shutil
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

# Configurações
ONEDRIVE_PATH = Path("C:/Users/Usuario/Desktop/POPs OneDrive")
VISADOCS_PATH = Path("C:/Users/Usuario/visadocs-360-mvp/pops_kits")
RAG_PATH = Path("C:/Users/Usuario/visadocs-360-mvp/pops_rag")

# Mapeamento de pastas do OneDrive para estrutura VISADOCS
KIT_MAPPING = {
    "POPs+MBP_Antibióticos Citostáticos e Hormônios": {
        "folder": "01_antibioticos_citostaticos_hormonios",
        "category": "Manipulação Especial",
        "priority": 1,
        "pop_count": 11,
    },
    "POPs+MBP_Farmácia de Manipulação Veterinária Exclusiva": {
        "folder": "02_veterinaria_exclusiva",
        "category": "Farmácia Veterinária",
        "priority": 2,
        "pop_count": 20,
    },
    "POPs+MBP_SBIT": {
        "folder": "03_sbit_bioterápicos",
        "category": "Homeopatia",
        "priority": 3,
        "pop_count": 8,
    },
    "POPs_Manipulação Magistral Homeopática": {
        "folder": "04_homeopatia_magistral",
        "category": "Homeopatia",
        "priority": 4,
        "pop_count": 23,
    },
    "POPs_Serviços e Consulta Farmacêutica": {
        "folder": "05_servicos_consulta_farmaceutica",
        "category": "Serviços Farmacêuticos",
        "priority": 5,
        "pop_count": 24,
    },
    "POPs_LGPD para Farmácias de Manipulação": {
        "folder": "06_lgpd_compliance",
        "category": "Compliance",
        "priority": 6,
        "pop_count": 8,
    },
    "POP Polícia Civil [2025]": {
        "folder": "07_fiscalizacao_policia_civil",
        "category": "Fiscalização",
        "priority": 7,
        "pop_count": 10,
    },
    "POPs_Manipulação Veterinária - Complementar MAPA-ANVISA": {
        "folder": "08_veterinaria_mapa_anvisa",
        "category": "Veterinária",
        "priority": 8,
        "pop_count": 15,
    },
    "Manual para Solicitação de AE": {
        "folder": "09_manuais_regulatorios/AE",
        "category": "Regulatório",
        "priority": 9,
        "pop_count": 0,
    },
    "Manual para Solicitação de AFE": {
        "folder": "09_manuais_regulatorios/AFE",
        "category": "Regulatório",
        "priority": 9,
        "pop_count": 0,
    },
    "Manual para Solicitação de Registro no MAPA": {
        "folder": "09_manuais_regulatorios/MAPA",
        "category": "Regulatório",
        "priority": 9,
        "pop_count": 0,
    },
    "PGRSS_Farmácia de Manipulação e Drogarias": {
        "folder": "10_pgrss_meio_ambiente",
        "category": "Meio Ambiente",
        "priority": 10,
        "pop_count": 0,
    },
}


class POPsMigrationManager:
    """Gerencia a migração de kits de POPs"""
    
    def __init__(self):
        self.migration_log = []
        self.errors = []
        self.stats = {
            "folders_created": 0,
            "files_copied": 0,
            "pops_indexed": 0,
            "errors": 0,
        }
    
    def create_directory_structure(self) -> bool:
        """Cria estrutura de diretórios no VISADOCS"""
        print("📁 Criando estrutura de diretórios...")
        
        try:
            # Criar pasta raiz se não existir
            VISADOCS_PATH.mkdir(parents=True, exist_ok=True)
            
            # Renomear pasta existente
            old_folder = VISADOCS_PATH / "1_recebimento_armazenamento"
            new_folder = VISADOCS_PATH / "00_geral_recebimento_armazenamento"
            if old_folder.exists() and not new_folder.exists():
                old_folder.rename(new_folder)
                print(f"  ✅ Renomeado: {old_folder.name} → {new_folder.name}")
            
            # Criar novas pastas
            for kit_name, config in KIT_MAPPING.items():
                folder_path = VISADOCS_PATH / config["folder"]
                folder_path.mkdir(parents=True, exist_ok=True)
                
                # Criar subpastas padrão
                (folder_path / "POPs").mkdir(exist_ok=True)
                (folder_path / "MBP").mkdir(exist_ok=True)
                (folder_path / "Roteiros").mkdir(exist_ok=True)
                (folder_path / "Regulatórios").mkdir(exist_ok=True)
                
                self.stats["folders_created"] += 1
                print(f"  ✅ Criado: {config['folder']}")
            
            print(f"✅ {self.stats['folders_created']} pastas criadas")
            return True
            
        except Exception as e:
            self.errors.append(f"Erro ao criar diretórios: {e}")
            print(f"❌ Erro: {e}")
            return False
    
    def migrate_kit(self, kit_name: str, config: Dict) -> bool:
        """Migra um kit específico do OneDrive para VISADOCS"""
        source_path = ONEDRIVE_PATH / kit_name
        dest_path = VISADOCS_PATH / config["folder"]
        
        if not source_path.exists():
            print(f"  ⚠️ Pasta não encontrada: {kit_name}")
            return False
        
        print(f"\n📦 Migrando: {kit_name}")
        print(f"   Origem: {source_path}")
        print(f"   Destino: {dest_path}")
        
        try:
            files_copied = 0
            
            # Copiar arquivos e pastas
            for item in source_path.iterdir():
                try:
                    if item.is_file():
                        # Determinar subpasta baseado no tipo
                        if "MBP" in item.name or "Manual" in item.name:
                            dest = dest_path / "MBP" / item.name
                        elif "Roteiro" in item.name or "Autoinspeção" in item.name:
                            dest = dest_path / "Roteiros" / item.name
                        elif ".zip" in item.name:
                            dest = dest_path / item.name
                        else:
                            dest = dest_path / item.name
                        
                        shutil.copy2(item, dest)
                        files_copied += 1
                        
                    elif item.is_dir() and "POP" in item.name:
                        # Copiar pastas de POPs
                        dest = dest_path / "POPs" / item.name
                        if dest.exists():
                            shutil.rmtree(dest)
                        shutil.copytree(item, dest)
                        files_copied += 1
                        self.stats["pops_indexed"] += 1
                        
                    elif item.is_dir():
                        # Outras pastas
                        dest = dest_path / item.name
                        if dest.exists():
                            shutil.rmtree(dest)
                        shutil.copytree(item, dest)
                        files_copied += 1
                
                except Exception as e:
                    print(f"  ⚠️ Erro ao copiar {item.name}: {e}")
                    self.stats["errors"] += 1
            
            self.stats["files_copied"] += files_copied
            print(f"  ✅ Copiados: {files_copied} itens")
            return True
            
        except Exception as e:
            self.errors.append(f"Erro na migração de {kit_name}: {e}")
            print(f"  ❌ Erro: {e}")
            return False
    
    def migrate_all_kits(self) -> bool:
        """Migra todos os kits do OneDrive"""
        print("\n🚀 Iniciando migração de todos os kits...")
        print("=" * 60)
        
        success_count = 0
        
        # Ordenar por prioridade
        sorted_kits = sorted(KIT_MAPPING.items(), key=lambda x: x[1]["priority"])
        
        for kit_name, config in sorted_kits:
            if self.migrate_kit(kit_name, config):
                success_count += 1
        
        print("\n" + "=" * 60)
        print(f"✅ Migração concluída: {success_count}/{len(KIT_MAPPING)} kits")
        return success_count == len(KIT_MAPPING)
    
    def generate_index_json(self) -> bool:
        """Gera arquivo JSON com índice de todos os POPs"""
        print("\n📊 Gerando índice JSON...")
        
        index = {
            "generated_at": datetime.now().isoformat(),
            "total_kits": len(KIT_MAPPING),
            "total_pops": sum(k["pop_count"] for k in KIT_MAPPING.values()),
            "kits": [],
        }
        
        for kit_name, config in KIT_MAPPING.items():
            kit_path = VISADOCS_PATH / config["folder"]
            pops_folder = kit_path / "POPs"
            
            pops_list = []
            if pops_folder.exists():
                pops_list = [p.name for p in pops_folder.iterdir() if p.is_dir()]
            
            kit_info = {
                "name": kit_name,
                "folder": config["folder"],
                "category": config["category"],
                "priority": config["priority"],
                "expected_pops": config["pop_count"],
                "found_pops": len(pops_list),
                "pops": pops_list,
                "path": str(kit_path),
            }
            index["kits"].append(kit_info)
        
        # Salvar índice
        index_path = VISADOCS_PATH / "pops_index.json"
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
        
        print(f"  ✅ Índice salvo: {index_path}")
        print(f"  📈 Total de POPs: {index['total_pops']}")
        return True
    
    def prepare_for_rag(self) -> bool:
        """Prepara dados para ingestão no RAG"""
        print("\n🧠 Preparando dados para RAG...")
        
        rag_ready_path = RAG_PATH / "ready_for_ingestion"
        rag_ready_path.mkdir(parents=True, exist_ok=True)
        
        try:
            # Criar manifesto para ingestão
            manifest = {
                "created_at": datetime.now().isoformat(),
                "source": "POPs OneDrive Migration",
                "total_documents": 0,
                "documents": [],
            }
            
            # Processar cada kit
            for kit_name, config in KIT_MAPPING.items():
                kit_path = VISADOCS_PATH / config["folder"]
                pops_path = kit_path / "POPs"
                
                if pops_path.exists():
                    for pop_folder in pops_path.iterdir():
                        if pop_folder.is_dir():
                            doc_info = {
                                "id": f"{config['folder']}_{pop_folder.name}",
                                "title": pop_folder.name,
                                "kit": kit_name,
                                "category": config["category"],
                                "path": str(pop_folder),
                                "files": [f.name for f in pop_folder.iterdir() if f.is_file()],
                            }
                            manifest["documents"].append(doc_info)
                            manifest["total_documents"] += 1
            
            # Salvar manifesto
            manifest_path = rag_ready_path / "manifest.json"
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)
            
            print(f"  ✅ Manifesto criado: {manifest_path}")
            print(f"  📄 Documentos para ingestão: {manifest['total_documents']}")
            return True
            
        except Exception as e:
            print(f"  ❌ Erro: {e}")
            return False
    
    def print_summary(self):
        """Imprime resumo da migração"""
        print("\n" + "=" * 60)
        print("📋 RESUMO DA MIGRAÇÃO")
        print("=" * 60)
        print(f"✅ Pastas criadas: {self.stats['folders_created']}")
        print(f"✅ Arquivos copiados: {self.stats['files_copied']}")
        print(f"✅ POPs indexados: {self.stats['pops_indexed']}")
        print(f"⚠️ Erros: {self.stats['errors']}")
        
        if self.errors:
            print("\n❌ Erros encontrados:")
            for error in self.errors:
                print(f"   - {error}")
        
        print("\n📍 Próximos passos:")
        print("   1. Verificar integridade dos arquivos copiados")
        print("   2. Executar ingestão no RAG")
        print("   3. Atualizar skills do assistente IA")
        print("   4. Fazer deploy em produção")


def main():
    """Função principal"""
    print("=" * 60)
    print("🚀 VISADOCS - Migração de Kits de POPs")
    print("=" * 60)
    print(f"📂 Origem: {ONEDRIVE_PATH}")
    print(f"📂 Destino: {VISADOCS_PATH}")
    print(f"📦 Kits a migrar: {len(KIT_MAPPING)}")
    print("=" * 60)
    
    manager = POPsMigrationManager()
    
    # 1. Criar estrutura
    if not manager.create_directory_structure():
        print("❌ Falha ao criar estrutura de diretórios")
        return 1
    
    # 2. Migrar kits
    if not manager.migrate_all_kits():
        print("⚠️ Alguns kits não foram migrados completamente")
    
    # 3. Gerar índice
    manager.generate_index_json()
    
    # 4. Preparar para RAG
    manager.prepare_for_rag()
    
    # 5. Resumo
    manager.print_summary()
    
    print("\n✅ Processo de migração concluído!")
    return 0


if __name__ == "__main__":
    exit(main())
