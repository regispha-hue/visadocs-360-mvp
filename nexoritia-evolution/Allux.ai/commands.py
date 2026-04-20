"""
Allux.ai v3.5 - Command API
Interface de comandos para "dirigir" a escrita

Regis vira DIRETOR, não escritor:
- WRITE: Ordena cena
- REVIEW: Pede revisão
- TEST: Verifica coerência
- APPROVE: Aprova para canon
- REJECT: Rejeita e pede refazer

Inspired by LDM-OS white paper
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel
from enum import Enum
import anthropic
import os


class CommandType(str, Enum):
    """Tipos de comando"""
    WRITE = "write"
    REVIEW = "review"
    TEST = "test"
    APPROVE = "approve"
    REJECT = "reject"


class WriteCommand(BaseModel):
    """Comando: WRITE (escrever cena)"""
    section: str
    scene: str
    length: str  # "5 pages" ou "2000 words"
    pov: Optional[str] = None
    focus: Optional[str] = None
    additional_context: Optional[str] = None


class ReviewCommand(BaseModel):
    """Comando: REVIEW (revisar cena)"""
    scene_text: str
    check_for: List[str]  # ["coherence", "voice", "laws"]


class TestCommand(BaseModel):
    """Comando: TEST (testar coerência)"""
    text: str
    against: List[str]  # ["kernel_laws", "character_traits", "world_rules"]


class CommandExecutor:
    """
    Executor de Comandos
    
    Recebe comandos tipo API e executa usando kernel do projeto.
    
    Exemplo:
        cmd = WriteCommand(
            section="Chapter 5",
            scene="First meeting between X and Y",
            length="5 pages",
            pov="Character X",
            focus="Tension and curiosity"
        )
        
        result = executor.execute(cmd)
        # → IA gera 5 páginas seguindo kernel
    """
    
    def __init__(
        self,
        project_id: str,
        anthropic_api_key: Optional[str] = None
    ):
        self.project_id = project_id
        self.client = anthropic.Anthropic(
            api_key=anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY")
        )
        
        # Carregar kernel
        self.kernel = self._load_kernel()
    
    def _load_kernel(self) -> str:
        """Carrega kernel do projeto"""
        from core.kernel_export import KernelExporter
        
        exporter = KernelExporter(self.project_id)
        return exporter.export()
    
    def execute(self, command: Any) -> Dict[str, Any]:
        """
        Executa comando
        
        Args:
            command: WriteCommand, ReviewCommand, ou TestCommand
        
        Returns:
            Dict com resultado da execução
        """
        if isinstance(command, WriteCommand):
            return self._execute_write(command)
        elif isinstance(command, ReviewCommand):
            return self._execute_review(command)
        elif isinstance(command, TestCommand):
            return self._execute_test(command)
        else:
            raise ValueError(f"Unknown command type: {type(command)}")
    
    def _execute_write(self, cmd: WriteCommand) -> Dict[str, Any]:
        """
        Executa comando WRITE
        
        Gera cena seguindo kernel
        """
        # Construir prompt
        prompt = f"""You are executing a WRITE command for a book project.

{self.kernel}

---

## WRITE COMMAND

**Section:** {cmd.section}
**Scene:** {cmd.scene}
**Length:** {cmd.length}
**POV:** {cmd.pov or "Author's choice"}
**Focus:** {cmd.focus or "Scene-appropriate"}

{f"**Additional Context:** {cmd.additional_context}" if cmd.additional_context else ""}

---

## INSTRUCTIONS

1. Write the scene following ALL kernel rules
2. Match the quality standard from Part 7
3. Respect fundamental laws (Part 1)
4. Use correct narrative voice (Part 2)
5. Keep characters consistent (Part 3)
6. Follow world rules (Part 4)
7. Never violate prohibitions (Part 6)

Write the complete scene now ({cmd.length}):
"""
        
        # Chamar Claude
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        scene_text = message.content[0].text
        
        return {
            "command": "WRITE",
            "status": "generated",
            "section": cmd.section,
            "scene": cmd.scene,
            "text": scene_text,
            "words": len(scene_text.split()),
            "next_action": "REVIEW or APPROVE or REJECT"
        }
    
    def _execute_review(self, cmd: ReviewCommand) -> Dict[str, Any]:
        """
        Executa comando REVIEW
        
        Verifica cena contra kernel
        """
        checks_text = ", ".join(cmd.check_for)
        
        prompt = f"""You are executing a REVIEW command for a book project.

{self.kernel}

---

## REVIEW COMMAND

**Check for:** {checks_text}

**Scene to review:**

{cmd.scene_text}

---

## INSTRUCTIONS

Analyze the scene and check:

{chr(10).join([f'- {check}' for check in cmd.check_for])}

Provide:
1. **PASS/FAIL** for each check
2. **Violations** (if any)
3. **Suggestions** for improvement

Format:
```
CHECK: [name]
STATUS: PASS/FAIL
VIOLATIONS: [list or "None"]
SUGGESTIONS: [list or "None"]
```
"""
        
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        review_text = message.content[0].text
        
        return {
            "command": "REVIEW",
            "status": "completed",
            "review": review_text,
            "next_action": "Fix violations or APPROVE"
        }
    
    def _execute_test(self, cmd: TestCommand) -> Dict[str, Any]:
        """
        Executa comando TEST
        
        Testa coerência com kernel
        """
        tests_text = ", ".join(cmd.against)
        
        prompt = f"""You are executing a TEST command for a book project.

{self.kernel}

---

## TEST COMMAND

**Test against:** {tests_text}

**Text to test:**

{cmd.text}

---

## INSTRUCTIONS

Test the text against:

{chr(10).join([f'- {test}' for test in cmd.against])}

For each test, provide:
- **PASS** (no violations)
- **FAIL** (violations found)
- List specific violations

Format:
```
TEST: [name]
RESULT: PASS/FAIL
VIOLATIONS: [details or "None"]
```
"""
        
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        test_result = message.content[0].text
        
        return {
            "command": "TEST",
            "status": "completed",
            "result": test_result
        }


class DirectorInterface:
    """
    Interface de Diretor
    
    Abstração de alto nível para Regis "dirigir" a escrita.
    
    Exemplo:
        director = DirectorInterface(project_id)
        
        # Escrever cena
        scene = director.write(
            "Nascimento do Terceiro",
            length="10 pages",
            focus="tensão crescente"
        )
        
        # Revisar
        review = director.review(scene)
        
        # Aprovar ou rejeitar
        if review["pass"]:
            director.approve(scene)
        else:
            director.reject(scene, "Refaça parágrafo 3")
    """
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.executor = CommandExecutor(project_id)
    
    def write(
        self,
        scene: str,
        section: str = "Current chapter",
        length: str = "5 pages",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Ordena IA para escrever cena
        
        Args:
            scene: Descrição da cena
            section: Seção/capítulo
            length: Tamanho desejado
            **kwargs: pov, focus, additional_context
        
        Returns:
            Dict com cena gerada
        """
        cmd = WriteCommand(
            section=section,
            scene=scene,
            length=length,
            pov=kwargs.get("pov"),
            focus=kwargs.get("focus"),
            additional_context=kwargs.get("additional_context")
        )
        
        result = self.executor.execute(cmd)
        
        print(f"✅ Scene generated: {len(result['text'].split())} words")
        print(f"Next: REVIEW or APPROVE or REJECT")
        
        return result
    
    def review(self, scene_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Revisa cena gerada
        
        Args:
            scene_data: Output do write()
        
        Returns:
            Dict com análise
        """
        cmd = ReviewCommand(
            scene_text=scene_data["text"],
            check_for=["coherence", "voice", "kernel_laws", "quality"]
        )
        
        result = self.executor.execute(cmd)
        
        print(f"✅ Review completed")
        print(result["review"])
        
        return result
    
    def test(self, text: str) -> Dict[str, Any]:
        """
        Testa coerência de texto
        
        Args:
            text: Texto a testar
        
        Returns:
            Dict com resultado
        """
        cmd = TestCommand(
            text=text,
            against=["kernel_laws", "character_traits", "world_rules"]
        )
        
        result = self.executor.execute(cmd)
        
        print(f"✅ Test completed")
        print(result["result"])
        
        return result
    
    def approve(self, scene_data: Dict[str, Any]) -> str:
        """
        Aprova cena para Canon
        
        Args:
            scene_data: Output do write()
        
        Returns:
            artifact_id
        """
        # Salvar como artifact canon
        import sqlite3
        import hashlib
        from datetime import datetime
        
        project_db = f"projects/{self.project_id}/project.db"
        conn = sqlite3.connect(project_db)
        cursor = conn.cursor()
        
        artifact_id = f"art_{hashlib.md5(scene_data['text'].encode()).hexdigest()[:12]}"
        
        cursor.execute("""
            INSERT INTO artifacts VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            artifact_id,
            "scene",
            scene_data["section"],
            scene_data["text"],
            "1.0",
            "canon",
            datetime.now().isoformat(),
            hashlib.md5(scene_data['text'].encode()).hexdigest()
        ))
        
        conn.commit()
        conn.close()
        
        print(f"✅ APPROVED and saved to Canon: {artifact_id}")
        
        return artifact_id
    
    def reject(self, scene_data: Dict[str, Any], reason: str) -> str:
        """
        Rejeita cena e pede refazer
        
        Args:
            scene_data: Output do write()
            reason: Por que foi rejeitado
        
        Returns:
            Mensagem
        """
        print(f"❌ REJECTED: {reason}")
        print(f"Run write() again with adjustments")
        
        return f"Scene rejected: {reason}"
