'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FiCheck, FiX, FiImage } from 'react-icons/fi';
import type { Note } from '@/types/note';

// Import Quill and styles
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface NoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: FormData) => Promise<void>;
    noteTypes: Note['type'][];
    isSaving: boolean;
    initialNote?: Note;
}

export default function NoteFormModal({ isOpen, onClose, onSave, noteTypes, isSaving, initialNote }: NoteFormModalProps) {
     const formRef = useRef<HTMLFormElement>(null);
     const titleRef = useRef<HTMLInputElement>(null);
     const editorContainerRef = useRef<HTMLDivElement | null>(null);
     const quillRef = useRef<Quill | null>(null);

     // Controlled form state to avoid DOM timing issues
     const [title, setTitle] = useState('');
     const [priority, setPriority] = useState<Note['priority'] | ''>('low');
     const [typeVal, setTypeVal] = useState<Note['type'] | ''>('note');
     const [noteId, setNoteId] = useState<string>('');

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
            setNoteId(String(initialNote.id));
            if (quillRef.current) {
                quillRef.current.clipboard.dangerouslyPasteHTML(initialNote.content || '');
            }
        } else if (isOpen) {
            // new note: clear state and editor
            setTitle('');
            setPriority('low');
            setTypeVal('note');
            setNoteId('');
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
                    <div className="p-4 flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center space-x-4">
                            <select
                                name="priority"
                                id="priority"
                                value={priority || 'low'}
                                onChange={(e) => setPriority(e.target.value as Note['priority'])}
                                className="bg-slate-800 border border-slate-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            <select
                                name="type"
                                id="type"
                                value={typeVal}
                                onChange={(e) => setTypeVal(e.target.value as Note['type'])}
                                className="bg-slate-800 border border-slate-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            >
                                {noteTypes.map(type => (
                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="p-2 rounded-full text-slate-400 hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center"
                            >
                                <FiX />
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="p-2 rounded-full text-white bg-emerald-400 hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center"
                            >
                                <FiCheck />
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
                        <div ref={editorContainerRef} id="quill-editor" className="min-h-[14rem]" />
                        {/* id hidden field will be set when editing an existing note via initialNote */}
                        <input type="hidden" name="content" value="" />
                        <input type="hidden" name="id" value={noteId} />
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
