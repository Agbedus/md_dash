'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import type { AttendanceRecord, PresenceState, AttendanceState } from '@/types/attendance';
import { presenceStateLabels, presenceStateColors, attendanceStateLabels, attendanceStateColors } from '@/types/attendance';
import { fetchTeamAttendanceLive, overrideAttendance } from '@/app/(dashboard)/attendance/actions';
import OverrideModal from './override-modal';
import { FiUsers, FiEdit2, FiClock, FiRefreshCw } from 'react-icons/fi';

interface Props {
    initialRecords: AttendanceRecord[];
    users: any[];
}

export default function TeamAttendanceGrid({ initialRecords, users }: Props) {
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

    const { data: records, mutate, isValidating } = useSWR(
        'team-attendance-today',
        () => fetchTeamAttendanceLive(),
        {
            fallbackData: initialRecords,
            refreshInterval: 30000,
            revalidateOnFocus: true,
        }
    );

    const teamRecords = records || [];

    // Hydrate with user info
    const hydratedRecords = teamRecords.map(r => {
        const user = users.find((u: any) => String(u.id) === String(r.user_id));
        return {
            ...r,
            userName: user?.name || user?.fullName || 'Unknown',
            userAvatar: user?.image || user?.avatarUrl || null,
        };
    });

    const handleOverride = async (recordId: number, clockIn: string | null, clockOut: string | null) => {
        await overrideAttendance(recordId, clockIn, clockOut);
        mutate();
        setSelectedRecord(null);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FiUsers className="text-sky-400" />
                        Team Presence
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        {hydratedRecords.length} members tracked today · Auto-refreshes every 30s
                    </p>
                </div>
                <button
                    onClick={() => mutate()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all"
                >
                    <FiRefreshCw className={`text-xs ${isValidating ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {hydratedRecords.length === 0 ? (
                <div className="glass p-8 rounded-2xl border border-white/5 text-center">
                    <FiUsers className="text-3xl text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">No team attendance data for today</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hydratedRecords.map((r, i) => {
                        const pState = r.presence_state || 'OUT_OF_OFFICE';
                        const aState = r.attendance_state || 'NOT_CLOCKED_IN';
                        const pColors = presenceStateColors[pState as PresenceState] || presenceStateColors['OUT_OF_OFFICE'];
                        const aColors = attendanceStateColors[aState as AttendanceState] || attendanceStateColors['NOT_CLOCKED_IN'];
                        return (
                            <div
                                key={r.id || i}
                                className="glass p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden ring-2 ring-white/5">
                                                {r.userAvatar ? (
                                                    <img src={r.userAvatar} alt={r.userName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white bg-[var(--pastel-indigo)]/20">
                                                        {r.userName?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${pColors.dot} ring-2 ring-[var(--background)]`}>
                                                {r.attendance_state === 'CLOCKED_IN' && (
                                                    <div className={`absolute inset-0 rounded-full ${pColors.dot} animate-ping opacity-75`} />
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{r.userName}</p>
                                            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${pColors.bg} ${pColors.text}`}>
                                                {presenceStateLabels[pState as PresenceState] || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedRecord(r)}
                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all opacity-0 group-hover:opacity-100"
                                        title="Override"
                                    >
                                        <FiEdit2 className="text-sm" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500" suppressHydrationWarning>
                                        <FiClock className="text-[10px]" />
                                        {(r.clock_in_at || r.clock_in)
                                            ? new Date((r.clock_in_at || r.clock_in)!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : 'Not clocked in'}
                                        {(r.clock_out_at || r.clock_out) && (
                                            <> — {new Date((r.clock_out_at || r.clock_out)!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                        )}
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${aColors.bg} ${aColors.text}`}>
                                        {attendanceStateLabels[aState as AttendanceState] || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedRecord && (
                <OverrideModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onOverride={handleOverride}
                />
            )}
        </div>
    );
}
