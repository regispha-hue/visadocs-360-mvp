"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { FileText } from "lucide-react";

interface PopsBySector {
  setor: string;
  _count: number;
}

interface DashboardChartsProps {
  popsBySector: PopsBySector[];
}

const COLORS = ["#0D9488", "#1E40AF", "#059669", "#7C3AED", "#DB2777", "#EA580C", "#CA8A04"];

export function DashboardCharts({ popsBySector }: DashboardChartsProps) {
  const chartData = (popsBySector ?? []).map((item) => ({
    name: item?.setor ?? "N/A",
    value: item?._count ?? 0,
  }));

  if ((chartData?.length ?? 0) === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            POPs por Setor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum POP cadastrado ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal-600" />
          POPs por Setor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
              <XAxis type="number" tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                tick={{ fontSize: 11 }}
                width={75}
              />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(value: number) => [value, "POPs"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
