'use client';

import React, { useState } from 'react';
import type { AttendanceRecord } from '@/types/attendance';
import { FiX, FiClock, FiCheck, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { toast } from '@/lib/toast';

interface Props {
    record: AttendanceRecord;
    onClose: () => void;
    onOverride: (recordId: number, clockIn: string | null, clockOut: string | null) => Promise<void>;
}

export default function OverrideModal({ record, onClose, onOverride }: Props) {
    const clockInSource = record.clock_in_at || record.clock_in;
    const clockOutSource = record.clock_out_at || record.clock_out;
    const dateSource = record.work_date || record.date || '';

    const [clockIn, setClockIn] = useState(
        clockInSource ? new Date(clockInSource).toTimeString().slice(0, 5) : ''
    );
    const [clockOut, setClockOut] = useState(
        clockOutSource ? new Date(clockOutSource).toTimeString().slice(0, 5) : ''
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Convert time inputs to full ISO strings using the record date
            const clockInISO = clockIn ? `${dateSource}T${clockIn}:00` : null;
            const clockOutISO = clockOut ? `${dateSource}T${clockOut}:00` : null;

            await onOverride(record.id, clockInISO, clockOutISO);
            toast.success('Attendance overridden successfully', {
                icon: <FiCheckCircle size={22} className="text-emerald-400" />
            });
        } catch {
            toast.error('Failed to override attendance', {
                icon: <FiXCircle size={22} className="text-rose-400" />
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass p-6 rounded-2xl border border-white/10 w-full max-w-md mx-4 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Override Attendance</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {record.userName || 'User'} · {dateSource ? new Date(dateSource + (dateSource.includes('T') ? '' : 'T00:00:00')).toLocaleDateString() : 'Today'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            <FiClock className="inline mr-1" />
                            Clock In Time
                        </label>
                        <input
                            type="time"
                            value={clockIn}
                            onChange={e => setClockIn(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            <FiClock className="inline mr-1" />
                            Clock Out Time
                        </label>
                        <input
                            type="time"
                            value={clockOut}
                            onChange={e => setClockOut(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all"
                        >
                            <FiX className="text-sm" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                        >
                            <FiCheck className="text-sm" />
                            {isSubmitting ? 'Saving...' : 'Apply Override'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
