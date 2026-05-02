'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FiCheck, FiX, FiStar, FiMapPin, FiArchive } from 'react-icons/fi';
import type { Note } from '@/types/note';
import type { Task } from '@/types/task';
import SlashCommandEditor from '../editor/slash-command-editor';

interface NoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: FormData) => Promise<void>;
    noteTypes: Note['type'][];
    isSaving: boolean;
    initialNote?: Note;
    tasks?: Task[];
}

export default function NoteFormModal({ isOpen, onClose, onSave, noteTypes, isSaving, initialNote, tasks }: NoteFormModalProps) {
     const formRef = useRef<HTMLFormElement>(null);
     const titleRef = useRef<HTMLInputElement>(null);

     // Controlled form state to avoid DOM timing issues
     const [title, setTitle] = useState('');
     const [content, setContent] = useState('');
     const [priority, setPriority] = useState<Note['priority'] | ''>('low');
     const [typeVal, setTypeVal] = useState<Note['type'] | ''>('note');
     const [noteId, setNoteId] = useState<string>('');
     const [taskId, setTaskId] = useState<string>('');
     const [tags, setTags] = useState<string>('');
     const [isPinned, setIsPinned] = useState(false);
     const [isFavorite, setIsFavorite] = useState(false);
     const [isArchived, setIsArchived] = useState(false);

    // Track the note we're currently editing to detect changes and reset state during render
    const [prevNoteId, setPrevNoteId] = useState<string | null>(null);
    const [prevIsOpen, setPrevIsOpen] = useState(false);

    const currentInitialNoteId = initialNote ? String(initialNote.id) : null;

    if (currentInitialNoteId !== prevNoteId || isOpen !== prevIsOpen) {
        setPrevNoteId(currentInitialNoteId);
        setPrevIsOpen(isOpen);
        
        if (initialNote) {
            setTitle(initialNote.title || '');
            setContent(initialNote.content || '');
            setPriority(initialNote.priority || 'low');
            setTypeVal(initialNote.type || 'note');
            setTaskId(initialNote.task_id ? String(initialNote.task_id) : '');
            setNoteId(String(initialNote.id));
            setTags(initialNote.tags || '');
            setIsPinned(initialNote.is_pinned === 1);
            setIsFavorite(initialNote.is_favorite === 1);
            setIsArchived(initialNote.is_archived === 1);
        } else if (isOpen) {
            setTitle('');
            setContent('');
            setPriority('low');
            setTypeVal('note');
            setNoteId('');
            setTaskId('');
            setTags('');
            setIsPinned(false);
            setIsFavorite(false);
            setIsArchived(false);
        }
    }

    // When `isOpen` changes to true, focus the title input
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => titleRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await onSave(formData);
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!isOpen}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
            
            {/* Modal Body */}
            <div className={`relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 rounded-3xl  overflow-hidden border border-white/5 transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`} onClick={e => e.stopPropagation()}>
                <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.03]">
                        {/* Group 1: Selections */}
                        <div className="flex items-center gap-3">
                            <select
                                name="priority"
                                id="priority"
                                value={priority || 'low'}
                                onChange={(e) => setPriority(e.target.value as Note['priority'])}
                                className="h-9 bg-white/[0.03] border border-white/5 rounded-xl px-3 text-[11px] uppercase font-bold tracking-wider text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer hover:bg-white/[0.06] transition-all"
                                required
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                            <select
                                name="type"
                                id="type"
                                value={typeVal}
                                onChange={(e) => setTypeVal(e.target.value as Note['type'])}
                                className="h-9 bg-white/[0.03] border border-white/5 rounded-xl px-3 text-[11px] uppercase font-bold tracking-wider text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer hover:bg-white/[0.06] transition-all"
                                required
                            >
                                {noteTypes.map(type => (
                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                ))}
                            </select>
                            <select
                                name="task_id"
                                id="task_id"
                                value={taskId}
                                onChange={(e) => setTaskId(e.target.value)}
                                className="h-9 bg-white/[0.03] border border-white/5 rounded-xl px-3 text-[11px] uppercase font-bold tracking-wider text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 max-w-[150px] cursor-pointer hover:bg-white/[0.06] transition-all"
                            >
                                <option value="">No Task Associated</option>
                                {tasks?.map(task => (
                                    <option key={task.id} value={task.id}>{task.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Group 2: Status */}
                        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/5 h-9">
                            <button
                                type="button"
                                onClick={() => setIsPinned(!isPinned)}
                                className={`h-full px-3 rounded-lg transition-all ${isPinned ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'}`}
                                title="Pin note"
                            >
                                <FiMapPin size={14} className={isPinned ? 'fill-current' : ''} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFavorite(!isFavorite)}
                                className={`h-full px-3 rounded-lg transition-all ${isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'}`}
                                title="Favorite note"
                            >
                                <FiStar size={14} className={isFavorite ? 'fill-current' : ''} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsArchived(!isArchived)}
                                className={`h-full px-3 rounded-lg transition-all ${isArchived ? 'text-zinc-400 bg-zinc-400/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'}`}
                                title="Archive note"
                            >
                                <FiArchive size={14} className={isArchived ? 'fill-current' : ''} />
                            </button>
                        </div>

                        {/* Group 3: Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="h-9 w-9 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50 flex items-center justify-center border border-white/5"
                                title="Cancel"
                            >
                                <FiX size={18} />
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="h-9 px-5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center  -emerald-500/20 font-bold text-xs uppercase tracking-wider gap-2"
                                title={initialNote ? 'Update Note' : 'Save Note'}
                            >
                                <FiCheck size={18} />
                                <span>{initialNote ? 'Update' : 'Save'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 flex-grow overflow-y-auto notes-scroll">
                        <input
                            ref={titleRef}
                            type="text"
                            name="title"
                            id="title"
                            placeholder="Note Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-4xl font-medium w-full bg-transparent pb-6 text-white focus:outline-none placeholder:text-zinc-800 tracking-tight"
                            required
                        />
                        <div className="flex items-center gap-3 mb-8">
                             <input
                                type="text"
                                name="tags"
                                id="tags"
                                placeholder="Add labels (travel, important, research)..."
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="text-sm flex-1 bg-white/[0.03] border border-white/5 py-2 px-4 rounded-xl text-zinc-400 focus:outline-none focus:bg-white/[0.06] transition-all placeholder:text-zinc-600"
                            />
                        </div>
                        <SlashCommandEditor initialContent={content} onChange={setContent} />
                        <input type="hidden" name="content" value={content} />
                        <input type="hidden" name="id" value={noteId} />
                        <input type="hidden" name="is_pinned" value={isPinned ? '1' : '0'} />
                        <input type="hidden" name="is_favorite" value={isFavorite ? '1' : '0'} />
                        <input type="hidden" name="is_archived" value={isArchived ? '1' : '0'} />
                        {noteId ? <input type="hidden" name="_editing" value="1" /> : null}
                     </div>
                 </form>
             </div>
         </div>
     );
 }
