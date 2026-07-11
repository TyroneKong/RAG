"use server";

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from "@/lib/db/schema/resources";
import { db } from "../db";
import { generateEmbeddings } from "../ai/embedding";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { ollama } from "ai-sdk-ollama";
import { embed } from "ai";

const embeddingModel = ollama.embedding("nomic-embed-text");

export const createResource = async (input: NewResourceParams) => {
  try {
    console.log("📥 [1/4] Server action invoked with input:", input);
    const { content } = insertResourceSchema.parse(input);

    console.log("💾 [2/4] Inserting row into 'resources' table...");
    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning();
    console.log("✅ Resource created with ID:", resource.id);

    console.log("🧬 [3/4] Calling generateEmbeddings via Ollama...");
    const embeddings = await generateEmbeddings(content);
    console.log(
      `✅ Generated ${embeddings.length} embedding chunk(s). Data payload sample:`,
      embeddings[0],
    );

    console.log("🗄️ [4/4] Writing chunks to 'embeddings' table...");
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        ...embedding,
      })),
    );
    console.log("🎉 SUCCESS: All steps completed!");

    return "Resource successfully created and embedded.";
  } catch (error) {
    // FIX: Force print the exact runtime failure directly to your terminal logs!
    console.error("❌ CRITICAL FAILURE IN EMBEDDING PIPELINE:", error);

    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};

export const findRelevantContent = async (userQuery: string) => {
  // 1. Turn the user's plain text question into a vector embedding
  const { embedding } = await embed({
    model: embeddingModel,
    value: userQuery,
  });

  // 2. Compute the similarity score (1 - cosine distance)
  const similarity = sql<number>`1 - (${cosineDistance(embeddingsTable.embedding, embedding)})`;

  // 3. Query the DB for the closest matches
  const similarGuides = await db
    .select({ name: embeddingsTable.content, similarity })
    .from(embeddingsTable)
    .where(gt(similarity, 0.5)) // Only get results that are somewhat relevant
    .orderBy((t) => desc(t.similarity))
    .limit(4);

  return similarGuides;
};
