/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { notes, tasks, projects, events, clients } from "@/db/schema";
import { desc, like, eq, and, gte, lte, sql } from "drizzle-orm";

// --- Tool Definitions (OpenAI Format) ---

const tools = [
  {
    type: "function",
    function: {
      name: "searchNotes",
      description: "Search for notes by title or content. Use this to find information in the user's notebook.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listTasks",
      description: "List recent tasks or todos.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["task", "in_progress", "completed"], description: "Filter by status" },
          limit: { type: "integer", description: "Number of tasks to return (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createNote",
      description: "Create a new note in the database.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title of the note" },
          content: { type: "string", description: "The content/body of the note" },
          tags: { type: "string", description: "Comma separated tags" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createTask",
      description: "Create a new task in the database.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The name of the task" },
          description: { type: "string", description: "Description" },
          dueDate: { type: "string", description: "Due date (YYYY-MM-DD)" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getNote",
      description: "Get full details of a specific note by ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "integer", description: "The ID of the note" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTask",
      description: "Get full details of a specific task by ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "integer", description: "The ID of the task" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listProjects",
      description: "List projects with optional filtering.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["planning", "in_progress", "completed", "on_hold"], description: "Filter by status" },
          limit: { type: "integer", description: "Number of projects to return (default 10)" },
          name: { type: "string", description: "Filter by project name (partial match)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProject",
      description: "Get full details of a specific project by ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "integer", description: "The ID of the project" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listEvents",
      description: "List calendar events for a specific date range.",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", description: "Start date (ISO string)" },
          end: { type: "string", description: "End date (ISO string)" },
        },
        required: ["start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchClients",
      description: "Search for clients by name.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The client name to search for" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getStats",
      description: "Get high-level statistics about the user's data (counts of notes, tasks, projects).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

// --- Helper Functions ---

async function executeTool(name: string, args: any) {
  console.log(`Executing tool: ${name}`, args);
  try {
    if (name === "searchNotes") {
      const results = await db.select().from(notes)
        .where(like(notes.title, `%${args.query}%`))
        .limit(10);
      return { notes: results };
    }
    
    if (name === "getNote") {
      const result = await db.select().from(notes).where(eq(notes.id, args.id)).limit(1);
      return result[0] || { error: "Note not found" };
    }

    if (name === "listTasks") {
      let query: any = db.select().from(tasks).orderBy(desc(tasks.createdAt));
      if (args.status) {
        query = query.where(eq(tasks.status, args.status));
      }
      const results = await query.limit(args.limit || 10);
      return { tasks: results };
    }

    if (name === "getTask") {
      const result = await db.select().from(tasks).where(eq(tasks.id, args.id)).limit(1);
      return result[0] || { error: "Task not found" };
    }

    if (name === "createNote") {
      const [newNote] = await db.insert(notes).values({
        title: args.title,
        content: args.content,
        tags: args.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();
      return { success: true, note: newNote };
    }

    if (name === "createTask") {
      const [newTask] = await db.insert(tasks).values({
        name: args.name,
        description: args.description,
        dueDate: args.dueDate,
        priority: args.priority || "medium",
        status: "task",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();
      return { success: true, task: newTask };
    }

    if (name === "listProjects") {
      let query = db.select().from(projects).orderBy(desc(projects.createdAt));
      const conditions = [];
      
      if (args.status) {
        conditions.push(eq(projects.status, args.status));
      }
      if (args.name) {
        conditions.push(like(projects.name, `%${args.name}%`));
      }
      
      if (conditions.length > 0) {
        // @ts-expect-error - Drizzle and/or types issue with spread
        query = query.where(and(...conditions));
      }
      
      const results = await query.limit(args.limit || 10);
      return { projects: results };
    }

    if (name === "getProject") {
      const project = await db.select().from(projects).where(eq(projects.id, args.id)).limit(1);
      if (!project.length) return { error: "Project not found" };
      
      // Fetch related tasks
      const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, args.id));
      
      return { project: project[0], tasks: projectTasks };
    }

    if (name === "listEvents") {
      const results = await db.select().from(events)
        .where(
          and(
            gte(events.start, args.start),
            lte(events.end, args.end)
          )
        )
        .orderBy(events.start);
      return { events: results };
    }

    if (name === "searchClients") {
      const results = await db.select().from(clients)
        .where(like(clients.companyName, `%${args.name}%`))
        .limit(5);
      return { clients: results };
    }

    if (name === "getStats") {
      const [noteCount] = await db.select({ count: sql<number>`count(*)` }).from(notes);
      const [taskCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks);
      const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(projects);
      
      return {
        notes: noteCount.count,
        tasks: taskCount.count,
        projects: projectCount.count
      };
    }

    return { error: "Unknown tool" };
  } catch (e: unknown) {
    console.error("Tool execution error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return { error: errorMessage };
  }
}

// --- Main Handler ---

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
    }

    const model = "openai/gpt-oss-20b";
    const baseUrl = "https://api.groq.com/openai/v1/chat/completions";

    const messages: any[] = [
      {
        role: "system",
        content: "You are a helpful assistant for a markdown note-taking app. You have access to the user's database to search notes and tasks. Always check the database before saying you don't know."
      },
      {
        role: "assistant",
        content: "Understood. I am ready to help you manage your notes and tasks using your database."
      },
      {
        role: "user",
        content: message
      }
    ];

    const MAX_TURNS = 5;
    let currentTurn = 0;

    while (currentTurn < MAX_TURNS) {
      console.log(`Turn ${currentTurn + 1}: Sending request to Groq...`);

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          tools: tools,
          tool_choice: "auto",
          stream: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalContent = "";
      const toolCallsMap: Record<number, any> = {};
      let currentToolCallIndex: number | null = null;

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              const delta = json.choices[0].delta;

              if (delta.content) {
                finalContent += delta.content;
              }

              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (tc.index !== undefined && tc.index !== null) {
                    const idx = tc.index;
                    currentToolCallIndex = idx;
                    if (!toolCallsMap[idx]) {
                      toolCallsMap[idx] = {
                        id: tc.id,
                        type: tc.type,
                        function: { name: "", arguments: "" }
                      };
                    }
                  }
                  
                  if (currentToolCallIndex !== null) {
                     if (tc.id) toolCallsMap[currentToolCallIndex].id = tc.id;
                     if (tc.function?.name) toolCallsMap[currentToolCallIndex].function.name += tc.function.name;
                     if (tc.function?.arguments) toolCallsMap[currentToolCallIndex].function.arguments += tc.function.arguments;
                  }
                }
              }
            } catch (e) {
              console.error("Error parsing stream chunk:", e);
            }
          }
        }
      }

      const toolCalls = Object.values(toolCallsMap);

      // If no tool calls, we are done. Return the content.
      if (toolCalls.length === 0) {
         // Re-stream to client? Or just return JSON?
         // The client expects a stream. Let's create a simple stream.
         const stream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(finalContent));
              controller.close();
            }
         });
         return new NextResponse(stream);
      }

      // Handle tool calls
      console.log(`Received ${toolCalls.length} tool calls`);
      
      // Add assistant message with tool calls to history
      messages.push({
        role: "assistant",
        content: finalContent || null,
        tool_calls: toolCalls
      });

      // Execute tools
      for (const tc of toolCalls) {
        const functionName = tc.function.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(tc.function.arguments);
        } catch (e) {
          console.error("Failed to parse function arguments:", e);
        }

        const result = await executeTool(functionName, functionArgs);

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: functionName,
          content: JSON.stringify(result)
        });
      }

      currentTurn++;
    }

    return NextResponse.json({ error: "Too many turns" }, { status: 500 });

  } catch (error: unknown) {
    console.error("Error in assistant API:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
