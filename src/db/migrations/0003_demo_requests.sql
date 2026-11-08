CREATE TABLE "demo_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"clinic_name" varchar(200),
	"phone" varchar(30) NOT NULL,
	"email" varchar(150),
	"city" varchar(100),
	"chairs" varchar(20),
	"interest" varchar(30),
	"preferred_contact" varchar(20),
	"message" text,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"ip_hash" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "demo_requests_status_idx" ON "demo_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "demo_requests_ip_idx" ON "demo_requests" USING btree ("ip_hash","created_at");