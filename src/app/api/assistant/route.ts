/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getAggregatedDashboardData } from "@/app/lib/dashboard-actions";
import { getTasks } from "@/app/tasks/actions";
import { getNotes } from "@/app/notes/actions";
import { getProjects } from "@/app/projects/actions";
import { getEvents } from "@/app/calendar/actions";
import { getClients } from "@/app/clients/actions";


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
  {
    type: "function",
    function: {
      name: "displayTasks",
      description: "Display tasks as interactive cards. Use this when the user asks to see their tasks.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["task", "in_progress", "completed"], description: "Filter by status" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Filter by priority" },
          limit: { type: "integer", description: "Number of tasks to display (default 5, max 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "displayNotes",
      description: "Display notes as interactive cards. Use this when the user asks to see their notes.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer", description: "Number of notes to display (default 5, max 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "displayEvents",
      description: "Display calendar events as interactive cards. Use this when the user asks about their schedule or calendar.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer", description: "Number of events to display (default 5, max 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "displayProjects",
      description: "Display projects as interactive cards. Use this when the user asks about their projects.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["planning", "in_progress", "completed", "on_hold"], description: "Filter by status" },
          limit: { type: "integer", description: "Number of projects to display (default 5, max 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "displayStats",
      description: "Display statistics and metrics. Use this when the user asks about productivity, task counts, or overview.",
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
      const notes = await getNotes(50);
      const query = args.query.toLowerCase();
      const filtered = notes.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.content.toLowerCase().includes(query)
      );
      return { notes: filtered.slice(0, 10) };
    }
    
    if (name === "getNote") {
      const notes = await getNotes(500);
      const note = notes.find(n => n.id === args.id);
      return note ? { note } : { error: "Note not found" };
    }

    if (name === "listTasks") {
      const tasks = await getTasks(undefined, args.priority, args.status, undefined, args.limit || 10);
      return { tasks };
    }

    if (name === "getTask") {
      const tasks = await getTasks(undefined, undefined, undefined, undefined, 500);
      const task = tasks.find(t => t.id === args.id);
      return task ? { task } : { error: "Task not found" };
    }

    if (name === "createNote") {
      return { success: true, message: "Use the UI to finalize note creation.", note: { ...args } };
    }

    if (name === "createTask") {
      return { success: true, message: "Use the UI to finalize task creation.", task: { ...args, status: "task" } };
    }

    if (name === "listProjects") {
      const allProjects = await getProjects();
      let filtered = allProjects;
      if (args.status) filtered = filtered.filter(p => p.status === args.status);
      if (args.name) filtered = filtered.filter(p => p.name.toLowerCase().includes(args.name.toLowerCase()));
      return { projects: filtered.slice(0, args.limit || 10) };
    }

    if (name === "getProject") {
      const allProjects = await getProjects();
      const project = allProjects.find(p => p.id === args.id);
      return project ? { project } : { error: "Project not found" };
    }

    if (name === "listEvents") {
      const allEvents = await getEvents();
      const start = new Date(args.start);
      const end = new Date(args.end);
      const filtered = allEvents.filter(e => {
        const eStart = new Date(e.start);
        return eStart >= start && eStart <= end;
      });
      return { events: filtered };
    }

    if (name === "searchClients") {
      const clients = await getClients();
      const query = args.name.toLowerCase();
      const filtered = clients.filter(c => 
        c.companyName.toLowerCase().includes(query) ||
        (c.contactPersonName && c.contactPersonName.toLowerCase().includes(query))
      );
      return { clients: filtered.slice(0, 10) };
    }

    if (name === "getStats") {
      const [tasks, notes, projects] = await Promise.all([
        getTasks(undefined, undefined, undefined, undefined, 500),
        getNotes(100),
        getProjects()
      ]);
      return {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        totalNotes: notes.length,
        totalProjects: projects.length
      };
    }

    // Widget display tools - return real data
    if (name === "displayTasks") {
      const limit = Math.min(args.limit || 5, 10);
      const tasks = await getTasks(undefined, args.priority, args.status, undefined, limit);
      return {
        widget: "task",
        data: tasks
      };
    }

    if (name === "displayNotes") {
      const limit = Math.min(args.limit || 5, 10);
      const notes = await getNotes(limit);
      return {
        widget: "note",
        data: notes
      };
    }

    if (name === "displayEvents") {
      const limit = Math.min(args.limit || 5, 10);
      const allEvents = await getEvents();
      // Get upcoming events
      const now = new Date();
      const upcomingEvents = allEvents
        .filter(e => new Date(e.start) >= now)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, limit);
      return {
        widget: "event",
        data: upcomingEvents
      };
    }

    if (name === "displayProjects") {
      const limit = Math.min(args.limit || 5, 10);
      const allProjects = await getProjects();
      let filtered = allProjects;
      if (args.status) {
        filtered = allProjects.filter(p => p.status === args.status);
      }
      return {
        widget: "project",
        data: filtered.slice(0, limit)
      };
    }

    if (name === "displayStats") {
      const [tasks, notes, projects] = await Promise.all([
        getTasks(undefined, undefined, undefined, undefined, 500),
        getNotes(100),
        getProjects()
      ]);
      
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const pendingTasks = tasks.filter(t => t.status === 'task').length;
      
      return {
        widget: "stats",
        data: {
          title: "Your Overview",
          stats: [
            { label: "Total Tasks", value: tasks.length, color: "text-blue-400" },
            { label: "Completed", value: completedTasks, color: "text-emerald-400" },
            { label: "In Progress", value: inProgressTasks, color: "text-yellow-400" },
            { label: "Pending", value: pendingTasks, color: "text-zinc-400" },
            { label: "Total Notes", value: notes.length, color: "text-purple-400" },
            { label: "Projects", value: projects.length, color: "text-pink-400" },
          ]
        }
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
        content: `You are a helpful assistant for a markdown note-taking app. You have access to the user's database to search notes and tasks. Always check the database before saying you don't know.
        
        Here is the current status of the user's dashboard (real data):
        ${JSON.stringify(await getAggregatedDashboardData(), null, 2)}

        IMPORTANT INSTRUCTIONS:
        1. When the user asks to "show", "list", or "display" specific items (tasks, notes, projects, events), ALWAYS call the corresponding 'displayX' tool (e.g., displayTasks).
        2. When a 'displayX' tool returns a __WIDGET__ content marker, you MUST include that EXACT marker string in your response to the user.
        3. Do NOT summarize the widget content in text unless asked; let the widget do the talking.
        4. The marker triggers an interactive UI element for the user.
        `
      },
      {
        role: "assistant",
        content: "Understood. I will use the database and interactive widgets to help you."
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
        
        // If it's a widget result, we return the marker so the LLM can include it in its text
        const content = (result.widget && result.data) 
          ? `__WIDGET__${JSON.stringify(result)}__WIDGET__`
          : JSON.stringify(result);

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: functionName,
          content: content
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
