#!/usr/bin/env python3
"""
LDMux-OS Axiom Kernel Test Suite
Testa os endpoints /axiom/seal e /axiom/verify.
"""

import requests
import json
from canon_axioms import CANON_AXIOMS

BASE_URL = "http://localhost:8000"


def test_ping():
    """Testa health check."""
    print("\n" + "="*80)
    print("TEST 1: Health Check")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/ping")
    data = response.json()
    
    print(f"Status: {data['status']}")
    print(f"Kernel: {data['kernel']}")
    print(f"Version: {data['version']}")
    print(f"Canon loaded: {data['canon_loaded']}")
    print(f"Canon axioms: {data['canon_axioms']}")
    
    assert response.status_code == 200
    assert data['status'] == 'active'
    print("✓ PASSED")


def test_seal_canonical_axiom():
    """Testa selar um axioma que existe no Canon."""
    print("\n" + "="*80)
    print("TEST 2: Seal Canonical Axiom")
    print("="*80)
    
    # Usar o Código do Orbe
    axiom = CANON_AXIOMS["codigo_do_orbe"]
    
    payload = {
        "text": axiom["text"],
        "domain": axiom["domain"],
        "category": axiom["category"],
        "priority": axiom["priority"]
    }
    
    response = requests.post(f"{BASE_URL}/axiom/seal", json=payload)
    data = response.json()
    
    print(f"Text: {data['text'][:60]}...")
    print(f"Hash: {data['hash']}")
    print(f"Domain: {data['domain']}")
    print(f"Sealed at: {data['sealed_at']}")
    
    if data['canon_match']:
        print(f"\n✓ CANON MATCH FOUND:")
        print(f"  Key: {data['canon_match']['key']}")
        print(f"  ID: {data['canon_match']['id']}")
        print(f"  Monte: {data['canon_match']['monte']}")
    
    assert response.status_code == 200
    assert data['canon_match'] is not None
    print("\n✓ PASSED")
    
    return data['hash']


def test_seal_new_axiom():
    """Testa selar um novo axioma (não canônico)."""
    print("\n" + "="*80)
    print("TEST 3: Seal New Axiom")
    print("="*80)
    
    payload = {
        "text": "Este é um axioma novo para teste do sistema de selo.",
        "domain": "test",
        "category": "experimental",
        "priority": "low"
    }
    
    response = requests.post(f"{BASE_URL}/axiom/seal", json=payload)
    data = response.json()
    
    print(f"Text: {data['text']}")
    print(f"Hash: {data['hash']}")
    print(f"Domain: {data['domain']}")
    print(f"Canon match: {data['canon_match']}")
    
    assert response.status_code == 200
    assert data['canon_match'] is None
    print("\n✓ PASSED")
    
    return data['hash']


def test_verify_valid_hash(canonical_hash: str):
    """Testa verificação de hash válido."""
    print("\n" + "="*80)
    print("TEST 4: Verify Valid Hash")
    print("="*80)
    
    payload = {
        "hash": canonical_hash,
        "kernel_version": "1.0.0"
    }
    
    response = requests.post(f"{BASE_URL}/axiom/verify", json=payload)
    data = response.json()
    
    print(f"Valid: {data['valid']}")
    print(f"Coherent: {data['coherent']}")
    print(f"Reason: {data['reason']}")
    
    if data['axiom']:
        print(f"\nAxiom found:")
        print(f"  Key: {data['axiom']['key']}")
        print(f"  ID: {data['axiom']['id']}")
        print(f"  Text: {data['axiom']['text'][:60]}...")
        print(f"  Monte: {data['axiom']['monte']}")
    
    assert response.status_code == 200
    assert data['valid'] is True
    assert data['coherent'] is True
    print("\n✓ PASSED")


def test_verify_invalid_hash():
    """Testa verificação de hash inválido."""
    print("\n" + "="*80)
    print("TEST 5: Verify Invalid Hash")
    print("="*80)
    
    payload = {
        "hash": "0000000000000000000000000000000000000000000000000000000000000000",
        "kernel_version": "1.0.0"
    }
    
    response = requests.post(f"{BASE_URL}/axiom/verify", json=payload)
    data = response.json()
    
    print(f"Valid: {data['valid']}")
    print(f"Coherent: {data['coherent']}")
    print(f"Reason: {data['reason']}")
    
    assert response.status_code == 200
    assert data['valid'] is False
    print("\n✓ PASSED")


def test_verify_version_mismatch(canonical_hash: str):
    """Testa verificação com versão incorreta."""
    print("\n" + "="*80)
    print("TEST 6: Verify Version Mismatch")
    print("="*80)
    
    payload = {
        "hash": canonical_hash,
        "kernel_version": "2.0.0"
    }
    
    response = requests.post(f"{BASE_URL}/axiom/verify", json=payload)
    data = response.json()
    
    print(f"Valid: {data['valid']}")
    print(f"Coherent: {data['coherent']}")
    print(f"Reason: {data['reason']}")
    
    assert response.status_code == 200
    assert data['valid'] is True
    assert data['coherent'] is False
    print("\n✓ PASSED")


def test_canon_info():
    """Testa endpoint de informações do Canon."""
    print("\n" + "="*80)
    print("TEST 7: Canon Info")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/canon/info")
    data = response.json()
    
    print(f"Version: {data['version']}")
    print(f"Author: {data['author']}")
    print(f"Work: {data['work']}")
    print(f"Total axioms: {data['total_axioms']}")
    print(f"Manifest hash: {data['manifest_hash'][:32]}...")
    
    assert response.status_code == 200
    print("\n✓ PASSED")


def test_list_axioms():
    """Testa listagem de axiomas com filtros."""
    print("\n" + "="*80)
    print("TEST 8: List Axioms (Monte I)")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/canon/axioms?monte=monte_i")
    data = response.json()
    
    print(f"Total axioms in Monte I: {data['total']}")
    print(f"\nAxioms:")
    for key, axiom in list(data['axioms'].items())[:3]:
        print(f"  [{axiom['id']:02d}] {key}: {axiom['text'][:50]}...")
    
    assert response.status_code == 200
    assert data['total'] == 7
    print("\n✓ PASSED")


def run_all_tests():
    """Executa todos os testes."""
    print("\n" + "="*80)
    print("LDMUX-OS AXIOM KERNEL TEST SUITE")
    print("="*80)
    
    try:
        test_ping()
        canonical_hash = test_seal_canonical_axiom()
        new_hash = test_seal_new_axiom()
        test_verify_valid_hash(canonical_hash)
        test_verify_invalid_hash()
        test_verify_version_mismatch(canonical_hash)
        test_canon_info()
        test_list_axioms()
        
        print("\n" + "="*80)
        print("ALL TESTS PASSED ✓")
        print("="*80 + "\n")
        
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}\n")
        raise
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Could not connect to server.")
        print("Make sure the server is running: python axiom_kernel.py\n")
        raise


if __name__ == "__main__":
    run_all_tests()
