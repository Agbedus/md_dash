'use client';
// Force rebuild for hydration

import React, { useState, useOptimistic, useTransition } from 'react';
import { getClients } from '@/app/clients/actions';
import { Client } from '@/types/client';
import { FiPlus, FiSearch, FiX, FiCheck, FiEdit2, FiTrash2, FiMail, FiGlobe, FiUser } from 'react-icons/fi';
import { createClient, updateClient, deleteClient } from '@/app/clients/actions';
import ClientCard from './client-card';
import toast from 'react-hot-toast';

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
    (state: Client[], action: { type: 'add' | 'update' | 'delete', client: Client & { pending?: boolean } }) => {
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
    const tempId = `temp-${Date.now()}`;
    const newClient: Client & { pending?: boolean } = {
      id: tempId,
      companyName: formData.get('companyName') as string,
      contactPersonName: formData.get('contactPersonName') as string,
      contactEmail: formData.get('contactEmail') as string,
      websiteUrl: formData.get('websiteUrl') as string,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    // UI Feedback
    addOptimisticClient({ type: 'add', client: newClient });
    setIsCreateModalOpen(false);

    try {
      const result = await createClient(formData);
      if (result?.success) {
        toast.success("Client created successfully");
        const clients = await getClients();
        startTransition(() => {
          setAllClients(clients);
        });
      } else {
        toast.error(result?.error || "Failed to create client");
        // Revert UI if needed by refreshing from source
        const clients = await getClients();
        setAllClients(clients);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      const clients = await getClients();
      setAllClients(clients);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    const editing = editingClient;
    if (!editing) return;

    const updatedClient: Client & { pending?: boolean } = {
      ...editing,
      companyName: formData.get('companyName') as string,
      contactPersonName: formData.get('contactPersonName') as string,
      contactEmail: formData.get('contactEmail') as string,
      websiteUrl: formData.get('websiteUrl') as string,
      pending: true,
    };

    // UI Feedback
    addOptimisticClient({ type: 'update', client: updatedClient });
    setEditingClient(null);

    try {
      formData.set('id', editing.id);
      const result = await updateClient(formData);
      if (result?.success) {
        toast.success("Client updated successfully");
        const clients = await getClients();
        startTransition(() => {
          setAllClients(clients);
        });
      } else {
        toast.error(result?.error || "Failed to update client");
        const clients = await getClients();
        setAllClients(clients);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
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
        const result = await deleteClient(formData);
        if (result?.success) {
          toast.success("Client deleted successfully");
          const clients = await getClients();
          startTransition(() => {
            setAllClients(clients);
          });
        } else {
          toast.error(result?.error || "Failed to delete client");
          const clients = await getClients();
          setAllClients(clients);
        }
      } catch (err) {
        toast.error("An unexpected error occurred");
        const clients = await getClients();
        setAllClients(clients);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Client Ecosystem</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Global company coordination & contact intelligence.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-bold text-white transition-all duration-300 hover-scale"
        >
          <div className="p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
            <FiPlus className="w-4 h-4" />
          </div>
          <span>Initialize Client</span>
        </button>
      </div>

      {/* Strategic Search */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <div className="relative w-full lg:w-96 group">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[var(--pastel-indigo)] transition-colors"/>
          <input
            type="text"
            placeholder="Search ecosystem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-white/20 text-white placeholder:text-zinc-600 transition-all text-sm"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <ClientCard 
            key={client.id} 
            client={client} 
            onEdit={setEditingClient} 
            onDelete={handleDelete}
            isPending={(client as any).pending}
          />
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-20 text-center glass rounded-3xl">
            <FiUser className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">No clients found matching your search.</p>
          </div>
        )}
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
