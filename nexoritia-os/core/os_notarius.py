"""
Nexoritia OS - OS-Notarius (AUTH-AI)
Sistema de autenticação criptográfica de propriedade intelectual
"""

import hashlib
import json
import time
import requests
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from cryptography import x509
from cryptography.x509.oid import NameOID

from .models import AuthProof, AuthRequest, AuthVerification


class OSNotarius:
    """Sistema AUTH-AI para autenticação criptográfica"""
    
    def __init__(self, keys_dir: str = "~/.auth-ai/keys"):
        self.keys_dir = Path(keys_dir).expanduser()
        self.keys_dir.mkdir(parents=True, exist_ok=True)
        
        # Paths das chaves
        self.private_key_path = self.keys_dir / "author_private.pem"
        self.public_key_path = self.keys_dir / "author_public.pem"
        
        # Inicializar chaves
        self._init_keys()
    
    def _init_keys(self):
        """Inicializa par de chaves RSA-4096"""
        if not self.private_key_path.exists():
            print("🔑 Gerando novo par de chaves RSA-4096...")
            
            # Gerar chave privada
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=4096,
                backend=default_backend()
            )
            
            # Salvar chave privada
            with open(self.private_key_path, "wb") as f:
                f.write(private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                ))
            
            # Extrair e salvar chave pública
            public_key = private_key.public_key()
            with open(self.public_key_path, "wb") as f:
                f.write(public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                ))
            
            print(f"✅ Chaves geradas em: {self.keys_dir}")
            print("⚠️  FAÇA BACKUP DAS CHAVES IMEDIATAMENTE!")
        else:
            print("🔑 Chaves existentes encontradas")
    
    def _get_private_key(self):
        """Carrega chave privada"""
        with open(self.private_key_path, "rb") as f:
            return serialization.load_pem_private_key(
                f.read(),
                password=None,
                backend=default_backend()
            )
    
    def _get_public_key_pem(self) -> str:
        """Retorna chave pública como string PEM"""
        with open(self.public_key_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    
    def _compute_content_hash(self, content: str) -> str:
        """Computa hash SHA256 do conteúdo"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def _sign_content(self, content: str, private_key) -> str:
        """Assina conteúdo com chave privada RSA-4096"""
        content_hash = self._compute_content_hash(content)
        
        signature = private_key.sign(
            content_hash.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        return signature.hex()
    
    def _get_tsa_timestamp(self) -> Optional[str]:
        """Obtém timestamp RFC 3161 do FreeTSA"""
        try:
            # FreeTSA endpoint gratuito
            url = "https://freetsa.org/tsr"
            
            # Preparar requisição TSA
            content_hash = hashlib.sha256(b"dummy").hexdigest()
            
            # Criar TSA request (simplificado)
            tsa_request = f"""
-----BEGIN TIMESTAMP REQUEST-----
{content_hash}
-----END TIMESTAMP REQUEST-----
            """.strip()
            
            response = requests.post(
                url,
                data=tsa_request.encode(),
                headers={"Content-Type": "application/timestamp-query"},
                timeout=30
            )
            
            if response.status_code == 200:
                return response.text.strip()
            else:
                print(f"⚠️  TSA indisponível: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"⚠️  Erro ao obter timestamp TSA: {e}")
            return None
    
    def authenticate_artifact(self, request: AuthRequest) -> AuthProof:
        """Gera prova criptográfica para artifact"""
        
        # Gerar hash do conteúdo
        content_hash = self._compute_content_hash(request.content)
        
        # Assinar com chave privada
        private_key = self._get_private_key()
        signature = self._sign_content(request.content, private_key)
        
        # Obter timestamp TSA (se solicitado)
        tsa_timestamp = None
        if request.include_tsa:
            tsa_timestamp = self._get_tsa_timestamp()
        
        # Criar prova
        proof = AuthProof(
            artifact_id=request.artifact_id,
            artifact_type=request.artifact_type,
            content_hash=content_hash,
            author_signature=signature,
            public_key_pem=self._get_public_key_pem(),
            tsa_timestamp=tsa_timestamp,
            created_at=datetime.now()
        )
        
        return proof
    
    def verify_proof(self, content: str, proof: AuthProof) -> AuthVerification:
        """Verifica prova criptográfica"""
        
        try:
            # 1. Verificar hash do conteúdo
            current_hash = self._compute_content_hash(content)
            hash_valid = current_hash == proof.content_hash
            
            if not hash_valid:
                return AuthVerification(
                    valid=False,
                    coherent=False,
                    reason="Content hash mismatch - content was modified",
                    proof=proof
                )
            
            # 2. Verificar assinatura
            public_key = serialization.load_pem_public_key(
                proof.public_key_pem.encode(),
                backend=default_backend()
            )
            
            content_hash_bytes = proof.content_hash.encode('utf-8')
            signature_bytes = bytes.fromhex(proof.author_signature)
            
            try:
                public_key.verify(
                    signature_bytes,
                    content_hash_bytes,
                    padding.PSS(
                        mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH
                    ),
                    hashes.SHA256()
                )
                signature_valid = True
            except Exception:
                signature_valid = False
            
            if not signature_valid:
                return AuthVerification(
                    valid=False,
                    coherent=False,
                    reason="Invalid digital signature",
                    proof=proof
                )
            
            # 3. Verificar timestamp (se presente)
            timestamp_valid = True
            if proof.tsa_timestamp:
                # Aqui poderia verificar validade do timestamp
                # Por enquanto, apenas verifica se existe
                timestamp_valid = len(proof.tsa_timestamp) > 0
            
            # 4. Verificar validade temporal (opcional)
            valid_until = proof.valid_until
            if valid_until and datetime.now() > valid_until:
                return AuthVerification(
                    valid=False,
                    coherent=False,
                    reason="Proof has expired",
                    proof=proof
                )
            
            return AuthVerification(
                valid=hash_valid and signature_valid and timestamp_valid,
                coherent=True,
                reason="Valid cryptographic proof",
                proof=proof
            )
            
        except Exception as e:
            return AuthVerification(
                valid=False,
                coherent=False,
                reason=f"Verification error: {str(e)}",
                proof=proof
            )
    
    def batch_authenticate(self, artifacts: List[Dict[str, Any]]) -> List[AuthProof]:
        """Autentica múltiplos artifacts em lote"""
        proofs = []
        
        for i, artifact_data in enumerate(artifacts):
            print(f"🔐 Autenticando artifact {i+1}/{len(artifacts)}: {artifact_data.get('artifact_id', 'unknown')}")
            
            request = AuthRequest(
                artifact_id=artifact_data["artifact_id"],
                content=artifact_data["content"],
                artifact_type=artifact_data.get("artifact_type", "text"),
                title=artifact_data.get("title"),
                include_tsa=artifact_data.get("include_tsa", True)
            )
            
            proof = self.authenticate_artifact(request)
            proofs.append(proof)
            
            # Pequeno delay para não sobrecarregar TSA
            if artifact_data.get("include_tsa", True):
                time.sleep(1)
        
        return proofs
    
    def export_public_key(self) -> Dict[str, str]:
        """Exporta chave pública para distribuição"""
        return {
            "public_key_pem": self._get_public_key_pem(),
            "key_format": "RSA-4096",
            "encoding": "PEM",
            "algorithm": "RSA-PSS with SHA-256",
            "exported_at": datetime.now().isoformat(),
            "fingerprint": self._compute_key_fingerprint()
        }
    
    def _compute_key_fingerprint(self) -> str:
        """Computa fingerprint da chave pública"""
        public_key_pem = self._get_public_key_pem()
        return hashlib.sha256(public_key_pem.encode('utf-8')).hexdigest()[:16]
    
    def backup_keys(self, backup_dir: str) -> bool:
        """Faz backup das chaves"""
        try:
            backup_path = Path(backup_dir)
            backup_path.mkdir(parents=True, exist_ok=True)
            
            # Copiar chaves
            import shutil
            shutil.copy2(self.private_key_path, backup_path / "author_private.pem")
            shutil.copy2(self.public_key_path, backup_path / "author_public.pem")
            
            # Criar manifesto do backup
            manifest = {
                "backup_created_at": datetime.now().isoformat(),
                "key_fingerprint": self._compute_key_fingerprint(),
                "files": ["author_private.pem", "author_public.pem"],
                "version": "1.0.0"
            }
            
            with open(backup_path / "backup_manifest.json", "w") as f:
                json.dump(manifest, f, indent=2)
            
            print(f"✅ Backup realizado em: {backup_path}")
            return True
            
        except Exception as e:
            print(f"❌ Erro no backup: {e}")
            return False
    
    def get_key_info(self) -> Dict[str, Any]:
        """Retorna informações das chaves"""
        return {
            "private_key_exists": self.private_key_path.exists(),
            "public_key_exists": self.public_key_path.exists(),
            "key_directory": str(self.keys_dir),
            "key_fingerprint": self._compute_key_fingerprint() if self.public_key_path.exists() else None,
            "key_size": 4096,
            "algorithm": "RSA-PSS with SHA-256",
            "created_at": datetime.fromtimestamp(self.private_key_path.stat().st_mtime).isoformat() if self.private_key_path.exists() else None
        }


# Funções de conveniência para uso direto
def create_auth_ai_instance(keys_dir: str = "~/.auth-ai/keys") -> OSNotarius:
    """Cria instância do AUTH-AI"""
    return OSNotarius(keys_dir)


def authenticate_file(file_path: str, artifact_id: str = None, include_tsa: bool = True) -> AuthProof:
    """Autentica arquivo diretamente"""
    notarius = OSNotarius()
    
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    request = AuthRequest(
        artifact_id=artifact_id or path.stem,
        content=content,
        artifact_type="file",
        title=path.name,
        include_tsa=include_tsa
    )
    
    return notarius.authenticate_artifact(request)


def verify_file(file_path: str, proof_path: str) -> AuthVerification:
    """Verifica arquivo contra prova"""
    notarius = OSNotarius()
    
    # Carregar conteúdo
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Carregar prova
    with open(proof_path, 'r', encoding='utf-8') as f:
        proof_data = json.load(f)
    
    proof = AuthProof(**proof_data)
    return notarius.verify_proof(content, proof)
