'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { updateLocation, getOfficeLocations, clockOutManual } from '@/app/(dashboard)/attendance/actions';
import { getDistanceInMeters } from '@/lib/distance-utils';
import { toast } from '@/lib/toast';
import type { PresenceState, AttendanceState, AttendancePolicy, OfficeLocation, AttendanceRecord } from '@/types/attendance';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minute polling as a background task
const STORAGE_KEY = 'md_location_tracking_enabled';

interface LocationContextType {
    isTracking: boolean;
    isSupported: boolean;
    presenceState: PresenceState | null;
    attendanceState: AttendanceState | null;
    lastUpdate: Date | null;
    clockInTime: string | null;
    clockOutTime: string | null;
    toggleTracking: () => void;
    manualClockIn: () => Promise<void>;
    manualClockOut: (force?: boolean) => Promise<{ success?: boolean; confirmRequired?: boolean }>;
    isLoading: boolean;
    refreshLocation: () => Promise<void>;
    location: { latitude: number; longitude: number; accuracy: number | null } | null;
    officeLocation: { latitude: number; longitude: number } | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);



function getAccuratePosition(timeoutMs = 15000, desiredAccuracy = 35): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        let watchId: number;
        let bestPosition: GeolocationPosition | null = null;
        let timeoutId: NodeJS.Timeout;

        const cleanup = () => {
            navigator.geolocation.clearWatch(watchId);
            clearTimeout(timeoutId);
        };

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
                    bestPosition = pos;
                }
                if (pos.coords.accuracy <= desiredAccuracy) {
                    cleanup();
                    resolve(pos);
                }
            },
            (err) => {
                if (!bestPosition) {
                    cleanup();
                    reject(err);
                }
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs }
        );

        timeoutId = setTimeout(() => {
            cleanup();
            if (bestPosition) {
                resolve(bestPosition);
            } else {
                reject(new Error("Timeout waiting for location"));
            }
        }, timeoutMs);
    });
}

export function LocationProvider({ 
    children,
    initialRecord 
}: { 
    children: React.ReactNode;
    initialRecord?: AttendanceRecord | null;
}) {
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const [isTracking, setIsTracking] = useState(false);
    const [isSupported, setIsSupported] = useState(true);

    // Policy-aligned initial presence: if clocked in but no presence_state on the initial record,
    // assume IN_OFFICE since the backend auto-clocks in when IN_OFFICE is first confirmed.
    const deriveInitialPresence = (record: AttendanceRecord | null | undefined): PresenceState | null => {
        if (!record) return null;
        if (record.presence_state) return record.presence_state;
        if (record.attendance_state === 'CLOCKED_IN') return 'IN_OFFICE';
        return null;
    };

    const [presenceState, setPresenceState] = useState<PresenceState | null>(deriveInitialPresence(initialRecord));
    const [attendanceState, setAttendanceState] = useState<AttendanceState | null>(initialRecord?.attendance_state || null);
    const [clockInTime, setClockInTime] = useState<string | null>(initialRecord?.clock_in_at || initialRecord?.clock_in || null);
    const [clockOutTime, setClockOutTime] = useState<string | null>(initialRecord?.clock_out_at || initialRecord?.clock_out || null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
    const [officeLocationState, setOfficeLocationState] = useState<{ latitude: number; longitude: number } | null>(null);
    
    // Config Caching (Pre-fetched on mount)
    const officesRef = useRef<OfficeLocation[]>([]);
    const policiesRef = useRef<Record<number, AttendancePolicy>>({});
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (initialRecord) {
            attendanceStateRef.current = initialRecord.attendance_state;
            presenceStateRef.current = deriveInitialPresence(initialRecord);
        }
    }, [initialRecord]);
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const presenceStateRef = useRef<PresenceState | null>(null);
    const attendanceStateRef = useRef<AttendanceState | null>(null); // To avoid dependency loop in callbacks

    // 1. Initial Data Load (Secondary to main page data)
    useEffect(() => {
        const initData = async () => {
            try {
                const offices = await getOfficeLocations();
                officesRef.current = offices;
                if (offices.length > 0) {
                    setOfficeLocationState({ latitude: offices[0].latitude, longitude: offices[0].longitude });
                }
                
                // Fetch policies for all offices to have them ready
                const { getAttendancePolicy } = await import('@/app/(dashboard)/attendance/actions');
                
                const newPolicies: Record<number, AttendancePolicy> = {};
                for (const office of offices) {
                    const p = await getAttendancePolicy(office.id);
                    if (p) {
                        newPolicies[office.id] = p;
                    }
                }
                policiesRef.current = newPolicies;
                setIsInitialized(true);
            } catch (err) {
                console.error('Failed to pre-fetch location config:', err);
                setIsInitialized(true); // Still allow tracking to attempt
            }
        };

        // Check browser support and restore preference
        startTransition(() => {
            if (!navigator.geolocation) {
                setIsSupported(false);
                return;
            }
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'true') {
                setIsTracking(true);
            }
        });

        initData();
    }, []);

    // Helper: Is current time within HH:MM:SS window?
    const isWithinWindow = useCallback((start: string | null, end: string | null) => {
        if (!start || !end) return true;
        const now = new Date();
        const [sH, sM, sS] = start.split(':').map(Number);
        const [eH, eM, eS] = end.split(':').map(Number);
        
        const startTime = new Date(now);
        startTime.setHours(sH, sM, sS || 0);
        
        const endTime = new Date(now);
        endTime.setHours(eH, eM, eS || 0);
        
        return now >= startTime && now <= endTime;
    }, []);

    // Tracking logic (Purely background)
    const sendLocation = useCallback(async () => {
        if (!navigator.geolocation || !isInitialized) return;

        return new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setLocation({ latitude, longitude, accuracy });
                    
                    // ── GATE 1: Reject highly inaccurate readings for automatic transitions ──
                    // The backend strictly ignores accuracy > 30m for auto-state changes.
                    // If we're tracking a manual action later, we'll allow a more lenient gate.
                    if (accuracy > 30) {
                        console.log(`[LocationProvider] Skipping state evaluation — accuracy ${accuracy.toFixed(0)}m is too noisy`);
                        resolve();
                        return;
                    }

                    // ── GATE 2: Must have offices configured ──
                    const offices = officesRef.current;
                    if (!offices || offices.length === 0) {
                        resolve();
                        return;
                    }

                    // ── 1. Find nearest office and compute accuracy-adjusted distance ──
                    let resolvedId: number | undefined;
                    let rawZone: PresenceState = 'OUT_OF_OFFICE';
                    let activeOffice: OfficeLocation | null = null;
                    let bestDistance = Infinity;
                    
                    for (const o of offices) {
                        const dist = getDistanceInMeters(latitude, longitude, o.latitude, o.longitude);
                        if (dist < bestDistance) {
                            bestDistance = dist;
                            activeOffice = o;
                        }
                    }
                    
                    if (activeOffice) {
                        const effectiveDistance = bestDistance; // accuracy-adjusted check happens later if needed
                        
                        // Strict Geofence Check based on Office Config
                        if (effectiveDistance <= activeOffice.in_office_radius_meters) {
                            rawZone = 'IN_OFFICE';
                        } else if (bestDistance <= (activeOffice.temporarily_out_radius_meters || activeOffice.in_office_radius_meters * 2.5)) {
                            rawZone = 'TEMPORARILY_OUT';
                        } else {
                            rawZone = 'OUT_OF_OFFICE';
                        }
                        resolvedId = activeOffice.id;
                    } else {
                        resolvedId = offices[0].id;
                    }

                    // ── 2. Sync with Backend ──
                    const result = await updateLocation(latitude, longitude, accuracy, resolvedId);
                    if (result.success && result.record) {
                        const prevAtt = attendanceStateRef.current;
                        const newAtt = result.record.attendance_state;
                        
                        const prevPres = presenceStateRef.current;
                        const newPres = result.record.presence_state ?? null;
                        
                        attendanceStateRef.current = newAtt;
                        presenceStateRef.current = newPres;
                        
                        let forceUpdate = false;
                        if (prevPres !== null && prevPres !== newPres) {
                            forceUpdate = true;
                        }

                        // Always trust the backend's response for definitive state
                        setPresenceState(newPres);
                        setAttendanceState(newAtt);
                        setClockInTime(result.record.clock_in_at || result.record.clock_in || null);
                        setClockOutTime(result.record.clock_out_at || result.record.clock_out || null);
                        setLastUpdate(new Date());
                        
                        mutate('my-attendance-today');
                        
                        if (prevAtt && prevAtt !== newAtt) {
                            mutate('team-attendance-today');
                            if (newAtt === 'CLOCKED_IN') {
                                toast.success('Confirmed in office!');
                            } else if (newAtt === 'CLOCKED_OUT') {
                                toast.info('Attendance finalized.');
                            }
                        } else if (forceUpdate) {
                            mutate('team-attendance-today');
                        }
                    }
                    resolve();
                },
                (error) => {
                    console.error('Geolocation error:', error.message);
                    if (error.code === error.PERMISSION_DENIED) {
                        toast.error('Location permission denied. Tracking disabled.');
                        setIsTracking(false);
                        localStorage.setItem(STORAGE_KEY, 'false');
                    }
                    resolve();
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });
    }, [isInitialized, mutate]);

    // Start/stop interval when tracking changes
    useEffect(() => {
        if (isTracking) {
            // Fetch immediately when tracking is turned on, then poll every INTERVAL_MS
            sendLocation();
            intervalRef.current = setInterval(sendLocation, INTERVAL_MS);
        } else {
            // When tracking is turned off, just stop polling — keep all cached state
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isTracking, sendLocation]);

    const toggleTracking = useCallback(() => {
        const next = !isTracking;
        setIsTracking(next);
        localStorage.setItem(STORAGE_KEY, String(next));
        if (next) {
            toast.success('Location tracking enabled');
        } else {
            toast.info('Location tracking paused');
        }
    }, [isTracking]);

    const manualClockIn = useCallback(async () => {
        setIsLoading(true);
        try {
            if (!navigator.geolocation) {
                toast.error('Geolocation not supported');
                setIsLoading(false);
                return;
            }
            toast.loading("Acquiring accurate GPS signal...", { id: 'gps-lock' });
            try {
                const position = await getAccuratePosition(15000, 35);
                toast.dismiss('gps-lock');
                const { latitude, longitude, accuracy } = position.coords;
                
                // Manual Accuracy Gate: Lenient up to 100m for intended actions
                if (accuracy > 100) {
                    toast.error('GPS signal too unstable for secure clock-in.');
                    setIsLoading(false);
                    return;
                }

                const offices = officesRef.current;
                if (!offices || offices.length === 0) {
                    toast.error('No office locations configured.');
                    setIsLoading(false);
                    return;
                }

                let validOfficeId: number | null = null;
                for (const office of offices) {
                    const dist = getDistanceInMeters(latitude, longitude, office.latitude, office.longitude);
                    // strict geofence check
                    if (dist <= office.in_office_radius_meters) {
                        validOfficeId = office.id;
                        break;
                    }
                }

                if (validOfficeId === null) {
                    toast.error('Not strictly in the office geofence.');
                    setIsLoading(false);
                    return;
                }

                // ── Policy time-window check (Arrival Windows for Manual Action) ──
                const policy = policiesRef.current[validOfficeId];
                if (policy) {
                    const inWindow = isWithinWindow(
                        policy.check_in_open_time as string | null,
                        policy.check_in_close_time as string | null
                    );
                    if (!inWindow) {
                        const openStr = policy.check_in_open_time || '—';
                        const closeStr = policy.check_in_close_time|| '—';
                        toast.error(`The arrival window is currently closed (${openStr} – ${closeStr}).`);
                        setIsLoading(false);
                        return;
                    }
                }

                const result = await updateLocation(latitude, longitude, accuracy, validOfficeId || undefined, true);
                if (result.success && result.record) {
                    setPresenceState(result.record.presence_state ?? null);
                    setAttendanceState(result.record.attendance_state);
                    setClockInTime(result.record.clock_in_at || result.record.clock_in || null);
                    setClockOutTime(result.record.clock_out_at || result.record.clock_out || null);
                    setLastUpdate(new Date());
                    mutate('my-attendance-today');
                    mutate('team-attendance-today');
                    // Only show success if the backend actually confirmed CLOCKED_IN
                    if (result.record.attendance_state === 'CLOCKED_IN') {
                        toast.success('Clocked in!');
                    } else {
                        toast.info('Location updated, but clock-in was not confirmed by the server.');
                    }
                } else {
                    toast.error(result.error || 'Failed to clock in');
                }
                setIsLoading(false);
            } catch (error) {
                toast.dismiss('gps-lock');
                toast.error('GPS error or timeout.');
                setIsLoading(false);
            }
        } catch {
            setIsLoading(false);
        }
    }, [mutate, isWithinWindow]);

    const manualClockOut = useCallback(async (force = false) => {
        setIsLoading(true);
        try {
            // Check if user is still in office before clocking out
            if (!force && presenceState === 'IN_OFFICE') {
                setIsLoading(false);
                return { confirmRequired: true };
            }

            toast.loading("Clocking out...", { id: 'clock-out' });
            
            const result = await clockOutManual();
            
            toast.dismiss('clock-out');
            if (result.success && result.record) {
                setPresenceState(result.record.presence_state ?? null);
                setAttendanceState(result.record.attendance_state);
                setClockInTime(result.record.clock_in_at || result.record.clock_in || null);
                setClockOutTime(result.record.clock_out_at || result.record.clock_out || null);
                setLastUpdate(new Date());
                mutate('my-attendance-today');
                mutate('team-attendance-today');
                toast.success('Clocked out successfully!');
                
                setIsTracking(false);
                localStorage.setItem(STORAGE_KEY, 'false');
            } else {
                toast.error(result.error || 'Failed to clock out');
            }
            setIsLoading(false);
            return { success: result.success };
        } catch {
            toast.dismiss('clock-out');
            toast.error('An unexpected error occurred while clocking out.');
            setIsLoading(false);
            return { success: false };
        }
    }, [mutate, presenceState]);

    const refreshLocation = useCallback(async () => {
        setIsLoading(true);
        toast.loading("Acquiring high-precision GPS...", { id: 'gps-sync' });
        try {
            const position = await getAccuratePosition(15000, 35);
            toast.dismiss('gps-sync');
            const { latitude, longitude, accuracy } = position.coords;
            setLocation({ latitude, longitude, accuracy });
            
            // Sync with backend
            const offices = officesRef.current;
            const resolvedId = offices.length > 0 ? offices[0].id : undefined;
            await updateLocation(latitude, longitude, accuracy, resolvedId);
            
            setLastUpdate(new Date());
            mutate('my-attendance-today');
            mutate('team-attendance-today');
            toast.success('Position Synchronized');
        } catch (err) {
            toast.dismiss('gps-sync');
            toast.error('Sync Timeout — poor signal');
        } finally {
            setIsLoading(false);
        }
    }, [mutate]);

    const contextValue = React.useMemo(() => ({
        isTracking,
        isSupported,
        presenceState,
        attendanceState,
        clockInTime,
        clockOutTime,
        lastUpdate,
        toggleTracking,
        manualClockIn,
        manualClockOut,
        isLoading,
        refreshLocation,
        location,
        officeLocation: officeLocationState,
    }), [
        isTracking,
        isSupported,
        presenceState,
        attendanceState,
        clockInTime,
        clockOutTime,
        lastUpdate,
        toggleTracking,
        manualClockIn,
        manualClockOut,
        isLoading,
        refreshLocation,
        location,
        officeLocationState
    ]);

    return (
        <LocationContext.Provider value={contextValue}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
