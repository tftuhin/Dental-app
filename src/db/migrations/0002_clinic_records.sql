CREATE SEQUENCE "public"."clinic_records_version_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "clinic_records" (
	"clinic_id" uuid NOT NULL,
	"collection" varchar(80) NOT NULL,
	"record_id" varchar(200) NOT NULL,
	"data" json,
	"pos" double precision DEFAULT 0 NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"version" bigint NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clinic_records_clinic_id_collection_record_id_pk" PRIMARY KEY("clinic_id","collection","record_id")
);
--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "ip_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "clinic_records" ADD CONSTRAINT "clinic_records_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clinic_records_clinic_version_idx" ON "clinic_records" USING btree ("clinic_id","version");--> statement-breakpoint
CREATE INDEX "booking_requests_ip_created_idx" ON "booking_requests" USING btree ("ip_hash","created_at");--> statement-breakpoint
-- Older references were random and could repeat: give any repeats a suffix so the unique index can be built
UPDATE "booking_requests" b SET "reference" = b."reference" || '-' || d.rn
FROM (
	SELECT "id", row_number() OVER (PARTITION BY "reference" ORDER BY "created_at") AS rn
	FROM "booking_requests"
) d
WHERE b."id" = d."id" AND d.rn > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_requests_reference_idx" ON "booking_requests" USING btree ("reference");