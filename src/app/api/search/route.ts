import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notes, tasks, users } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const notesResults = await db
      .select({
        note: notes,
        owner: {
          name: users.name,
          image: users.image,
          email: users.email,
        }
      })
      .from(notes)
      .leftJoin(users, eq(notes.userId, users.id))
      .where(sql`title LIKE ${'%' + query + '%'} OR content LIKE ${'%' + query + '%'}`);

    const tasksResults = await db
      .select()
      .from(tasks)
      .where(sql`name LIKE ${'%' + query + '%'} OR description LIKE ${'%' + query + '%'}`);

    const results = [
      ...notesResults.map(({ note, owner }) => ({
        ...note,
        owner: owner ? {
          name: owner.name,
          image: owner.image,
          email: owner.email,
        } : undefined,
        type: 'note' as const
      })),
      ...tasksResults.map((task) => ({ ...task, type: 'task' as const })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

