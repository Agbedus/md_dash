export type Note = {
  id: number;
  title: string;
  content: string;

  type: 'note' | 'checklist' | 'todo' | 'journal' | 'meeting' | 'idea' | 'link' | 'code' | 'bookmark' | 'sketch';
  tags?: string | null; // JSON string array
  notebook?: string | null;
  color?: string | null;

  isPinned: number;   // 0 | 1
  isArchived: number; // 0 | 1
  isFavorite: number; // 0 | 1

  coverImage?: string | null;
  links?: string | null;        // JSON string array
  attachments?: string | null;  // JSON string array

  reminderAt?: string | null;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;

  userId: string;
  taskId?: number | null;

  createdAt?: string | null;
  updatedAt?: string | null;
  owner?: {
    id: string;
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
  sharedWith?: {
    id: string;
    name?: string | null;
    image?: string | null;
    email?: string | null;
  }[];
};