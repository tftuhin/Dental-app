// ============================================================
// Drug–allergy check for the prescription pad.
// A safety net that flags likely conflicts for the doctor to confirm;
// it is not a complete interaction database.
// ============================================================

/** Drug families: an allergy to the family name matches any member. */
const FAMILIES: Record<string, string[]> = {
  penicillin: [
    "penicillin", "amoxicillin", "amoxycillin", "ampicillin", "cloxacillin", "flucloxacillin",
    "dicloxacillin", "piperacillin", "co-amoxiclav", "clavulan", "phenoxymethylpenicillin",
  ],
  cephalosporin: ["cef", "ceph"],
  sulfa: ["sulfa", "sulpha", "sulfamethoxazole", "cotrimoxazole", "co-trimoxazole"],
  nsaid: [
    "ibuprofen", "diclofenac", "naproxen", "ketorolac", "aceclofenac", "etoricoxib",
    "celecoxib", "mefenamic", "indomethacin", "aspirin", "piroxicam", "flurbiprofen",
  ],
  aspirin: ["aspirin", "acetylsalicylic"],
  macrolide: ["erythromycin", "azithromycin", "clarithromycin"],
  metronidazole: ["metronidazole", "tinidazole"],
  lidocaine: ["lidocaine", "lignocaine"],
  latex: [],
};

/** Words in an allergy note that aren't drug names. */
const NOISE = new Set([
  "allergy", "allergic", "to", "severe", "mild", "moderate", "rash", "anaphylaxis", "reaction",
  "sensitivity", "intolerance", "and", "or", "with", "history", "of", "drug", "known",
]);

export interface AllergyConflict {
  allergy: string;
  reason: string;
}

/**
 * Check one medicine (brand + generic) against the patient's recorded allergies.
 * Returns the allergies it may conflict with.
 */
export function findAllergyConflicts(
  med: { brandName?: string; genericName?: string },
  allergies: string[]
): AllergyConflict[] {
  const drug = `${med.brandName || ""} ${med.genericName || ""}`.toLowerCase();
  if (!drug.trim()) return [];
  const conflicts: AllergyConflict[] = [];

  for (const allergy of allergies) {
    const words = allergy
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ") // drop "(Severe Anaphylaxis)" etc.
      .split(/[^a-z0-9-]+/)
      .filter((w) => w.length >= 4 && !NOISE.has(w));

    for (const w of words) {
      const familyKey = Object.keys(FAMILIES).find((k) => w.startsWith(k) || k.startsWith(w));
      const members = familyKey ? FAMILIES[familyKey] : [];
      const hit = drug.includes(w) ? w : members.find((m) => drug.includes(m));
      if (hit) {
        conflicts.push({
          allergy,
          reason: familyKey && hit !== w ? `${hit} is in the ${familyKey} group` : `matches "${w}"`,
        });
        break;
      }
    }
  }
  return conflicts;
}
