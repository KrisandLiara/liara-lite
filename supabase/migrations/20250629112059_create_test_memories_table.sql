CREATE TABLE "public"."test_memories" (
    "id" uuid NOT NULL,
    "content" text,
    "embedding" vector(1536),
    "importance" real,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" uuid NOT NULL,
    "related_to" uuid[],
    "source" text,
    "model_version" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone,
    "summary" text,
    "topic" text,
    "sentiment" text,
    "type" text,
    "source_type" text,
    "tags" text[],
    "pinned" boolean,
    "reference_links" text[],
    "reference_to" uuid,
    "role" text,
    "create_time" timestamp with time zone,
    "message_id" uuid,
    "parent_id" uuid,
    "conversation_title" text,
    "conversation_start_time" timestamp with time zone,
    "source_chat_id" uuid
);

ALTER TABLE "public"."test_memories" OWNER TO "postgres";

ALTER TABLE ONLY "public"."test_memories"
    ADD CONSTRAINT "test_memories_pkey" PRIMARY KEY (id);
