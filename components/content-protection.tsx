"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContentProtectionProps {
  children: React.ReactNode;
  contentId: string;
  userId: string;
  tenantId: string;
  watermarkText?: string;
}

export function ContentProtection({
  children,
  contentId,
  userId,
  tenantId,
  watermarkText,
}: ContentProtectionProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  useEffect(() => {
    // Desabilitar seleção de texto
    const disableSelection = (e: Event) => {
      e.preventDefault();
      handleViolation("selection");
    };

    // Desabilitar clique direito
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation("context_menu");
      return false;
    };

    // Desabilitar atalhos de cópia
    const disableCopyShortcuts = (e: KeyboardEvent) => {
      // Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+P
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "p")
      ) {
        e.preventDefault();
        handleViolation("keyboard_shortcut", e.key);
        return false;
      }

      // F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        handleViolation("devtools");
        return false;
      }

      // Ctrl+Shift+I/J (DevTools)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "i" || e.key === "j" || e.key === "c")
      ) {
        e.preventDefault();
        handleViolation("devtools");
        return false;
      }

      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        handleViolation("view_source");
        return false;
      }
    };

    // Desabilitar arrastar e soltar
    const disableDragDrop = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Detectar print screen
    const detectPrintScreen = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        handleViolation("printscreen");
        // Tentar limpar clipboard
        navigator.clipboard.writeText("Captura de tela não permitida").catch(() => {});
      }
    };

    // Desabilitar inspeção via elemento
    const disableInspection = (e: MouseEvent) => {
      if (e.detail === 3) {
        // Triple click
        e.preventDefault();
      }
    };

    // Registro de eventos
    document.addEventListener("selectstart", disableSelection);
    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("keydown", disableCopyShortcuts);
    document.addEventListener("dragstart", disableDragDrop);
    document.addEventListener("drop", disableDragDrop);
    document.addEventListener("keyup", detectPrintScreen);
    document.addEventListener("click", disableInspection);

    // Prevenir console methods
    const originalConsole = {
      log: console.log,
      debug: console.debug,
      info: console.info,
    };

    if (process.env.NODE_ENV === "production") {
      console.log = () => {};
      console.debug = () => {};
      console.info = () => {};
    }

    // Cleanup
    return () => {
      document.removeEventListener("selectstart", disableSelection);
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("keydown", disableCopyShortcuts);
      document.removeEventListener("dragstart", disableDragDrop);
      document.removeEventListener("drop", disableDragDrop);
      document.removeEventListener("keyup", detectPrintScreen);
      document.removeEventListener("click", disableInspection);

      if (process.env.NODE_ENV === "production") {
        console.log = originalConsole.log;
        console.debug = originalConsole.debug;
        console.info = originalConsole.info;
      }
    };
  }, [contentId, userId, tenantId]);

  const handleViolation = async (type: string, details?: string) => {
    setViolationCount((prev) => prev + 1);
    setShowWarning(true);

    // Log da violação
    try {
      await fetch("/api/security/log-violation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          userId,
          tenantId,
          type,
          details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (e) {
      // Silently fail
    }

    // Esconder aviso após 3 segundos
    setTimeout(() => {
      setShowWarning(false);
    }, 3000);
  };

  return (
    <div className="relative">
      {/* Warning Banner */}
      {showWarning && (
        <Alert className="absolute top-0 left-0 right-0 z-50 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Ação não permitida. Esta tentativa foi registrada para segurança.
          </AlertDescription>
        </Alert>
      )}

      {/* Watermark Overlay */}
      {watermarkText && (
        <div
          className="absolute inset-0 pointer-events-none z-40 overflow-hidden opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 50px,
              rgba(0, 0, 0, 0.03) 50px,
              rgba(0, 0, 0, 0.03) 100px
            )`,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: "rotate(-45deg)",
            }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-4xl font-bold text-gray-400 whitespace-nowrap select-none"
                style={{
                  top: `${i * 15}%`,
                  left: "-20%",
                  right: "-20%",
                }}
              >
                {watermarkText}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Container */}
      <div
        className="relative select-none"
        style={{
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          userSelect: "none",
        }}
      >
        {children}
      </div>

      {/* Violation Counter (hidden) */}
      {violationCount > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
            {violationCount} tentativa(s) de violação
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para uso simplificado
export function useContentProtection(contentId: string, userId: string, tenantId: string) {
  const [violations, setViolations] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v" || e.key === "x")) {
        e.preventDefault();
        setViolations((v) => v + 1);
        
        // Log
        fetch("/api/security/log-violation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentId,
            userId,
            tenantId,
            type: "keyboard_shortcut",
            details: e.key,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [contentId, userId, tenantId]);

  return { violations };
}
