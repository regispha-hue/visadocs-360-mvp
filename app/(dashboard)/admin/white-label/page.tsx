"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Palette,
  Type,
  Image as ImageIcon,
  Save,
  Monitor,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function WhiteLabelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    // Cores
    primaryColor: "#0d9488",
    secondaryColor: "#0f766e",
    accentColor: "#14b8a6",
    backgroundColor: "#f8fafc",
    textColor: "#1e293b",

    // Fontes
    fontFamily: "Inter",
    fontSize: "16px",

    // Branding
    appName: "VISADOCS",
    tagline: "Conformidade RDC 67/2007",
    logoUrl: "",
    faviconUrl: "",

    // Layout
    sidebarStyle: "default", // default, compact, minimal
    dashboardStyle: "default", // default, modern, classic

    // Features toggle
    showLogo: true,
    showNotifications: true,
    showHelp: true,
    darkModeEnabled: true,
  });

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const user = session?.user as any;
  if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN_FARMACIA") {
    router.push("/dashboard");
    return null;
  }

  const handleSave = async () => {
    try {
      setLoading(true);
      // API call seria aqui
      toast.success("Configurações salvas!");
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const colorPresets = [
    { name: "Teal (Padrão)", primary: "#0d9488", secondary: "#0f766e" },
    { name: "Blue", primary: "#2563eb", secondary: "#1d4ed8" },
    { name: "Purple", primary: "#7c3aed", secondary: "#6d28d9" },
    { name: "Green", primary: "#16a34a", secondary: "#15803d" },
    { name: "Red", primary: "#dc2626", secondary: "#b91c1c" },
    { name: "Orange", primary: "#ea580c", secondary: "#c2410c" },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Palette className="h-8 w-8 text-teal-600" />
          White-label & Customização
        </h1>
        <p className="text-muted-foreground mt-2">
          Personalize a aparência da plataforma para sua farmácia
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Cores da Marca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Presets */}
            <div>
              <Label>Presets</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    className="px-3 py-1 text-xs rounded-full border hover:border-primary"
                    style={{
                      backgroundColor: preset.primary,
                      color: "white",
                    }}
                    onClick={() =>
                      setConfig({
                        ...config,
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                      })
                    }
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, primaryColor: e.target.value })
                    }
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={config.primaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, primaryColor: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, secondaryColor: e.target.value })
                    }
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={config.secondaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, secondaryColor: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome da Aplicação</Label>
              <Input
                value={config.appName}
                onChange={(e) =>
                  setConfig({ ...config, appName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input
                value={config.tagline}
                onChange={(e) =>
                  setConfig({ ...config, tagline: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Fonte</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={config.fontFamily}
                onChange={(e) =>
                  setConfig({ ...config, fontFamily: e.target.value })
                }
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo e Favicon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>URL do Logo</Label>
              <Input
                value={config.logoUrl}
                onChange={(e) =>
                  setConfig({ ...config, logoUrl: e.target.value })
                }
                placeholder="https://..."
              />
              {config.logoUrl && (
                <img
                  src={config.logoUrl}
                  alt="Preview"
                  className="mt-2 h-12 object-contain"
                />
              )}
            </div>
            <div>
              <Label>URL do Favicon</Label>
              <Input
                value={config.faviconUrl}
                onChange={(e) =>
                  setConfig({ ...config, faviconUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="p-4 rounded-lg border"
              style={{ backgroundColor: config.backgroundColor }}
            >
              <div
                className="p-3 rounded mb-3"
                style={{ backgroundColor: config.primaryColor }}
              >
                <h3 style={{ color: "white", fontFamily: config.fontFamily }}>
                  {config.appName}
                </h3>
                <p style={{ color: "white", opacity: 0.8, fontSize: "12px" }}>
                  {config.tagline}
                </p>
              </div>
              <div className="space-y-2">
                <div
                  className="p-2 rounded"
                  style={{
                    backgroundColor: config.secondaryColor + "20",
                    borderLeft: `3px solid ${config.primaryColor}`,
                  }}
                >
                  <p
                    style={{
                      color: config.textColor,
                      fontFamily: config.fontFamily,
                    }}
                  >
                    Exemplo de card
                  </p>
                </div>
                <button
                  className="px-4 py-2 rounded text-white text-sm"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Botão Primário
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="mt-8 flex gap-4">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
        <Button variant="outline" size="lg">
          <RefreshCw className="h-4 w-4 mr-2" />
          Resetar Padrão
        </Button>
      </div>

      {/* Info */}
      <Card className="mt-8 bg-muted/50">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p>
            <strong>Nota:</strong> As configurações de white-label estão disponíveis
            apenas no plano Enterprise. Personalizações incluem cores, logo, fonte e
            branding da plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
