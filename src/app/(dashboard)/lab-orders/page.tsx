"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FlaskConical,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Truck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface LabOrder {
  id: string;
  orderNumber: string;
  patient: string;
  patientId: string;
  labName: string;
  prosthesis: string;
  toothNumbers: string;
  shade: string;
  material: string;
  sentDate: string;
  expectedDate: string;
  status: "sent" | "in_progress" | "delivered" | "overdue";
  fee: string;
}

const INITIAL_ORDERS: LabOrder[] = [
  {
    id: "lo-1",
    orderNumber: "LAB-2026-0082",
    patient: "Kazi Nazrul Haque",
    patientId: "DENT-2025-00812",
    labName: "Dhaka Dental Lab & Milling Center (Banani)",
    prosthesis: "Full Contour Zirconia Crown",
    toothNumbers: "#30",
    shade: "VITA Classical A2",
    material: "Multi-layered High-Translucent Zirconia",
    sentDate: "Oct 15, 2026",
    expectedDate: "Today, Oct 24, 2026",
    status: "delivered",
    fee: "৳6,500.00",
  },
  {
    id: "lo-2",
    orderNumber: "LAB-2026-0083",
    patient: "Anika Tabassum",
    patientId: "DENT-2026-00042",
    labName: "Bengal CAD/CAM Ceramic Arts (Dhanmondi)",
    prosthesis: "E-max CAD/CAM Ceramic Crown",
    toothNumbers: "#19",
    shade: "Bleach BL2",
    material: "Lithium Disilicate",
    sentDate: "Today, Oct 24, 2026",
    expectedDate: "Nov 02, 2026",
    status: "sent",
    fee: "৳7,200.00",
  },
  {
    id: "lo-3",
    orderNumber: "LAB-2026-0078",
    patient: "Tanvir Ahmed",
    patientId: "DENT-2026-00122",
    labName: "Green Dental Orthotech Studio (Uttara)",
    prosthesis: "Clear Retainers (Upper & Lower)",
    toothNumbers: "Full Arch",
    shade: "Clear",
    material: "Zendura Polyurethane",
    sentDate: "Oct 10, 2026",
    expectedDate: "Oct 20, 2026",
    status: "overdue",
    fee: "৳4,800.00",
  },
];

export default function LabOrdersPage() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Dental Lab Orders & Prosthetics Tracking
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track crown, bridge, denture, and aligner fabrication, shade guides, and expected return dates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => toast.info("New Dental Lab Order form opened")} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Lab Order
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Order #</th>
                <th className="py-3 px-4 text-left font-semibold">Patient</th>
                <th className="py-3 px-3 text-left font-semibold">Prosthesis & Tooth</th>
                <th className="py-3 px-3 text-left font-semibold">Dental Lab</th>
                <th className="py-3 px-3 text-left font-semibold">Shade / Material</th>
                <th className="py-3 px-3 text-left font-semibold">Expected Return</th>
                <th className="py-3 px-3 text-left font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Lab Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    {o.orderNumber}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    <span className="font-bold">{o.patient}</span>
                    <span className="text-[11px] text-muted-foreground block">
                      {o.patientId}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-foreground">{o.prosthesis}</span>
                    <Badge variant="outline" className="text-[10px] ml-1.5 font-bold">
                      {o.toothNumbers}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{o.labName}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-foreground">Shade: {o.shade}</span>
                    <span className="text-[11px] text-muted-foreground block">{o.material}</span>
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {o.status === "overdue" ? (
                      <span className="text-red-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {o.expectedDate}
                      </span>
                    ) : (
                      <span>{o.expectedDate}</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      className={`text-[10px] capitalize font-semibold ${
                        o.status === "delivered"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : o.status === "overdue"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                      }`}
                    >
                      {o.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    {o.fee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
