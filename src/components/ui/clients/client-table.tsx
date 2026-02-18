'use client';

import React from 'react';
import { Client } from '@/types/client';
import { FiEdit2, FiTrash2, FiMail, FiGlobe, FiUser, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export default function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Company</th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contact</th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Website</th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest hidden sm:table-cell">Added</th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                      {client.companyName[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-white uppercase tracking-tight">{client.companyName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-300">
                  <div className="flex items-center gap-2">
                    <FiUser className="text-zinc-500" />
                    {client.contactPersonName || 'No contact'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <FiMail className="text-zinc-500" />
                    {client.contactEmail || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400 hidden lg:table-cell">
                   {client.websiteUrl ? (
                      <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                        <FiGlobe className="text-zinc-500" />
                        {client.websiteUrl.replace(/^https?:\/\//, '')}
                      </a>
                   ) : 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500 hidden sm:table-cell">
                   <div className="flex items-center gap-2">
                    <FiCalendar className="text-zinc-500" size={12} />
                    {client.createdAt ? format(new Date(client.createdAt), 'MMM d, yyyy') : 'N/A'}
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(client)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                      title="Edit"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(client)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
