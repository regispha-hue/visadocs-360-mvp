"""Nexoritia OS - OS-Notarius (AUTH-AI) | Otimizado para deploy"""
import hashlib, json, time, requests
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from .models import AuthProof, AuthRequest, AuthVerification

class OSNotarius:
    def __init__(self, keys_dir="~/.auth-ai/keys"):
        self.keys_dir = Path(keys_dir).expanduser()
        self.keys_dir.mkdir(parents=True, exist_ok=True)
        self.private_key_path = self.keys_dir / "author_private.pem"
        self.public_key_path = self.keys_dir / "author_public.pem"
        self._init_keys()

    def _init_keys(self):
        if self.private_key_path.exists(): return
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=4096, backend=default_backend())
        with open(self.private_key_path, "wb") as f:
            f.write(private_key.private_bytes(encoding=serialization.Encoding.PEM, format=serialization.PrivateFormat.PKCS8, encryption_algorithm=serialization.NoEncryption()))
        public_key = private_key.public_key()
        with open(self.public_key_path, "wb") as f:
            f.write(public_key.public_bytes(encoding=serialization.Encoding.PEM, format=serialization.PublicFormat.SubjectPublicKeyInfo))

    def _get_private_key(self):
        with open(self.private_key_path, "rb") as f:
            return serialization.load_pem_private_key(f.read(), password=None, backend=default_backend())

    def _get_public_key_pem(self):
        with open(self.public_key_path, "r", encoding="utf-8") as f:
            return f.read().strip()

    def _compute_hash(self, content: str) -> str:
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def _sign(self, content: str, private_key) -> str:
        return private_key.sign(self._compute_hash(content).encode('utf-8'),
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH), hashes.SHA256()).hex()

    def _get_tsa(self) -> Optional[str]:
        try:
            r = requests.post("https://freetsa.org/tsr", data=b"test", headers={"Content-Type": "application/timestamp-query"}, timeout=30)
            return r.text.strip() if r.status_code == 200 else None
        except: return None

    def authenticate_artifact(self, request: AuthRequest) -> AuthProof:
        content_hash = self._compute_hash(request.content)
        signature = self._sign(request.content, self._get_private_key())
        tsa = self._get_tsa() if request.include_tsa else None
        return AuthProof(artifact_id=request.artifact_id, artifact_type=request.artifact_type,
                      content_hash=content_hash, author_signature=signature,
                      public_key_pem=self._get_public_key_pem(), tsa_timestamp=tsa)

    def verify_proof(self, content: str, proof: AuthProof) -> AuthVerification:
        try:
            current_hash = self._compute_hash(content)
            if current_hash != proof.content_hash:
                return AuthVerification(valid=False, coherent=False, reason="Content hash mismatch", proof=proof)
            public_key = serialization.load_pem_public_key(proof.public_key_pem.encode(), backend=default_backend())
            try:
                public_key.verify(bytes.fromhex(proof.author_signature), proof.content_hash.encode('utf-8'),
                    padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH), hashes.SHA256())
                return AuthVerification(valid=True, coherent=True, reason="Valid cryptographic proof", proof=proof)
            except:
                return AuthVerification(valid=False, coherent=False, reason="Invalid digital signature", proof=proof)
        except Exception as e:
            return AuthVerification(valid=False, coherent=False, reason=f"Verification error: {str(e)}", proof=proof)

    def batch_authenticate(self, artifacts: List[Dict[str, Any]]) -> List[AuthProof]:
        proofs = []
        for artifact_data in artifacts:
            request = AuthRequest(artifact_id=artifact_data["artifact_id"], content=artifact_data["content"],
                                artifact_type=artifact_data.get("artifact_type", "text"), include_tsa=artifact_data.get("include_tsa", True))
            proofs.append(self.authenticate_artifact(request))
            if artifact_data.get("include_tsa", True): time.sleep(1)
        return proofs

    def export_public_key(self):
        return {"public_key_pem": self._get_public_key_pem(), "key_format": "RSA-4096", "encoding": "PEM",
                "algorithm": "RSA-PSS with SHA-256", "exported_at": datetime.now().isoformat(),
                "fingerprint": hashlib.sha256(self._get_public_key_pem().encode('utf-8')).hexdigest()[:16]}

    def get_key_info(self):
        return {"private_key_exists": self.private_key_path.exists(), "public_key_exists": self.public_key_path.exists(),
                "key_directory": str(self.keys_dir), "key_size": 4096, "algorithm": "RSA-PSS with SHA-256",
                "created_at": datetime.fromtimestamp(self.private_key_path.stat().st_mtime).isoformat() if self.private_key_path.exists() else None}
