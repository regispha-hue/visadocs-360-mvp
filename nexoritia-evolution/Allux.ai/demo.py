"""
Allux MVP Demo
Version: 1.0.0

Demonstrates Canon Registry workflow with Monte I example.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from core.models import (
    Artifact, ArtifactType, ArtifactStatus,
    Patch, PatchTests, TestResult, Operation, ProposedBy,
    Source, SourceType
)
from core.registry import CanonRegistry


def demo_canon_workflow():
    """Demonstrate complete Canon Registry workflow"""
    
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║          ALLUX MVP - CANON REGISTRY DEMO                ║
    ║          Livro dos Montes - Monte I Example             ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    # Initialize registry
    print("\n[1] Initializing Canon Registry...")
    registry = CanonRegistry(db_path="demo_canon.db")
    print("✅ Registry initialized")
    
    # Create artifact (Monte I - Prólogo)
    print("\n[2] Creating artifact: Monte I - Prólogo")
    
    content_v1 = """# Monte I: A Desconciliação dos Sagrados

[VÁCUO]

No princípio, havia o Sopro e o Verbo.
E entre eles, a Desconciliação.

Não houve guerra, não houve separação.
Houve o reconhecimento do que jamais se concilia.

O Masculino e o Feminino, eternos opostos,
não nasceram para se fundir — nasceram para se espelhar.

[CORTE]

Semi Alado caminha entre os montes,
carregando o peso de ser o Quinto e o Sétimo,
aquele que não pertence, mas atravessa.

[APNEIA:0.52]

E nesta travessia, aprende:
a desconciliação não é ausência de amor.
É a presença do respeito ao incomensurável.
"""
    
    monte_i_prologo = Artifact(
        artifact_id="monte_i_prologo",
        type=ArtifactType.CHAPTER,
        title="Monte I: A Desconciliação dos Sagrados",
        version="1.0.0",
        status=ArtifactStatus.DRAFT,
        content=content_v1,
        sources=[
            Source(
                source_type=SourceType.CHAT,
                source_id="claude_2025-12-30",
                range="messages:10-25"
            )
        ],
        ontology_refs=["desconciliacao", "sagrados", "semi_alado"],
        axioms=[
            "Lei da Não-Reconciliação",
            "Princípio do Espelho Eterno",
            "Axioma do Incomensurável"
        ]
    )
    
    created = registry.create_artifact(monte_i_prologo)
    print(f"✅ Artifact created")
    print(f"   ID: {created.artifact_id}")
    print(f"   Version: {created.version}")
    print(f"   Status: {created.status.value}")
    print(f"   Hash: {created.hash[:16]}...")
    
    # Search
    print("\n[3] Testing full-text search...")
    results = registry.search_artifacts("desconciliação")
    print(f"✅ Found {len(results)} artifact(s) matching 'desconciliação'")
    
    # Create patch (typo correction)
    print("\n[4] Creating patch to fix typo...")
    
    patch = Patch(
        patch_id="patch_001_typo_fix",
        target_artifact_id="monte_i_prologo",
        base_hash=created.hash,
        operations=[
            Operation(
                op="replace",
                selector="line:12",
                new_text="carregando o peso de ser o Quinto e o Sétimo,"
            )
        ],
        proposed_by=ProposedBy.HUMAN,
        tests=PatchTests(
            conformance=TestResult.PASS,
            ontology=TestResult.PASS,
            editorial=TestResult.PASS
        )
    )
    
    patch_created = registry.create_patch(patch)
    print(f"✅ Patch created")
    print(f"   ID: {patch_created.patch_id}")
    print(f"   Tests: conformance={patch_created.tests.conformance.value}, "
          f"ontology={patch_created.tests.ontology.value}, "
          f"editorial={patch_created.tests.editorial.value}")
    
    # Apply patch
    print("\n[5] Applying patch (creates v1.0.1)...")
    updated = registry.apply_patch(patch_created.patch_id)
    print(f"✅ Patch applied")
    print(f"   New version: {updated.version}")
    print(f"   New hash: {updated.hash[:16]}...")
    print(f"   Status: {updated.status.value}")
    
    # Demonstrate fail-closed (create failing patch)
    print("\n[6] Testing FAIL-CLOSED: Creating patch that fails ontology test...")
    
    bad_patch = Patch(
        patch_id="patch_002_bad",
        target_artifact_id="monte_i_prologo",
        base_hash=updated.hash,
        operations=[
            Operation(
                op="replace",
                selector="line:9",
                new_text="nasceram para se fundir — nasceram para se unir."  # Violates axiom!
            )
        ],
        proposed_by=ProposedBy.LLM,
        tests=PatchTests(
            conformance=TestResult.PASS,
            ontology=TestResult.FAIL,  # Violates "Lei da Não-Reconciliação"
            editorial=TestResult.PASS
        )
    )
    
    bad_patch_created = registry.create_patch(bad_patch)
    print(f"✅ Bad patch created (for testing)")
    print(f"   Tests: ontology={bad_patch_created.tests.ontology.value}")
    
    print("\n   Attempting to apply bad patch...")
    try:
        registry.apply_patch(bad_patch_created.patch_id)
        print("❌ ERROR: Bad patch should not have been applied!")
    except ValueError as e:
        print(f"✅ FAIL-CLOSED worked! Patch rejected:")
        print(f"   Reason: {str(e)}")
    
    # Promote to canon
    print("\n[7] Promoting v1.0.1 to CANON...")
    canon = registry.promote_to_canon(updated.artifact_id)
    print(f"✅ Artifact promoted")
    print(f"   Status: {canon.status.value}")
    
    # Freeze
    print("\n[8] Freezing artifact (immutable)...")
    frozen = registry.freeze_artifact(canon.artifact_id)
    print(f"✅ Artifact frozen")
    print(f"   Status: {frozen.status.value}")
    print(f"   Final hash: {frozen.hash[:16]}...")
    
    # Try to modify frozen (should fail)
    print("\n[9] Testing immutability: Attempting to modify frozen artifact...")
    
    post_freeze_patch = Patch(
        patch_id="patch_003_post_freeze",
        target_artifact_id="monte_i_prologo",
        base_hash=frozen.hash,
        operations=[
            Operation(op="add", selector="line:20", new_text="Nova linha")
        ],
        proposed_by=ProposedBy.HUMAN,
        tests=PatchTests(
            conformance=TestResult.PASS,
            ontology=TestResult.PASS,
            editorial=TestResult.PASS
        )
    )
    
    try:
        registry.create_patch(post_freeze_patch)
        print("❌ ERROR: Should not allow patches to frozen artifacts!")
    except ValueError as e:
        print(f"✅ Immutability enforced!")
        print(f"   Reason: {str(e)}")
    
    # Statistics
    print("\n[10] Canon Registry Statistics:")
    stats = registry.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║                    DEMO COMPLETE                        ║
    ║                                                          ║
    ║  ✅ Artifact creation                                    ║
    ║  ✅ Full-text search                                     ║
    ║  ✅ Patch system (git-like)                              ║
    ║  ✅ Fail-closed governance                               ║
    ║  ✅ Version promotion (DRAFT → CANON → FROZEN)           ║
    ║  ✅ Immutability enforcement                             ║
    ║                                                          ║
    ║  Database: demo_canon.db                                ║
    ╚══════════════════════════════════════════════════════════╝
    """)


if __name__ == "__main__":
    demo_canon_workflow()
