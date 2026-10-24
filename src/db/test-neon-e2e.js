const { config } = require("dotenv");
const { neon } = require("@neondatabase/serverless");

config({ path: ".env.local" });
config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runEndToEndTest() {
  console.log("=== NEON SERVERLESS POSTGRES END-TO-END TEST ===");
  console.log(`Connecting to: ${dbUrl.replace(/:[^:@]+@/, ":***@")}`);

  // 1. Check Postgres Version & Database Info
  const versionRes = await sql.query("SELECT version() as pg_version, current_database() as db, current_user as user");
  console.log("\n[1] Connected successfully to Neon Postgres:");
  console.log(`    Database: ${versionRes[0].db}`);
  console.log(`    User: ${versionRes[0].user}`);
  console.log(`    Version: ${versionRes[0].pg_version}`);

  // 2. Check Database Tables
  const tables = await sql.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(`\n[2] Verified ${tables.length} tables in public schema:`);
  console.log(tables.map((t) => t.table_name).join(", "));

  // 3. Test Insert & Query
  const testClinicId = "00000000-0000-0000-0000-000000000001";
  console.log("\n[3] Testing Atomic Insert and Query on 'clinics' table...");
  
  await sql.query(`
    INSERT INTO clinics (id, name, slug, phone, email, address, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
  `, [testClinicId, "Apex Dental Specialists", "apex-dental", "+1-555-0199", "admin@apexdental.com", "742 Evergreen Terrace", true]);
  
  const clinicQuery = await sql.query("SELECT id, name, slug, email FROM clinics WHERE id = $1", [testClinicId]);
  console.log("    Retrieved clinic row:", clinicQuery[0]);

  // 4. Test Patient ID sequence counter
  console.log("\n[4] Testing Atomic Patient ID Counter on 'patient_id_counters' table...");
  const counterRes = await sql.query(`
    INSERT INTO patient_id_counters (clinic_id, prefix, current_year, current_month, last_sequence)
    VALUES ($1, 'PT', 2026, 10, 1)
    ON CONFLICT (clinic_id, prefix, current_year, current_month)
    DO UPDATE SET last_sequence = patient_id_counters.last_sequence + 1
    RETURNING last_sequence;
  `, [testClinicId]);
  console.log(`    Current Sequence for PT-202610: ${counterRes[0].last_sequence}`);

  // 5. Test Patient record insert & select
  const testPatientId = "00000000-0000-0000-0000-000000000002";
  const customId = `PT-202610-${String(counterRes[0].last_sequence).padStart(4, "0")}`;
  console.log(`\n[5] Testing Patient creation with custom ID ${customId}...`);
  await sql.query(`
    INSERT INTO patients (id, clinic_id, custom_patient_id, first_name, last_name, phone, gender, date_of_birth, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name
  `, [testPatientId, testClinicId, customId, "Eleanor", "Vance", "+1-555-0144", "female", new Date("1992-04-15"), "active"]);

  const patientQuery = await sql.query("SELECT id, custom_patient_id, first_name, last_name, phone, status FROM patients WHERE id = $1", [testPatientId]);
  console.log("    Retrieved patient row:", patientQuery[0]);

  // Clean up test data
  console.log("\n[6] Cleaning up test records...");
  await sql.query("DELETE FROM patients WHERE id = $1", [testPatientId]);
  await sql.query("DELETE FROM patient_id_counters WHERE clinic_id = $1", [testClinicId]);
  await sql.query("DELETE FROM clinics WHERE id = $1", [testClinicId]);
  console.log("    Cleanup complete!");

  console.log("\n=== ALL NEON END-TO-END TESTS PASSED SUCCESSFULLY! ===");
}

runEndToEndTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
