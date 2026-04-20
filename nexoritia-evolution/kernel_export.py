"""
Allux.ai v3.5 - Kernel Export System
Exporta kernel do projeto como arquivo MD standalone

Resultado: Arquivo .md portável que funciona em qualquer LLM
(Claude, GPT, Gemini, Llama)

Uso:
    kernel = KernelExporter(project_id)
    kernel_md = kernel.export()
    # → Arquivo completo com TUDO necessário para "rodar" o livro
"""

from typing import Dict, Any, Optional, List
import sqlite3
import json
from datetime import datetime


class KernelExporter:
    """
    Exporta Kernel do Projeto
    
    Gera arquivo .md standalone com:
    - Leis fundamentais (Kernel)
    - Personagens (Knowledge Graph)
    - Mundo (worldbuilding)
    - Voz narrativa (invariantes)
    - Decisões críticas
    - Proibições
    - Material já escrito (Runtime)
    
    Output: Arquivo que pode ser colado em QUALQUER LLM
    """
    
    def __init__(self, project_id: str, version: str = "1.0.0"):
        self.project_id = project_id
        self.version = version
        self.project_db = f"projects/{project_id}/project.db"
    
    def export(self) -> str:
        """
        Exporta kernel completo
        
        Returns:
            String com arquivo MD completo
        """
        sections = []
        
        # Header
        sections.append(self._header())
        
        # Part 1: Leis Fundamentais
        sections.append(self._kernel_laws())
        
        # Part 2: Voz Narrativa
        sections.append(self._narrative_voice())
        
        # Part 3: Personagens
        sections.append(self._characters())
        
        # Part 4: Mundo
        sections.append(self._world())
        
        # Part 5: Decisões Críticas
        sections.append(self._critical_decisions())
        
        # Part 6: Proibições
        sections.append(self._prohibitions())
        
        # Part 7: Qualidade (Exemplos)
        sections.append(self._quality_examples())
        
        # Part 8: Runtime (Estado Atual)
        sections.append(self._runtime())
        
        # Part 9: API (Comandos)
        sections.append(self._api_commands())
        
        return "\n\n".join(sections)
    
    def _header(self) -> str:
        """Cabeçalho do kernel"""
        conn = sqlite3.connect("allux_projects.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name, author, genre, type 
            FROM projects 
            WHERE project_id = ?
        """, (self.project_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return "# KERNEL - Project Not Found"
        
        name, author, genre, ptype = row
        
        return f"""# KERNEL: {name}

**Version:** {self.version}  
**Author:** {author}  
**Genre:** {genre}  
**Type:** {ptype}  
**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Project ID:** {self.project_id}

---

## WHAT IS THIS KERNEL?

This is a **Literary Operating System** - a complete specification that allows ANY AI (Claude, GPT, Gemini, Llama) to generate content for this book while maintaining perfect consistency.

**How to use:**
1. Copy this entire file
2. Paste into any LLM
3. Give commands (see API section)
4. AI generates content following kernel rules

**Portability:** This kernel is platform-independent. It works anywhere.

---"""
    
    def _kernel_laws(self) -> str:
        """Leis fundamentais (Kernel Rules)"""
        conn = sqlite3.connect(self.project_db)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM kernel_rules")
            rules = cursor.fetchall()
        except:
            rules = []
        
        conn.close()
        
        if not rules:
            return """## PART 1: FUNDAMENTAL LAWS

*No fundamental laws defined yet.*

Define laws that are IMMUTABLE - they can never be violated.

Examples:
- "Character X never lies"
- "Magic requires blood sacrifice"
- "Nobody breathes in Monte II"
"""
        
        laws_text = "## PART 1: FUNDAMENTAL LAWS\n\n"
        laws_text += "These laws are **IMMUTABLE**. AI must NEVER violate them.\n\n"
        
        for rule in rules:
            rule_id, name, description, pattern, severity = rule
            laws_text += f"### LAW: {name}\n\n"
            laws_text += f"**Description:** {description}\n\n"
            laws_text += f"**Severity:** {severity.upper()}\n\n"
            if pattern:
                laws_text += f"**Pattern:** `{pattern}`\n\n"
            laws_text += "---\n\n"
        
        return laws_text
    
    def _narrative_voice(self) -> str:
        """Voz narrativa"""
        return """## PART 2: NARRATIVE VOICE

Define the EXACT tone, rhythm, and style.

### Tone
[Define tone here]

### Rhythm
[Define sentence rhythm]

### Style Guidelines
- Use X
- Avoid Y
- Never Z

### Quality Example
[Paste paragraph of perfect quality here]

### Anti-Example (What NOT to do)
[Paste paragraph of bad quality here]

---"""
    
    def _characters(self) -> str:
        """Personagens do Knowledge Graph"""
        conn = sqlite3.connect(self.project_db)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT * FROM graph_nodes WHERE type = 'personagem'
            """)
            chars = cursor.fetchall()
        except:
            chars = []
        
        conn.close()
        
        if not chars:
            return """## PART 3: CHARACTERS

*No characters defined yet.*

---"""
        
        chars_text = "## PART 3: CHARACTERS [CORE]\n\n"
        chars_text += "These are the CANONICAL character definitions. AI must respect them.\n\n"
        
        for char in chars:
            node_id, node_type, name, properties = char
            props = json.loads(properties) if properties else {}
            
            chars_text += f"### {name}\n\n"
            
            for key, value in props.items():
                chars_text += f"**{key.capitalize()}:** {value}\n\n"
            
            chars_text += "---\n\n"
        
        return chars_text
    
    def _world(self) -> str:
        """Construção de mundo"""
        return """## PART 4: WORLD [CORE]

### Setting
[Describe when/where story takes place]

### Locations
[List major locations]

### Rules of the World
- Rule 1
- Rule 2

### Technology/Magic
[Describe systems]

---"""
    
    def _critical_decisions(self) -> str:
        """Decisões críticas"""
        return """## PART 5: CRITICAL DECISIONS

These are CONFIRMED decisions that cannot be changed.

### Decision 1
[What was decided]

### Decision 2
[What was decided]

---"""
    
    def _prohibitions(self) -> str:
        """Proibições"""
        return """## PART 6: PROHIBITIONS

**NEVER:**
- Contradict fundamental laws
- Change established character traits
- Use generic ChatGPT-style language
- [Add more]

---"""
    
    def _quality_examples(self) -> str:
        """Exemplos de qualidade"""
        conn = sqlite3.connect(self.project_db)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT content FROM artifacts 
                WHERE status = 'canon'
                LIMIT 3
            """)
            examples = cursor.fetchall()
        except:
            examples = []
        
        conn.close()
        
        if not examples:
            return """## PART 7: QUALITY STANDARD

*No canon examples yet.*

Paste fragments of ⭐⭐⭐⭐⭐ quality here.

---"""
        
        quality_text = "## PART 7: QUALITY STANDARD\n\n"
        quality_text += "These are examples of PERFECT quality. AI should match this level.\n\n"
        
        for i, (content,) in enumerate(examples, 1):
            quality_text += f"### Example {i}\n\n"
            quality_text += f"{content[:500]}...\n\n"
            quality_text += "---\n\n"
        
        return quality_text
    
    def _runtime(self) -> str:
        """Estado atual (Runtime)"""
        conn = sqlite3.connect(self.project_db)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT COUNT(*) FROM artifacts")
            artifact_count = cursor.fetchone()[0]
        except:
            artifact_count = 0
        
        conn.close()
        
        return f"""## PART 8: RUNTIME (Current State)

**Last Updated:** {datetime.now().strftime("%Y-%m-%d")}

### Material Already Written
- {artifact_count} artifacts created
- [List major completed sections]

### Status by Section
- Section 1: X% complete
- Section 2: Y% complete

### Next Tasks (Prioritized)
1. [Task 1]
2. [Task 2]
3. [Task 3]

### Pending
- [What needs to be written]

---"""
    
    def _api_commands(self) -> str:
        """Comandos da API"""
        return """## PART 9: API (How to Give Commands)

### COMMAND: WRITE SCENE

Format:
```
WRITE:
Section: [name]
Scene: [description]
Length: [pages/words]
POV: [character]
Focus: [theme/emotion]
```

Example:
```
WRITE:
Section: Chapter 5
Scene: Character X meets Character Y for first time
Length: 5 pages
POV: Character X (internal)
Focus: Tension and curiosity
```

### COMMAND: REVIEW SCENE

Format:
```
REVIEW:
Scene: [paste scene here]
Check: [what to verify]
```

### COMMAND: TEST COHERENCE

Format:
```
TEST:
Text: [paste text]
Against: Kernel laws
Output: Violations or PASS
```

---

## END OF KERNEL

**Version:** {self.version}  
**Portable:** Yes (works in any LLM)  
**License:** [Define license]

Copy this entire file into Claude, GPT, Gemini, or any LLM to "run" this book.
"""
    
    def save_to_file(self, filename: Optional[str] = None) -> str:
        """
        Salva kernel em arquivo
        
        Args:
            filename: Nome do arquivo (opcional)
        
        Returns:
            Path do arquivo salvo
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"projects/{self.project_id}/KERNEL_v{self.version}_{timestamp}.md"
        
        kernel_content = self.export()
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(kernel_content)
        
        return filename


class KernelVersionManager:
    """
    Gerenciador de Versões do Kernel
    
    Implementa versionamento semântico (semver):
    - v1.0.0 → v1.0.1 (patch - correções)
    - v1.0.0 → v1.1.0 (minor - novos personagens)
    - v1.0.0 → v2.0.0 (major - mudanças fundamentais)
    """
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.versions_file = f"projects/{project_id}/KERNEL_VERSIONS.json"
    
    def create_version(
        self,
        version: str,
        changes: str,
        breaking: bool = False
    ) -> str:
        """
        Cria nova versão do kernel
        
        Args:
            version: Número da versão (ex: "1.1.0")
            changes: Descrição das mudanças
            breaking: Se é breaking change
        
        Returns:
            Path do arquivo kernel
        """
        # Exportar kernel
        exporter = KernelExporter(self.project_id, version)
        kernel_file = exporter.save_to_file()
        
        # Registrar versão
        self._register_version(version, changes, breaking, kernel_file)
        
        return kernel_file
    
    def _register_version(
        self,
        version: str,
        changes: str,
        breaking: bool,
        kernel_file: str
    ):
        """Registra versão no histórico"""
        import os
        
        # Carregar histórico
        if os.path.exists(self.versions_file):
            with open(self.versions_file, 'r') as f:
                history = json.load(f)
        else:
            history = {"versions": []}
        
        # Adicionar nova versão
        history["versions"].append({
            "version": version,
            "date": datetime.now().isoformat(),
            "changes": changes,
            "breaking": breaking,
            "file": kernel_file
        })
        
        # Salvar
        with open(self.versions_file, 'w') as f:
            json.dump(history, f, indent=2)
    
    def get_versions(self) -> List[Dict]:
        """Lista todas as versões"""
        import os
        
        if not os.path.exists(self.versions_file):
            return []
        
        with open(self.versions_file, 'r') as f:
            history = json.load(f)
        
        return history.get("versions", [])
