'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User } from '@/types/user';
import { FiSearch, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { updateUser, deleteUser, getUsers } from '@/app/users/actions';
import { useOptimistic, useTransition } from 'react';

interface UsersPageClientProps {
  initialUsers: User[];
  currentUser?: {
    role?: string; // Keeping for backward compat if needed, but we use roles now
    roles?: string[];
    id?: string;
  };
}

const AVAILABLE_ROLES = ['staff', 'supervisor', 'project_manager', 'manager', 'super_admin'];

export default function UsersPageClient({ initialUsers, currentUser }: UsersPageClientProps) {
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [, startTransition] = useTransition();

  // Optimistic UI for Users
  const [optimisticUsers, addOptimisticUser] = useOptimistic(
    allUsers,
    (state: User[], action: { type: 'update' | 'delete', user: User }) => {
      switch (action.type) {
        case 'update':
          return state.map(u => u.id === action.user.id ? action.user : u);
        case 'delete':
          return state.filter(u => u.id !== action.user.id);
        default:
          return state;
      }
    }
  );
  
  // Temporary state for editing
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const filteredUsers = optimisticUsers.filter(user =>
    (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (user: User) => {
    setEditingId(user.id);
    setEditForm({
        ...user,
        roles: user.roles || ['staff']
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    setEditForm(prev => {
        const currentRoles = prev.roles || [];
        if (checked) {
            return { ...prev, roles: [...currentRoles, role] };
        } else {
            return { ...prev, roles: currentRoles.filter(r => r !== role) };
        }
    });
  };

  const saveUser = async () => {
    if (!editingId) return;
    
    const formData = new FormData();
    formData.set('id', editingId);
    formData.set('fullName', editForm.fullName || '');
    formData.set('email', editForm.email || '');
    formData.set('avatarUrl', editForm.avatarUrl || '');
    formData.set('roles', JSON.stringify(editForm.roles || []));

    // Optimistic Update
    const updatedUser: User = {
        ...allUsers.find(u => u.id === editingId)!,
        fullName: editForm.fullName || '',
        email: editForm.email || '',
        avatarUrl: editForm.avatarUrl || '',
        roles: editForm.roles || [],
    };
    addOptimisticUser({ type: 'update', user: updatedUser });

    setEditingId(null);
    setEditForm({});

    try {
        await updateUser(formData);
        const users = await getUsers();
        startTransition(() => {
            setAllUsers(users);
        });
    } catch (err) {
        console.error(err);
        const users = await getUsers();
        setAllUsers(users);
    }
  };

  const handleDelete = async (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.fullName || 'this user'}?`)) {
      addOptimisticUser({ type: 'delete', user });
      try {
        const formData = new FormData();
        formData.set('id', user.id);
        await deleteUser(formData);
        const users = await getUsers();
        startTransition(() => {
            setAllUsers(users);
        });
      } catch (err) {
        console.error(err);
        const users = await getUsers();
        setAllUsers(users);
      }
    }
  };

  const userRoles = currentUser?.roles || [];
  const canEdit = userRoles.includes('super_admin');
  const canDelete = userRoles.includes('super_admin');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:flex-items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">Users</h1>
          <p className="text-zinc-400 text-sm md:text-lg">Manage team members and their roles.</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass p-3 md:p-4 rounded-2xl mb-6 md:mb-8 hidden md:block">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Roles</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Avatar URL</th>
                {(canEdit || canDelete) && (
                  <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => {
                const isEditing = editingId === user.id;
                return (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {!isEditing && (
                          user.avatarUrl ? (
                            <Image 
                              src={user.avatarUrl} 
                              alt={user.fullName || 'User'}
                              width={40}
                              height={40}
                              className="rounded-full object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                              {(user.fullName || user.email).charAt(0).toUpperCase()}
                            </div>
                          )
                      )}
                      {isEditing ? (
                          <input 
                            type="text" 
                            value={editForm.fullName || ''} 
                            onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm w-full"
                          />
                      ) : (
                        <div className="text-sm font-medium text-white">{user.fullName || 'Unknown User'}</div>
                      )}
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {isEditing ? (
                        <input 
                            type="email" 
                            value={editForm.email || ''} 
                            onChange={e => setEditForm({...editForm, email: e.target.value})}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm w-full"
                        />
                    ) : user.email}
                  </td>

                  {/* Roles */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_ROLES.map(role => (
                                <label key={role} className="flex items-center gap-1 text-xs text-zinc-300 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={editForm.roles?.includes(role)}
                                        onChange={e => handleRoleChange(role, e.target.checked)}
                                        className="rounded border-white/10 bg-white/5"
                                    />
                                    <span className="capitalize">{role.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {user.roles?.map(role => (
                                <span key={role} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-zinc-300 capitalize border border-white/5">
                                {role.replace('_', ' ')}
                                </span>
                            ))}
                        </div>
                    )}
                  </td>

                  {/* Avatar URL */}
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={editForm.avatarUrl || ''} 
                            onChange={e => setEditForm({...editForm, avatarUrl: e.target.value})}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm w-full"
                            placeholder="https://..."
                        />
                    ) : (
                        <span className="truncate max-w-[150px] block" title={user.avatarUrl || ''}>{user.avatarUrl || '-'}</span>
                    )}
                  </td>

                  {/* Actions */}
                  {(canEdit || canDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={saveUser}
                                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-colors"
                                    title="Save"
                                >
                                    <FiCheck className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={cancelEditing}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                    title="Cancel"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                {canEdit && (
                                <button
                                    onClick={() => startEditing(user)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                    title="Edit"
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                </button>
                                )}
                                {canDelete && (
                                <button
                                    onClick={() => handleDelete(user)}
                                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors"
                                    title="Delete"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                                )}
                            </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
