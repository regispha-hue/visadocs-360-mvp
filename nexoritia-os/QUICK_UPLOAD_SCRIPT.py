#!/usr/bin/env python3
"""
Nexoritia OS - Quick Upload Script
Script para facilitar upload do repositório para GitHub
"""

import subprocess
import sys
import webbrowser
from pathlib import Path

def run_command(cmd, description):
    """Executa comando e exibe resultado"""
    print(f"\n🔄 {description}")
    print(f"Comando: {cmd}")
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Sucesso: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ Erro: {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"❌ Exceção: {str(e)}")
        return False

def main():
    """Função principal"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║              NEXORITIA OS - QUICK UPLOAD SCRIPT             ║
╠══════════════════════════════════════════════════════════════╣
║  Script para upload automático do repositório para GitHub         ║
║  Nexoritia OS v2.0 - Sistema Operacional de Governança IA     ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    # 1. Verificar se estamos no diretório correto
    current_dir = Path.cwd()
    if current_dir.name != "nexoritia-os":
        print(f"❌ Erro: Execute este script na pasta 'nexoritia-os'")
        print(f"   Diretório atual: {current_dir}")
        return False
    
    # 2. Verificar se já é um repositório Git
    if not Path(".git").exists():
        print("❌ Erro: Este não é um repositório Git")
        print("   Execute 'git init' primeiro")
        return False
    
    # 3. Verificar arquivos principais
    required_files = [
        "README.md",
        "api/main.py", 
        "core/models.py",
        "core/canon_registry.py",
        "core/os_notarius.py",
        "core/os_radar.py",
        "data/canon_v1.0.json",
        "requirements.txt"
    ]
    
    print("\n📋 Verificando arquivos obrigatórios:")
    missing_files = []
    for file in required_files:
        if Path(file).exists():
            print(f"  ✅ {file}")
        else:
            print(f"  ❌ {file}")
            missing_files.append(file)
    
    if missing_files:
        print(f"\n❌ Arquivos faltando: {', '.join(missing_files)}")
        return False
    
    # 4. Verificar status do Git
    print("\n🔍 Status do repositório Git:")
    run_command("git status --porcelain", "Verificando status")
    
    # 5. Fazer commit se houver mudanças
    status_result = subprocess.run("git status --porcelain", shell=True, capture_output=True, text=True)
    if status_result.stdout.strip():
        print("\n📝 Mudanças pendentes encontradas")
        if not run_command("git add .", "Adicionando mudanças"):
            return False
        
        commit_msg = "chore: final preparation for GitHub upload"
        if not run_command(f'git commit -m "{commit_msg}"', "Fazendo commit"):
            return False
    else:
        print("\n✅ Nenhuma mudança pendente")
    
    # 6. Verificar remote
    remote_result = subprocess.run("git remote -v", shell=True, capture_output=True, text=True)
    if "origin" not in remote_result.stdout:
        print("\n⚠️  Nenhum remote 'origin' configurado")
        print("   Você precisa criar o repositório no GitHub primeiro!")
        print("   Acesse: https://github.com/new")
        print("   Repository name: nexoritia-os")
        print("   Depois execute: git remote add origin https://github.com/SEU_USERNAME/nexoritia-os.git")
        return False
    
    # 7. Fazer push
    print("\n🚀 Fazendo upload para GitHub...")
    if not run_command("git push -u origin master", "Push para GitHub"):
        return False
    
    # 8. Abrir repositório no navegador
    print("\n🌐 Abrindo repositório no navegador...")
    try:
        # Extrair username do remote URL
        remote_url = subprocess.run("git remote get-url origin", shell=True, capture_output=True, text=True).stdout.strip()
        if "github.com" in remote_url:
            username = remote_url.split("github.com/")[1].split("/")[0]
            repo_url = f"https://github.com/{username}/nexoritia-os"
            webbrowser.open(repo_url)
            print(f"📂 Repositório aberto: {repo_url}")
    except Exception as e:
        print(f"⚠️  Não foi possível abrir automaticamente: {e}")
    
    # 9. Instructions para release
    print("""
🎯 UPLOAD CONCLUÍDO COM SUCESSO!

📋 Próximos passos:
1. ✅ Repositório upado no GitHub
2. 📝 Criar release v2.0.0:
   - Acesse: https://github.com/SEU_USERNAME/nexoritia-os/releases
   - Clique: "Create a new release"
   - Tag: v2.0.0
   - Title: "Nexoritia OS v2.0.0"
3. 🚀 Fazer deploy:
   - Railway: Conecte GitHub ao Railway
   - Heroku: git push heroku master
   - VPS: Use docker-compose

🔐 Nexoritia OS v2.0.0 agora está disponível publicamente!
    """)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
