CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('fixed', 'percentage', 'birthday_privilege', 'none');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('xray_iopa', 'xray_opg', 'xray_bitewing', 'xray_cbct', 'lab_report', 'consent_form', 'prescription_pdf', 'invoice_pdf', 'medical_certificate', 'other');--> statement-breakpoint
CREATE TYPE "public"."dosage_form" AS ENUM('tablet', 'capsule', 'syrup', 'oral_rinse', 'topical_gel', 'injection', 'drops', 'inhaler', 'powder', 'other');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."lab_order_status" AS ENUM('pending', 'sent_to_lab', 'in_progress', 'completed', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."patient_status" AS ENUM('active', 'inactive', 'recall_due', 'in_treatment', 'new');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'mobile_money', 'insurance', 'bank_transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."sms_event" AS ENUM('appointment_booked', 'queue_reminder', 'visit_followup', 'missed_appointment', 'next_visit_reminder', 'campaign', 'custom');--> statement-breakpoint
CREATE TYPE "public"."sms_status" AS ENUM('queued', 'sent', 'delivered', 'failed', 'undelivered');--> statement-breakpoint
CREATE TYPE "public"."tooth_notation" AS ENUM('universal', 'fdi');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'clinic_owner', 'dentist', 'hygienist', 'receptionist');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"provider" varchar(100) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(100),
	"scope" varchar(255),
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"scheduled_end_at" timestamp,
	"token_serial" integer,
	"chair" varchar(50),
	"reason" text,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"is_public_booking" boolean DEFAULT false,
	"reminder_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid,
	"actor_id" uuid,
	"actor_email" varchar(255),
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" varchar(255),
	"changes" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinic_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id_pattern" varchar(100) DEFAULT 'DENT-{YYYY}-{SEQ:5}',
	"default_tooth_notation" "tooth_notation" DEFAULT 'universal',
	"primary_color" varchar(7) DEFAULT '#0d9488',
	"accent_color" varchar(7) DEFAULT '#059669',
	"sms_provider" varchar(50),
	"sms_api_key" text,
	"sms_api_secret" text,
	"sms_from_number" varchar(30),
	"sms_enabled" boolean DEFAULT false,
	"ai_provider" varchar(50) DEFAULT 'anthropic',
	"currency" varchar(10) DEFAULT 'USD',
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clinic_settings_clinic_id_unique" UNIQUE("clinic_id")
);
--> statement-breakpoint
CREATE TABLE "clinical_encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"appointment_id" uuid,
	"doctor_id" uuid NOT NULL,
	"encounter_date" timestamp DEFAULT now() NOT NULL,
	"vital_signs" jsonb,
	"chief_complaint" text,
	"symptoms_checklist" jsonb,
	"custom_symptoms" text[],
	"subjective" text,
	"objective" text,
	"assessment" text,
	"plan" text,
	"diagnoses" jsonb,
	"ai_generated_suggestions" jsonb,
	"is_locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"phone" varchar(30),
	"email" varchar(255),
	"address" text,
	"city" varchar(100),
	"country" varchar(100),
	"logo_url" text,
	"letterhead_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clinics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dental_lab_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"lab_name" varchar(255),
	"prosthesis_type" varchar(100),
	"tooth_numbers" text[],
	"shade" varchar(50),
	"material" varchar(100),
	"instructions" text,
	"sent_date" timestamp,
	"expected_return_date" timestamp,
	"actual_return_date" timestamp,
	"lab_fee" numeric(10, 2),
	"status" "lab_order_status" DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dental_procedures_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid,
	"cdt_code" varchar(10),
	"icd10_code" varchar(20),
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"standard_fee" numeric(10, 2) DEFAULT '0',
	"consumables_cost" numeric(10, 2) DEFAULT '0',
	"duration_minutes" integer,
	"is_active" boolean DEFAULT true,
	"is_custom" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"item_type" varchar(50) NOT NULL,
	"procedure_id" uuid,
	"description" varchar(255) NOT NULL,
	"tooth_numbers" text[],
	"cdt_code" varchar(10),
	"quantity" integer DEFAULT 1,
	"unit_price" numeric(10, 2) DEFAULT '0',
	"total_price" numeric(10, 2) DEFAULT '0',
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"invoice_number" varchar(50) NOT NULL,
	"invoice_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0',
	"discount_type" "discount_type" DEFAULT 'none',
	"discount_value" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) DEFAULT '0',
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"due_amount" numeric(10, 2) DEFAULT '0',
	"payment_method" "payment_method",
	"payment_date" timestamp,
	"notes" text,
	"pdf_url" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"issued_by_id" uuid NOT NULL,
	"certificate_type" varchar(50) DEFAULT 'sick_leave',
	"diagnosis_reason" text,
	"recommended_rest_days" integer,
	"leave_start_date" timestamp,
	"leave_end_date" timestamp,
	"remarks" text,
	"fit_to_work" boolean DEFAULT false,
	"pdf_url" text,
	"qr_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicines_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid,
	"brand_name" varchar(255) NOT NULL,
	"generic_name" varchar(255),
	"strength" varchar(100),
	"dosage_form" "dosage_form",
	"default_frequency" varchar(100),
	"default_duration" varchar(100),
	"default_timing" varchar(100),
	"category" varchar(100),
	"is_custom_added" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "odontogram_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"notation" "tooth_notation" DEFAULT 'universal' NOT NULL,
	"chart_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"category" "document_category" NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"tooth_numbers" text[],
	"description" text,
	"uploaded_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_id_counters" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_id" uuid NOT NULL,
	"prefix" varchar(50) NOT NULL,
	"current_year" integer NOT NULL,
	"current_month" integer NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"custom_patient_id" varchar(100),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"date_of_birth" timestamp,
	"gender" varchar(20),
	"phone" varchar(30),
	"phone2" varchar(30),
	"email" varchar(255),
	"address" text,
	"city" varchar(100),
	"occupation" varchar(100),
	"emergency_contact_name" varchar(200),
	"emergency_contact_phone" varchar(30),
	"emergency_contact_relation" varchar(50),
	"blood_group" varchar(10),
	"medical_alerts" text[],
	"current_medications" text,
	"medical_history" text,
	"dental_history" text,
	"status" "patient_status" DEFAULT 'new' NOT NULL,
	"outstanding_balance" numeric(10, 2) DEFAULT '0',
	"tags" text[],
	"next_recall_date" timestamp,
	"referred_by" varchar(200),
	"avatar_url" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "periodontal_charts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"chart_data" jsonb DEFAULT '{}'::jsonb,
	"clinician_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"medicine_id" uuid,
	"brand_name" varchar(255) NOT NULL,
	"generic_name" varchar(255),
	"strength" varchar(100),
	"dosage_form" "dosage_form",
	"frequency" varchar(100),
	"duration" varchar(100),
	"timing" varchar(100),
	"quantity" integer,
	"instructions" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "prescription_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"test_type" varchar(100) NOT NULL,
	"tooth_numbers" text[],
	"indications" text,
	"urgency" varchar(50) DEFAULT 'routine',
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"prescribed_by_id" uuid NOT NULL,
	"prescribed_at" timestamp DEFAULT now() NOT NULL,
	"diagnosis" text,
	"additional_instructions" text,
	"next_follow_up_date" timestamp,
	"pdf_url" text,
	"pdf_hash" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "sms_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"template_id" uuid,
	"message_body" text NOT NULL,
	"audience_filter" jsonb,
	"recipient_count" integer DEFAULT 0,
	"sent_count" integer DEFAULT 0,
	"delivered_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"total_cost" numeric(10, 4) DEFAULT '0',
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"status" varchar(50) DEFAULT 'draft',
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_delivery_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid,
	"campaign_id" uuid,
	"event" "sms_event",
	"to_number" varchar(30) NOT NULL,
	"message_body" text,
	"provider_message_id" varchar(255),
	"status" "sms_status" DEFAULT 'queued',
	"error_message" text,
	"cost" numeric(8, 6),
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"event" "sms_event" NOT NULL,
	"name" varchar(100) NOT NULL,
	"template_body" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"password_hash" text,
	"role" "user_role" DEFAULT 'receptionist' NOT NULL,
	"title" varchar(50),
	"specialty" varchar(100),
	"license_number" varchar(100),
	"phone" varchar(30),
	"avatar_url" text,
	"scanned_signature_url" text,
	"bio" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_settings" ADD CONSTRAINT "clinic_settings_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dental_lab_orders" ADD CONSTRAINT "dental_lab_orders_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dental_lab_orders" ADD CONSTRAINT "dental_lab_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dental_lab_orders" ADD CONSTRAINT "dental_lab_orders_encounter_id_clinical_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."clinical_encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dental_procedures_catalog" ADD CONSTRAINT "dental_procedures_catalog_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_procedure_id_dental_procedures_catalog_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."dental_procedures_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_encounter_id_clinical_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."clinical_encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_issued_by_id_users_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicines_catalog" ADD CONSTRAINT "medicines_catalog_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odontogram_states" ADD CONSTRAINT "odontogram_states_encounter_id_clinical_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."clinical_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odontogram_states" ADD CONSTRAINT "odontogram_states_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_encounter_id_clinical_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."clinical_encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_id_counters" ADD CONSTRAINT "patient_id_counters_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periodontal_charts" ADD CONSTRAINT "periodontal_charts_encounter_id_clinical_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."clinical_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periodontal_charts" ADD CONSTRAINT "periodontal_charts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medicine_id_medicines_catalog_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_tests" ADD CONSTRAINT "prescription_tests_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_encounter_id_clinical_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."clinical_encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_prescribed_by_id_users_id_fk" FOREIGN KEY ("prescribed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_campaigns" ADD CONSTRAINT "sms_campaigns_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_campaigns" ADD CONSTRAINT "sms_campaigns_template_id_sms_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."sms_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_campaigns" ADD CONSTRAINT "sms_campaigns_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_delivery_logs" ADD CONSTRAINT "sms_delivery_logs_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_delivery_logs" ADD CONSTRAINT "sms_delivery_logs_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_delivery_logs" ADD CONSTRAINT "sms_delivery_logs_campaign_id_sms_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."sms_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_templates" ADD CONSTRAINT "sms_templates_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_clinic_idx" ON "appointments" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "appointments_patient_idx" ON "appointments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appointments_doctor_idx" ON "appointments" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "appointments_scheduled_at_idx" ON "appointments" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "audit_clinic_idx" ON "audit_logs" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "encounters_patient_idx" ON "clinical_encounters" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "encounters_clinic_idx" ON "clinical_encounters" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "encounters_date_idx" ON "clinical_encounters" USING btree ("encounter_date");--> statement-breakpoint
CREATE INDEX "procedures_clinic_idx" ON "dental_procedures_catalog" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "procedures_cdt_idx" ON "dental_procedures_catalog" USING btree ("cdt_code");--> statement-breakpoint
CREATE INDEX "invoices_patient_idx" ON "invoices" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "invoices_clinic_idx" ON "invoices" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "invoices_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "medicines_clinic_idx" ON "medicines_catalog" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "medicines_brand_idx" ON "medicines_catalog" USING btree ("brand_name");--> statement-breakpoint
CREATE INDEX "odontogram_encounter_idx" ON "odontogram_states" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "odontogram_patient_idx" ON "odontogram_states" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "documents_patient_idx" ON "patient_documents" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "documents_clinic_idx" ON "patient_documents" USING btree ("clinic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_id_counters_unique" ON "patient_id_counters" USING btree ("clinic_id","prefix","current_year","current_month");--> statement-breakpoint
CREATE INDEX "patients_clinic_id_idx" ON "patients" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "patients_custom_id_idx" ON "patients" USING btree ("custom_patient_id");--> statement-breakpoint
CREATE INDEX "patients_phone_idx" ON "patients" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "patients_clinic_custom_id_unique" ON "patients" USING btree ("clinic_id","custom_patient_id");--> statement-breakpoint
CREATE INDEX "perio_encounter_idx" ON "periodontal_charts" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "prescriptions_patient_idx" ON "prescriptions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "prescriptions_clinic_idx" ON "prescriptions" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "sms_logs_clinic_idx" ON "sms_delivery_logs" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "sms_logs_patient_idx" ON "sms_delivery_logs" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "sms_logs_campaign_idx" ON "sms_delivery_logs" USING btree ("campaign_id");