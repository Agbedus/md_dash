'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { 
    FiPlus, FiGrid, FiList, FiFileText, FiCheckSquare, 
    FiBookOpen, FiUsers, FiZap, FiLink, FiCode, FiBookmark, FiEdit3, FiCheckCircle, FiSearch
} from 'react-icons/fi';
import { createNote, updateNote, deleteNote, getNotes, getUsers, shareNote } from '@/app/notes/actions';
import type { Note } from "@/types/note";
import NoteCard from './note-card';
import NoteFormModal from './NoteFormModal';

type ViewMode = 'grid' | 'table';
const noteTypes: Note['type'][] = ['note', 'checklist', 'todo', 'journal', 'meeting', 'idea', 'link', 'code', 'bookmark', 'sketch'];

const noteTypeIcons: Record<Note['type'], React.ElementType> = {
    note: FiFileText,
    checklist: FiCheckSquare,
    todo: FiCheckCircle,
    journal: FiBookOpen,
    meeting: FiUsers,
    idea: FiZap,
    link: FiLink,
    code: FiCode,
    bookmark: FiBookmark,
    sketch: FiEdit3,
};

const noteTypeColors: Record<Note['type'], string> = {
    note: 'text-blue-400',
    checklist: 'text-green-400',
    todo: 'text-purple-400',
    journal: 'text-yellow-400',
    meeting: 'text-indigo-400',
    idea: 'text-pink-400',
    link: 'text-red-400',
    code: 'text-cyan-400',
    bookmark: 'text-orange-400',
    sketch: 'text-teal-400',
};

export default function NotesPageClient({ allNotes: initialNotes }: { allNotes: Note[] }) {
    const [allNotes, setAllNotes] = useState<Note[]>(initialNotes);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [, startTransition] = useTransition();
    const [savingCreate, setSavingCreate] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<Note['type'] | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [expandedNoteIds, setExpandedNoteIds] = useState<Set<number>>(new Set());

    const toggleNoteExpansion = (noteId: number) => {
        setExpandedNoteIds(prev => {
            const next = new Set(prev);
            if (next.has(noteId)) {
                next.delete(noteId);
            } else {
                next.add(noteId);
            }
            return next;
        });
    };

    const [availableUsers, setAvailableUsers] = useState<{id: string, name: string | null, email: string | null, image: string | null}[]>([]);

    useEffect(() => {
        getUsers().then(setAvailableUsers);
    }, []);

    const handleModalSave = async (formData: FormData) => {
        setErrorMsg(null);
        setSavingCreate(true);
        try {
            const isEditingFlag = formData.get('_editing');
            const formId = formData.get('id');

            if (isEditingFlag || formId || editingNote) {
                if (!formId && editingNote) {
                    formData.set('id', String(editingNote.id));
                }
                await updateNote(formData);
            } else {
                await createNote(formData);
            }
            const notes = (await getNotes()) as Note[];
            startTransition(() => {
                setAllNotes(notes);
                setIsModalOpen(false);
                setEditingNote(null);
            });
        } catch (err) {
            console.error(err);
            setErrorMsg('Could not save the note. Please try again.');
        } finally {
            setSavingCreate(false);
        }
    };

    const handleUpdate = async (formData: FormData) => {
        setErrorMsg(null);
        try {
            await updateNote(formData);
            const notes = (await getNotes()) as Note[];
            startTransition(() => {
                setAllNotes(notes);
            });
        } catch (err) {
            console.error(err);
            setErrorMsg('Could not update the note. Please try again.');
        }
    };

    const handleDelete = async (formData: FormData) => {
        setErrorMsg(null);
        try {
            await deleteNote(formData);
            const notes = (await getNotes()) as Note[];
            startTransition(() => {
                setAllNotes(notes);
            });
        } catch (err) {
            console.error(err);
            setErrorMsg('Could not delete the note. Please try again.');
        }
    };

    const handleAddUser = async (noteId: number, userEmail: string) => {
        setErrorMsg(null);
        try {
            const fd = new FormData();
            fd.append('noteId', String(noteId));
            fd.append('email', userEmail);
            await shareNote(fd);
            const notes = (await getNotes()) as Note[];
            startTransition(() => {
                setAllNotes(notes);
            });
        } catch (err) {
            console.error(err);
            setErrorMsg('Could not add user to note. Please try again.');
        }
    };

    const filteredNotes = useMemo(() => {
        let notes = allNotes;

        if (filterType !== 'all') {
            notes = notes.filter(note => note.type === filterType);
        }

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            notes = notes.filter(note =>
                note.title.toLowerCase().includes(lowercasedQuery) ||
                (note.content && note.content.toLowerCase().includes(lowercasedQuery))
            );
        }

        return notes;
    }, [allNotes, filterType, searchQuery]);

    return (
        <div className="flex flex-col h-screen p-8 max-w-7xl mx-auto text-white">
            {/* Non-scrolling Header */}
            <div>
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Notes</h1>
                    <p className="text-zinc-400 text-lg">Create, organize, and manage your notes.</p>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="relative flex-1 md:flex-none md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-white/20 text-white placeholder:text-zinc-600 transition-all"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all hover-scale ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`} title="Grid view">
                                <FiGrid className="w-5 h-5" />
                            </button>
                            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all hover-scale ${viewMode === 'table' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`} title="Table view">
                                <FiList className="w-5 h-5" />
                            </button>
                        </div>

                        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-5 py-2.5 border border-white/10 text-sm font-medium text-white rounded-xl bg-white/5 hover:bg-white/10 transition-all hover-scale">
                            <FiPlus className="mr-2" />
                            Add new note
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-8">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all hover-scale ${filterType === 'all' ? 'bg-white text-black' : 'bg-white/10 text-zinc-300 hover:bg-white/20'}`}>
                        All Notes
                    </button>
                    {noteTypes.map(type => {
                        const Icon = noteTypeIcons[type];
                        return (
                            <button 
                                key={type} 
                                onClick={() => setFilterType(type)} 
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover-scale ${filterType === type ? 'bg-white text-black' : 'bg-white/10 text-zinc-300 hover:bg-white/20'}`}>
                                <Icon className={`${filterType === type ? 'text-black' : noteTypeColors[type]}`} />
                                <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                            </button>
                        );
                    })}
                </div>

                {errorMsg && (
                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">
                        {errorMsg}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto">
                {viewMode === 'grid' ? (
                    <div className="masonry-container mt-4 mb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {filteredNotes.map((note) => {
                            const isExpanded = expandedNoteIds.has(note.id);
                            return (
                                <div 
                                    key={note.id} 
                                    className="masonry-item transition-all duration-300 ease-in-out"
                                    style={{ 
                                        height: isExpanded ? 'calc(var(--card-height) * 2 + 1.5rem)' : 'var(--card-height)' 
                                    }}
                                >
                                    <NoteCard 
                                        note={note} 
                                        onNoteUpdate={handleUpdate} 
                                        onNoteDelete={handleDelete} 
                                        onEdit={(n)=>{ setEditingNote(n); setIsModalOpen(true); }} 
                                        onAddUser={handleAddUser} 
                                        availableUsers={availableUsers} 
                                        viewMode="grid" 
                                        searchQuery={searchQuery}
                                        isExpanded={isExpanded}
                                        onToggleExpand={() => toggleNoteExpansion(note.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="glass rounded-2xl">
                        <table className="w-full border-collapse">
                            <caption className="sr-only">Notes table</caption>
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Title</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Content</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Priority</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredNotes.map((note) => (
                                    <NoteCard key={note.id} note={note} onNoteUpdate={handleUpdate} onNoteDelete={handleDelete} onEdit={(n)=>{ setEditingNote(n); setIsModalOpen(true); }} onAddUser={handleAddUser} availableUsers={availableUsers} viewMode="table" searchQuery={searchQuery} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <NoteFormModal 
                isOpen={isModalOpen} 
                onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
                onSave={handleModalSave}
                initialNote={editingNote ?? undefined}
                 noteTypes={noteTypes}
                 isSaving={savingCreate}
             />
            <style jsx>{`
                .masonry-container {
                    column-gap: 1.5rem; /* 24px */
                    column-count: 1;
                    display: block;
                    /* prefer balanced columns when supported */
                    column-fill: balance;
                    --card-height: 320px; /* default card height */
                    /* hide scrollbar across browsers */
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE 10+ */
                }
                .masonry-container::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                    background: transparent;
                }
                @media (min-width: 768px) { 
                    .masonry-container { 
                        column-count: 2;
                        --card-height: 380px;
                    } 
                }
                @media (min-width: 1024px) { 
                    .masonry-container { 
                        column-count: 3;
                        --card-height: 420px;
                    } 
                }
                .masonry-item {
                    display: inline-block;
                    width: 100%;
                    margin-bottom: 1.5rem; /* 24px */
                    break-inside: avoid;
                    vertical-align: top; /* ensure alignment */
                    height: var(--card-height); /* fix height so inner area can scroll */
                    /* ensure the child card can use full height */
                    box-sizing: border-box;
                    overflow: visible;
                }
                /* ensure the card fills the masonry-item height so its internal flex layout works */
                .masonry-item > .glass,
                .masonry-item > * {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
            `}</style>
        </div>
    );
}
