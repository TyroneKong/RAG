# local-ai-db-explorer

An enterprise-grade **Generative UI Database Explorer** built with Next.js, the Vercel AI SDK, and Drizzle ORM. 

Instead of relying on hardcoded API routes and static frontend layouts, this application leverages a local **Llama 3.1** model running via **Ollama** as an intelligent orchestrator. The AI dynamically translates plain English user intent into type-safe database actions, inspects schema metadata in-memory to prevent injection attacks, and streams raw database payloads directly into dynamically generated **TanStack Table** views.

---

## 🚀 Key Features

*   **Dynamic Intent Routing:** Uses semantic tool-calling to automatically map conversational queries (e.g., *"Show me who registered today"*) to specific runtime execution contexts without explicit frontend routing logic.
*   **In-Memory Schema Validation:** Bypasses dangerous raw string queries and system catalog scans by validating inputs directly against compile-time Drizzle ORM schema primitives.
*   **Generative UI Engine:** Intercepts JSON tool payloads directly within a `UIMessageStream` pipeline to seamlessly mount complex data tables into the chat stream on the fly.
*   **Zero-Config Dynamic Tables:** Automatically extracts runtime object keys from arbitrary table datasets to render fully-responsive headless tables using TanStack Table.

---

## 🛠️ Architecture Blueprint

```
[ User Chat Input ]
        │
        ▼
[ Next.js API Route (POST) ] ──(System Prompt Guardrails)
        │
        ▼
[ Vercel AI SDK + Ollama (Llama 3.1) ] 
        │
        ├──► [ Tool Call: getSchema({ tableName }) ]
        │          │
        │          ▼ (Validation)
        │    Inspects Drizzle Schema Map (e.g., `schema.usersTable`)
        │          │
        │          ▼ (Type-Safe Query)
        │    `db.select().from(targetTable)`
        │
        ▼
[ UIMessageStream Response ] ──(Streaming Chunk Delivery)
        │
        ▼
[ React Client Component ]
        │
        ▼ (Type Guard: part.type === 'tool-getSchema')
[ Headless TanStack Table ] ──► Dynamically extracts object keys as headers
```

---

## 📦 Tech Stack

*   **Framework:** Next.js (App Router)
*   **AI Engine:** Ollama (`llama3.1`)
*   **AI Orchestration:** Vercel AI SDK Core & UI Stream Specifications (`UIMessage`)
*   **Database ORM:** Drizzle ORM (PostgreSQL)
*   **UI Framework:** Tailwind CSS, TypeScript
*   **Data Table:** `@tanstack/react-table`

---

## 🚦 Getting Started

### Prerequisites

1.  **Ollama Engine:** Ensure Ollama is installed and running locally.
    ```bash
    ollama run llama3.1
    ```
2.  **PostgreSQL Instance:** A running Postgres instance configured with your schema.

### Installation

1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```

2. Configure your environment variables in a `.env.local` file:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/your-db
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

---

## 💻 Core Implementation Details

### Secure Backend Tool Definition
The `getSchema` tool dynamically matches user requests against valid Drizzle exports, shielding system catalogs from prompt injection vectors:

```typescript
// app/api/chat/route.ts
import { streamText, tool } from 'ai';
import { createOllama } from '@ai-sdk/ollama';
import { getColumns } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { db } from '@/db';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: createOllama()('llama3.1'),
    messages,
    system: "You are a database administrator. Use tools to fetch requested structural elements.",
    tools: {
      getSchema: tool({
        description: 'Fetch structural layouts and records for an explicit table.',
        parameters: z.object({
          tableName: z.string().describe('The database table name targeted by the user.'),
        }),
        execute: async ({ tableName }) => {
          // Resolve internal schema definition using database runtime keys
          const targetTable = Object.values(schema).find(
            (table: any) => table?.tableName === tableName
          );

          if (!targetTable) {
            return { error: `Table '${tableName}' does not exist in the application schema.` };
          }

          // Fetch real rows safely via the validated target object reference
          const rows = await db.select().from(targetTable as any);
          return rows;
        },
      }),
    },
  });

  // Returns fully-typed message structures to the client UI
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
```

### Headless Client-Side Reflection
The client UI maps the returned JSON array dynamically, reading the shape of the data at runtime:

```tsx
// components/dynamic-table.tsx
'use client';

import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

export function DynamicTable({ data }: { data: any[] }) {
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).map((key) => ({
      accessorKey: key,
      header: key.replace(/_/g, ' ').replace(/\w/g, c => c.toUpperCase()),
    }));
  }, [data]);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto border border-slate-800 rounded-lg">
      <table className="w-full text-left text-xs font-mono">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-slate-800 bg-slate-900">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-3 font-semibold text-slate-400">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-900 hover:bg-slate-900/40">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-3 truncate max-w-[200px]">
                  {String(cell.getValue() ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```
<img width="581" height="695" alt="image" src="https://github.com/user-attachments/assets/1f4480a6-a6bf-4fee-80f6-885ba7b0fec5" />


---

## 🔮 Future Enhancements

*   [ ] **Human-in-the-Loop Write Safeguards:** Add an interactive step for mutative tools (`INSERT`/`UPDATE`/`DELETE`) where the LLM produces a change card requiring manual button authorization before hitting Postgres.
*   [ ] **Generative Analytics:** Add a `generateChartData` tool that hooks raw relational payloads directly into beautiful chart layouts (`shadcn/ui` charts / Recharts).
# RAG
