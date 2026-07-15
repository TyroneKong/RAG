CREATE TABLE IF NOT EXISTS "embeddings" (
	"id" varchar(191) PRIMARY KEY,
	"resource_id" varchar(191),
	"content" text NOT NULL,
	"embedding" vector(768) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
	"id" varchar(191) PRIMARY KEY,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"age" integer,
	"email" varchar(255) NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_age_check" CHECK ("age" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddingIndex" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_resource_id_resources_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE;