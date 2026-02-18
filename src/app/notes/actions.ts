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
    full_name: string | null;
    email: string | null;
    image: string | null;
    avatar_url: string | null;
}

interface ApiNote {
    id: number;
    title: string;
    content: string;
    type: Note['type'];
    tags: string;
    is_pinned: 0 | 1;
    is_archived: 0 | 1;
    is_favorite: 0 | 1;
    cover_image: string | null;
    user_id: string;
    task_id: number | null;
    shared_with: (string | any)[];
    created_at: string;
    updated_at: string;
}

function mapApiNote(p: ApiNote): Note {
    const validTypes: Note['type'][] = ['note', 'checklist', 'todo', 'journal', 'meeting', 'idea', 'link', 'code', 'bookmark', 'sketch'];
    
    // Robust tag parsing for JSON array strings or raw text
    let tags = p.tags || '';
    if (typeof tags === 'string' && tags.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) {
                tags = parsed.join(', ');
            }
        } catch {
            // Fallback to original string if parsing fails
        }
    }

    return {
        id: p.id,
        title: p.title,
        content: p.content,
        type: validTypes.includes(p.type) ? p.type : 'note',
        tags: tags,
        is_pinned: p.is_pinned,
        is_archived: p.is_archived,
        is_favorite: p.is_favorite,
        cover_image: p.cover_image,
        user_id: p.user_id,
        task_id: p.task_id,
        created_at: p.created_at,
        updated_at: p.updated_at,
    };
}


export async function getNotes(limit?: number, skip?: number): Promise<Note[]> {

  const session = await auth();


  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) {

    return [];
  }

  try {

    const [notesRes, users] = await Promise.all([
      fetch(`${API_BASE_URL}/notes?${limit ? `limit=${limit}` : ''}${skip ? `&skip=${skip}` : ''}`, {
        method: 'GET',
        headers: {
          // @ts-expect-error accessToken is not in default session type
          'Authorization': `Bearer ${session.user.accessToken}`
        },
        next: { tags: ['notes'], revalidate: 60 }
      }),
      getRealUsers()
    ]);




    if (!notesRes.ok) {
        console.error("Failed to fetch notes:", await notesRes.text());
        return [];
    }

    const apiNotes: ApiNote[] = await notesRes.json();


    return apiNotes.map(apiNote => {
      const note = mapApiNote(apiNote);
      
      // Hydrate Owner
      const owner = (users as HydratedUser[]).find(u => u.id === note.user_id);
      if (owner) {
        note.owner = {
          id: owner.id,
          name: owner.name,
          full_name: owner.full_name,
          image: owner.image,
          avatar_url: owner.avatar_url,
          email: owner.email
        };
      }

      // Hydrate Shared With
      if (apiNote.shared_with && apiNote.shared_with.length > 0) {
        note.shared_with = apiNote.shared_with.map(shUser => {
          // If it's already an object with an ID, check if it has the required fields
          if (typeof shUser !== 'string' && shUser.id) {
            // Find in hydrated users to get full data if missing
            const u = (users as HydratedUser[]).find(user => user.id === String(shUser.id));
            if (u) {
              return {
                id: u.id,
                name: u.name,
                full_name: u.full_name,
                image: u.image,
                avatar_url: u.avatar_url,
                email: u.email
              };
            }
            // If not found in users list, return the object as is (mapped to Note structure)
            return {
              id: String(shUser.id),
              name: shUser.name || shUser.full_name,
              full_name: shUser.full_name,
              image: shUser.image || shUser.avatar_url,
              avatar_url: shUser.avatar_url,
              email: shUser.email
            };
          }

          // If it's a string (name, email, or ID), find by those fields
          const shIdentifier = String(shUser);
          const u = (users as HydratedUser[]).find(user => 
            user.id === shIdentifier ||
            user.name === shIdentifier || 
            user.full_name === shIdentifier || 
            user.email === shIdentifier
          );

          return u ? {
            id: u.id,
            name: u.name,
            full_name: u.full_name,
            image: u.image,
            avatar_url: u.avatar_url,
            email: u.email
          } : shIdentifier;
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
    is_pinned: formData.get('is_pinned') === '1' ? 1 : 0,
    is_archived: formData.get('is_archived') === '1' ? 1 : 0,
    is_favorite: formData.get('is_favorite') === '1' ? 1 : 0,
    cover_image: formData.get('cover_image'),
    tags: formData.get('tags') || '',
    task_id: formData.get('task_id') ? Number(formData.get('task_id')) : null,
    user_id: session.user?.id, // Use current user's ID
    shared_with: [],
  };




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
  if (formData.has('is_pinned')) payload.is_pinned = formData.get('is_pinned') === '1' ? 1 : 0;
  if (formData.has('is_archived')) payload.is_archived = formData.get('is_archived') === '1' ? 1 : 0;
  if (formData.has('is_favorite')) payload.is_favorite = formData.get('is_favorite') === '1' ? 1 : 0;
  if (formData.has('cover_image')) payload.cover_image = formData.get('cover_image');
  if (formData.has('tags')) payload.tags = formData.get('tags') || '';
  if (formData.has('task_id')) {
    const taskId = formData.get('task_id');
    payload.task_id = taskId === "" || taskId === null ? null : Number(taskId);
  }
  if (formData.has('shared_with')) {
    try {
      const sw = formData.get('shared_with') as string;
      payload.shared_with = JSON.parse(sw);
    } catch {
      payload.shared_with = [];
    }
  }




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

    const responseText = await response.text();


    if (!response.ok) {
        console.error("updateNote: API error", response.status, responseText);
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

export async function toggleNoteFlag(noteId: number, field: 'is_pinned' | 'is_favorite' | 'is_archived', value: 0 | 1) {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return;

  const payload = { [field]: value };

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
  const sharedWith = formData.get('email'); // This is actually the name/email from the dropdown
  if (!noteId || !sharedWith) return;

  try {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/share`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({ email: sharedWith }) // Keeping field name 'email' but content is name/email
    });

    if (response.ok) {
        revalidatePath('/notes');
        revalidateTag('notes', 'max');
    }
  } catch (error) {
    console.error("Error sharing note:", error);
  }
}
