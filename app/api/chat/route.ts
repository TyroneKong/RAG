import { createResource, findRelevantContent } from "@/lib/actions/resources";
import { z } from "zod";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  tool,
  toUIMessageStream,
  UIMessage,
} from "ai";
import { ollama, streamText } from "ai-sdk-ollama";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import * as usersSchema from "@/lib/db/schema/users";
import * as resourcesSchema from "@/lib/db/schema/resources";
import * as embeddingsSchema from "@/lib/db/schema/embeddings";
import { db } from "@/lib/db";

// Map keyed by the actual SQL table name ("users", "resources", "embeddings")
// so the LLM can reference tables by their real names instead of JS export
// symbols (e.g. "usersTable").
const tables: Record<string, PgTable> = Object.fromEntries(
  (
    [
      ...Object.values(usersSchema),
      ...Object.values(resourcesSchema),
      ...Object.values(embeddingsSchema),
    ] as unknown[]
  )
    .filter((v): v is PgTable => is(v, PgTable))
    .map((t) => [getTableName(t), t]),
);
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await streamText({
    model: ollama("llama3.1") as any,
    messages: await convertToModelMessages(messages),
    system:
      "You are a helpful assistant. Always check your knowledge base before answering questions. Only respond to questions using tool calls, if no relevant information is found in the tool calls, respond sorry Tyrone I dont know the answer to that question.",
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe("the content or resource to add to the knowledge base"),
        }),
        execute: async ({ content }) => {
          console.log("🚀 AGENT EXECUTING DB SAVE:", content);
          try {
            await createResource({ content });
            return `Successfully saved information: "${content}" to your knowledge base.`;
          } catch (err) {
            console.error("❌ DB Insert Failed:", err);
            return "Error: Failed to save to database.";
          }
        },
      }),

      // 👇 ADD THIS TOOL TO READ FROM THE DATABASE
      getInformation: tool({
        description: `Call this tool when asked for preferences or personal data.`,
        inputSchema: z.object({
          question: z
            .string()
            .describe(
              "the user's question to search for in the knowledge base",
            ),
        }),
        execute: async ({ question }) => {
          try {
            // 1. Generate an embedding for the incoming 'question'
            // 2. Query your database using vector similarity (e.g., cosine similarity)
            // 3. Return the text content of the closest match

            const content = await findRelevantContent(question);
            return content;
          } catch (err) {
            console.error("Vector search failed:", err);
            return "Could not find any relevant information.";
          }
        },
      }),
      getSchema: tool({
        description:
          "Call this tool when the user asks to view, inspect, read or show a row/columns in a table. Do not use this tool for general questions",
        inputSchema: z.object({
          tableName: z
            .string()
            .describe("The validated name of the database table to query"),
        }),
        execute: async ({ tableName }) => {
          const targetTable = tables[tableName];
          if (!targetTable) {
            return {
              error: `Table ${tableName} does not exist. Available tables: ${Object.keys(tables).join(", ")}`,
            };
          }
          return await db.select().from(targetTable);
        },
      }),
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
