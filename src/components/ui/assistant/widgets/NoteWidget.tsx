import type { Note } from "@/types/note";
import Link from "next/link";

interface NoteWidgetProps {
  note: Note;
}

export default function NoteWidget({ note }: NoteWidgetProps) {
  // Type color coding
  let typeColor = "text-zinc-400";
  if (note.type === "meeting") typeColor = "text-blue-400";
  if (note.type === "idea") typeColor = "text-yellow-400";
  if (note.type === "journal") typeColor = "text-pink-400";
  if (note.type === "code") typeColor = "text-purple-400";

  // Truncate content
  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  return (
    <div className="glass p-4 rounded-xl border border-white/5 hover:border-white/5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-white truncate">{note.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-lg bg-white/[0.03] ${typeColor} font-medium whitespace-nowrap`}>
              {note.type}
            </span>
          </div>
          
          <p className="text-sm text-zinc-400 mb-3 line-clamp-3">
            {truncateContent(note.content)}
          </p>
          
          {note.tags && (
            <div className="flex flex-wrap gap-1 text-xs">
              {note.tags.split(',').map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-white/[0.03] text-zinc-500">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <Link 
          href={`/notes?id=${note.id}`}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium whitespace-nowrap"
        >
          Read →
        </Link>
      </div>
    </div>
  );
}
