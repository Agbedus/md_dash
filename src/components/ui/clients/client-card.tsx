'use client';

import React from 'react';
import { Client } from '@/types/client';
import { FiEdit2, FiTrash2, FiMail, FiGlobe, FiUser, FiExternalLink, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';

interface ClientCardProps {
    client: Client;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
    isPending?: boolean;
}

export default function ClientCard({ client, onEdit, onDelete, isPending = false }: ClientCardProps) {
    return (
        <div 
            className={`group relative glass rounded-2xl p-6 transition-all duration-300 hover-glow ${
                isPending ? 'opacity-70 grayscale-[0.5] scale-[0.98]' : 'hover:-translate-y-1'
            }`}
        >
            {/* Pending Overlay/Indicator */}
            {isPending && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 backdrop-blur-[1px] rounded-2xl pointer-events-none">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] rounded-full border border-white/5 animate-pulse text-[11px] font-bold text-white uppercase tracking-wider shadow-xl">
                        <div className="h-2 w-2 bg-emerald-400 rounded-full animate-ping"></div>
                        Saving...
                    </div>
                </div>
            )}

            <div className="flex justify-between items-start mb-5">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white tracking-tight truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-emerald-400 transition-all duration-300">
                        {client.companyName}
                    </h3>
                    {client.createdAt && (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                            <FiClock size={10} className="text-zinc-600" />
                            <span>Added {format(new Date(client.createdAt), 'MMM yyyy')}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-2">
                    <button
                        onClick={() => onEdit(client)}
                        disabled={isPending}
                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-white border border-white/5 hover:border-white/5 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        title="Edit Client"
                    >
                        <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(client)}
                        disabled={isPending}
                        className="p-2 rounded-xl bg-rose-500/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        title="Delete Client"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Contact Person */}
                {client.contactPersonName && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/5 transition-colors group/item">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover/item:bg-indigo-500/20 transition-colors">
                            <FiUser className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-bold mb-0.5">Contact</span>
                            <span className="text-sm text-zinc-300 font-medium">{client.contactPersonName}</span>
                        </div>
                    </div>
                )}

                {/* Email */}
                {client.contactEmail && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/5 transition-colors group/item">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover/item:bg-emerald-500/20 transition-colors">
                            <FiMail className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-bold mb-0.5">Email</span>
                            <span className="text-sm text-zinc-300 font-medium truncate">{client.contactEmail}</span>
                        </div>
                    </div>
                )}

                {/* Website */}
                {client.websiteUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/5 transition-colors group/item relative overflow-hidden">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover/item:bg-amber-500/20 transition-colors">
                            <FiGlobe className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-bold mb-0.5">Website</span>
                            <a 
                                href={client.websiteUrl.startsWith('http') ? client.websiteUrl : `https://${client.websiteUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm text-zinc-400 hover:text-indigo-400 transition-colors truncate flex items-center gap-1.5"
                            >
                                {client.websiteUrl.replace(/^https?:\/\//, '')}
                                <FiExternalLink className="w-3 h-3 opacity-50" />
                            </a>
                        </div>
                        {/* Subtle decorative background glow for links */}
                        <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-indigo-500/5 blur-2xl rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Decorative background element */}
            <div className="absolute -z-10 right-4 top-4 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
    );
}
