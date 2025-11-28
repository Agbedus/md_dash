import { getNotes } from "./actions";
import NotesPageClient from "@/components/ui/notes/notes-page-client";

export default async function NotesPage() {
  const allNotes = await getNotes();
  return <NotesPageClient allNotes={allNotes} />;
}