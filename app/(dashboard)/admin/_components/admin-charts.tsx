"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Building2 } from "lucide-react";

interface FarmaciasByStatus {
  status: string;
  _count: number;
}

interface AdminDashboardChartsProps {
  farmaciasByStatus: FarmaciasByStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "#F59E0B",
  ATIVO: "#10B981",
  SUSPENSO: "#EF4444",
  CANCELADO: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendentes",
  ATIVO: "Ativas",
  SUSPENSO: "Suspensas",
  CANCELADO: "Canceladas",
};

export function AdminDashboardCharts({ farmaciasByStatus }: AdminDashboardChartsProps) {
  const chartData = (farmaciasByStatus ?? []).map((item) => ({
    name: STATUS_LABELS[item?.status] ?? item?.status ?? "N/A",
    value: item?._count ?? 0,
    color: STATUS_COLORS[item?.status] ?? "#6B7280",
  }));

  if ((chartData?.length ?? 0) === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal-600" />
            Farmácias por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhuma farmácia cadastrada ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-teal-600" />
          Farmácias por Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {chartData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry?.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, "Farmácias"]} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
