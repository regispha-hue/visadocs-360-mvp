"use client";

import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  daysLeft: number;
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  if (daysLeft < 0) return null;

  const isUrgent = daysLeft <= 3;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium",
        isUrgent
          ? "bg-red-500 text-white"
          : "bg-amber-500 text-white"
      )}
    >
      {isUrgent ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span>
        {daysLeft === 0
          ? "Seu período de trial expira hoje!"
          : daysLeft === 1
          ? "Seu período de trial expira amanhã!"
          : `Faltam ${daysLeft} dias para o fim do trial`}
      </span>
    </div>
  );
}
