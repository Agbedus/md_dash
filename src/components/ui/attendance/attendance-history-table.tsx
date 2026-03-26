'use client';

import React from 'react';
import type { AttendanceRecord, AttendanceState } from '@/types/attendance';
import { attendanceStateLabels, attendanceStateColors } from '@/types/attendance';
import { FiClock, FiEye } from 'react-icons/fi';

function computeHours(start: string | null | undefined, end: string | null | undefined): number | null {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(diff) || diff < 0) return null;
    return diff / (1000 * 60 * 60);
}

function formatTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AttendanceHistoryTable({ records }: { records: AttendanceRecord[] }) {
    if (records.length === 0) {
        return (
            <div className="glass p-8 rounded-2xl border border-white/5 text-center">
                <FiClock className="text-3xl text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">No attendance history yet</p>
                <p className="text-zinc-600 text-xs mt-1">Records will appear here after your first clock-in</p>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Attendance History</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{records.length} records</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Clock In</th>
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Clock Out</th>
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">First Seen</th>
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Last Seen</th>
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Hours</th>
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r, i) => {
                            const dateStr = r.work_date || r.date;
                            const clockIn = r.clock_in_at ?? r.clock_in ?? null;
                            const clockOut = r.clock_out_at ?? r.clock_out ?? null;
                            const firstSeen = r.first_seen_in_office_at ?? null;
                            const lastSeen = r.last_seen_in_office_at ?? null;
                            const hours = r.total_hours ?? computeHours(clockIn, clockOut);
                            const aState = r.attendance_state || 'NOT_CLOCKED_IN';
                            const aColors = attendanceStateColors[aState as AttendanceState] || attendanceStateColors['NOT_CLOCKED_IN'];

                            return (
                                <tr key={r.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 lg:px-6 py-3 text-zinc-300 font-medium whitespace-nowrap" suppressHydrationWarning>
                                        {dateStr
                                            ? new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00')).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                                            : '—'}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-zinc-400 whitespace-nowrap" suppressHydrationWarning>
                                        {formatTime(clockIn)}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-zinc-400 whitespace-nowrap" suppressHydrationWarning>
                                        {formatTime(clockOut)}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                                        {firstSeen ? (
                                            <span className="inline-flex items-center gap-1 text-zinc-400" suppressHydrationWarning>
                                                <FiEye className="text-[10px] text-emerald-500/60" />
                                                {formatTime(firstSeen)}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                                        {lastSeen ? (
                                            <span className="inline-flex items-center gap-1 text-zinc-400" suppressHydrationWarning>
                                                <FiEye className="text-[10px] text-amber-500/60" />
                                                {formatTime(lastSeen)}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-white font-semibold whitespace-nowrap font-numbers">
                                        {hours != null ? `${hours.toFixed(1)}h` : '—'}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${aColors.bg} ${aColors.text}`}>
                                            {attendanceStateLabels[aState as AttendanceState] || 'Unknown'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

