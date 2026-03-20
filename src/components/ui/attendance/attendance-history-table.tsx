'use client';

import React from 'react';
import type { AttendanceRecord, PresenceState, AttendanceState } from '@/types/attendance';
import { presenceStateLabels, presenceStateColors, attendanceStateLabels, attendanceStateColors } from '@/types/attendance';
import { FiClock } from 'react-icons/fi';

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
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Hours</th>
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Presence</th>
                            <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r, i) => {
                            const pState = r.presence_state || 'OUT_OF_OFFICE';
                            const aState = r.attendance_state || 'NOT_CLOCKED_IN';
                            const pColors = presenceStateColors[pState as PresenceState] || presenceStateColors['OUT_OF_OFFICE'];
                            const aColors = attendanceStateColors[aState as AttendanceState] || attendanceStateColors['NOT_CLOCKED_IN'];
                            return (
                                <tr key={r.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 lg:px-6 py-3 text-zinc-300 font-medium whitespace-nowrap" suppressHydrationWarning>
                                        {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-zinc-400 whitespace-nowrap" suppressHydrationWarning>
                                        {r.clock_in
                                            ? new Date(r.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '—'}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-zinc-400 whitespace-nowrap" suppressHydrationWarning>
                                        {r.clock_out
                                            ? new Date(r.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '—'}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-white font-semibold whitespace-nowrap">
                                        {r.total_hours != null ? `${r.total_hours.toFixed(1)}h` : '—'}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-semibold ${pColors.bg} ${pColors.text}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${pColors.dot}`} />
                                            {presenceStateLabels[pState as PresenceState] || 'Unknown'}
                                        </span>
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
