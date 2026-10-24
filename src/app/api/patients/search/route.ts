import { NextResponse } from "next/server";

// Fast in-memory search for clinical responsiveness
const MOCK_SEARCH_PATIENTS = [
  {
    id: "pat-1",
    name: "Anika Tabassum",
    customPatientId: "DENT-2026-00042",
    phone: "+880 1711-234891",
    type: "patient" as const,
  },
  {
    id: "pat-2",
    name: "Nusrat Parveen",
    customPatientId: "DENT-2026-00089",
    phone: "+880 1819-872334",
    type: "patient" as const,
  },
  {
    id: "pat-3",
    name: "Mohammad Tariqul Islam",
    customPatientId: "DENT-2026-00104",
    phone: "+880 1912-439019",
    type: "patient" as const,
  },
  {
    id: "pat-4",
    name: "Tanvir Ahmed",
    customPatientId: "DENT-2026-00122",
    phone: "+880 1675-901443",
    type: "patient" as const,
  },
  {
    id: "pat-5",
    name: "Kazi Nazrul Haque",
    customPatientId: "DENT-2025-00812",
    phone: "+880 1722-312778",
    type: "patient" as const,
  },
  {
    id: "pat-6",
    name: "Farhana Chowdhury",
    customPatientId: "DENT-2026-00095",
    phone: "+880 1733-892120",
    type: "patient" as const,
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const limit = parseInt(searchParams.get("limit") || "8");

  if (!q) {
    return NextResponse.json({ patients: [] });
  }

  const results = MOCK_SEARCH_PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.customPatientId.toLowerCase().includes(q) ||
      p.phone.includes(q)
  ).slice(0, limit);

  return NextResponse.json({ patients: results });
}
