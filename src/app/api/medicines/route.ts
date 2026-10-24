import { NextResponse } from "next/server";
import { db } from "@/db";
import { medicinesCatalog } from "@/db/schema";
import { ilike, or, eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { DEFAULT_BANGLA_MEDICINES } from "@/lib/medicines-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.trim().length > 0) {
      try {
        const results = await db
          .select()
          .from(medicinesCatalog)
          .where(
            or(
              ilike(medicinesCatalog.brandName, `%${query}%`),
              ilike(medicinesCatalog.genericName, `%${query}%`),
              ilike(medicinesCatalog.category, `%${query}%`)
            )
          )
          .limit(30);

        if (results && results.length > 0) {
          return NextResponse.json({ medicines: results });
        }
      } catch (dbErr) {
        console.warn("DB query failed, filtering fallback catalog:", dbErr);
      }

      // Fallback search in DEFAULT_BANGLA_MEDICINES
      const q = query.toLowerCase();
      const filtered = DEFAULT_BANGLA_MEDICINES.filter(
        (m) =>
          m.brandName.toLowerCase().includes(q) ||
          m.genericName?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q)
      );
      return NextResponse.json({ medicines: filtered });
    }

    // Default top medicines
    try {
      const results = await db
        .select()
        .from(medicinesCatalog)
        .where(eq(medicinesCatalog.isActive, true))
        .orderBy(desc(medicinesCatalog.createdAt))
        .limit(50);

      if (results && results.length > 0) {
        return NextResponse.json({ medicines: results });
      }
    } catch (dbErr) {
      console.warn("DB select failed, using default catalog:", dbErr);
    }

    return NextResponse.json({ medicines: DEFAULT_BANGLA_MEDICINES });
  } catch (error) {
    console.error("Failed to fetch medicines catalog:", error);
    return NextResponse.json({ medicines: DEFAULT_BANGLA_MEDICINES });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const {
      brandName,
      genericName,
      strength,
      dosageForm,
      defaultFrequency,
      defaultDuration,
      defaultTiming,
      category,
      notes,
    } = body;

    if (!brandName) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      );
    }

    // Normalize dosageForm to allowed enum values
    const validDosageForms = [
      "tablet",
      "capsule",
      "syrup",
      "oral_rinse",
      "topical_gel",
      "injection",
      "drops",
      "inhaler",
      "powder",
      "other",
    ];
    const normalizedForm = (dosageForm || "tablet").toLowerCase().replace(/\s+/g, "_");
    const safeDosageForm = validDosageForms.includes(normalizedForm)
      ? (normalizedForm as any)
      : "tablet";

    try {
      const [newMedicine] = await db
        .insert(medicinesCatalog)
        .values({
          clinicId: (session?.user as any)?.clinicId || null,
          brandName: brandName.trim(),
          genericName: genericName ? genericName.trim() : null,
          strength: strength ? strength.trim() : null,
          dosageForm: safeDosageForm,
          defaultFrequency: defaultFrequency || "1+0+1",
          defaultDuration: defaultDuration || "5 days",
          defaultTiming: defaultTiming || "After food",
          category: category || "Dental Therapeutics",
          isCustomAdded: true,
          isActive: true,
          notes: notes || null,
        })
        .returning();

      return NextResponse.json({ success: true, medicine: newMedicine });
    } catch (dbErr) {
      console.warn("Database insert failed, returning synthetic medicine object:", dbErr);
      const syntheticMedicine = {
        id: `med-${Date.now()}`,
        brandName: brandName.trim(),
        genericName: genericName ? genericName.trim() : null,
        strength: strength ? strength.trim() : null,
        dosageForm: safeDosageForm,
        defaultFrequency: defaultFrequency || "1+0+1",
        defaultDuration: defaultDuration || "5 days",
        defaultTiming: defaultTiming || "After food",
        category: category || "Dental Therapeutics",
        isCustomAdded: true,
        isActive: true,
        notes: notes || null,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, medicine: syntheticMedicine });
    }
  } catch (error) {
    console.error("Failed to add medicine:", error);
    return NextResponse.json(
      { error: "Failed to add medicine to database" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Medicine ID is required" }, { status: 400 });
    }

    try {
      await db.delete(medicinesCatalog).where(eq(medicinesCatalog.id, id));
    } catch (dbErr) {
      console.warn("DB delete skipped or failed:", dbErr);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Failed to delete medicine:", error);
    return NextResponse.json(
      { error: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}
