"use client";
import React, { useState } from "react";
import { FiX, FiCalendar, FiCheck } from "react-icons/fi";
import { createTimeOffRequest } from "@/app/(dashboard)/time-off/actions";
import type { TimeOffRequest, TimeOffType } from "@/types/time-off";
import { CustomDatePicker } from "@/components/ui/inputs/custom-date-picker";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface TimeOffModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const TIME_OFF_TYPES: { value: TimeOffType; label: string; description: string }[] = [
    { value: 'leave', label: 'Leave', description: 'Annual leave (max 15 days/year)' },
    { value: 'off', label: 'Day Off', description: 'Personal day off' },
    { value: 'sick', label: 'Sick Leave', description: 'Medical absence' },
    { value: 'other', label: 'Other', description: 'Other absence type' },
];

export default function TimeOffModal({ open, onClose, onCreated }: TimeOffModalProps) {
    const [type, setType] = useState<TimeOffType>('leave');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [justification, setJustification] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const requiresJustification = type !== 'leave';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            toast.error('Please select start and end dates');
            return;
        }
        if (requiresJustification && !justification.trim()) {
            toast.error('Justification is required for this type');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.set('type', type);
            formData.set('start_date', format(startDate, 'yyyy-MM-dd'));
            formData.set('end_date', format(endDate, 'yyyy-MM-dd'));
            if (justification.trim()) {
                formData.set('justification', justification.trim());
            }

            const result = await createTimeOffRequest(formData);
            if (result.success) {
                toast.success('Time-off request submitted');
                onCreated();
                onClose();
                // Reset
                setType('leave');
                setStartDate(null);
                setEndDate(null);
                setJustification('');
            } else {
                toast.error(result.error || 'Failed to submit request');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="glass w-full max-w-lg mx-4 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <FiCalendar className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-white">Request Time Off</h2>
                            <p className="text-xs text-zinc-500">Submit a request for approval</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Type */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TIME_OFF_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setType(t.value)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        type === t.value
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                            : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                                    }`}
                                >
                                    <div className="text-xs font-bold">{t.label}</div>
                                    <div className="text-[10px] mt-0.5 opacity-60">{t.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Start Date</label>
                            <CustomDatePicker
                                value={startDate}
                                onChange={setStartDate}
                                placeholder="Select start"
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">End Date</label>
                            <CustomDatePicker
                                value={endDate}
                                onChange={setEndDate}
                                placeholder="Select end"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Justification */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            Justification {requiresJustification && <span className="text-amber-400">*</span>}
                        </label>
                        <textarea
                            value={justification}
                            onChange={e => setJustification(e.target.value)}
                            placeholder={requiresJustification ? "Required for this type..." : "Optional reason..."}
                            rows={3}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 text-sm resize-none focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 transition-all"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.06] text-sm font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 text-sm font-bold transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FiCheck className="w-4 h-4" />
                            )}
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
