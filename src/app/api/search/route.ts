import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // Mock Search Results
    const results = [
      {
        id: "mock-note-1",
        title: "Meeting Notes",
        content: `Discussed ${query} related topics.`,
        type: 'note',
        updatedAt: new Date().toISOString()
      },
      {
        id: "mock-task-1",
        name: `Implement ${query}`,
        description: "Task description here",
        type: 'task',
        status: 'in_progress'
      }
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
