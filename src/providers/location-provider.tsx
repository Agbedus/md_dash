'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { updateLocation, getOfficeLocations } from '@/app/(dashboard)/attendance/actions';
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
    manualClockOut: () => Promise<void>;
    isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

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
    const [presenceState, setPresenceState] = useState<PresenceState | null>(initialRecord?.presence_state || null);
    const [attendanceState, setAttendanceState] = useState<AttendanceState | null>(initialRecord?.attendance_state || null);
    const [clockInTime, setClockInTime] = useState<string | null>(initialRecord?.clock_in_at || initialRecord?.clock_in || null);
    const [clockOutTime, setClockOutTime] = useState<string | null>(initialRecord?.clock_out_at || initialRecord?.clock_out || null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Config Caching (Pre-fetched on mount)
    const officesRef = useRef<OfficeLocation[]>([]);
    const policiesRef = useRef<Record<number, AttendancePolicy>>({});
    const [isInitialized, setIsInitialized] = useState(false);

    // Update refs to match initial state to avoid redundant mutations on first background check
    useEffect(() => {
        if (initialRecord) {
            attendanceStateRef.current = initialRecord.attendance_state;
        }
    }, [initialRecord]);
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const firstSeenInNewStateRef = useRef<{ state: PresenceState; time: number } | null>(null);
    const confirmedPresenceRef = useRef<PresenceState | null>(null);
    const attendanceStateRef = useRef<AttendanceState | null>(null); // To avoid dependency loop in callbacks

    // 1. Initial Data Load (Secondary to main page data)
    useEffect(() => {
        const initData = async () => {
            try {
                const offices = await getOfficeLocations();
                officesRef.current = offices;
                
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
                    
                    // ── GATE 1: Reject highly inaccurate readings entirely ──
                    // The backend also rejects accuracy > 50m, so don't waste a network call
                    if (accuracy > 50) {
                        console.log(`[LocationProvider] Skipping ping — accuracy ${accuracy.toFixed(0)}m is too poor`);
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
                        // Use accuracy-adjusted distance: the real position could be
                        // up to (accuracy * 0.5) meters further away than reported
                        const effectiveDistance = bestDistance + (accuracy * 0.5);
                        
                        if (effectiveDistance <= activeOffice.in_office_radius_meters) {
                            rawZone = 'IN_OFFICE';
                        } else if (bestDistance <= activeOffice.temporarily_out_radius_meters) {
                            rawZone = 'TEMPORARILY_OUT';
                        } else {
                            rawZone = 'OUT_OF_OFFICE';
                        }
                        resolvedId = activeOffice.id;
                    } else {
                        resolvedId = offices[0].id;
                    }

                    // ── 2. Use Cached Policy for grace period logic ──
                    const policy = activeOffice ? policiesRef.current[activeOffice.id] : null;
                    
                    // ── 3. Apply Stable Evidence Rules ──
                    // Without a valid policy, do NOT confirm any zone change locally.
                    // Let the backend be the sole authority.
                    let confirmedZone = confirmedPresenceRef.current;
                    let forceUpdate = false;

                    if (policy) {
                        const now = Date.now();
                        
                        if (rawZone !== confirmedZone) {
                            // Start or continue accumulating evidence for this new zone
                            if (!firstSeenInNewStateRef.current || firstSeenInNewStateRef.current.state !== rawZone) {
                                firstSeenInNewStateRef.current = { state: rawZone, time: now };
                            }

                            const elapsedMins = (now - firstSeenInNewStateRef.current.time) / 60000;
                            let requiredMins = 0;

                            if (rawZone === 'IN_OFFICE') {
                                requiredMins = policy.return_to_office_confirmation_minutes;
                            } else if (rawZone === 'TEMPORARILY_OUT') {
                                requiredMins = policy.temporarily_out_grace_minutes;
                            } else if (rawZone === 'OUT_OF_OFFICE') {
                                requiredMins = policy.out_of_office_grace_minutes;
                            }

                            // Additional guard: For transitioning TO IN_OFFICE,
                            // require tighter accuracy (< 30m) to avoid false clock-ins
                            if (rawZone === 'IN_OFFICE' && accuracy > 30) {
                                // Don't accumulate evidence with noisy readings for IN_OFFICE
                                console.log(`[LocationProvider] Ignoring IN_OFFICE candidate — accuracy ${accuracy.toFixed(0)}m too poor for confirmation`);
                            } else if (elapsedMins >= requiredMins) {
                                const prevState = confirmedPresenceRef.current;
                                confirmedPresenceRef.current = rawZone;
                                confirmedZone = rawZone;
                                firstSeenInNewStateRef.current = null;
                                
                                if (prevState !== null && prevState !== rawZone) {
                                    forceUpdate = true;
                                }
                            }
                        } else {
                            // Zone matches confirmed state — reset evidence tracker
                            firstSeenInNewStateRef.current = null;
                        }
                    }
                    // If no policy, don't touch confirmedPresenceRef — let the backend response drive it

                    // ── 4. Sync with Backend ──
                    const result = await updateLocation(latitude, longitude, accuracy, resolvedId);
                    if (result.success && result.record) {
                        const prevAtt = attendanceStateRef.current;
                        const newAtt = result.record.attendance_state;
                        
                        attendanceStateRef.current = newAtt;
                        // Always trust the backend's response for presence state
                        setPresenceState(result.record.presence_state ?? null);
                        setAttendanceState(newAtt);
                        setClockInTime(result.record.clock_in_at || result.record.clock_in || null);
                        setClockOutTime(result.record.clock_out_at || result.record.clock_out || null);
                        setLastUpdate(new Date());
                        
                        mutate('my-attendance-today');
                        mutate('team-attendance-today');
                        
                        if (prevAtt && prevAtt !== newAtt) {
                            if (newAtt === 'CLOCKED_IN') {
                                toast.success('Confirmed in office — Clocked in!');
                            } else if (newAtt === 'CLOCKED_OUT') {
                                toast.info('Confirmed away — Clocked out.');
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
                
                if (accuracy > 50) {
                    toast.error('GPS signal too weak. Please step outside.');
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
                    // stricter geofence check incorporating accuracy
                    if (dist + (accuracy * 0.5) <= office.in_office_radius_meters) {
                        validOfficeId = office.id;
                        break;
                    }
                }

                if (validOfficeId === null) {
                    toast.error('Not strictly in the office geofence.');
                    setIsLoading(false);
                    return;
                }

                // ── Policy time-window check (workday hours) ──
                const policy = policiesRef.current[validOfficeId];
                if (policy) {
                    const inWindow = isWithinWindow(
                        policy.work_start_time as string | null,
                        policy.work_end_time as string | null
                    );
                    if (!inWindow) {
                        const openStr = policy.work_start_time || '—';
                        const closeStr = policy.work_end_time || '—';
                        toast.error(`Clock-in is only allowed during work hours (${openStr} – ${closeStr}).`);
                        setIsLoading(false);
                        return;
                    }
                }

                const result = await updateLocation(latitude, longitude, accuracy, validOfficeId || undefined);
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

    const manualClockOut = useCallback(async () => {
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
                const offices = officesRef.current;
                let resolvedId: number | undefined;
                if (offices.length > 0) {
                    const inOffice = offices.find(o => 
                        getDistanceInMeters(latitude, longitude, o.latitude, o.longitude) <= o.in_office_radius_meters
                    );
                    resolvedId = inOffice?.id || offices[0].id;
                }

                const result = await updateLocation(latitude, longitude, accuracy, resolvedId);
                if (result.success && result.record) {
                    setPresenceState(result.record.presence_state ?? null);
                    setAttendanceState(result.record.attendance_state);
                    setClockInTime(result.record.clock_in_at || result.record.clock_in || null);
                    setClockOutTime(result.record.clock_out_at || result.record.clock_out || null);
                    setLastUpdate(new Date());
                    mutate('my-attendance-today');
                    mutate('team-attendance-today');
                    toast.success('Clocked out!');
                } else {
                    toast.error(result.error || 'Failed to clock out');
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
        isLoading
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
