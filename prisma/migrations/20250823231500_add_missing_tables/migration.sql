-- Add auth_otps table for OTP verification
CREATE TABLE "public"."auth_otps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used" BOOLEAN DEFAULT false,

    CONSTRAINT "auth_otps_pkey" PRIMARY KEY ("id")
);

-- Create index on email for faster lookups
CREATE INDEX "auth_otps_email_idx" ON "public"."auth_otps"("email");

-- Create index on code for OTP verification
CREATE INDEX "auth_otps_code_idx" ON "public"."auth_otps"("code");

-- Create index on expires_at for cleanup operations
CREATE INDEX "auth_otps_expires_at_idx" ON "public"."auth_otps"("expires_at");

-- Add user_credits table for credit management
CREATE TABLE "public"."user_credits" (
    "user_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_credits_pkey" PRIMARY KEY ("user_id")
);

-- Add app_config table for application configuration
CREATE TABLE "public"."app_config" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
);

-- Insert default app configuration values
INSERT INTO "public"."app_config" ("key", "value") VALUES
    ('starter_grant', '30'),
    ('referral_referrer_bonus', '50'),
    ('referral_new_bonus', '25');

-- Add referral_signups table for referral tracking
CREATE TABLE "public"."referral_signups" (
    "id" TEXT NOT NULL,
    "referrer_user_id" TEXT NOT NULL,
    "new_user_id" TEXT NOT NULL,
    "referrer_email" TEXT,
    "new_user_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_signups_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on new_user_id
CREATE UNIQUE INDEX "referral_signups_new_user_id_key" ON "public"."referral_signups"("new_user_id");

-- Add neo_glitch_media table for Neo Glitch functionality
CREATE TABLE "public"."neo_glitch_media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "stability_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "neo_glitch_media_pkey" PRIMARY KEY ("id")
);

-- Create indexes for neo_glitch_media
CREATE UNIQUE INDEX "neo_glitch_media_run_id_key" ON "public"."neo_glitch_media"("run_id");
CREATE INDEX "neo_glitch_media_user_id_created_at_idx" ON "public"."neo_glitch_media"("user_id", "created_at" DESC);
CREATE INDEX "neo_glitch_media_status_idx" ON "public"."neo_glitch_media"("status");
CREATE INDEX "neo_glitch_media_preset_idx" ON "public"."neo_glitch_media"("preset");
CREATE INDEX "neo_glitch_media_stability_job_id_idx" ON "public"."neo_glitch_media"("stability_job_id");

-- Add foreign key constraints
ALTER TABLE "public"."user_credits" ADD CONSTRAINT "user_credits_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."referral_signups" ADD CONSTRAINT "referral_signups_referrer_user_id_fkey" 
    FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."referral_signups" ADD CONSTRAINT "referral_signups_new_user_id_fkey" 
    FOREIGN KEY ("new_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."neo_glitch_media" ADD CONSTRAINT "neo_glitch_media_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
