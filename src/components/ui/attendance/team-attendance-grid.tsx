'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import type { AttendanceRecord, PresenceState, AttendanceState } from '@/types/attendance';
import { presenceStateLabels, presenceStateColors, attendanceStateLabels, attendanceStateColors } from '@/types/attendance';
import { fetchTeamAttendanceLive, overrideAttendance, getTeamAttendanceHistory } from '@/app/(dashboard)/attendance/actions';
import OverrideModal from './override-modal';
import TeamAttendanceTable from './team-attendance-table';
import { FiUsers, FiEdit2, FiClock, FiRefreshCw } from 'react-icons/fi';
import Image from 'next/image';

interface Props {
    initialRecords: AttendanceRecord[];
    initialHistory?: AttendanceRecord[];
    users: any[];
    isAdmin?: boolean;
}

export default function TeamAttendanceGrid({ initialRecords, initialHistory = [], users, isAdmin = false }: Props) {
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

    const { data: history } = useSWR(
        isAdmin ? 'team-attendance-history' : null,
        () => getTeamAttendanceHistory(),
        {
            fallbackData: initialHistory,
            refreshInterval: 60000,
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

    const hydratedHistory = (history || []).map(r => {
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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <FiUsers className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Live Presence</h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                            {hydratedRecords.length} Members Active Today
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => mutate()}
                        disabled={isValidating}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-foreground bg-foreground/[0.05] border border-card-border hover:bg-foreground/[0.1] transition-all"
                    >
                        <FiRefreshCw className={`w-3 h-3 ${isValidating ? 'animate-spin text-indigo-400' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {hydratedRecords.map(record => {
                    const pState = record.presence_state || (record.attendance_state === 'CLOCKED_IN' ? 'IN_OFFICE' : 'OUT_OF_OFFICE');
                    const aState = record.attendance_state || 'NOT_CLOCKED_IN';
                    
                    const pColors = presenceStateColors[pState as PresenceState] || presenceStateColors.OUT_OF_OFFICE;
                    const aColors = attendanceStateColors[aState as AttendanceState] || attendanceStateColors.NOT_CLOCKED_IN;

                    return (
                        <div
                            key={record.id}
                            className="bg-card p-4 rounded-2xl border border-card-border hover:border-foreground/[0.1] transition-all group relative overflow-hidden"
                        >
                            {/* Glow effect on hover */}
                            <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity ${pColors.bg}`} />

                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-xl bg-foreground/[0.05] border border-card-border overflow-hidden">
                                            {record.userAvatar ? (
                                                <Image 
                                                    src={record.userAvatar} 
                                                    alt={record.userName} 
                                                    width={40} 
                                                    height={40} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-text-muted bg-[var(--pastel-indigo)]/20">
                                                    {record.userName?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${pColors.dot}`}>
                                            {record.attendance_state === 'CLOCKED_IN' && (
                                                <div className={`absolute inset-0 rounded-full ${pColors.dot} animate-ping opacity-75`} />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground tracking-tight group-hover:text-indigo-500 transition-colors">
                                            {record.userName}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${pColors.text}`}>
                                                {presenceStateLabels[pState as PresenceState]}
                                            </span>
                                            <span className="text-text-muted text-[8px]">•</span>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${aColors.text} opacity-80`}>
                                                {attendanceStateLabels[aState as AttendanceState]}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <button
                                        onClick={() => setSelectedRecord(record)}
                                        className="p-1.5 rounded-lg bg-foreground/[0.05] border border-card-border text-text-muted hover:text-indigo-500 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <FiEdit2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="mt-4 flex items-center justify-between pt-3 border-t border-card-border relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">In</span>
                                        <span className="text-[10px] font-numbers text-text-secondary">
                                            {record.clock_in_at ? new Date(record.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Out</span>
                                        <span className="text-[10px] font-numbers text-text-secondary">
                                            {record.clock_out_at ? new Date(record.clock_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Duty Time</span>
                                    <span className="text-[10px] font-numbers font-bold text-foreground bg-foreground/[0.05] px-1.5 py-0.5 rounded-md border border-card-border">
                                        {(() => {
                                            const start = record.clock_in_at ? new Date(record.clock_in_at) : null;
                                            const end = record.clock_out_at ? new Date(record.clock_out_at) : (record.attendance_state === 'CLOCKED_IN' ? new Date() : null);
                                            if (!start || !end) return '0h 0m';
                                            const diffMs = end.getTime() - start.getTime();
                                            const h = Math.floor(diffMs / 3600000);
                                            const m = Math.floor((diffMs % 3600000) / 60000);
                                            return `${h}h ${m}m`;
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {hydratedRecords.length === 0 && (
                    <div className="col-span-full bg-card p-12 rounded-[32px] border border-card-border text-center">
                        <div className="w-12 h-12 rounded-2xl bg-foreground/[0.05] flex items-center justify-center mx-auto mb-4 border border-card-border">
                            <FiUsers className="text-text-secondary" />
                        </div>
                        <p className="text-text-muted text-sm font-medium">No team activity yet today.</p>
                        <p className="text-text-muted text-xs mt-1">Presence updates will appear here in real-time.</p>
                    </div>
                )}
            </div>

            {selectedRecord && (
                <OverrideModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onOverride={handleOverride}
                />
            )}

            {isAdmin && (
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <TeamAttendanceTable records={hydratedHistory} />
                </div>
            )}
        </div>
    );
}
