'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useSWR from 'swr';
import { fetchMyAttendanceLive } from '@/app/(dashboard)/attendance/actions';
import type { AttendanceRecord } from '@/types/attendance';
import { presenceStateLabels, presenceStateColors, attendanceStateLabels, attendanceStateColors } from '@/types/attendance';
import { useLocation } from '@/providers/location-provider';
import { getDistanceInMeters, formatDistance } from '@/lib/distance-utils';
import { FiMapPin, FiClock, FiTarget, FiActivity, FiNavigation, FiZap, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';

export default function AttendanceStatusCard({ record: initialRecord }: { record: AttendanceRecord | null }) {
    const [mounted, setMounted] = React.useState(false);
    const [showMetadata, setShowMetadata] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const { data: liveRecord, mutate, isValidating } = useSWR('my-attendance-today', fetchMyAttendanceLive, {
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
        refreshLocation,
        location,
        officeLocation,
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

    const rawPresence = manualPresence || liveRecord?.presence_state || initialRecord?.presence_state || null;
    const currentAttendance = manualAttendance || liveRecord?.attendance_state || initialRecord?.attendance_state || 'NOT_CLOCKED_IN';

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

    const distance = useMemo(() => {
        if (!location || !officeLocation) return null;
        return getDistanceInMeters(location.latitude, location.longitude, officeLocation.latitude, officeLocation.longitude);
    }, [location, officeLocation]);

    return (
        <div className="glass p-6 rounded-[32px] border border-card-border flex flex-col gap-6 relative overflow-hidden">
            {/* Background Gradient */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-20 ${pColors.bg}`} />
            
            {/* LAYER 1: Header (Icon + Labels + Controls) */}
            <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    {/* Pulsing Presence Icon */}
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl ${pColors.bg} flex items-center justify-center transition-colors border border-card-border`}>
                            <FiMapPin className={`text-xl ${pColors.text}`} />
                        </div>
                        <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${pColors.dot} ring-4 ring-card`}>
                            {currentAttendance === 'CLOCKED_IN' && (
                                <div className={`absolute inset-0 rounded-full ${pColors.dot} animate-ping opacity-75`} />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-sm font-bold text-foreground leading-none tracking-tight">
                            {presenceStateLabels[currentPresence]}
                        </h2>
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${aColors.text} opacity-80 mt-1`}>
                            {attendanceStateLabels[currentAttendance]}
                        </span>
                    </div>
                </div>

                {/* Top Right Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshLocation}
                        disabled={isLoading}
                        title="Acquire Precision GPS"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-foreground bg-foreground/[0.03] border border-card-border hover:bg-foreground/[0.08] transition-all"
                    >
                        <FiTarget className={`text-xs ${isLoading ? 'animate-pulse text-emerald-500' : ''}`} />
                        Sync
                    </button>
                    {isSupported && (
                        <button
                            onClick={toggleTracking}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                                isTracking 
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                                    : 'bg-foreground/[0.03] border-card-border text-text-muted hover:text-foreground'
                            }`}
                        >
                            <FiZap className={`w-3 h-3 ${isTracking ? 'animate-pulse text-emerald-400' : ''}`} />
                            <span className="hidden sm:inline">GPS</span>
                        </button>
                    )}
                </div>
            </div>

            {/* LAYER 2: Hero Action (Full-width button) */}
            <div className="w-full z-10">
                {currentAttendance !== 'CLOCKED_IN' ? (
                    <button
                        onClick={manualClockIn}
                        disabled={isLoading}
                        className="group relative w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-emerald-500 text-background hover:bg-emerald-400 active:scale-[0.98] transition-all duration-300"
                    >
                        <FiClock className="w-4 h-4" />
                        <span className="text-base font-black uppercase tracking-wider italic leading-none">
                            {isLoading ? 'Relocating...' : 'Clock In'}
                        </span>
                    </button>
                ) : showConfirm ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleConfirmClockOut}
                            disabled={isLoading}
                            className="flex-1 py-3.5 rounded-2xl bg-rose-500 text-foreground font-black uppercase tracking-wider hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <FiX className="w-4 h-4" />
                            Confirm
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="px-6 py-3.5 rounded-2xl bg-foreground/[0.03] border border-card-border text-text-muted text-[10px] font-bold uppercase tracking-widest hover:text-foreground transition-all"
                        >
                            Back
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleClockOut}
                        disabled={isLoading}
                        className="group w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-foreground/[0.03] border border-card-border text-foreground hover:bg-foreground/[0.06] active:scale-[0.98] transition-all duration-300"
                    >
                        <FiX className="w-4 h-4 group-hover:text-rose-400 transition-colors" />
                        <span className="text-base font-black uppercase tracking-wider italic leading-none">
                            {isLoading ? 'Syncing...' : 'Clock Out'}
                        </span>
                    </button>
                )}
            </div>

            {/* LAYER 3: Metrics Strip */}
            <div className="grid grid-cols-3 gap-1 bg-foreground/[0.01] rounded-2xl border border-card-border overflow-hidden z-10">
                <div className="flex flex-col items-center justify-center py-4 bg-foreground/[0.02]">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <FiActivity className="text-emerald-500/60 w-2.5 h-2.5" />
                        Pulse
                    </span>
                    <p className="text-2xl font-numbers font-black text-foreground tracking-tighter" suppressHydrationWarning>
                        {mounted && lastUpdate ? lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                </div>
                
                <div className="flex flex-col items-center justify-center py-4 bg-foreground/[0.02] border-x border-card-border">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <FiNavigation className="text-sky-500/60 w-2.5 h-2.5" />
                        Range
                    </span>
                    <p className="text-2xl font-numbers font-black text-foreground tracking-tighter">
                        {distance !== null ? formatDistance(distance) : '—'}
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center py-4 bg-foreground/[0.02]">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <FiTarget className="text-rose-500/60 w-2.5 h-2.5" />
                        Prec.
                    </span>
                    <p className="text-2xl font-numbers font-black text-foreground tracking-tighter">
                        {location?.accuracy ? `${Math.round(location.accuracy)}m` : '—'}
                    </p>
                </div>
            </div>

            {/* LAYER 4: Technical Metadata Toggle */}
            <div className="z-10">
                <button
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="w-full flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-foreground transition-colors group px-1"
                >
                    <span className="flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full ${isLoading ? 'bg-emerald-500 animate-pulse' : 'bg-text-muted'}`} />
                        Telemetry Details
                    </span>
                    {showMetadata ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                
                <AnimatePresence>
                    {showMetadata && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 grid grid-cols-2 gap-y-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Active Duty</span>
                                    <span className="text-xs font-numbers text-foreground font-medium tracking-tight">
                                        {mounted && clockInTime ? (
                                            (() => {
                                                const start = new Date(clockInTime);
                                                const end = clockOutTime ? new Date(clockOutTime) : new Date();
                                                const diffMs = end.getTime() - start.getTime();
                                                const h = Math.floor(diffMs / 3600000);
                                                const m = Math.floor((diffMs % 3600000) / 60000);
                                                return `${h}h ${m}m`;
                                            })()
                                        ) : '0h 0m'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5 items-end">
                                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Confirmed Entry</span>
                                    <span className="text-xs font-numbers text-foreground font-medium tracking-tight" suppressHydrationWarning>
                                        {mounted && liveRecord?.first_seen_in_office_at ? new Date(liveRecord.first_seen_in_office_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Waiting...'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Geo Coordinates</span>
                                    <span className="text-[10px] font-numbers text-text-secondary font-medium tracking-tight">
                                        {location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Scanning...'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5 items-end">
                                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Link Status</span>
                                    <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest flex items-center gap-1.5">
                                        Secure
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

