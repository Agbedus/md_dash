'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import type { Note } from '@/types/note';

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

import { revalidateTag } from 'next/cache';
import { getUsers as getRealUsers } from '@/app/users/actions';

interface HydratedUser {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
}

interface ApiNote {
    id: number;
    title: string;
    content: string;
    type: Note['type'];
    tags: string[];
    is_pinned: boolean;
    is_archived: boolean;
    is_favorite: boolean;
    cover_image: string | null;
    user_id: string;
    task_id: number | null;
    shared_with: string[];
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
        tags: p.tags || [],
        isPinned: p.is_pinned,
        isArchived: p.is_archived,
        isFavorite: p.is_favorite,
        coverImage: p.cover_image,
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
    const [notesRes, users] = await Promise.all([
      fetch(`${API_BASE_URL}/notes`, {
        method: 'GET',
        headers: {
          // @ts-expect-error accessToken is not in default session type
          'Authorization': `Bearer ${session.user.accessToken}`
        },
        next: { tags: ['notes'], revalidate: 60 }
      }),
      getRealUsers()
    ]);

    if (!notesRes.ok) return [];

    const apiNotes: ApiNote[] = await notesRes.json();
    return apiNotes.map(apiNote => {
      const note = mapApiNote(apiNote);
      
      // Hydrate Owner
      const owner = (users as HydratedUser[]).find(u => u.id === note.userId);
      if (owner) {
        note.owner = {
          id: owner.id,
          name: owner.name,
          image: owner.image,
          email: owner.email
        };
      }

      // Hydrate Shared With
      if (apiNote.shared_with && apiNote.shared_with.length > 0) {
        note.sharedWith = apiNote.shared_with.map(shUserId => {
          const u = (users as HydratedUser[]).find(user => user.id === shUserId);
          return u ? {
            id: u.id,
            name: u.name,
            image: u.image,
            email: u.email
          } : { id: shUserId };
        });
      }

      return note;
    });
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
    is_pinned: formData.get('is_pinned') === '1',
    is_archived: formData.get('is_archived') === '1',
    is_favorite: formData.get('is_favorite') === '1',
    cover_image: formData.get('coverImage') || formData.get('cover_image'),
    tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : [],
    task_id: formData.get('taskId') ? Number(formData.get('taskId')) : null,
    user_id: session.user?.id, // Use current user's ID
    shared_with: [],
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
        revalidateTag('notes', 'max');
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
  if (formData.has('is_pinned')) payload.is_pinned = formData.get('is_pinned') === '1';
  if (formData.has('is_archived')) payload.is_archived = formData.get('is_archived') === '1';
  if (formData.has('is_favorite')) payload.is_favorite = formData.get('is_favorite') === '1';
  if (formData.has('coverImage')) payload.cover_image = formData.get('coverImage');
  if (formData.has('cover_image')) payload.cover_image = formData.get('cover_image');
  if (formData.has('tags')) {
      const tagsStr = formData.get('tags') as string;
      payload.tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
  }
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
        revalidateTag('notes', 'max');
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
        revalidateTag('notes', 'max');
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
  const payload = { [apiField]: value };

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
        revalidateTag('notes', 'max');
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
        revalidateTag('notes', 'max');
    }
  } catch (error) {
    console.error("Error sharing note:", error);
  }
}
