-- Video Jobs Database Migration for V2V (Video-to-Video) functionality
-- Run this in your Supabase SQL editor

-- 1) Job status enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('queued','running','succeeded','failed','canceled');
  END IF;
END $$;

-- 2) video_jobs table
CREATE TABLE IF NOT EXISTS public.video_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  source_url        text NOT NULL,          -- Cloudinary video URL
  prompt            text,
  model             text,                   -- e.g., "flux/dev/video-to-video"
  strength          numeric,
  num_inference_steps int,
  guidance_scale    numeric,
  seed              bigint,
  fps               int,
  width             int,
  height            int,
  duration_ms       int,
  allow_remix       boolean DEFAULT false,
  visibility        text DEFAULT 'private' CHECK (visibility in ('private','public')),
  provider_job_id   text,
  provider_name     text DEFAULT 'aimlapi',
  status            job_status NOT NULL DEFAULT 'queued',
  result_url        text,                   -- final CDN video
  error             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 3) indexes
CREATE INDEX IF NOT EXISTS video_jobs_user_created_idx ON public.video_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS video_jobs_status_idx       ON public.video_jobs (status);

-- 4) RLS
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_jobs' AND policyname='video_jobs_select_own'
  ) THEN
    CREATE POLICY video_jobs_select_own
      ON public.video_jobs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_jobs' AND policyname='video_jobs_insert_own'
  ) THEN
    CREATE POLICY video_jobs_insert_own
      ON public.video_jobs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_jobs' AND policyname='video_jobs_update_service'
  ) THEN
    -- Worker (service role) updates: handled by service role, so allow all; RLS bypassed by service role anyway.
    CREATE POLICY video_jobs_update_service
      ON public.video_jobs FOR UPDATE
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5) Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='tr_video_jobs_touch'
  ) THEN
    CREATE TRIGGER tr_video_jobs_touch
    BEFORE UPDATE ON public.video_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

-- 6) Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;
