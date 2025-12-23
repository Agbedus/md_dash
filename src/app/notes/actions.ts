'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import type { Note } from '@/types/note';

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

import { revalidateTag } from 'next/cache';
import { getUsers as getRealUsers } from '@/app/users/actions';

interface ApiNote {
    id: number;
    title: string;
    content: string;
    type: Note['type'];
    tags: string | null;
    is_pinned: number;
    is_archived: number;
    is_favorite: number;
    user_id: string;
    task_id: number | null;
    created_at: string;
    updated_at: string;
}

function mapApiNote(p: ApiNote): Note {
    const validTypes: Note['type'][] = ['note', 'checklist', 'todo', 'journal', 'meeting', 'idea', 'link', 'code', 'bookmark', 'sketch'];
    return {
        id: p.id,
        title: p.title,
        content: p.content,
        type: validTypes.includes(p.type) ? p.type : 'note',
        tags: p.tags,
        isPinned: p.is_pinned,
        isArchived: p.is_archived,
        isFavorite: p.is_favorite,
        userId: p.user_id,
        taskId: p.task_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    };
}

export async function getNotes(): Promise<Note[]> {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'GET',
        headers: {
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        },
        next: { tags: ['notes'], revalidate: 60 }
    });

    if (!response.ok) return [];

    const notes: ApiNote[] = await response.json();
    return notes.map(mapApiNote);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

export async function getUsers() {
    return getRealUsers();
}

export async function createNote(formData: FormData) {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return;

  const payload = {
    title: formData.get('title'),
    content: formData.get('content'),
    type: formData.get('type'),
    is_pinned: formData.get('is_pinned') === '1' ? 1 : 0,
    tags: formData.get('tags'),
    task_id: formData.get('taskId') ? Number(formData.get('taskId')) : null,
  };

  console.log("createNote: payload", payload);

  try {
    const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        console.error("createNote: API error", response.status, await response.text());
        return;
    }

    if (response.ok) {
        revalidatePath('/notes');
        revalidateTag('notes');
    }
  } catch (error) {
    console.error("Error creating note:", error);
  }
}

export async function updateNote(formData: FormData) {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return;

  const id = formData.get('id');
  if (!id) return;

  const payload: Record<string, unknown> = {};
  if (formData.has('title')) payload.title = formData.get('title');
  if (formData.has('content')) payload.content = formData.get('content');
  if (formData.has('type')) payload.type = formData.get('type');
  if (formData.has('is_pinned')) payload.is_pinned = formData.get('is_pinned') === '1' ? 1 : 0;
  if (formData.has('is_archived')) payload.is_archived = formData.get('is_archived') === '1' ? 1 : 0;
  if (formData.has('is_favorite')) payload.is_favorite = formData.get('is_favorite') === '1' ? 1 : 0;
  if (formData.has('tags')) payload.tags = formData.get('tags');
  if (formData.has('taskId')) payload.task_id = formData.get('taskId') ? Number(formData.get('taskId')) : null;

  console.log("updateNote: id", id, "payload", payload);

  try {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        console.error("updateNote: API error", response.status, await response.text());
        return;
    }

    if (response.ok) {
        revalidatePath('/notes');
        revalidateTag('notes');
    }
  } catch (error) {
    console.error("Error updating note:", error);
  }
}

export async function deleteNote(formData: FormData) {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return;

  const id = formData.get('id');
  if (!id) return;

  try {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: {
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        }
    });

    if (response.ok) {
        revalidatePath('/notes');
        revalidateTag('notes');
    }
  } catch (error) {
    console.error("Error deleting note:", error);
  }
}

export async function toggleNoteFlag(noteId: number, field: 'isPinned' | 'isFavorite' | 'isArchived', value: boolean) {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return;

  const apiField = field === 'isPinned' ? 'is_pinned' : field === 'isFavorite' ? 'is_favorite' : 'is_archived';
  const payload = { [apiField]: value ? 1 : 0 };

  try {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        revalidatePath('/notes');
        revalidateTag('notes');
    }
  } catch (error) {
    console.error("Error toggling note flag:", error);
  }
}

export async function shareNote(formData: FormData) {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return;

  const noteId = formData.get('noteId');
  const email = formData.get('email');
  if (!noteId || !email) return;

  try {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/share`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({ email })
    });

    if (response.ok) {
        revalidatePath('/notes');
        revalidateTag('notes');
    }
  } catch (error) {
    console.error("Error sharing note:", error);
  }
}
