import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const priority = searchParams.get("priority");
  const status = searchParams.get("status");

  try {
    // Mock data
    let tasks = [
      {
        id: "task-1",
        name: "Design System",
        description: "Create a cohesive design system.",
        priority: "high",
        status: "in_progress",
        assignees: [{ user: { name: "Alice", email: "alice@example.com", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" } }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "task-2",
        name: "Integration Tests",
        description: "Write integration tests for the API.",
        priority: "medium",
        status: "task",
        assignees: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    if (query) {
       const lowerQuery = query.toLowerCase();
       tasks = tasks.filter(t => t.name.toLowerCase().includes(lowerQuery) || t.description.toLowerCase().includes(lowerQuery));
    }
    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    return NextResponse.json(tasks);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function PUT(_request: Request) {
  return NextResponse.json({ success: true });
}

export async function PATCH(_request: Request) {
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request) {
  return NextResponse.json({ success: true });
}
