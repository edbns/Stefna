-- CreateTable
CREATE TABLE "public"."neo_glitch_media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "neo_glitch_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "neo_glitch_media_run_id_key" ON "public"."neo_glitch_media"("run_id");

-- CreateIndex
CREATE INDEX "neo_glitch_media_user_id_created_at_idx" ON "public"."neo_glitch_media"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "neo_glitch_media_status_idx" ON "public"."neo_glitch_media"("status");

-- CreateIndex
CREATE INDEX "neo_glitch_media_preset_idx" ON "public"."neo_glitch_media"("preset");

-- AddForeignKey
ALTER TABLE "public"."neo_glitch_media" ADD CONSTRAINT "neo_glitch_media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
