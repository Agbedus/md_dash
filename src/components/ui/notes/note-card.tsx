"use client";
import React from "react";
import Image from "next/image";
import type { Note } from "@/types/note";
import 'quill/dist/quill.snow.css';
import { FiEdit2, FiTrash2, FiFileText, FiCheckSquare, FiBookOpen, FiUsers, FiZap, FiLink, FiCode, FiBookmark, FiEdit3, FiCheckCircle, FiUserPlus, FiLayers, FiClock } from "react-icons/fi";

import { FiMaximize2, FiMinimize2 } from "react-icons/fi";

interface NoteCardProps {
    note: Note;
    // allow async handlers (Promise<void>) from parent
    onNoteUpdate: (formData: FormData) => Promise<void> | void;
    onNoteDelete: (formData: FormData) => Promise<void> | void;
    viewMode: 'grid' | 'table';
    searchQuery?: string;
    onEdit?: (note: Note) => void;
    onAddUser?: (noteId: number, userEmail: string) => Promise<void>;
    availableUsers?: {id: string, name: string | null, email: string | null, image: string | null}[];
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

function sanitizeHtml(html: string): string {
    if (!html) return '';
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style').forEach(node => node.remove());
    const elements = doc.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
            const name = attr.name.toLowerCase();
            const val = attr.value;
            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
                continue;
            }
            if ((name === 'href' || name === 'src') && val.trim().toLowerCase().startsWith('javascript:')) {
                el.removeAttribute(attr.name);
                continue;
            }
        }
    }
    return doc.body.innerHTML;
}

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

const formatPriority = (p: Note['priority'] | undefined): string =>
  p ? p.charAt(0).toUpperCase() + p.slice(1) : '';

const TextHighlight: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!highlight) {
        return <>{text}</>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-300 text-black">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

export default function NoteCard({ note, onNoteDelete, viewMode, searchQuery = '', onEdit, onAddUser, availableUsers = [], isExpanded = false, onToggleExpand }: NoteCardProps) {
    const [showUserDropdown, setShowUserDropdown] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddUser = async () => {
        if (selectedUser && onAddUser) {
            await onAddUser(note.id, selectedUser);
            setSelectedUser('');
            setShowUserDropdown(false);
        }
    };

    const priorityBgColorClass = (priority: Note['priority']) => {
        switch (priority) {
            case 'high': return 'bg-red-400/10';
            case 'medium': return 'bg-yellow-400/10';
            case 'low': return 'bg-emerald-400/10';
            default: return 'bg-zinc-400/10';
        }
    };
    
    const priorityTextColorClass = (priority: Note['priority']) => {
        switch (priority) {
            case 'high': return 'text-red-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-emerald-400';
            default: return 'text-zinc-400';
        }
    };
    

    // Defensive tag parsing to handle arrays, JSON strings, or comma-separated lists
    const getNoteTags = () => {
        if (!note.tags) return [];
        
        // If it's already an array, return it
        if (Array.isArray(note.tags)) return note.tags;

        // If it's a string, try to parse as JSON or split by comma
        if (typeof note.tags === 'string') {
            try {
                const parsed = JSON.parse(note.tags);
                if (Array.isArray(parsed)) return parsed;
                if (typeof parsed === 'object' && parsed !== null) {
                    return Object.values(parsed).map(String).filter(Boolean);
                }
            } catch {
                return (note.tags as unknown as string).split(',').map((t: string) => t.trim()).filter(Boolean);
            }
        }

        // If it's an object (but not an array), try to get its values
        if (typeof note.tags === 'object' && note.tags !== null) {
            return Object.values(note.tags).map(String).filter(Boolean);
        }

        return [];
    };
    const noteTags = getNoteTags();
    
    // Debug log for tags - remove after verification
    if (note.tags && noteTags.length === 0) {
        console.log(`Note [${note.id}] has tags but they failed to parse:`, note.tags);
    }
    const TypeIcon = noteTypeIcons[note.type] || FiFileText;
    const typeIconColorClass = noteTypeColors[note.type] || 'text-zinc-400';

    const renderContent = (content: string) => {
        const sanitized = sanitizeHtml(content);
        if (!searchQuery || typeof window === 'undefined') {
            return sanitized;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitized, 'text/html');
        const highlightRegex = new RegExp(`(${searchQuery})`, 'gi');

        const walk = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || '';
                if (highlightRegex.test(text)) {
                    const span = document.createElement('span');
                    span.innerHTML = text.replace(highlightRegex, '<mark class="bg-yellow-300 text-black">$1</mark>');
                    node.parentNode?.replaceChild(span, node);
                }
            } else {
                Array.from(node.childNodes).forEach(walk);
            }
        };

        walk(doc.body);
        return doc.body.innerHTML;
    };

    if (viewMode === 'grid') {
        return (
            <div className={`glass rounded-2xl p-6 flex flex-col h-full hover-glow transition-all duration-300 ${isExpanded ? 'ring-2 ring-purple-500/50' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-2">
                            {note.owner?.image ? (
                                <Image src={note.owner.image} alt={note.owner.name || 'Owner'} width={24} height={24} className="rounded-full border border-white/10" />
                            ) : note.owner?.name ? (
                                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold border border-white/10">
                                    {note.owner.name.charAt(0).toUpperCase()}
                                </div>
                            ) : null}
                            <div className="flex items-center gap-2 min-w-0">
                                <h3 className="font-bold text-xl text-white tracking-tight truncate">
                                    <TextHighlight text={note.title} highlight={searchQuery} />
                                </h3>
                                {note.taskId && (
                                    <FiLayers className="text-purple-400 flex-shrink-0" size={16} title="Associated with a task" />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 ml-8">
                            <FiClock size={10} />
                            <span>{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'No date'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onToggleExpand && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                                className="text-zinc-500 hover:text-white transition-colors"
                                title={isExpanded ? "Collapse" : "Expand"}
                            >
                                {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                            </button>
                        )}
                        {TypeIcon ? (
                            <TypeIcon className={`${typeIconColorClass || 'text-zinc-400'} flex-shrink-0`} size={20} />
                        ) : (
                            <div className="w-5 h-5 rounded bg-zinc-800 flex-shrink-0" />
                        )}
                    </div>
                </div>

                {/* content area now flexes and scrolls internally */}
                <div className="ql-snow text-sm text-zinc-400 overflow-y-auto notes-scroll flex-1">
                    <div className="ql-editor" dangerouslySetInnerHTML={{ __html: renderContent(note.content || '') }} />
                </div>

                <div className="mt-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {noteTags.map((tag: string) => (
                            <span key={tag} className="px-2.5 py-1 bg-white/5 text-zinc-300 text-xs rounded-full">{tag}</span>
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-full ${priorityBgColorClass(note.priority)} ${priorityTextColorClass(note.priority)}`}>
                                {formatPriority(note.priority)}
                            </span>
                            
                            {note.sharedWith && note.sharedWith.length > 0 && (
                                <div className="flex -space-x-2">
                                    {note.sharedWith.slice(0, 3).map((user, idx) => (
                                        user.image ? (
                                            <Image key={idx} src={user.image} alt={user.name || user.email || 'User'} width={20} height={20} className="rounded-full border-2 border-slate-900" title={user.name || user.email || ''} />
                                        ) : (
                                            <div key={idx} className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px] font-bold border-2 border-slate-900" title={user.name || user.email || ''}>
                                                {(user.name || user.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )
                                    ))}
                                    {note.sharedWith.length > 3 && (
                                        <div className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center text-[10px] font-bold border-2 border-slate-900">
                                            +{note.sharedWith.length - 3}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="relative" ref={dropdownRef}>
                                <button 
                                    onClick={() => setShowUserDropdown(!showUserDropdown)} 
                                    className="text-zinc-400 hover:text-white transition-colors"
                                    title="Add User"
                                >
                                    <FiUserPlus size={16} />
                                </button>
                                {showUserDropdown && availableUsers.length > 0 && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl p-2 border border-slate-700 z-50">
                                        <select
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white mb-2 focus:outline-none focus:border-purple-500"
                                        >
                                            <option value="">Select user...</option>
                                            {availableUsers.map(u => (
                                                <option key={u.id} value={u.email || ''}>
                                                    {u.name || u.email}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleAddUser}
                                            disabled={!selectedUser}
                                            className="w-full bg-purple-600 text-white text-xs py-1 rounded hover:bg-purple-500 disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => onEdit?.(note)} className="text-zinc-400 hover:text-white transition-colors"><FiEdit2 size={16} /></button>
                            <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(); fd.append('id', note.id.toString()); await onNoteDelete(fd); }} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={note.id} />
                                <button type="submit" className="text-zinc-400 hover:text-red-500 transition-colors"><FiTrash2 size={16} /></button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const rowClasses = "border-b border-white/5";

    return (
        <tr className={rowClasses}>
            <td className="px-6 py-4 text-sm font-medium text-white">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        {note.owner?.image ? (
                            <Image src={note.owner.image} alt={note.owner.name || 'Owner'} width={20} height={20} className="rounded-full border border-white/10" />
                        ) : note.owner?.name ? (
                            <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold border border-white/10">
                                {note.owner.name.charAt(0).toUpperCase()}
                            </div>
                        ) : null}
                        <TextHighlight text={note.title} highlight={searchQuery} />
                    </div>
                    {note.sharedWith && note.sharedWith.length > 0 && (
                        <div className="flex items-center gap-1 ml-6">
                            <span className="text-[10px] text-zinc-500">+</span>
                            <div className="flex -space-x-1">
                                {note.sharedWith.slice(0, 2).map((user, idx) => (
                                    user.image ? (
                                        <Image key={idx} src={user.image} alt={user.name || user.email || 'User'} width={16} height={16} className="rounded-full border border-slate-900" title={user.name || user.email || ''} />
                                    ) : (
                                        <div key={idx} className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[8px] font-bold border border-slate-900" title={user.name || user.email || ''}>
                                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )
                                ))}
                                {note.sharedWith.length > 2 && (
                                    <div className="w-4 h-4 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center text-[8px] font-bold border border-slate-900">
                                        +{note.sharedWith.length - 2}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-zinc-400">
                <div className="ql-snow">
                    <div className="ql-editor !p-0" dangerouslySetInnerHTML={{ __html: renderContent(note.content || '') }} />
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-zinc-400">
                <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-full ${priorityBgColorClass(note.priority)} ${priorityTextColorClass(note.priority)}`}>
                    {formatPriority(note.priority)}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-zinc-400">
                <div className="flex flex-wrap gap-1">
                    {noteTags.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-white/5 text-zinc-300 text-xs rounded-full">{tag}</span>
                    ))}
                </div>
            </td>
            <td className="px-6 py-4 text-sm font-medium text-right space-x-2">
                <div className="relative inline-block" ref={dropdownRef}>
                    <button 
                        type="button" 
                        onClick={() => setShowUserDropdown(!showUserDropdown)} 
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                        title="Add User"
                    >
                        <FiUserPlus size={16} />
                    </button>
                    {showUserDropdown && availableUsers.length > 0 && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl p-2 border border-slate-700 z-50">
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white mb-2 focus:outline-none focus:border-purple-500"
                            >
                                <option value="">Select user...</option>
                                {availableUsers.map(u => (
                                    <option key={u.id} value={u.email || ''}>
                                        {u.name || u.email}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddUser}
                                disabled={!selectedUser}
                                className="w-full bg-purple-600 text-white text-xs py-1 rounded hover:bg-purple-500 disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                    )}
                </div>
                <button type="button" onClick={() => onEdit?.(note)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"><FiEdit2 size={16} /></button>
                <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(); fd.append('id', note.id.toString()); await onNoteDelete(fd); }} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={note.id} />
                    <button type="submit" className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-white/10"><FiTrash2 size={16} /></button>
                </form>
            </td>
        </tr>
    );
}