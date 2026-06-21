-- CreateTable
CREATE TABLE "VideoTranscript" (
    "video_key" TEXT NOT NULL,
    "text" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoTranscript_pkey" PRIMARY KEY ("video_key")
);
