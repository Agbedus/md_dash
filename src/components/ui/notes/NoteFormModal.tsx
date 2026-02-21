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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!isOpen}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
            
            {/* Modal Body */}
            <div className={`relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/5 transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`} onClick={e => e.stopPropagation()}>
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
                                className="h-9 px-5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-xs uppercase tracking-wider gap-2"
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
                        <div ref={editorContainerRef} id="quill-editor" className="min-h-[25rem]" />
                        <input type="hidden" name="content" value="" />
                        <input type="hidden" name="id" value={noteId} />
                        <input type="hidden" name="is_pinned" value={isPinned ? '1' : '0'} />
                        <input type="hidden" name="is_favorite" value={isFavorite ? '1' : '0'} />
                        <input type="hidden" name="is_archived" value={isArchived ? '1' : '0'} />
                        {noteId ? <input type="hidden" name="_editing" value="1" /> : null}
                     </div>


                    <div id="toolbar-container" className="px-6 py-4 border-t border-white/5 bg-white/[0.03] flex flex-wrap gap-2">
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
                    </div>
                 </form>
             </div>

             <style jsx global>{`
                .ql-snow { border: none !important; }
                .ql-toolbar { border: none !important; background: transparent; }
                .ql-container { color: #A1A1AA; font-family: inherit; font-size: 1.1rem; }
                .ql-editor.ql-blank::before { color: #27272A; font-style: normal; opacity: 1; }
                .ql-snow .ql-stroke { stroke: #52525B; }
                .ql-snow .ql-fill { fill: #52525B; }
                .ql-snow .ql-picker-label { color: #52525B; }

                .ql-container.ql-snow { border: none; background: transparent; }
                .ql-editor { background: transparent; color: #E4E4E7; min-height: 25rem; line-height: 1.8; }

                .ql-snow .ql-toolbar button:hover .ql-stroke,
                .ql-snow.ql-toolbar button:hover .ql-stroke { stroke: #10B981 !important; }
                
                .ql-snow .ql-toolbar button.ql-active .ql-stroke { stroke: #10B981 !important; }
                .ql-snow .ql-toolbar button.ql-active .ql-fill { fill: #10B981 !important; }

                .ql-snow .ql-toolbar button,
                .ql-snow .ql-toolbar .ql-picker-label,
                .ql-snow .ql-toolbar .ql-picker-item {
                    color: #52525B;
                }
                .ql-snow .ql-toolbar .ql-stroke { stroke: #52525B !important; }
                .ql-snow .ql-toolbar .ql-fill { fill: #52525B !important; }

                /* Dropdown/Picker refinements */
                .ql-snow .ql-picker-options {
                    display: none !important;
                    background-color: #18181B !important; /* zinc-900 */
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4) !important;
                    padding: 8px !important;
                    bottom: 100% !important;
                    top: auto !important;
                    margin-bottom: 8px !important;
                }

                .ql-snow .ql-picker.ql-expanded .ql-picker-options {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 2px !important;
                }

                .ql-snow .ql-color-picker.ql-expanded .ql-picker-options {
                    display: grid !important;
                }

                .ql-snow .ql-picker-item {
                    border-radius: 6px !important;
                    padding: 4px 8px !important;
                    transition: all 0.2s !important;
                }

                .ql-snow .ql-picker-item:hover {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                    color: #10B981 !important; /* emerald-500 */
                }

                .ql-snow .ql-color-picker .ql-picker-options {
                    width: 160px !important; 
                    grid-template-columns: repeat(7, 1fr) !important;
                    gap: 3px !important;
                    overflow: hidden !important;
                }

                .ql-snow .ql-color-picker .ql-picker-item {
                    width: 16px !important;
                    height: 16px !important;
                    padding: 0 !important;
                    border-radius: 4px !important;
                    margin: 2px !important;
                }
            `}</style>
         </div>
     );
 }
