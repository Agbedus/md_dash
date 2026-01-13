'use client';

import React, { useState, useOptimistic, useTransition } from 'react';
import { getClients } from '@/app/clients/actions';
import { Client } from '@/types/client';
import { FiPlus, FiSearch, FiX, FiCheck, FiEdit2, FiTrash2, FiMail, FiGlobe, FiUser } from 'react-icons/fi';
import { createClient, updateClient, deleteClient } from '@/app/clients/actions';

interface ClientsPageClientProps {
  initialClients: Client[];
}

export default function ClientsPageClient({ initialClients }: ClientsPageClientProps) {
  const [allClients, setAllClients] = useState<Client[]>(initialClients);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [, startTransition] = useTransition();

  // Optimistic UI for Clients
  const [optimisticClients, addOptimisticClient] = useOptimistic(
    allClients,
    (state: Client[], action: { type: 'add' | 'update' | 'delete', client: Client }) => {
      switch (action.type) {
        case 'add':
          return [...state, action.client];
        case 'update':
          return state.map(c => c.id === action.client.id ? action.client : c);
        case 'delete':
          return state.filter(c => c.id !== action.client.id);
        default:
          return state;
      }
    }
  );

  const filteredClients = optimisticClients.filter(client =>
    client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async (formData: FormData) => {
    const newClient: Client = {
      id: Date.now().toString(), // Temp ID
      companyName: formData.get('companyName') as string,
      contactPersonName: formData.get('contactPersonName') as string,
      contactEmail: formData.get('contactEmail') as string,
      websiteUrl: formData.get('websiteUrl') as string,
      createdAt: new Date().toISOString(),
    };
    addOptimisticClient({ type: 'add', client: newClient });
    setIsCreateModalOpen(false);

    try {
      await createClient(formData);
      const clients = await getClients();
      startTransition(() => {
        setAllClients(clients);
      });
    } catch (err) {
      console.error(err);
      const clients = await getClients();
      setAllClients(clients);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    const editing = editingClient;
    if (editing) {
      const updatedClient: Client = {
        ...editing,
        companyName: formData.get('companyName') as string,
        contactPersonName: formData.get('contactPersonName') as string,
        contactEmail: formData.get('contactEmail') as string,
        websiteUrl: formData.get('websiteUrl') as string,
      };
      addOptimisticClient({ type: 'update', client: updatedClient });
    }
    setEditingClient(null);

    try {
      formData.set('id', editing!.id);
      await updateClient(formData);
      const clients = await getClients();
      startTransition(() => {
        setAllClients(clients);
      });
    } catch (err) {
      console.error(err);
      const clients = await getClients();
      setAllClients(clients);
    }
  };

  const handleDelete = async (client: Client) => {
    if (confirm(`Are you sure you want to delete ${client.companyName}?`)) {
      addOptimisticClient({ type: 'delete', client });
      try {
        const formData = new FormData();
        formData.set('id', client.id);
        await deleteClient(formData);
        const clients = await getClients();
        startTransition(() => {
          setAllClients(clients);
        });
      } catch (err) {
        console.error(err);
        const clients = await getClients();
        setAllClients(clients);
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">Clients</h1>
          <p className="text-zinc-400 text-sm md:text-lg">Manage client companies and contacts.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs md:text-sm text-zinc-400 hover:text-white transition-all duration-200 group self-start md:self-auto">
          <div className="p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
            <FiPlus className="w-3 h-3 md:w-4 md:h-4" />
          </div>
          <span className="pr-2">New Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="glass p-3 md:p-4 rounded-2xl mb-6 md:mb-8 hidden md:block">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="group relative bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-white">{client.companyName}</h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingClient(client)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {client.contactPersonName && (
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                <FiUser className="w-4 h-4" />
                <span>{client.contactPersonName}</span>
              </div>
            )}

            {client.contactEmail && (
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                <FiMail className="w-4 h-4" />
                <span className="truncate">{client.contactEmail}</span>
              </div>
            )}

            {client.websiteUrl && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <FiGlobe className="w-4 h-4" />
                <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:text-indigo-400 transition-colors">
                  {client.websiteUrl}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Create New Client</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white">×</button>
            </div>
            <form action={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Company Name *</label>
                <input type="text" name="companyName" required className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Contact Person</label>
                <input type="text" name="contactPersonName" className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Contact Email</label>
                <input type="email" name="contactEmail" className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="contact@acme.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Website</label>
                <input type="url" name="websiteUrl" className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="https://acme.com" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-2.5 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all" title="Cancel">
                  <FiX className="w-5 h-5" />
                </button>
                <button type="submit" className="p-2.5 rounded-xl text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-all" title="Create Client">
                  <FiCheck className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Client</h2>
              <button onClick={() => setEditingClient(null)} className="text-zinc-400 hover:text-white">×</button>
            </div>
            <form action={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Company Name *</label>
                <input type="text" name="companyName" required defaultValue={editingClient.companyName} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Contact Person</label>
                <input type="text" name="contactPersonName" defaultValue={editingClient.contactPersonName || ''} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Contact Email</label>
                <input type="email" name="contactEmail" defaultValue={editingClient.contactEmail || ''} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Website</label>
                <input type="url" name="websiteUrl" defaultValue={editingClient.websiteUrl || ''} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingClient(null)} className="p-2.5 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all" title="Cancel">
                  <FiX className="w-5 h-5" />
                </button>
                <button type="submit" className="p-2.5 rounded-xl text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-all" title="Save Changes">
                  <FiCheck className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
