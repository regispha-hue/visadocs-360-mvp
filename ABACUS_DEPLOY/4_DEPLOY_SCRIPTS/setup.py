#!/usr/bin/env python3
"""Nexoritia OS - Setup Script | Otimizado para deploy"""
import subprocess, sys, os, json
from pathlib import Path

def run(cmd, desc):
    print(f"\n[SETUP] {desc}")
    print(f"$ {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  OK: {result.stdout.strip()[:200]}")
            return True
        else:
            print(f"  ERR: {result.stderr.strip()[:500]}")
            return False
    except Exception as e:
        print(f"  ERR: {e}")
        return False

def main():
    print("""
╔═══════════════════════════════════════════════╗
║     NEXORITIA OS v2.0 - SETUP SCRIPT          ║
╠═══════════════════════════════════════════════╣
║  Sistema Operacional de Governanca IA         ║
╚═══════════════════════════════════════════════╝
    """)

    base = Path(__file__).parent.parent
    core_dir = base / "1_NEXORITIA_OS_CORE"
    api_dir = base / "2_API_SERVER"
    data_dir = api_dir / "data"
    data_dir.mkdir(exist_ok=True)

    # Step 1: Generate canon
    print("\n[1/6] Generating canon_v1.0.json...")
    canon_script = core_dir / "generate_canon.py"
    if canon_script.exists():
        run(f"cd {core_dir} && python generate_canon.py", "Generate canon")
        if (core_dir / "canon_v1.0.json").exists():
            import shutil
            shutil.copy2(core_dir / "canon_v1.0.json", data_dir / "canon_v1.0.json")
            print("  Canon copied to data/")
    else:
        print("  WARN: generate_canon.py not found")

    # Step 2: Install dependencies
    print("\n[2/6] Installing Python dependencies...")
    deps = ["fastapi", "uvicorn", "pydantic", "cryptography", "requests", "python-dateutil"]
    for dep in deps:
        run(f"pip install {dep}", f"Install {dep}")

    # Step 3: Initialize database
    print("\n[3/6] Initializing database...")
    sys.path.insert(0, str(core_dir))
    try:
        from canon_registry import CanonRegistry
        reg = CanonRegistry(str(data_dir / "nexoritia.db"))
        print(f"  OK: Database initialized at {data_dir / 'nexoritia.db'}")
        print(f"  Canon loaded: {reg.canon is not None}")
    except Exception as e:
        print(f"  ERR: {e}")

    # Step 4: Generate keys
    print("\n[4/6] Generating AUTH-AI keys...")
    try:
        from os_notarius import OSNotarius
        notarius = OSNotarius()
        info = notarius.get_key_info()
        print(f"  OK: Keys generated - {info}")
    except Exception as e:
        print(f"  ERR: {e}")

    # Step 5: Test validation
    print("\n[5/6] Testing validation engine...")
    try:
        from os_radar import OSRADAR
        radar = OSRADAR(reg)
        from models import ValidationRequest
        result = radar.validate_content(ValidationRequest(content="Toda criacao nasce de um rasgo"))
        print(f"  OK: Validation test passed - valid={result.valid}")
    except Exception as e:
        print(f"  ERR: {e}")

    # Step 6: Summary
    print("""
╔═══════════════════════════════════════════════╗
║         SETUP COMPLETE - SUMMARY              ║
╠═══════════════════════════════════════════════╣
""")
    print(f"  Data dir: {data_dir}")
    print(f"  Canon:    {data_dir / 'canon_v1.0.json'} {'EXISTS' if (data_dir / 'canon_v1.0.json').exists() else 'MISSING'}")
    print(f"  Database: {data_dir / 'nexoritia.db'} {'EXISTS' if (data_dir / 'nexoritia.db').exists() else 'MISSING'}")
    print(f"\n  Start server: python {api_dir / 'main.py'}")
    print(f"  API docs:     http://localhost:8000/docs")
    print("""
╚═══════════════════════════════════════════════╝
    """)

if __name__ == "__main__":
    main()
