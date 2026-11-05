CREATE TABLE IF NOT EXISTS "booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"reference" varchar(20) NOT NULL,
	"patient_name" varchar(150) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(150),
	"service" varchar(200) NOT NULL,
	"preferred_date" varchar(10) NOT NULL,
	"preferred_time" varchar(10) NOT NULL,
	"health_notes" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"imported_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medicines_catalog" ALTER COLUMN "dosage_form" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "prescription_items" ALTER COLUMN "dosage_form" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "medicines_catalog" ADD COLUMN IF NOT EXISTS "manufacturer" varchar(255);--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_requests_clinic_status_idx" ON "booking_requests" USING btree ("clinic_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_requests_phone_idx" ON "booking_requests" USING btree ("phone");