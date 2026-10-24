"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Users,
  Activity,
  Calendar,
  Sparkles,
  Download,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";

export default function AnalyticsPage() {
  const procedureBreakdown = [
    { category: "Restorative (Composites & Crowns)", percent: 38, count: 142, revenue: "৳4,26,000" },
    { category: "Endodontics (Root Canal Therapy)", percent: 24, count: 36, revenue: "৳3,42,000" },
    { category: "Hygiene & Periodontics (Prophy & Scaling)", percent: 20, count: 210, revenue: "৳2,31,000" },
    { category: "Prosthodontics & Implants", percent: 12, count: 18, revenue: "৳2,85,000" },
    { category: "Diagnostic & Preventative (X-Rays, Exams)", percent: 6, count: 195, revenue: "৳1,48,000" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Clinical Practice Analytics & Production Insights
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Key clinical performance indicators, procedure revenue distributions, and recall retention rates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export Monthly Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border p-4 shadow-sm">
          <span className="text-xs text-muted-foreground block font-medium">Monthly Gross Production</span>
          <div className="text-2xl font-bold text-foreground mt-1">৳14,32,000</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">↑ 14% vs last month</p>
        </Card>
        <Card className="border p-4 shadow-sm">
          <span className="text-xs text-muted-foreground block font-medium">Case Acceptance Rate</span>
          <div className="text-2xl font-bold text-foreground mt-1">78.5%</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Target: 75% (+3.5%)</p>
        </Card>
        <Card className="border p-4 shadow-sm">
          <span className="text-xs text-muted-foreground block font-medium">Active Recall Retention</span>
          <div className="text-2xl font-bold text-foreground mt-1">84.2%</div>
          <p className="text-[11px] text-muted-foreground mt-1">1,051 hygiene recalled patients</p>
        </Card>
        <Card className="border p-4 shadow-sm">
          <span className="text-xs text-muted-foreground block font-medium">Avg Production per Chair / Day</span>
          <div className="text-2xl font-bold text-foreground mt-1">৳18,500</div>
          <p className="text-[11px] text-muted-foreground mt-1">Across 4 operatories</p>
        </Card>
      </div>

      {/* Procedure Distribution Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">
            Procedure Breakdown by Clinical Discipline
          </CardTitle>
          <CardDescription className="text-xs">
            Monthly distribution of clinical procedures, volume, and gross billing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-3">
            {procedureBreakdown.map((item) => (
              <div key={item.category} className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">{item.category}</span>
                  <span className="font-mono font-bold text-primary">
                    {item.revenue} ({item.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{item.count} procedures logged</span>
                  <span>Avg: ${(parseInt(item.revenue.replace(/[^0-9]/g, "")) / item.count).toFixed(0)} / case</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
