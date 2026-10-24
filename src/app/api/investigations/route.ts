import { NextResponse } from "next/server";
import { DEFAULT_INVESTIGATIONS, InvestigationItem } from "@/lib/investigations-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";

    let list = DEFAULT_INVESTIGATIONS;

    if (query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.testName.toLowerCase().includes(q) ||
          item.sampleOrModality.toLowerCase().includes(q) ||
          item.indication.toLowerCase().includes(q) ||
          item.code?.toLowerCase().includes(q)
      );
    }

    if (category && category !== "all") {
      list = list.filter((item) => item.category === category);
    }

    return NextResponse.json({ investigations: list });
  } catch (error) {
    console.error("Failed to fetch investigations:", error);
    return NextResponse.json({ investigations: DEFAULT_INVESTIGATIONS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      testName,
      code,
      category,
      sampleOrModality,
      turnaroundTime,
      defaultPriceBDT,
      indication,
      instructions,
    } = body;

    if (!testName) {
      return NextResponse.json(
        { error: "Test name is required" },
        { status: 400 }
      );
    }

    const newItem: InvestigationItem = {
      id: `inv-${Date.now()}`,
      testName: testName.trim(),
      code: code ? code.trim() : `TEST-${Math.floor(100 + Math.random() * 900)}`,
      category: category || "radiology",
      sampleOrModality: sampleOrModality || "Digital Diagnostic",
      turnaroundTime: turnaroundTime || "Immediate (10 mins)",
      defaultPriceBDT: Number(defaultPriceBDT) || 500,
      indication: indication || "Dental diagnostic evaluation",
      instructions: instructions || "",
      isCustomAdded: true,
      isActive: true,
    };

    return NextResponse.json({ success: true, investigation: newItem });
  } catch (error) {
    console.error("Failed to add investigation:", error);
    return NextResponse.json(
      { error: "Failed to add investigation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Investigation ID is required" }, { status: 400 });
    }
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Failed to delete investigation:", error);
    return NextResponse.json({ error: "Failed to delete investigation" }, { status: 500 });
  }
}
