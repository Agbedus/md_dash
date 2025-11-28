import React from 'react';
import { statusMapping } from "@/types/task";

export default function TaskFormFields() {
    return (
        <>
            <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">Task Name</label>
                <input
                    type="text"
                    name="name"
                    className="block w-full bg-slate-800 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-300">Description</label>
                <textarea
                    name="description"
                    className="block w-full bg-slate-800 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium text-slate-300">Status</label>
                <select
                    name="status"
                    className="block w-full bg-slate-800 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                    {Object.entries(statusMapping).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                    ))}
                </select>
            </div>
        </>
    );
}