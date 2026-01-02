'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FiCheck, FiX, FiImage, FiStar, FiMapPin, FiArchive } from 'react-icons/fi';
import type { Note } from '@/types/note';

// Import Quill and styles
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

import type { Task } from '@/types/task';

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
     const editorContainerRef = useRef<HTMLDivElement | null>(null);
     const quillRef = useRef<Quill | null>(null);

     // Controlled form state to avoid DOM timing issues
     const [title, setTitle] = useState('');
     const [priority, setPriority] = useState<Note['priority'] | ''>('low');
     const [typeVal, setTypeVal] = useState<Note['type'] | ''>('note');
     const [noteId, setNoteId] = useState<string>('');
     const [taskId, setTaskId] = useState<string>('');
     const [tags, setTags] = useState<string>('');
     const [isPinned, setIsPinned] = useState(false);
     const [isFavorite, setIsFavorite] = useState(false);
     const [isArchived, setIsArchived] = useState(false);

    // Initialize Quill once when the component mounts and keep it mounted so content persists
    useEffect(() => {
        if (editorContainerRef.current && !quillRef.current) {
            quillRef.current = new Quill(editorContainerRef.current, {
                theme: 'snow',
                placeholder: 'Write your note here...',
                modules: {
                    toolbar: '#toolbar-container',
                },
            });
        }



        // Do not destroy Quill on unmount so editor state persists across opens.
        return () => {
            // intentionally keep quillRef and DOM so content persists
        };
    }, []); // run only once

    // When `isOpen` changes to true, focus the title input but don't clear the editor
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => titleRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // When initialNote or isOpen changes, sync controlled state and quill content
    useEffect(() => {
        if (initialNote) {
            setTitle(initialNote.title || '');
            setPriority(initialNote.priority || 'low');
            setTypeVal(initialNote.type || 'note');
            setTaskId(initialNote.task_id ? String(initialNote.task_id) : '');
            setNoteId(String(initialNote.id));
            
            // Tag initialization - now a simple string
            setTags(initialNote.tags || '');
            
            setIsPinned(initialNote.is_pinned === 1);
            setIsFavorite(initialNote.is_favorite === 1);
            setIsArchived(initialNote.is_archived === 1);
            if (quillRef.current) {
                quillRef.current.clipboard.dangerouslyPasteHTML(initialNote.content || '');
            }
        } else if (isOpen) {
            // new note: clear state and editor
            setTitle('');
            setPriority('low');
            setTypeVal('note');
            setNoteId('');
            setTaskId('');
            setTags('');
            setIsPinned(false);
            setIsFavorite(false);
            setIsArchived(false);
            if (quillRef.current) {
                quillRef.current.setContents([]);
            }
        }
    }, [initialNote, isOpen]);

    // Always render the modal but hide it when not open so Quill instance and DOM persist
    const visibilityClass = isOpen ? 'block' : 'hidden';

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const contentInput = formRef.current?.querySelector('input[name="content"]') as HTMLInputElement | null;
        if (contentInput && quillRef.current) {
            contentInput.value = quillRef.current.root.innerHTML;
        }
        const formData = new FormData(e.currentTarget);
        await onSave(formData);
    };

    const handleImageClick = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        input.onchange = async () => {
            const file = input.files ? input.files[0] : null;
            if (file && quillRef.current) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const range = quillRef.current?.getSelection(true);
                    if (range && e.target?.result) {
                        quillRef.current?.insertEmbed(range.index, 'image', e.target.result);
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    };

    return (
        // positioned bottom-right; wrapper prevents background pointer events while modal handles its own
        <div className={`${visibilityClass} fixed z-50 right-6 bottom-6 pointer-events-none`} aria-hidden={!isOpen}>
            <div className="pointer-events-auto bg-slate-900 rounded-lg shadow-xl w-full max-w-xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col h-full max-h-[80vh]">
                    <div className="px-4 py-1.5 flex items-center justify-between border-b border-slate-800 bg-slate-900/50">
                        {/* Group 1: Selections */}
                        <div className="flex items-center gap-1.5">
                            <select
                                name="priority"
                                id="priority"
                                value={priority || 'low'}
                                onChange={(e) => setPriority(e.target.value as Note['priority'])}
                                className="h-7 bg-slate-800 border border-slate-700 rounded-md px-1.5 py-0 text-[9px] uppercase font-bold tracking-wider text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer hover:bg-slate-700 transition-colors"
                                required
                            >
                                <option value="low">Low</option>
                                <option value="medium">Med</option>
                                <option value="high">High</option>
                            </select>
                            <select
                                name="type"
                                id="type"
                                value={typeVal}
                                onChange={(e) => setTypeVal(e.target.value as Note['type'])}
                                className="h-7 bg-slate-800 border border-slate-700 rounded-md px-1.5 py-0 text-[9px] uppercase font-bold tracking-wider text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer hover:bg-slate-700 transition-colors"
                                required
                            >
                                {noteTypes.map(type => (
                                    <option key={type} value={type}>{type.length > 5 ? type.slice(0, 4) + '.' : type}</option>
                                ))}
                            </select>
                            <select
                                name="task_id"
                                id="task_id"
                                value={taskId}
                                onChange={(e) => setTaskId(e.target.value)}
                                className="h-7 bg-slate-800 border border-slate-700 rounded-md px-1.5 py-0 text-[9px] uppercase font-bold tracking-wider text-white focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-[100px] cursor-pointer hover:bg-slate-700 transition-colors"
                            >
                                <option value="">No Task</option>
                                {tasks?.map(task => (
                                    <option key={task.id} value={task.id}>{task.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Group 2: Status */}
                        <div className="flex items-center gap-1 p-0.5 bg-slate-800/50 rounded-lg border border-white/5 h-7">
                            <button
                                type="button"
                                onClick={() => setIsPinned(!isPinned)}
                                className={`h-full px-2 rounded-md transition-all ${isPinned ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Pin note"
                            >
                                <FiMapPin size={12} className={isPinned ? 'fill-current' : ''} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFavorite(!isFavorite)}
                                className={`h-full px-2 rounded-md transition-all ${isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Favorite note"
                            >
                                <FiStar size={12} className={isFavorite ? 'fill-current' : ''} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsArchived(!isArchived)}
                                className={`h-full px-2 rounded-md transition-all ${isArchived ? 'text-zinc-400 bg-zinc-400/10' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Archive note"
                            >
                                <FiArchive size={12} className={isArchived ? 'fill-current' : ''} />
                            </button>
                        </div>

                        {/* Group 3: Actions */}
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="h-7 w-7 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center"
                                title="Cancel"
                            >
                                <FiX size={16} />
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="h-7 px-3 rounded-md text-slate-900 bg-emerald-400 hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                                title={initialNote ? 'Update Note' : 'Save Note'}
                            >
                                <FiCheck size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 flex-grow">
                        <input
                            ref={titleRef}
                            type="text"
                            name="title"
                            id="title"
                            placeholder="Note Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-3xl font-bold w-full bg-transparent pb-4 text-white focus:outline-none"
                            required
                        />
                        <input
                            type="text"
                            name="tags"
                            id="tags"
                            placeholder="Add tags (comma separated)..."
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="text-sm w-full bg-transparent pb-4 text-zinc-400 focus:outline-none italic"
                        />
                        <div ref={editorContainerRef} id="quill-editor" className="min-h-[14rem]" />
                        {/* id hidden field will be set when editing an existing note via initialNote */}
                        <input type="hidden" name="content" value="" />
                        <input type="hidden" name="id" value={noteId} />
                        <input type="hidden" name="is_pinned" value={isPinned ? '1' : '0'} />
                        <input type="hidden" name="is_favorite" value={isFavorite ? '1' : '0'} />
                        <input type="hidden" name="is_archived" value={isArchived ? '1' : '0'} />
                        {noteId ? <input type="hidden" name="_editing" value="1" /> : null}
                     </div>


                    <div id="toolbar-container" className="p-2 border-t border-slate-800">
                        <span className="ql-formats">
                            <button className="ql-bold"></button>
                            <button className="ql-italic"></button>
                            <button className="ql-underline"></button>
                            <button className="ql-strike"></button>
                        </span>
                        <span className="ql-formats">
                            <button className="ql-list" value="ordered"></button>
                            <button className="ql-list" value="bullet"></button>
                        </span>
                        <span className="ql-formats">
                            <button className="ql-blockquote"></button>
                            <button className="ql-code-block"></button>
                        </span>
                        <span className="ql-formats">
                            <button className="ql-link"></button>
                            <button type="button" className="ql-image" onClick={handleImageClick}>
                                <FiImage />
                            </button>
                        </span>
                        <span className="ql-formats">
                            <select className="ql-header" defaultValue="">
                                <option value="1"></option>
                                <option value="2"></option>
                                <option value="3"></option>
                                <option value=""></option>
                            </select>
                            <select className="ql-color"></select>
                            <select className="ql-background"></select>
                        </span>
                        <span className="ql-formats">
                            <button className="ql-clean"></button>
                        </span>
                    </div>
                 </form>
             </div>

             <style jsx global>{`
                /* Remove dark overlay and make the modal float over content */
                /* Keep Quill toolbar styling consistent and light */
                .ql-snow { border: none !important; }
                .ql-toolbar { border: none !important; background: transparent; }
                .ql-container { color: #CBD5E1; }
                .ql-editor.ql-blank::before { color: #64748B; font-style: normal; }
                .ql-snow .ql-stroke { stroke: #94A3B8; }
                .ql-snow .ql-fill { fill: #94A3B8; }
                .ql-snow .ql-picker-label { color: #94A3B8; }

                /* Make editor visually blend into the modal (no inner borders) */
                .ql-container.ql-snow { border: none; background: transparent; }
                .ql-editor { background: transparent; color: #E6EEF6; min-height: 14rem; }

                /* Toolbar buttons color */
                .ql-snow .ql-toolbar button,
                .ql-snow .ql-toolbar .ql-picker-label,
                .ql-snow .ql-toolbar .ql-picker-item {
                    color: rgba(255,255,255,0.92);
                }
                .ql-snow .ql-toolbar .ql-stroke { stroke: rgba(255,255,255,0.92) !important; }
                .ql-snow .ql-toolbar .ql-fill { fill: rgba(255,255,255,0.92) !important; }
            `}</style>
         </div>
     );
 }
