"""
Allux.ai v3.0 - Multi-Project API
Plataforma Universal de Criação Literária

Endpoints para:
- Gerenciar múltiplos projetos
- Pipeline zero-to-book
- Templates de gêneros
- Escrita assistida por IA
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

# Imports v3
from core.projects import ProjectManager, ProjectScaffolder, ProjectType, ProjectStatus
from core.pipeline import ZeroToBookPipeline
from core.templates import TemplateFactory

# Imports v3.5 (Literary OS)
from core.kernel_export import KernelExporter, KernelVersionManager
from core.commands import CommandExecutor, DirectorInterface, WriteCommand, ReviewCommand, TestCommand


app = FastAPI(
    title="Allux.ai - Literary OS",
    version="3.5.0",
    description="Literary Operating System - Write any book with AI governance + portability"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicialização
pm = ProjectManager()
scaffolder = ProjectScaffolder(pm)


# ===== Models =====

class ProjectCreate(BaseModel):
    name: str
    author: str
    type: ProjectType
    genre: Optional[str] = None
    setting: Optional[str] = None
    target_words: Optional[int] = None


class ProjectFromIdea(BaseModel):
    idea: str
    name: str
    author: str
    genre: str


class ProjectFromTemplate(BaseModel):
    template_name: str
    name: str
    author: str
    genre: Optional[str] = None


class PipelineRun(BaseModel):
    project_id: str
    idea: str
    genre: str
    num_chapters: int = 30
    kernel_rules: List[str] = []


# ===== Endpoints =====

@app.get("/")
def root():
    return {
        "service": "Allux.ai - Literary Operating System",
        "version": "3.5.0",
        "description": "First Literary OS in history - portable kernel for any book",
        "revolutionary_features": [
            "Kernel Export (portable MD file)",
            "Multi-LLM support (Claude/GPT/Gemini/Llama)",
            "Semantic versioning (v1.0.0)",
            "Director interface (WRITE/REVIEW/TEST/APPROVE/REJECT)",
            "Zero dependency on specific platform"
        ],
        "capabilities": [
            "Multi-project management",
            "Zero-to-book pipeline",
            "Genre templates",
            "AI-assisted writing",
            "Knowledge graph per project",
            "Consistency validation",
            "Kernel portability",
            "Command-based direction"
        ],
        "inspired_by": "LDM-OS white paper (R.Gis Veniloqa)",
        "author_role": "Director (not writer)"
    }


# === PROJECT MANAGEMENT ===

@app.post("/projects")
def create_project(data: ProjectCreate):
    """Cria novo projeto de livro"""
    project = pm.create_project(
        name=data.name,
        author=data.author,
        project_type=data.type,
        genre=data.genre,
        setting=data.setting,
        target_words=data.target_words
    )
    
    return project.model_dump()


@app.get("/projects")
def list_projects(author: str = "", status: str = ""):
    """Lista projetos com filtros"""
    projects = pm.list_projects(
        author=author or None,
        status=ProjectStatus(status) if status else None
    )
    
    return {
        "count": len(projects),
        "projects": [p.model_dump() for p in projects]
    }


@app.get("/projects/{project_id}")
def get_project(project_id: str):
    """Recupera projeto específico"""
    project = pm.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.model_dump()


@app.delete("/projects/{project_id}")
def delete_project(project_id: str):
    """Deleta projeto e todos os dados"""
    success = pm.delete_project(project_id)
    return {"status": "deleted" if success else "failed"}


# === PROJECT CREATION FROM SOURCES ===

@app.post("/projects/from-idea")
def create_from_idea(data: ProjectFromIdea):
    """
    Cria projeto a partir de ideia
    
    Exemplo:
    {
      "idea": "Um mundo onde magia requer sangue",
      "name": "Blood Magic",
      "author": "John Doe",
      "genre": "fantasy"
    }
    """
    project = scaffolder.from_idea(
        idea=data.idea,
        name=data.name,
        author=data.author,
        genre=data.genre
    )
    
    return project.model_dump()


@app.post("/projects/from-zip")
async def create_from_zip(
    file: UploadFile = File(...),
    name: str = "",
    author: str = "",
    genre: str = "fantasy"
):
    """
    Upload ZIP com materiais do livro
    
    ZIP pode conter:
    - Documentos de worldbuilding
    - Rascunhos de capítulos
    - Notas de personagens
    - Outline
    """
    # Salvar ZIP temporariamente
    zip_path = f"/tmp/{file.filename}"
    
    with open(zip_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Criar projeto
    project = scaffolder.from_zip(
        zip_path=zip_path,
        name=name or file.filename.replace(".zip", ""),
        author=author,
        genre=genre
    )
    
    # Limpar temp
    os.remove(zip_path)
    
    return project.model_dump()


@app.post("/projects/from-template")
def create_from_template(data: ProjectFromTemplate):
    """
    Cria projeto a partir de template de gênero
    
    Templates disponíveis:
    - literary (estilo LDM)
    - fantasy
    - thriller
    - scifi
    - romance
    - nonfiction
    """
    template = TemplateFactory.get_template(data.template_name)
    
    project = pm.create_project(
        name=data.name,
        author=data.author,
        project_type=ProjectType.NOVEL,
        genre=data.genre or template.name
    )
    
    # Aplicar regras do template
    import sqlite3
    project_db = f"projects/{project.project_id}/project.db"
    conn = sqlite3.connect(project_db)
    cursor = conn.cursor()
    
    # Criar tabela de kernel_rules se não existir
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kernel_rules (
            rule_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            pattern TEXT,
            severity TEXT
        )
    """)
    
    # Inserir regras do template
    for rule in template.kernel_rules:
        import hashlib
        rule_id = f"rule_{hashlib.md5(rule['name'].encode()).hexdigest()[:8]}"
        
        cursor.execute("""
            INSERT INTO kernel_rules VALUES (?, ?, ?, ?, ?)
        """, (
            rule_id,
            rule['name'],
            rule['description'],
            rule['pattern'],
            rule['severity']
        ))
    
    conn.commit()
    conn.close()
    
    return {
        "project": project.model_dump(),
        "template_applied": template.to_dict()
    }


# === TEMPLATES ===

@app.get("/templates")
def list_templates():
    """Lista templates disponíveis"""
    templates = TemplateFactory.list_templates()
    
    return {
        "count": len(templates),
        "templates": templates
    }


@app.get("/templates/{template_name}")
def get_template_details(template_name: str):
    """Detalhes de template específico"""
    try:
        template = TemplateFactory.get_template(template_name)
        return template.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# === ZERO-TO-BOOK PIPELINE ===

@app.post("/pipeline/run")
def run_pipeline(data: PipelineRun):
    """
    Executa pipeline completo: ideia → livro
    
    Etapas:
    1. Gerar outline
    2. Criar personagens
    3. Construir mundo
    4. Popular Knowledge Graph
    5. Escrever capítulos (demo: 3 primeiros)
    
    Exemplo:
    {
      "project_id": "proj_abc123",
      "idea": "Um detetive que vê fantasmas",
      "genre": "thriller",
      "num_chapters": 30,
      "kernel_rules": ["Capítulos curtos", "Ritmo rápido"]
    }
    """
    pipeline = ZeroToBookPipeline(data.project_id)
    
    result = pipeline.run_full_pipeline(
        idea=data.idea,
        genre=data.genre,
        num_chapters=data.num_chapters,
        kernel_rules=data.kernel_rules
    )
    
    return result


@app.post("/pipeline/write-chapter")
def write_chapter(
    project_id: str,
    chapter_number: int,
    chapter_summary: str
):
    """
    Escreve capítulo individual
    
    Usa contexto do projeto (personagens, mundo, kernel).
    """
    # TODO: Implementar
    # 1. Carregar contexto do projeto
    # 2. Chamar pipeline.stage_5_write_chapter()
    # 3. Validar com OS-RADAR
    # 4. Salvar como artifact
    
    return {"status": "not_implemented"}


# === PROJECT DATA ACCESS ===

@app.get("/projects/{project_id}/artifacts")
def get_project_artifacts(project_id: str):
    """Lista artifacts (Canon) do projeto"""
    import sqlite3
    
    project_db = f"projects/{project_id}/project.db"
    
    if not os.path.exists(project_db):
        raise HTTPException(status_code=404, detail="Project not found")
    
    conn = sqlite3.connect(project_db)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM artifacts")
    rows = cursor.fetchall()
    conn.close()
    
    artifacts = []
    for row in rows:
        artifacts.append({
            "artifact_id": row[0],
            "type": row[1],
            "title": row[2],
            "status": row[5],
            "created_at": row[6]
        })
    
    return {"count": len(artifacts), "artifacts": artifacts}


@app.get("/projects/{project_id}/graph")
def get_project_graph(project_id: str):
    """Recupera Knowledge Graph do projeto"""
    import sqlite3
    
    project_db = f"projects/{project_id}/project.db"
    
    if not os.path.exists(project_db):
        raise HTTPException(status_code=404, detail="Project not found")
    
    conn = sqlite3.connect(project_db)
    cursor = conn.cursor()
    
    # Nós
    cursor.execute("SELECT * FROM graph_nodes")
    nodes = [
        {"node_id": r[0], "type": r[1], "name": r[2]}
        for r in cursor.fetchall()
    ]
    
    # Arestas
    cursor.execute("SELECT * FROM graph_edges")
    edges = [
        {"edge_id": r[0], "source": r[1], "target": r[2], "type": r[3]}
        for r in cursor.fetchall()
    ]
    
    conn.close()
    
    return {
        "nodes_count": len(nodes),
        "edges_count": len(edges),
        "nodes": nodes,
        "edges": edges
    }


# ===== v3.5: LITERARY OS (KERNEL EXPORT + COMMANDS) =====

# === KERNEL EXPORT ===

@app.get("/projects/{project_id}/kernel/export")
def export_kernel(project_id: str, version: str = "1.0.0"):
    """
    Exporta kernel do projeto como arquivo MD standalone
    
    Resultado: Arquivo .md portável que funciona em qualquer LLM
    (Claude, GPT, Gemini, Llama)
    
    Este é o coração do Literary OS - permite "rodar" o livro
    em qualquer plataforma sem dependência.
    """
    exporter = KernelExporter(project_id, version)
    kernel_content = exporter.export()
    
    return {
        "project_id": project_id,
        "version": version,
        "kernel": kernel_content,
        "portable": True,
        "works_in": ["Claude", "GPT", "Gemini", "Llama", "Any LLM"]
    }


@app.post("/projects/{project_id}/kernel/save")
def save_kernel_file(project_id: str, version: str = "1.0.0"):
    """
    Salva kernel como arquivo no projeto
    
    Retorna path do arquivo para download
    """
    exporter = KernelExporter(project_id, version)
    filepath = exporter.save_to_file()
    
    return {
        "filepath": filepath,
        "version": version,
        "download_url": f"/projects/{project_id}/kernel/download?version={version}"
    }


@app.get("/projects/{project_id}/kernel/download")
def download_kernel(project_id: str, version: str = "1.0.0"):
    """Download arquivo kernel"""
    import glob
    
    # Buscar arquivo
    pattern = f"projects/{project_id}/KERNEL_v{version}_*.md"
    files = glob.glob(pattern)
    
    if not files:
        raise HTTPException(status_code=404, detail="Kernel file not found")
    
    # Retornar arquivo mais recente
    latest = max(files)
    
    return FileResponse(
        latest,
        media_type="text/markdown",
        filename=f"KERNEL_{project_id}_v{version}.md"
    )


# === KERNEL VERSIONING ===

class VersionCreate(BaseModel):
    version: str
    changes: str
    breaking: bool = False


@app.post("/projects/{project_id}/kernel/versions")
def create_kernel_version(project_id: str, data: VersionCreate):
    """
    Cria nova versão do kernel com versionamento semântico
    
    Exemplo:
    {
      "version": "1.1.0",
      "changes": "Added new character: Character Z",
      "breaking": false
    }
    
    Versioning:
    - v1.0.0 → v1.0.1 (patch - bug fixes)
    - v1.0.0 → v1.1.0 (minor - new features)
    - v1.0.0 → v2.0.0 (major - breaking changes)
    """
    manager = KernelVersionManager(project_id)
    kernel_file = manager.create_version(
        data.version,
        data.changes,
        data.breaking
    )
    
    return {
        "version": data.version,
        "file": kernel_file,
        "breaking": data.breaking,
        "status": "created"
    }


@app.get("/projects/{project_id}/kernel/versions")
def list_kernel_versions(project_id: str):
    """Lista todas as versões do kernel"""
    manager = KernelVersionManager(project_id)
    versions = manager.get_versions()
    
    return {
        "project_id": project_id,
        "count": len(versions),
        "versions": versions
    }


# === DIRECTOR COMMANDS ===

class DirectorWrite(BaseModel):
    scene: str
    section: str = "Current chapter"
    length: str = "5 pages"
    pov: Optional[str] = None
    focus: Optional[str] = None
    additional_context: Optional[str] = None


class DirectorReview(BaseModel):
    scene_text: str


class DirectorTest(BaseModel):
    text: str


@app.post("/projects/{project_id}/director/write")
def director_write(project_id: str, cmd: DirectorWrite):
    """
    Comando WRITE: Ordena IA para escrever cena
    
    Regis vira DIRETOR (não escritor):
    - Dá ordem
    - IA executa seguindo kernel
    - Regis revisa
    - Aprova ou rejeita
    
    Exemplo:
    {
      "scene": "Nascimento do Terceiro",
      "length": "10 pages",
      "focus": "tensão crescente",
      "pov": "Mãe dos Sete"
    }
    """
    director = DirectorInterface(project_id)
    
    result = director.write(
        scene=cmd.scene,
        section=cmd.section,
        length=cmd.length,
        pov=cmd.pov,
        focus=cmd.focus,
        additional_context=cmd.additional_context
    )
    
    return result


@app.post("/projects/{project_id}/director/review")
def director_review(project_id: str, cmd: DirectorReview):
    """
    Comando REVIEW: Revisa cena contra kernel
    
    Verifica:
    - Coerência
    - Voz narrativa
    - Leis do kernel
    - Qualidade
    """
    director = DirectorInterface(project_id)
    
    # Simular scene_data
    scene_data = {"text": cmd.scene_text}
    
    result = director.review(scene_data)
    
    return result


@app.post("/projects/{project_id}/director/test")
def director_test(project_id: str, cmd: DirectorTest):
    """
    Comando TEST: Testa coerência de texto
    
    Verifica contra:
    - Kernel laws
    - Character traits
    - World rules
    """
    director = DirectorInterface(project_id)
    
    result = director.test(cmd.text)
    
    return result


@app.post("/projects/{project_id}/director/approve")
def director_approve(project_id: str, scene_text: str):
    """
    Comando APPROVE: Aprova cena para Canon
    
    Salva como artifact ⭐⭐⭐⭐⭐
    """
    director = DirectorInterface(project_id)
    
    scene_data = {
        "text": scene_text,
        "section": "Approved scene"
    }
    
    artifact_id = director.approve(scene_data)
    
    return {
        "status": "approved",
        "artifact_id": artifact_id,
        "saved_to": "canon"
    }


@app.post("/projects/{project_id}/director/reject")
def director_reject(project_id: str, reason: str):
    """
    Comando REJECT: Rejeita cena
    
    Pede para IA refazer
    """
    director = DirectorInterface(project_id)
    
    scene_data = {"text": ""}  # Não importa
    
    result = director.reject(scene_data, reason)
    
    return {
        "status": "rejected",
        "reason": reason,
        "next_action": "Run /director/write again with adjustments"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
