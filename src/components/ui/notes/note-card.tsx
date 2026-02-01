"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { Note } from "@/types/note";
import 'quill/dist/quill.snow.css';
import { FiEdit2, FiTrash2, FiFileText, FiCheckSquare, FiBookOpen, FiUsers, FiZap, FiLink, FiCode, FiBookmark, FiEdit3, FiCheckCircle, FiUserPlus, FiLayers, FiClock, FiStar, FiMapPin, FiArchive } from "react-icons/fi";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import UserAvatarGroup from "@/components/ui/user-avatar-group";
import { Portal } from "@/components/ui/portal";

interface NoteCardProps {
    note: Note;
    // allow async handlers (Promise<void>) from parent
    onNoteUpdate: (formData: FormData) => Promise<void> | void;
    onNoteDelete: (formData: FormData) => Promise<void> | void;
    viewMode: 'grid' | 'table';
    searchQuery?: string;
    onEdit?: (note: Note) => void;
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

export default function NoteCard({ note, onNoteUpdate, onNoteDelete, viewMode, searchQuery = '', onEdit, availableUsers = [], isExpanded = false, onToggleExpand }: NoteCardProps) {
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [hoveredOwner, setHoveredOwner] = useState(false);
    const [ownerCoords, setOwnerCoords] = useState({ top: 0, left: 0 });
    const ownerRef = useRef<HTMLDivElement>(null);

    const handleOwnerMouseEnter = () => {
        if (ownerRef.current) {
            const rect = ownerRef.current.getBoundingClientRect();
            setOwnerCoords({
                top: rect.top,
                left: rect.left + rect.width / 2,
            });
            setHoveredOwner(true);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddUser = async () => {
        if (!selectedUser) return;
        setIsSharing(true);
        setShowUserDropdown(false);
        const currentShared = note.shared_with || [];
        // Map hydrated objects back to IDs for the API
        const sharedValues = currentShared.map(u => typeof u === 'string' ? u : u.id);
        
        try {
            if (!sharedValues.includes(selectedUser)) {
                const newList = [...sharedValues, selectedUser];
                const fd = new FormData();
                fd.append('id', String(note.id));
                fd.append('shared_with', JSON.stringify(newList));
                await onNoteUpdate(fd);
            }
        } finally {
            setIsSharing(false);
            setSelectedUser("");
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
    

    const getNoteTags = () => {
        if (!note.tags) return [];
        if (typeof note.tags === 'string') {
            return note.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        return [];
    };
    const noteTags = getNoteTags();
    
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
            <div className={`glass rounded-2xl p-5 flex flex-col h-full hover-glow transition-all duration-300 ${isExpanded ? 'ring-2 ring-purple-500/50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-bold text-lg text-white tracking-tight truncate">
                                <TextHighlight text={note.title} highlight={searchQuery} />
                            </h3>
                            {note.task_id && (
                                <FiLayers className="text-purple-400 flex-shrink-0" size={16} title="Associated with a task" />
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                            <FiClock size={10} />
                            <span suppressHydrationWarning>{note.updated_at ? new Date(note.updated_at).toLocaleDateString() : note.created_at ? new Date(note.created_at).toLocaleDateString() : 'No date'}</span>
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
                            <TypeIcon className={`${typeIconColorClass || 'text-zinc-400'} flex-shrink-0`} size={18} />
                        ) : (
                            <div className="w-4 h-4 rounded bg-zinc-800 flex-shrink-0" />
                        )}
                    </div>
                </div>

                {/* content area now flexes and scrolls internally */}
                <div className="ql-snow text-sm text-zinc-400 overflow-y-auto notes-scroll flex-1">
                    <div className="ql-editor" dangerouslySetInnerHTML={{ __html: renderContent(note.content || '') }} />
                </div>

                <div className="mt-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {noteTags.map((tag: string) => (
                            <span key={tag} className="px-2.5 py-1 bg-white/5 text-zinc-300 text-xs rounded-full">{tag}</span>
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                                {note.is_pinned === 1 && (
                                    <div className="text-blue-400" title="Pinned">
                                        <FiMapPin size={12} className="fill-current" />
                                    </div>
                                )}
                                {note.is_favorite === 1 && (
                                    <div className="text-yellow-400" title="Favorite">
                                        <FiStar size={12} className="fill-current" />
                                    </div>
                                )}
                                {note.is_archived === 1 && (
                                    <div className="text-zinc-500" title="Archived">
                                        <FiArchive size={12} className="fill-current" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <div 
                                    ref={ownerRef}
                                    onMouseEnter={handleOwnerMouseEnter}
                                    onMouseLeave={() => setHoveredOwner(false)}
                                    className="relative flex-shrink-0 cursor-pointer"
                                >
                                    {note.owner?.avatar_url || note.owner?.image ? (
                                        <Image 
                                            src={(note.owner.avatar_url || note.owner.image)!} 
                                            alt={note.owner.full_name || note.owner.name || 'Owner'} 
                                            width={32} 
                                            height={32} 
                                            className="rounded-full border-2 border-zinc-900 ring-2 ring-purple-500/20 object-cover" 
                                        />
                                    ) : note.owner?.name || note.owner?.full_name ? (
                                        <div 
                                            className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold border-2 border-zinc-900 ring-2 ring-purple-500/20"
                                        >
                                            {(note.owner.full_name || note.owner.name)!.charAt(0).toUpperCase()}
                                        </div>
                                    ) : null}
                                </div>
                                
                                {( (note.shared_with && note.shared_with.length > 0) || isSharing ) && (
                                    <div className="flex items-center gap-1 border-l border-white/5 pl-3">
                                        {note.shared_with && note.shared_with.length > 0 && (
                                            <UserAvatarGroup 
                                                users={note.shared_with.map(u => typeof u === 'string' ? { name: u } : u)} 
                                                size="sm" 
                                                limit={3} 
                                            />
                                        )}
                                        {isSharing && (
                                            <div className="w-6 h-6 rounded-full bg-white/10 animate-pulse" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Owner Tooltip */}
                        {hoveredOwner && note.owner && (
                            <Portal>
                                <div 
                                    style={{
                                        position: 'fixed',
                                        top: `${ownerCoords.top - 8}px`,
                                        left: `${ownerCoords.left}px`,
                                        transform: 'translate(-50%, -100%)',
                                    }}
                                    className="mb-2 w-48 p-2 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-1 duration-200 z-[9999]"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex-shrink-0 relative overflow-hidden ring-1 ring-white/10">
                                            {note.owner.avatar_url || note.owner.image ? (
                                                <Image src={note.owner.avatar_url || note.owner.image || ''} alt={note.owner.name || ''} fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10">
                                                    {(note.owner.full_name || note.owner.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-white truncate">{note.owner.full_name || note.owner.name}</p>
                                            <p className="text-[10px] text-zinc-500 truncate">Creator</p>
                                            {note.owner.email && <p className="text-[10px] text-zinc-500 truncate">{note.owner.email}</p>}
                                        </div>
                                    </div>
                                </div>
                            </Portal>
                        )}
                        <div className="flex items-center space-x-2">
                            <div className="relative" ref={dropdownRef}>
                                <button 
                                    onClick={() => setShowUserDropdown(!showUserDropdown)} 
                                    disabled={isSharing}
                                    className={`transition-colors ${isSharing ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white'}`}
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
                                                <option key={u.id} value={u.id}>
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
                        <div className="flex items-center gap-1">
                            {note.is_pinned === 1 && (
                                <div className="text-blue-400" title="Pinned">
                                    <FiMapPin size={10} className="fill-current" />
                                </div>
                            )}
                            {note.is_favorite === 1 && (
                                <div className="text-yellow-400" title="Favorite">
                                    <FiStar size={10} className="fill-current" />
                                </div>
                            )}
                            {note.is_archived === 1 && (
                                <div className="text-zinc-500" title="Archived">
                                    <FiArchive size={10} className="fill-current" />
                                </div>
                            )}
                        </div>
                        <div 
                            ref={ownerRef}
                            onMouseEnter={handleOwnerMouseEnter}
                            onMouseLeave={() => setHoveredOwner(false)}
                            className="relative flex-shrink-0 cursor-pointer"
                        >
                            {note.owner?.avatar_url || note.owner?.image ? (
                                <Image src={(note.owner.avatar_url || note.owner.image)!} alt={note.owner.full_name || note.owner.name || 'Owner'} width={28} height={28} className="rounded-full border border-white/10 object-cover" />
                            ) : note.owner?.name || note.owner?.full_name ? (
                                <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold border border-white/10">
                                    {(note.owner.full_name || note.owner.name)!.charAt(0).toUpperCase()}
                                </div>
                            ) : null}
                        </div>
                        <TextHighlight text={note.title} highlight={searchQuery} />
                    </div>
                    {( (note.shared_with && note.shared_with.length > 0) || isSharing ) && (
                        <div className="flex items-center gap-1 ml-6 shrink-0">
                            {note.shared_with && note.shared_with.length > 0 && (
                                <>
                                    <span className="text-[10px] text-zinc-500">+</span>
                                    <UserAvatarGroup 
                                        users={note.shared_with.map(u => typeof u === 'string' ? { name: u } : u)} 
                                        size="sm" 
                                        limit={2} 
                                    />
                                </>
                            )}
                            {isSharing && (
                                <div className="w-5 h-5 rounded-full bg-white/10 animate-pulse" />
                            )}
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
                        disabled={isSharing}
                        className={`p-2 rounded-lg transition-colors ${isSharing ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
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
                                    <option key={u.id} value={u.id}>
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
            {/* Owner Tooltip */}
            {hoveredOwner && note.owner && (
                <Portal>
                    <div 
                        style={{
                            position: 'fixed',
                            top: `${ownerCoords.top - 8}px`,
                            left: `${ownerCoords.left}px`,
                            transform: 'translate(-50%, -100%)',
                        }}
                        className="mb-2 w-48 p-2 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-1 duration-200 z-[9999]"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-zinc-800 flex-shrink-0 relative overflow-hidden ring-1 ring-white/10">
                                {note.owner.avatar_url || note.owner.image ? (
                                    <Image src={note.owner.avatar_url || note.owner.image || ''} alt={note.owner.name || ''} fill className="object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10">
                                        {(note.owner.full_name || note.owner.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{note.owner.full_name || note.owner.name}</p>
                                <p className="text-[10px] text-zinc-500 truncate">Creator</p>
                                {note.owner.email && <p className="text-[10px] text-zinc-500 truncate">{note.owner.email}</p>}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </tr>
    );
}