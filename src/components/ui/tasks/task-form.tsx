"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

interface Task {
  id?: string;
  name: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'task' | 'in_progress' | 'completed';
}

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id'>) => Promise<void> | void;
  task?: Partial<Task>;
  onCancel?: () => void;
}

export function TaskForm({ onSubmit, task, onCancel }: TaskFormProps) {
  const [name, setName] = useState(task?.name || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [status, setStatus] = useState(task?.status || "task");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, description, dueDate, priority, status });
      toast.success(`Task ${task ? 'updated' : 'created'} successfully!`);
      if (!task) {
        setName("");
        setDescription("");
        setDueDate("");
        setPriority("medium");
      }
    } catch {
      toast.error(`Failed to ${task ? 'update' : 'create'} task.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border border-slate-700 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="p-2 border border-slate-700 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
          className="p-2 border border-slate-700 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'task' | 'in_progress' | 'completed')}
          className="p-2 border border-slate-700 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="task">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="p-2 border border-slate-700 rounded w-full mt-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      <div className="flex justify-end space-x-2 mt-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded">
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            task ? "Update Task" : "Add Task"
          )}
          {isSubmitting && <span>{task ? "Updating..." : "Adding..."}</span>}
        </button>
      </div>
    </form>
  );
}