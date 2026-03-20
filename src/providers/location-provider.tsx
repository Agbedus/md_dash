'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { updateLocation, getOfficeLocations } from '@/app/attendance/actions';
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
    const [clockInTime, setClockInTime] = useState<string | null>(initialRecord?.clock_in || null);
    const [clockOutTime, setClockOutTime] = useState<string | null>(initialRecord?.clock_out || null);
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
                const { getAttendancePolicy, updateAttendancePolicy } = await import('@/app/attendance/actions');
                
                const newPolicies: Record<number, AttendancePolicy> = {};
                for (const office of offices) {
                    let p = await getAttendancePolicy(office.id);
                    if (p) {
                        // If we are in a dev/test phase and the window is closed, expand it
                        // This fixes the "clock_in_at is null" issue when testing in the afternoon
                        if (p.check_in_close_time && p.check_in_close_time < '23:59:00') {
                            try {
                                console.log(`[LocationProvider] Expanding check-in window for office ${office.id}`);
                                await updateAttendancePolicy(office.id, {
                                    check_in_close_time: '23:59:59'
                                });
                                p = { ...p, check_in_close_time: '23:59:59' };
                            } catch (err) {
                                console.error('Failed to auto-expand policy window:', err);
                            }
                        }
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
                    
                    // 1. Resolve Raw Zone using cached offices
                    const offices = officesRef.current;
                    let resolvedId: number | undefined;
                    let rawZone: PresenceState = 'OUT_OF_OFFICE';
                    let activeOffice: OfficeLocation | null = null;
                    
                    if (offices.length > 0) {
                        let minVal = Infinity;
                        for (const o of offices) {
                            const dist = getDistanceInMeters(latitude, longitude, o.latitude, o.longitude);
                            if (dist < minVal) {
                                minVal = dist;
                                activeOffice = o;
                            }
                        }
                        
                        if (activeOffice) {
                            if (minVal <= activeOffice.in_office_radius_meters) {
                                rawZone = 'IN_OFFICE';
                            } else if (minVal <= activeOffice.temporarily_out_radius_meters) {
                                rawZone = 'TEMPORARILY_OUT';
                            } else {
                                rawZone = 'OUT_OF_OFFICE';
                            }
                            resolvedId = activeOffice.id;
                        } else {
                            resolvedId = offices[0].id;
                        }
                    }

                    // 2. Use Cached Policy
                    const policy = activeOffice ? policiesRef.current[activeOffice.id] : null;
                    
                    // 3. Apply Stable Evidence Rules
                    let confirmedZone = confirmedPresenceRef.current;
                    let forceUpdate = false;

                    if (policy) {
                        const now = Date.now();
                        
                        if (rawZone !== confirmedZone) {
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

                            if (rawZone === 'OUT_OF_OFFICE' && accuracy > 30 && confirmedZone !== 'OUT_OF_OFFICE') {
                                // Ignore noisy samples
                            } else if (elapsedMins >= requiredMins) {
                                const prevState = confirmedPresenceRef.current;
                                confirmedPresenceRef.current = rawZone;
                                confirmedZone = rawZone;
                                firstSeenInNewStateRef.current = null;
                                
                                // Always trigger a backend sync on transition into IN_OFFICE
                                if (rawZone === 'IN_OFFICE' || (prevState !== null && prevState !== rawZone)) {
                                    forceUpdate = true;
                                }
                            }
                        } else {
                            firstSeenInNewStateRef.current = null;
                        }
                    } else {
                        confirmedPresenceRef.current = rawZone;
                        confirmedZone = rawZone;
                    }

                    // 4. Update Backend - Non-blocking silent call
                    // We sync if forceUpdate is true (state changed) or every interval
                    const result = await updateLocation(latitude, longitude, accuracy, resolvedId);
                    if (result.success && result.record) {
                        const prevAtt = attendanceStateRef.current;
                        const newAtt = result.record.attendance_state;
                        
                        attendanceStateRef.current = newAtt;
                        setPresenceState(result.record.presence_state);
                        setAttendanceState(newAtt);
                        setClockInTime(result.record.clock_in);
                        setClockOutTime(result.record.clock_out);
                        setLastUpdate(new Date());
                        
                        // Mutate both user and team views
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
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
            );
        });
    }, [isInitialized, mutate]);

    // Start/stop interval when tracking changes
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (isTracking) {
            // Delay initial background check by 10s to not interfere with initial page data fetch
            timeoutId = setTimeout(() => {
                sendLocation();
                intervalRef.current = setInterval(sendLocation, INTERVAL_MS);
            }, 10000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
            clearTimeout(timeoutId);
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
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const offices = officesRef.current;
                    if (!offices || offices.length === 0) {
                        toast.error('No office locations configured.');
                        setIsLoading(false);
                        return;
                    }

                    let validOfficeId: number | null = null;
                    for (const office of offices) {
                        const dist = getDistanceInMeters(latitude, longitude, office.latitude, office.longitude);
                        if (dist <= office.in_office_radius_meters) {
                            validOfficeId = office.id;
                            break;
                        }
                    }

                    if (validOfficeId === null) {
                        toast.error('Not in the office geofence.');
                        setIsLoading(false);
                        return;
                    }

                    const result = await updateLocation(latitude, longitude, accuracy, validOfficeId || undefined);
                    if (result.success && result.record) {
                        setPresenceState(result.record.presence_state);
                        setAttendanceState(result.record.attendance_state);
                        setClockInTime(result.record.clock_in);
                        setClockOutTime(result.record.clock_out);
                        setLastUpdate(new Date());
                        mutate('my-attendance-today');
                        mutate('team-attendance-today');
                        toast.success('Clocked in!');
                    } else {
                        toast.error(result.error || 'Failed to clock in');
                    }
                    setIsLoading(false);
                },
                (error) => {
                    toast.error('GPS error.');
                    setIsLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } catch {
            setIsLoading(false);
        }
    }, [mutate]);

    const manualClockOut = useCallback(async () => {
        setIsLoading(true);
        try {
            if (!navigator.geolocation) {
                toast.error('Geolocation not supported');
                setIsLoading(false);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async (position) => {
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
                        setPresenceState(result.record.presence_state);
                        setAttendanceState(result.record.attendance_state);
                        setClockInTime(result.record.clock_in);
                        setClockOutTime(result.record.clock_out);
                        setLastUpdate(new Date());
                        mutate('my-attendance-today');
                        mutate('team-attendance-today');
                        toast.success('Clocked out!');
                    } else {
                        toast.error(result.error || 'Failed to clock out');
                    }
                    setIsLoading(false);
                },
                () => {
                    setIsLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
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
