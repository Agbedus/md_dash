import React from 'react';
import { FiFileText, FiCheckSquare } from 'react-icons/fi';
import type { Note } from '@/types/note';
import type { Task } from '@/types/task';

interface CardProps {
  item: Note | Task;
  type: 'note' | 'task';
}

const AssistantCard: React.FC<CardProps> = ({ item, type }) => {
  const isNote = type === 'note';
  const Icon = isNote ? FiFileText : FiCheckSquare;

  return (
    <div className="glass rounded-xl p-4 border border-white/5 hover:bg-white/[0.03] transition-all duration-300 group cursor-pointer">
      <div className="flex items-center mb-2">
        <div className="p-2 rounded-lg bg-white/[0.03] mr-3 group-hover:bg-white/[0.06] transition-colors">
            <Icon className="text-purple-400 w-5 h-5" />
        </div>
        <h3 className="font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
          {isNote ? (item as Note).title : (item as Task).name}
        </h3>
      </div>
      {'content' in item && item.content && (
        <div
          className="text-sm text-zinc-400 prose prose-invert prose-sm line-clamp-3"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      )}
      {'description' in item && item.description && (
        <p className="text-sm text-zinc-400 line-clamp-2">{item.description}</p>
      )}
    </div>
  );
};

export default AssistantCard;

