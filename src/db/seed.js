const { config } = require("dotenv");
const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");

config({ path: ".env.local" });
config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const sql = neon(dbUrl);

async function seed() {
  console.log("=== SEEDING BANGLADESHI CLINICAL DATA INTO NEON POSTGRES ===");

  // 1. Create Default Clinic with Bangladeshi Address
  const clinicId = "11111111-1111-1111-1111-111111111111";
  await sql.query(`
    INSERT INTO clinics (id, name, slug, phone, email, address, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name, 
      email = EXCLUDED.email, 
      address = EXCLUDED.address,
      phone = EXCLUDED.phone
  `, [
    clinicId,
    "Dhaka Dental Care & Maxillofacial Implant Hospital",
    "dhaka-dental",
    "+880 1711-555DENT",
    "info@dhakadental.com.bd",
    "House #42, Road #7A, Dhanmondi R/A, Dhaka-1209, Bangladesh",
    true,
  ]);
  console.log("✓ Bangladeshi Clinic seeded: Dhaka Dental Care & Maxillofacial Implant Hospital (Dhanmondi, Dhaka)");

  // 2. Create Clinical Doctors & Staff Users
  const demoPasswordHash = await bcrypt.hash("DentAI2026!", 10);
  
  // Dr. Sarah Smith (configured as demo login, Consultant Endodontist)
  await sql.query(`
    INSERT INTO users (id, clinic_id, email, name, password_hash, role, title, specialty, license_number, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = true
  `, [
    "33333333-3333-3333-3333-333333333333",
    clinicId,
    "dr.smith@dentai.com",
    "Dr. Sarah Smith, BDS, FCPS",
    demoPasswordHash,
    "clinic_owner",
    "Dr.",
    "Consultant Dental Surgeon & Endodontics",
    "BMDC-DEN-7842",
    true,
  ]);
  console.log("✓ Doctor user seeded: dr.smith@dentai.com (Dr. Sarah Smith, BDS, FCPS)");

  // Dr. Tanvir Ahmed (Senior Dental Surgeon)
  await sql.query(`
    INSERT INTO users (id, clinic_id, email, name, password_hash, role, title, specialty, license_number, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = true
  `, [
    "55555555-5555-5555-5555-555555555555",
    clinicId,
    "dr.tanvir@dentai.com",
    "Dr. Tanvir Ahmed, BDS (DU), FCPS (Oral Surgery)",
    demoPasswordHash,
    "clinic_owner",
    "Dr.",
    "Oral & Maxillofacial Surgery",
    "BMDC-DEN-5621",
    true,
  ]);
  console.log("✓ Doctor user seeded: dr.tanvir@dentai.com (Dr. Tanvir Ahmed, BDS (DU), FCPS)");

  // Front Desk Receptionist (Rumana Akter)
  await sql.query(`
    INSERT INTO users (id, clinic_id, email, name, password_hash, role, title, specialty, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = true
  `, [
    "44444444-4444-4444-4444-444444444444",
    clinicId,
    "reception@dentai.com",
    "Rumana Akter",
    demoPasswordHash,
    "receptionist",
    "Front Desk",
    "Patient Registration & BDT Billing",
    true,
  ]);
  console.log("✓ Front Desk seeded: reception@dentai.com (Rumana Akter)");

  // 3. Initialize Patient ID Counter
  await sql.query(`
    INSERT INTO patient_id_counters (clinic_id, prefix, current_year, current_month, last_sequence)
    VALUES ($1, 'DENT', 2026, 10, 100)
    ON CONFLICT (clinic_id, prefix, current_year, current_month) DO NOTHING
  `, [clinicId]);

  // 4. Seed Real Bangladeshi Dental Medicines Catalog
  const bdMedicines = require("../lib/medicines-data.json");
  console.log(`Seeding ${bdMedicines.length} real Bangladeshi Dental Medicines into medicines_catalog...`);
  await sql.query(`DELETE FROM medicines_catalog WHERE is_custom_added = false OR is_custom_added IS NULL;`);

  const batchSize = 100;
  for (let i = 0; i < bdMedicines.length; i += batchSize) {
    const chunk = bdMedicines.slice(i, i + batchSize);
    const valuePlaceholders = [];
    const values = [];

    chunk.forEach((m, idx) => {
      const offset = idx * 11;
      valuePlaceholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, true, $${offset + 11})`
      );
      values.push(
        clinicId,
        m.brand_name,
        m.generic_name || null,
        m.strength || null,
        m.dosage_form || "Tablet",
        m.company_name || null,
        m.default_frequency || null,
        m.default_duration || null,
        m.default_timing || null,
        m.category || "General",
        m.notes || null
      );
    });

    const query = `
      INSERT INTO medicines_catalog (
        clinic_id,
        brand_name,
        generic_name,
        strength,
        dosage_form,
        manufacturer,
        default_frequency,
        default_duration,
        default_timing,
        category,
        is_active,
        notes
      )
      VALUES ${valuePlaceholders.join(", ")}
      ON CONFLICT DO NOTHING;
    `;
    await sql.query(query, values);
  }
  console.log(`✓ Seeded ${bdMedicines.length} real Bangladeshi Dental Medicines into medicines_catalog`);

  // 5. Seed Bangladeshi Dental Procedure Catalog in BDT (৳)
  const bdtProcedures = [
    { code: "D0150", title: "Comprehensive Oral Examination & Treatment Planning", cat: "Diagnostic", cost: "800.00" },
    { code: "D0220", title: "Digital Intraoral Periapical (IOPA) Radiograph", cat: "Diagnostic", cost: "400.00" },
    { code: "D0330", title: "Digital Orthopantomogram (OPG) Full Mouth Panoramic", cat: "Diagnostic", cost: "1200.00" },
    { code: "D1110", title: "Ultrasonic Scaling & Polishing (Adult Full Mouth)", cat: "Preventive", cost: "2500.00" },
    { code: "D2391", title: "Composite Resin Aesthetic Restoration (1 Surface)", cat: "Restorative", cost: "1800.00" },
    { code: "D2740", title: "Monolithic High-Strength Zirconia Crown (CAD/CAM)", cat: "Restorative", cost: "12000.00" },
    { code: "D3330", title: "Molar Root Canal Treatment (Rotary Endodontics, Complete)", cat: "Endodontics", cost: "8500.00" },
    { code: "D4341", title: "Deep Periodontal Scaling & Root Planing (Per Quadrant)", cat: "Periodontics", cost: "2200.00" },
    { code: "D6010", title: "Endosteal Dental Implant Surgical Placement (Titanium Body)", cat: "Implantology", cost: "65000.00" },
    { code: "D7140", title: "Simple Extraction of Erupted Tooth", cat: "Oral Surgery", cost: "1500.00" },
    { code: "D7210", title: "Surgical Extraction / Impaction Removal (Wisdom Tooth)", cat: "Oral Surgery", cost: "6500.00" },
  ];

  for (const p of bdtProcedures) {
    await sql.query(`
      INSERT INTO dental_procedures_catalog (clinic_id, cdt_code, title, category, standard_fee, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT DO NOTHING
    `, [clinicId, p.code, p.title, p.cat, p.cost]);
  }
  console.log(`✓ Seeded ${bdtProcedures.length} Dental Procedures in BDT (৳) into catalog`);

  // 6. Seed Bangladeshi Dummy Patients
  const bdPatients = [
    {
      id: "66666666-0001-0000-0000-000000000001",
      customId: "DENT-2026-00042",
      firstName: "Anika",
      lastName: "Tabassum",
      phone: "+880 1712-345678",
      gender: "female",
      dob: "1992-10-14",
      address: "House 42, Road 7A, Dhanmondi R/A, Dhaka-1209",
      city: "Dhaka",
      bloodGroup: "O+",
      alerts: ["Penicillin Allergy"],
      status: "in_treatment",
      balance: "1200.00",
    },
    {
      id: "66666666-0002-0000-0000-000000000002",
      customId: "DENT-2026-00089",
      firstName: "Mohammad",
      lastName: "Tariqul Islam",
      phone: "+880 1819-876543",
      gender: "male",
      dob: "1988-06-21",
      address: "Plot 18, Block D, Mirpur-10, Dhaka-1216",
      city: "Dhaka",
      bloodGroup: "B+",
      alerts: [],
      status: "active",
      balance: "0.00",
    },
    {
      id: "66666666-0003-0000-0000-000000000003",
      customId: "DENT-2026-00104",
      firstName: "Nusrat",
      lastName: "Parveen",
      phone: "+880 1914-112233",
      gender: "female",
      dob: "1998-03-15",
      address: "Road 11, Block C, Banani, Dhaka-1213",
      city: "Dhaka",
      bloodGroup: "A+",
      alerts: ["Hypertension"],
      status: "new",
      balance: "500.00",
    },
    {
      id: "66666666-0004-0000-0000-000000000004",
      customId: "DENT-2026-00122",
      firstName: "Kazi Nazrul",
      lastName: "Haque",
      phone: "+880 1611-998877",
      gender: "male",
      dob: "1972-11-04",
      address: "Sector 7, Road 3, Uttara, Dhaka-1230",
      city: "Dhaka",
      bloodGroup: "AB+",
      alerts: ["Diabetic Type 2"],
      status: "in_treatment",
      balance: "4500.00",
    },
  ];

  for (const pt of bdPatients) {
    await sql.query(`
      INSERT INTO patients (id, clinic_id, custom_patient_id, first_name, last_name, phone, gender, date_of_birth, address, city, blood_group, medical_alerts, status, outstanding_balance)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        outstanding_balance = EXCLUDED.outstanding_balance
    `, [
      pt.id,
      clinicId,
      pt.customId,
      pt.firstName,
      pt.lastName,
      pt.phone,
      pt.gender,
      new Date(pt.dob),
      pt.address,
      pt.city,
      pt.bloodGroup,
      pt.alerts,
      pt.status,
      pt.balance,
    ]);
  }
  console.log(`✓ Seeded ${bdPatients.length} Bangladeshi Patients into patients table`);

  console.log("\n=== BANGLADESHI CLINICAL DATA SEEDED SUCCESSFULLY! ===");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
