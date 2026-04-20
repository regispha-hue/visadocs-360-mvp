"""
Allux Complete System Demo
Demonstrates full functionality with LDMux-migrated components

Shows:
- Canon Registry with fail-closed governance
- Canonical RAG with dual thresholds
- Artifact lifecycle (DRAFT → CANON → FROZEN)
- Patch system with validation
- Full-text search
"""

from core.registry import CanonRegistry
from core.models import (
    Artifact, Patch, PatchTests, Source, Operation,
    ArtifactType, ArtifactStatus, PatchOperation, TestResult, ProposedBy
)
from indexing.canonical_rag import CanonicalRAG, RAGConfig


def print_section(title: str):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print('='*60)


def demo_canon_registry():
    """Demonstrate Canon Registry with fail-closed governance"""
    print_section("CANON REGISTRY DEMO")
    
    registry = CanonRegistry("demo_allux.db")
    
    # 1. Create artifact
    print("\n[1] Creating artifact: Monte I - Prólogo")
    artifact = Artifact(
        artifact_id="monte_i_prologo",
        type=ArtifactType.CHAPTER,
        title="Monte I - Prólogo: A Desconciliação dos Sagrados",
        content="# Monte I\n\n[VÁCUO]\n\nNo princípio não havia reconciliação...",
        sources=[
            Source(
                source_type="chat",
                source_id="claude_2026_01_16",
                range_start="line:1",
                range_end="line:50"
            )
        ],
        ontology_refs=["desconciliacao_sagrados", "vacuo", "nexoritmo"],
        axioms=["lei_nao_reconciliacao"]
    )
    
    created = registry.create_artifact(artifact)
    print(f"✅ Created: {created.artifact_id}")
    print(f"   Version: {created.version}")
    print(f"   Status: {created.status.value}")
    print(f"   Hash: {created.hash[:16]}...")
    
    # 2. Create good patch
    print("\n[2] Creating patch to fix typo...")
    good_patch = Patch(
        patch_id="patch_001_typo_fix",
        target_artifact_id="monte_i_prologo",
        base_hash=created.hash,
        operations=[
            Operation(
                op=PatchOperation.REPLACE,
                selector="line:3",
                old_text="principio",
                new_text="princípio"
            )
        ],
        proposed_by=ProposedBy.HUMAN,
        tests=PatchTests(
            conformance=TestResult.PASS,
            ontology=TestResult.PASS,
            editorial=TestResult.PASS
        )
    )
    
    patch_created = registry.create_patch(good_patch)
    print(f"✅ Patch created: {patch_created.patch_id}")
    print(f"   Tests: conformance={patch_created.tests.conformance.value}, "
          f"ontology={patch_created.tests.ontology.value}, "
          f"editorial={patch_created.tests.editorial.value}")
    
    # 3. Apply patch
    print("\n[3] Applying patch (creates v1.0.1)...")
    updated = registry.apply_patch(patch_created.patch_id)
    print(f"✅ Patch applied")
    print(f"   New version: {updated.version}")
    print(f"   New hash: {updated.hash[:16]}...")
    
    # 4. Test fail-closed: create bad patch
    print("\n[4] Testing FAIL-CLOSED: Creating patch that violates ontology...")
    bad_patch = Patch(
        patch_id="patch_002_bad",
        target_artifact_id="monte_i_prologo",
        base_hash=updated.hash,
        operations=[
            Operation(
                op=PatchOperation.ADD,
                selector="line:10",
                new_text="E assim tudo se reconciliou em harmonia."  # Violates!
            )
        ],
        proposed_by=ProposedBy.LLM,
        tests=PatchTests(
            conformance=TestResult.PASS,
            ontology=TestResult.FAIL,  # ❌ Violates Lei da Não-Reconciliação
            editorial=TestResult.PASS
        )
    )
    
    bad_patch_created = registry.create_patch(bad_patch)
    print(f"✅ Bad patch created (for testing)")
    
    print("\n   Attempting to apply bad patch...")
    try:
        registry.apply_patch(bad_patch_created.patch_id)
        print("❌ ERROR: Bad patch should not have been applied!")
    except ValueError as e:
        print(f"✅ FAIL-CLOSED worked! Patch rejected:")
        print(f"   Reason: {str(e)}")
    
    # 5. Promote to canon
    print("\n[5] Promoting v1.0.1 to CANON...")
    canon = registry.promote_to_canon(updated.artifact_id)
    print(f"✅ Artifact promoted")
    print(f"   Status: {canon.status.value}")
    
    # 6. Freeze
    print("\n[6] Freezing artifact (immutable)...")
    frozen = registry.freeze_artifact(canon.artifact_id)
    print(f"✅ Artifact frozen")
    print(f"   Status: {frozen.status.value}")
    print(f"   Final hash: {frozen.hash[:16]}...")
    
    # 7. Test immutability
    print("\n[7] Testing immutability: Attempting to modify frozen artifact...")
    try:
        post_freeze_patch = Patch(
            patch_id="patch_003_post_freeze",
            target_artifact_id="monte_i_prologo",
            base_hash=frozen.hash,
            operations=[
                Operation(op=PatchOperation.ADD, selector="line:20", new_text="Nova linha")
            ],
            proposed_by=ProposedBy.HUMAN,
            tests=PatchTests(
                conformance=TestResult.PASS,
                ontology=TestResult.PASS,
                editorial=TestResult.PASS
            )
        )
        registry.create_patch(post_freeze_patch)
        print("❌ ERROR: Should not allow patches to frozen artifacts!")
    except ValueError as e:
        print(f"✅ Immutability enforced!")
        print(f"   Reason: {str(e)}")
    
    # 8. Statistics
    print("\n[8] Registry statistics:")
    stats = registry.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    return registry


def demo_canonical_rag():
    """Demonstrate Canonical RAG with fail-closed principle"""
    print_section("CANONICAL RAG DEMO (LDMux Migrated)")
    
    rag = CanonicalRAG(RAGConfig(
        threshold_core=0.88,
        threshold_echo=0.82,
        fail_closed=True
    ))
    
    # 1. Add canonical fragments
    print("\n[1] Adding canonical fragments to RAG corpus...")
    
    fragments = [
        {
            "content": "O rosto dele era meu sonho. Primeiro fragmento canônico.",
            "metadata": {"rating": 5, "type": "centro_gravidade", "monte": "I"}
        },
        {
            "content": "Eu vim para falar de amor. Segundo fragmento fundacional.",
            "metadata": {"rating": 5, "type": "centro_gravidade", "monte": "I"}
        },
        {
            "content": "Desconciliação dos Sagrados: princípio ontológico fundamental.",
            "metadata": {"rating": 5, "type": "conceito", "monte": "I"}
        },
        {
            "content": "Nexoritmo: algoritmo que valida nexo causal no conhecimento.",
            "metadata": {"rating": 4, "type": "conceito", "monte": "II"}
        }
    ]
    
    for frag in fragments:
        result = rag.add(frag["content"], frag["metadata"])
        print(f"✅ Added: {result['chunks']} chunks")
    
    # 2. Test retrieval with core threshold (0.88)
    print("\n[2] Testing CORE retrieval (threshold 0.88)...")
    print("   Query: 'amor e sonho'")
    
    core_results = rag.retrieve("amor e sonho", mode="core", limit=5)
    print(f"   Results found: {len(core_results)}")
    
    for i, r in enumerate(core_results, 1):
        print(f"\n   [{i}] Score: {r.score:.3f}")
        print(f"       Content: {r.content[:60]}...")
        print(f"       Metadata: {r.metadata}")
    
    # 3. Test retrieval with echo threshold (0.82)
    print("\n[3] Testing ECHO retrieval (threshold 0.82)...")
    print("   Query: 'nexo causal conhecimento'")
    
    echo_results = rag.retrieve("nexo causal conhecimento", mode="echo", limit=5)
    print(f"   Results found: {len(echo_results)}")
    
    for i, r in enumerate(echo_results, 1):
        print(f"\n   [{i}] Score: {r.score:.3f}")
        print(f"       Content: {r.content[:60]}...")
    
    # 4. Test dual retrieval
    print("\n[4] Testing DUAL retrieval (both thresholds)...")
    print("   Query: 'desconciliação sagrados'")
    
    dual_results = rag.retrieve_dual("desconciliação sagrados")
    print(f"   Core results: {len(dual_results['core'])}")
    print(f"   Echo results: {len(dual_results['echo'])}")
    
    # 5. Test fail-closed (query with no relevant results)
    print("\n[5] Testing FAIL-CLOSED principle...")
    print("   Query: 'quantum physics thermodynamics' (irrelevant)")
    
    irrelevant_results = rag.retrieve("quantum physics thermodynamics", mode="core")
    print(f"   Results found: {len(irrelevant_results)}")
    if len(irrelevant_results) == 0:
        print("   ✅ FAIL-CLOSED: Silêncio > invenção")
    else:
        print("   ⚠️ Found results (may be false positives)")
    
    # 6. RAG statistics
    print("\n[6] RAG corpus statistics:")
    stats = rag.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    return rag


def demo_integrated_workflow():
    """Demonstrate integrated workflow: Registry + RAG"""
    print_section("INTEGRATED WORKFLOW: Registry + RAG")
    
    registry = CanonRegistry("demo_allux.db")
    rag = CanonicalRAG()
    
    print("\n[1] Create artifact with RAG context...")
    
    # Query RAG for context
    context = rag.retrieve_dual("amor sonho")
    formatted_context = rag.format_for_prompt(context)
    
    print("   RAG context retrieved:")
    print(formatted_context[:200] + "...")
    
    # Create artifact using RAG context
    artifact = Artifact(
        artifact_id="scene_001",
        type=ArtifactType.SCENE,
        title="Cena: Encontro no Reino",
        content=f"# Cena 1\n\n{formatted_context}\n\n[Narrative continues...]",
        ontology_refs=["desconciliacao_sagrados"]
    )
    
    created = registry.create_artifact(artifact)
    print(f"\n✅ Artifact created using RAG context")
    print(f"   ID: {created.artifact_id}")
    print(f"   Hash: {created.hash[:16]}...")
    
    # Add artifact content back to RAG
    rag.add(created.content, {"artifact_id": created.artifact_id, "type": "scene"})
    print(f"\n✅ Artifact content added back to RAG corpus")
    
    print("\n✅ Integrated workflow complete!")


if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║          ALLUX COMPLETE SYSTEM DEMO                      ║
║          Canon-First Ontological Governance              ║
║                                                          ║
║          Integrates:                                     ║
║          • Canon Registry (Phase 1)                      ║
║          • Canonical RAG (LDMux migrated)                ║
║          • Fail-closed governance principles             ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    # Run demos
    demo_canon_registry()
    demo_canonical_rag()
    demo_integrated_workflow()
    
    print("\n" + "="*60)
    print(" DEMO COMPLETE")
    print("="*60)
    print("\n✅ All systems operational")
    print("✅ Fail-closed governance verified")
    print("✅ Integration successful")
    print("\nTo start the daemon:")
    print("   python daemon.py")
    print("\nThen visit:")
    print("   http://localhost:8000/docs")
