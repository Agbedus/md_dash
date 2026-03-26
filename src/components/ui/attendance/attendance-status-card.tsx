'use client';

import React from 'react';
import useSWR from 'swr';
import { fetchMyAttendanceLive } from '@/app/(dashboard)/attendance/actions';
import type { AttendanceRecord } from '@/types/attendance';
import { presenceStateLabels, presenceStateColors, attendanceStateLabels, attendanceStateColors } from '@/types/attendance';
import { useLocation } from '@/providers/location-provider';
import { FiMapPin, FiClock, FiLogIn, FiLogOut, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

export default function AttendanceStatusCard({ record: initialRecord }: { record: AttendanceRecord | null }) {
    const { data: liveRecord } = useSWR('my-attendance-today', fetchMyAttendanceLive, {
        fallbackData: initialRecord,
        revalidateOnFocus: true,
    });

    const {
        isTracking,
        isSupported,
        presenceState: manualPresence,
        attendanceState: manualAttendance,
        clockInTime: manualClockInTime,
        clockOutTime: manualClockOutTime,
        lastUpdate,
        toggleTracking,
        manualClockIn,
        manualClockOut,
        isLoading,
    } = useLocation();

    const [showConfirm, setShowConfirm] = React.useState(false);

    const handleClockOut = async () => {
        const result = await manualClockOut();
        if (result?.confirmRequired) {
            setShowConfirm(true);
        } else {
            setShowConfirm(false);
        }
    };

    const handleConfirmClockOut = async () => {
        await manualClockOut(true);
        setShowConfirm(false);
    };

    // Priority: 1. Manual/Local state derived from last action
    //           2. Live SWR data
    //           3. Initial server record
    const rawPresence = manualPresence || liveRecord?.presence_state || initialRecord?.presence_state || null;
    const currentAttendance = manualAttendance || liveRecord?.attendance_state || initialRecord?.attendance_state || 'NOT_CLOCKED_IN';

    // Policy-aligned presence derivation:
    // If we have an explicit presence state, use it.
    // If clocked in but no presence state is set (e.g., manual clock-in or GPS grace period),
    // default to IN_OFFICE rather than the misleading OUT_OF_OFFICE.
    let currentPresence: import('@/types/attendance').PresenceState;
    if (rawPresence) {
        currentPresence = rawPresence;
    } else if (currentAttendance === 'CLOCKED_IN') {
        currentPresence = 'IN_OFFICE';
    } else {
        currentPresence = 'OUT_OF_OFFICE';
    }
    const clockInTime = manualClockInTime || liveRecord?.clock_in_at || liveRecord?.clock_in || initialRecord?.clock_in_at || initialRecord?.clock_in;
    const clockOutTime = manualClockOutTime || liveRecord?.clock_out_at || liveRecord?.clock_out || initialRecord?.clock_out_at || initialRecord?.clock_out;
    const pColors = presenceStateColors[currentPresence];
    const aColors = attendanceStateColors[currentAttendance];

    // Calculate duration
    const getDuration = () => {
        if (!clockInTime) return null;
        const start = new Date(clockInTime);
        const end = clockOutTime ? new Date(clockOutTime) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="glass p-6 lg:p-8 rounded-2xl border border-white/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Status */}
                <div className="flex items-center gap-5">
                    {/* Pulsing presence dot */}
                    <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl ${pColors.bg} flex items-center justify-center`}>
                            <FiMapPin className={`text-2xl ${pColors.text}`} />
                        </div>
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${pColors.dot} ring-4 ring-[var(--background)]`}>
                            {currentAttendance === 'CLOCKED_IN' && (
                                <div className={`absolute inset-0 rounded-full ${pColors.dot} animate-ping opacity-75`} />
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {presenceStateLabels[currentPresence]}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${aColors.bg} ${aColors.text}`}>
                                {attendanceStateLabels[currentAttendance]}
                            </span>
                            {getDuration() && (
                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                    <FiClock className="text-[10px]" />
                                    {getDuration()}
                                </span>
                            )}
                        </div>
                        {clockInTime && (
                            <p className="text-[11px] text-zinc-600 mt-1" suppressHydrationWarning>
                                Clocked in at {new Date(clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {clockOutTime && ` · Out at ${new Date(clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Location tracking toggle */}
                    {isSupported && (
                        <button
                            onClick={toggleTracking}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                                isTracking
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                            }`}
                        >
                            {isTracking ? <FiToggleRight className="text-base" /> : <FiToggleLeft className="text-base" />}
                            {isTracking ? 'Tracking On' : 'Tracking Off'}
                        </button>
                    )}

                    {/* Manual clock in/out */}
                    {currentAttendance !== 'CLOCKED_IN' ? (
                        <button
                            onClick={manualClockIn}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-all duration-200 disabled:opacity-50"
                        >
                            <FiLogIn className="text-base" />
                            {isLoading ? 'Locating...' : 'Clock In'}
                        </button>
                    ) : showConfirm ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <button
                                onClick={handleConfirmClockOut}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all duration-200"
                            >
                                Confirm Clock Out
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-3 py-2.5 rounded-xl text-xs font-medium bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleClockOut}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 transition-all duration-200 disabled:opacity-50"
                        >
                            <FiLogOut className="text-base" />
                            {isLoading ? 'Locating...' : 'Clock Out'}
                        </button>
                    )}
                </div>
            </div>

            {/* Last update info */}
            {lastUpdate && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-zinc-500" suppressHydrationWarning>
                        Last location update: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            )}
        </div>
    );
}
