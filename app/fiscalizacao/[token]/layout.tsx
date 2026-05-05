/**
 * Layout do Portal de Fiscalização
 * Página pública sem autenticação (acesso via token)
 */

export const metadata = {
  title: "Portal de Fiscalização - VISADOCS",
  description: "Portal público para fiscalização ANVISA",
};

export default function FiscalizacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
