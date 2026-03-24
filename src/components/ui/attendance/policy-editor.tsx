'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { OfficeLocation, AttendancePolicy } from '@/types/attendance';
import { getAttendancePolicy, updateAttendancePolicy } from '@/app/(dashboard)/attendance/actions';
import { FiSettings, FiCheck } from 'react-icons/fi';
import { toast } from '@/lib/toast';

export default function PolicyEditor({ officeLocationId }: { officeLocationId: number }) {
    const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        auto_clock_in: true,
        auto_clock_out: true,
        check_in_open_time: '07:30:00',
        check_in_close_time: '10:00:00',
        work_start_time: '08:30:00',
        work_end_time: '18:00:00',
        auto_clock_out_time: '18:00:00',
        temporarily_out_grace_minutes: 5,
        out_of_office_grace_minutes: 10,
        return_to_office_confirmation_minutes: 2,
    });

    useEffect(() => {
        if (!officeLocationId) return;
        let cancelled = false;
        startTransition(async () => {
            const p = await getAttendancePolicy(officeLocationId);
            if (cancelled) return;
            setPolicy(p);
            if (p) {
                setForm({
                    auto_clock_in: p.auto_clock_in ?? true,
                    auto_clock_out: p.auto_clock_out ?? true,
                    check_in_open_time: p.check_in_open_time || '07:30:00',
                    check_in_close_time: p.check_in_close_time || '10:00:00',
                    work_start_time: p.work_start_time || '08:30:00',
                    work_end_time: p.work_end_time || '18:00:00',
                    auto_clock_out_time: p.auto_clock_out_time || '18:00:00',
                    temporarily_out_grace_minutes: p.temporarily_out_grace_minutes ?? 5,
                    out_of_office_grace_minutes: p.out_of_office_grace_minutes ?? 10,
                    return_to_office_confirmation_minutes: p.return_to_office_confirmation_minutes ?? 2,
                });
            }
        });
        return () => { cancelled = true; };
    }, [officeLocationId]);

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateAttendancePolicy(officeLocationId, form);
        if (result.success) {
            toast.success('Policy updated successfully');
        } else {
            toast.error(result.error || 'Failed to update policy');
        }
        setIsSaving(false);
    };

    const inputClass = "w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-colors";
    const labelClass = "block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5";

    // Helper to strip :SS for HTML time input
    const toTimeValue = (val: string | null) => val ? val.substring(0, 5) : '';
    // Helper to add :00 back for API
    const fromTimeValue = (val: string) => `${val}:00`;

    return (
        <div className="glass p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FiSettings className="text-emerald-400" />
                        Attendance Policy
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Configure operational windows and grace periods</p>
                </div>
            </div>

            {isPending ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 bg-white/[0.03] rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Automation Toggles */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div>
                                <p className="text-sm font-medium text-white leading-tight">Auto Clock-In</p>
                                <p className="text-[10px] text-zinc-600 mt-0.5">Automatic trigger</p>
                            </div>
                            <button
                                onClick={() => setForm(f => ({ ...f, auto_clock_in: !f.auto_clock_in }))}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.auto_clock_in ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${form.auto_clock_in ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div>
                                <p className="text-sm font-medium text-white leading-tight">Auto Clock-Out</p>
                                <p className="text-[10px] text-zinc-600 mt-0.5">Automatic trigger</p>
                            </div>
                            <button
                                onClick={() => setForm(f => ({ ...f, auto_clock_out: !f.auto_clock_out }))}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.auto_clock_out ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${form.auto_clock_out ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Check-in Windows */}
                    <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-widest pl-1">Check-in Window</h4>
                        <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                            <div>
                                <label className={labelClass}>Window Opens</label>
                                <input
                                    type="time"
                                    value={toTimeValue(form.check_in_open_time)}
                                    onChange={e => setForm(f => ({ ...f, check_in_open_time: fromTimeValue(e.target.value) }))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Window Closes</label>
                                <input
                                    type="time"
                                    value={toTimeValue(form.check_in_close_time)}
                                    onChange={e => setForm(f => ({ ...f, check_in_close_time: fromTimeValue(e.target.value) }))}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Work Hours & Auto Clock-out */}
                    <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-widest pl-1">Workday & Automation</h4>
                        <div className="grid grid-cols-3 gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                            <div>
                                <label className={labelClass}>Work Start</label>
                                <input
                                    type="time"
                                    value={toTimeValue(form.work_start_time)}
                                    onChange={e => setForm(f => ({ ...f, work_start_time: fromTimeValue(e.target.value) }))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Work End</label>
                                <input
                                    type="time"
                                    value={toTimeValue(form.work_end_time)}
                                    onChange={e => setForm(f => ({ ...f, work_end_time: fromTimeValue(e.target.value) }))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Auto Clock-Out Time</label>
                                <input
                                    type="time"
                                    value={toTimeValue(form.auto_clock_out_time)}
                                    onChange={e => setForm(f => ({ ...f, auto_clock_out_time: fromTimeValue(e.target.value) }))}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grace Periods */}
                    <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-widest pl-1">Grace Periods (Minutes)</h4>
                        <div className="grid grid-cols-3 gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                            <div>
                                <label className={labelClass}>Temp Out</label>
                                <input
                                    type="number"
                                    value={form.temporarily_out_grace_minutes}
                                    onChange={e => setForm(f => ({ ...f, temporarily_out_grace_minutes: parseInt(e.target.value) || 0 }))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Out Of Office</label>
                                <input
                                    type="number"
                                    value={form.out_of_office_grace_minutes}
                                    onChange={e => setForm(f => ({ ...f, out_of_office_grace_minutes: parseInt(e.target.value) || 0 }))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Return Confirm</label>
                                <input
                                    type="number"
                                    value={form.return_to_office_confirmation_minutes}
                                    onChange={e => setForm(f => ({ ...f, return_to_office_confirmation_minutes: parseInt(e.target.value) || 0 }))}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                    >
                        <FiCheck className="text-sm" />
                        {isSaving ? 'Saving...' : 'Update Policy'}
                    </button>
                </div>
            )}
        </div>
    );
}
