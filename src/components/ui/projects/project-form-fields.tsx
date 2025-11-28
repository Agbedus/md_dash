'use client';

import React, { useState } from 'react';
import { Project } from '@/types/project';
import { User } from '@/types/user';
import { Client } from '@/types/client';
import { Combobox } from "@/components/ui/combobox";

interface ProjectFormFieldsProps {
  defaultValues?: Partial<Project>;
  users: User[];
  clients: Client[];
}

export function ProjectFormFields({ defaultValues, users, clients }: ProjectFormFieldsProps) {
  const [selectedOwner, setSelectedOwner] = useState<string | number | null>(
    defaultValues?.ownerId || null
  );
  const [selectedManagers, setSelectedManagers] = useState<(string | number)[]>(
    defaultValues?.managers ? defaultValues.managers.map(m => m.user.id) : []
  );
  const [selectedClient, setSelectedClient] = useState<string | number | null>(
    defaultValues?.clientId || null
  );

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              defaultValue={defaultValues?.name}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label htmlFor="key" className="block text-sm font-medium text-zinc-400 mb-1">
              Project Key
            </label>
            <input
              type="text"
              name="key"
              id="key"
              defaultValue={defaultValues?.key || ''}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="e.g., PROJ-123"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-1">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            defaultValue={defaultValues?.description || ''}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
            placeholder="Add details about this project..."
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-zinc-400 mb-1">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            id="tags"
            defaultValue={defaultValues?.tags || ''}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            placeholder="Comma-separated tags"
          />
        </div>
      </div>

      {/* Status & Priority */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Status & Priority</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-zinc-400 mb-1">
              Status
            </label>
            <select
              name="status"
              id="status"
              defaultValue={defaultValues?.status || 'planning'}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-zinc-400 mb-1">
              Priority
            </label>
            <select
              name="priority"
              id="priority"
              defaultValue={defaultValues?.priority || 'medium'}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Timeline</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-zinc-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              defaultValue={defaultValues?.startDate || ''}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-zinc-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              defaultValue={defaultValues?.endDate || ''}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Financials */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Financials</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-zinc-400 mb-1">
              Budget
            </label>
            <input
              type="number"
              name="budget"
              id="budget"
              defaultValue={defaultValues?.budget || ''}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="spent" className="block text-sm font-medium text-zinc-400 mb-1">
              Spent
            </label>
            <input
              type="number"
              name="spent"
              id="spent"
              defaultValue={defaultValues?.spent || 0}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-zinc-400 mb-1">
              Currency
            </label>
            <input
              type="text"
              name="currency"
              id="currency"
              defaultValue={defaultValues?.currency || 'USD'}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="USD"
            />
          </div>
        </div>

        <div>
          <label htmlFor="billingType" className="block text-sm font-medium text-zinc-400 mb-1">
            Billing Type
          </label>
          <select
            name="billingType"
            id="billingType"
            defaultValue={defaultValues?.billingType || 'non_billable'}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="non_billable">Non-Billable</option>
            <option value="time_and_materials">Time & Materials</option>
            <option value="fixed_price">Fixed Price</option>
          </select>
        </div>
      </div>

      {/* Team & Stakeholders */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Team & Stakeholders</h3>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Owner
            </label>
            <Combobox
              name="ownerId"
              options={users.map(u => ({ value: u.id, label: u.fullName || u.email, subLabel: u.email }))}
              value={selectedOwner || ''}
              onChange={(val) => setSelectedOwner(val as string | number | null)}
              placeholder="Select owner..."
              searchPlaceholder="Search users..."
              className="w-full"
            />
          </div>

          {/* Managers (Multi-Select) */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Managers
            </label>
            <Combobox
              name="managerIds"
              options={users.map(u => ({ value: u.id, label: u.fullName || u.email, subLabel: u.email }))}
              value={selectedManagers}
              onChange={(val) => setSelectedManagers(val as (string | number)[])}
              multiple
              placeholder="Select managers..."
              searchPlaceholder="Search users..."
              className="w-full"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Client
            </label>
            <Combobox
              name="clientId"
              options={clients.map(c => ({ value: c.id, label: c.companyName, subLabel: c.contactEmail || undefined }))}
              value={selectedClient || ''}
              onChange={(val) => setSelectedClient(val as string | number | null)}
              placeholder="Select client..."
              searchPlaceholder="Search clients..."
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
