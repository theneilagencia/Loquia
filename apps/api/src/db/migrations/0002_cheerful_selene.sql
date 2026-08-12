ALTER TABLE "ai_packs" ADD COLUMN "workspace_id" text;--> statement-breakpoint
ALTER TABLE "ai_packs" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_packs" ADD COLUMN "is_current" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_packs" ADD COLUMN "status" text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_packs" ADD COLUMN "output_language" text DEFAULT 'pt-BR' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_packs" ADD COLUMN "provider" text DEFAULT 'demo' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_packs" ADD COLUMN "prompt_version" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_packs" ADD COLUMN "schema_version" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_packs" ADD COLUMN "generation_key" text;--> statement-breakpoint
ALTER TABLE "ai_packs" ADD COLUMN "metrics" jsonb;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "ai_pack_status" text DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
CREATE INDEX "ai_packs_meeting_idx" ON "ai_packs" USING btree ("meeting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_packs_current_idx" ON "ai_packs" USING btree ("meeting_id") WHERE "ai_packs"."is_current";--> statement-breakpoint
CREATE UNIQUE INDEX "ai_packs_generation_key_idx" ON "ai_packs" USING btree ("meeting_id","generation_key") WHERE "ai_packs"."generation_key" is not null;