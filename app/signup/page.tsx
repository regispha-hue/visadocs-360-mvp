"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Para o link de volta para Login

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Tenta obter uma mensagem de erro mais espec�fica do corpo da resposta
        const errorMessage = data?.message || "Erro ao cadastrar usu�rio.";
        throw new Error(errorMessage);
      }

      // Usu�rio cadastrado com sucesso, redireciona para a p�gina de login
      router.push("/login");
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      // Usa a mensagem de erro da requisi��o ou uma mensagem gen�rica
      setError(err.message || "Ocorreu um erro inesperado.");
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "24px", borderRadius: "8px", backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", textAlign: "center", marginBottom: "16px" }}>Cadastre-se</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="name" style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>
              Nome Completo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px" }}
            />
          </div>
          <div>
            <label htmlFor="email" style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px" }}
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6} // Exemplo: M�nimo de 6 caracteres para a senha
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px" }}
            />
          </div>
          {error && (
            <div style={{ color: "#ef4444", fontSize: "14px" }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "8px 16px", backgroundColor: loading ? "#9ca3af" : "#2563eb", color: "white", fontSize: "14px", fontWeight: "500", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
        <div style={{ marginTop: "16px", textAlign: "center", fontSize: "14px", color: "#6b7280" }}>
          J� tem uma conta? {" "}
          <Link href="/login" style={{ color: "#2563eb", textDecoration: "underline" }}>
            Fa�a login aqui
          </Link>
        </div>
      </div>
    </div>
  );
}

