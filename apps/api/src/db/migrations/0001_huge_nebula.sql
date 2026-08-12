CREATE TABLE "media_assets" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"meeting_id" text NOT NULL,
	"storage_provider" text NOT NULL,
	"bucket" text NOT NULL,
	"object_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer,
	"duration_ms" integer,
	"status" text DEFAULT 'pending_upload' NOT NULL,
	"sha256" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uploaded_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "detected_language" text;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD COLUMN "media_asset_id" text;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD COLUMN "provider_request_id" text;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD COLUMN "metrics" jsonb;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD COLUMN "workspace_id" text;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD COLUMN "sequence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD COLUMN "start_ms" integer;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD COLUMN "end_ms" integer;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD COLUMN "confidence" text;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD COLUMN "edited_by" text;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_meeting_idx" ON "media_assets" USING btree ("meeting_id");