'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { updateLocation, getOfficeLocations, clockOutManual } from '@/app/(dashboard)/attendance/actions';
import { getDistanceInMeters } from '@/lib/distance-utils';
import { toast } from '@/lib/toast';
import type { PresenceState, AttendanceState, AttendancePolicy, OfficeLocation, AttendanceRecord } from '@/types/attendance';

const STORAGE_KEY = 'md_location_tracking_enabled';
const CONFIG_CACHE_KEY = 'md_attendance_config_cache';
const SYNC_THROTTLE_MS = 5 * 60 * 1000; // Throttle backend sync to once per 5 minutes unless state changes

import { isTimeInWindow, isAfterTime, isBeforeTime, isWithinRadius } from '@/lib/attendance-utils';

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
    isPolling: boolean;
    refreshLocation: () => Promise<void>;
    lastPulse: Date | null;
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
    
    const officesRef = useRef<OfficeLocation[]>([]);
    const policiesRef = useRef<Record<number, AttendancePolicy>>({});
    const [isInitialized, setIsInitialized] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [lastPulse, setLastPulse] = useState<Date | null>(null);

    useEffect(() => {
        if (initialRecord) {
            attendanceStateRef.current = initialRecord.attendance_state;
            presenceStateRef.current = deriveInitialPresence(initialRecord);
        }
    }, [initialRecord]);
    
    const watchIdRef = useRef<number | null>(null);
    const lastSyncTimeRef = useRef<number>(0);
    const presenceStateRef = useRef<PresenceState | null>(null);
    const attendanceStateRef = useRef<AttendanceState | null>(null); // To avoid dependency loop in callbacks

    const syncConfiguration = useCallback(async (force = false) => {
        try {
            // If not forced, try to load from localStorage first for immediate UI hydration
            const cached = localStorage.getItem(CONFIG_CACHE_KEY);
            if (cached && !force) {
                const { offices, policies } = JSON.parse(cached);
                officesRef.current = offices;
                policiesRef.current = policies;
                if (offices.length > 0) {
                    setOfficeLocationState({ latitude: offices[0].latitude, longitude: offices[0].longitude });
                }
                setIsInitialized(true);
            }

            console.log('[LocationProvider] Syncing configuration with server...');
            const offices = await getOfficeLocations();
            officesRef.current = offices;
            if (offices.length > 0) {
                setOfficeLocationState({ latitude: offices[0].latitude, longitude: offices[0].longitude });
            }
            
            const { getAttendancePolicy } = await import('@/app/(dashboard)/attendance/actions');
            const newPolicies: Record<number, AttendancePolicy> = {};
            for (const office of offices) {
                const p = await getAttendancePolicy(office.id);
                if (p) newPolicies[office.id] = p;
            }
            policiesRef.current = newPolicies;
            
            // Update Cache
            localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({
                offices,
                policies: newPolicies,
                timestamp: Date.now()
            }));

            setIsInitialized(true);
        } catch (err) {
            console.error('Failed to sync location config:', err);
            setIsInitialized(true); 
        }
    }, []);

    useEffect(() => {
        const initData = async () => {
            await syncConfiguration();
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
    }, [syncConfiguration]);


    const handlePositionUpdate = useCallback(async (position: GeolocationPosition) => {
        if (!isInitialized) return;
        
        const { latitude, longitude, accuracy } = position.coords;
        const now = new Date();
        
        // 1. Instant UI Update
        setLocation({ latitude, longitude, accuracy });
        setLastPulse(now);

        const offices = officesRef.current;
        if (!offices || offices.length === 0) return;

        // 2. Instant Local Evaluation
        let activeOffice: OfficeLocation | null = null;
        let minDistance = Infinity;
        
        for (const o of offices) {
            const dist = getDistanceInMeters(latitude, longitude, o.latitude, o.longitude);
            if (dist < minDistance) {
                minDistance = dist;
                activeOffice = o;
            }
        }
        
        if (!activeOffice) return;

        let localPresence: PresenceState = 'OUT_OF_OFFICE';
        if (minDistance <= activeOffice.in_office_radius_meters) {
            localPresence = 'IN_OFFICE';
        } else if (minDistance <= (activeOffice.temporarily_out_radius_meters || activeOffice.in_office_radius_meters * 2.5)) {
            localPresence = 'TEMPORARILY_OUT';
        }

        const prevPres = presenceStateRef.current;
        const stateChanged = prevPres !== localPresence;
        
        if (stateChanged) {
            console.log(`[LocationProvider] Instant transition: ${prevPres} -> ${localPresence}`);
            presenceStateRef.current = localPresence;
            setPresenceState(localPresence);
        }

        // 3. Dynamic Sync: Location + Configuration
        const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
        const shouldSync = stateChanged || timeSinceLastSync >= SYNC_THROTTLE_MS;

        if (shouldSync && accuracy <= 50) {
            setIsPolling(true);
            try {
                // Ensure configuration is fresh
                await syncConfiguration(true);
                
                const result = await updateLocation(latitude, longitude, accuracy, activeOffice.id);
                if (result.success && result.record) {
                    const newAtt = result.record.attendance_state;
                    const backendPres = result.record.presence_state ?? null;
                    
                    lastSyncTimeRef.current = Date.now();
                    
                    // Sync attendance state (always from backend)
                    const prevAtt = attendanceStateRef.current;
                    attendanceStateRef.current = newAtt;
                    setAttendanceState(newAtt);
                    
                    // Sync presence state (confirming local guess)
                    if (backendPres && backendPres !== localPresence) {
                        console.log(`[LocationProvider] Backend correction: ${localPresence} -> ${backendPres}`);
                        presenceStateRef.current = backendPres;
                        setPresenceState(backendPres);
                    }

                    setClockInTime(result.record.clock_in_at || result.record.clock_in || null);
                    setClockOutTime(result.record.clock_out_at || result.record.clock_out || null);
                    setLastUpdate(new Date());
                    
                    mutate('my-attendance-today');
                    if (prevAtt !== newAtt || (stateChanged && backendPres !== prevPres)) {
                        mutate('team-attendance-today');
                        if (prevAtt && prevAtt !== newAtt) {
                            if (newAtt === 'CLOCKED_IN') toast.success('Confirmed in office!');
                            else if (newAtt === 'CLOCKED_OUT') toast.info('Attendance finalized.');
                        }
                    }
                }
            } catch (err) {
                console.error('Backend sync failed:', err);
            } finally {
                setIsPolling(false);
            }
        }
    }, [isInitialized, mutate, syncConfiguration]);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) return;
        
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            (error) => {
                console.error('Geolocation watch error:', error.message);
                if (error.code === error.PERMISSION_DENIED) {
                    toast.error('Location permission denied. Tracking disabled.');
                    setIsTracking(false);
                    localStorage.setItem(STORAGE_KEY, 'false');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [handlePositionUpdate]);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    // Start/stop watch when tracking changes
    useEffect(() => {
        if (isTracking) {
            startTracking();
        } else {
            stopTracking();
        }
        return () => stopTracking();
    }, [isTracking, startTracking, stopTracking]);

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

                // ── Policy window checks ──
                const policy = policiesRef.current[validOfficeId];
                if (policy) {
                    const now = new Date();
                    
                    // 1. Arrival Window
                    const inArrivalWindow = isTimeInWindow(
                        now,
                        policy.check_in_open_time,
                        policy.check_in_close_time
                    );
                    if (!inArrivalWindow) {
                        toast.error(`Arrival window is closed (${policy.check_in_open_time?.slice(0,5)} - ${policy.check_in_close_time?.slice(0,5)}).`);
                        setIsLoading(false);
                        return;
                    }

                    // 2. Auto-Out Check
                    if (policy.auto_clock_out_time && isAfterTime(now, policy.auto_clock_out_time)) {
                        toast.error(`Automatic checkout period has started (${policy.auto_clock_out_time.slice(0,5)}).`);
                        setIsLoading(false);
                        return;
                    }
                }

                // ── 3. Optimistic Update (Instant Feedback) ──
                const previousAttendance = attendanceStateRef.current;
                const previousPresence = presenceStateRef.current;
                const previousClockIn = clockInTime;

                setAttendanceState('CLOCKED_IN');
                setPresenceState('IN_OFFICE');
                attendanceStateRef.current = 'CLOCKED_IN';
                presenceStateRef.current = 'IN_OFFICE';
                setClockInTime(new Date().toISOString());
                setLastUpdate(new Date());

                const result = await updateLocation(latitude, longitude, accuracy, validOfficeId || undefined, true);
                
                if (result.success && result.record) {
                    // Sync with backend confirmed record
                    setPresenceState(result.record.presence_state ?? null);
                    setAttendanceState(result.record.attendance_state);
                    attendanceStateRef.current = result.record.attendance_state;
                    presenceStateRef.current = result.record.presence_state ?? null;
                    
                    const actualClockIn = result.record.clock_in_at || result.record.clock_in || null;
                    setClockInTime(actualClockIn);
                    setClockOutTime(result.record.clock_out_at || result.record.clock_out || null);
                    
                    mutate('my-attendance-today');
                    mutate('team-attendance-today');
                    
                    if (result.record.attendance_state === 'CLOCKED_IN') {
                        toast.success('Clocked in!');
                    } else {
                        toast.info('Location updated, but clock-in was not confirmed by the server.');
                    }
                } else {
                    // ── Rollback on Failure ──
                    setAttendanceState(previousAttendance);
                    setPresenceState(previousPresence);
                    attendanceStateRef.current = previousAttendance;
                    presenceStateRef.current = previousPresence;
                    setClockInTime(previousClockIn);
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
    }, [mutate, clockInTime]);

    const manualClockOut = useCallback(async (force = false) => {
        setIsLoading(true);
        try {
            const now = new Date();
            // Note: Manual Clock-out uses cached data for rules as requested.
            // Check nearest office from cache based on last known location or defaults
            const offices = officesRef.current;
            const office = offices.length > 0 ? offices[0] : null;
            const policy = office ? policiesRef.current[office.id] : null;

            // Pre-check Warnings (Logic-only confirmation)
            if (!force) {
                const inOffice = presenceState === 'IN_OFFICE';
                const isDuringWorkday = policy ? isTimeInWindow(now, policy.work_start_time, policy.work_end_time) : false;

                if (inOffice || isDuringWorkday) {
                    setIsLoading(false);
                    return { confirmRequired: true };
                }
            }

            // ── 2. Optimistic Update ──
            const previousAttendance = attendanceStateRef.current;
            const previousPresence = presenceStateRef.current;
            const previousClockOut = clockOutTime;
            const previousTracking = isTracking;

            setAttendanceState('CLOCKED_OUT');
            attendanceStateRef.current = 'CLOCKED_OUT';
            setClockOutTime(new Date().toISOString());
            setLastUpdate(new Date());
            
            // Stop tracking immediately for snappy feel
            setIsTracking(false);
            localStorage.setItem(STORAGE_KEY, 'false');
            stopTracking();

            toast.loading("Clocking out...", { id: 'clock-out' });
            
            const result = await clockOutManual();
            
            toast.dismiss('clock-out');
            if (result.success && result.record) {
                setPresenceState(result.record.presence_state ?? null);
                setAttendanceState(result.record.attendance_state);
                attendanceStateRef.current = result.record.attendance_state;
                presenceStateRef.current = result.record.presence_state ?? null;
                
                setClockInTime(result.record.clock_in_at || result.record.clock_in || null);
                setClockOutTime(result.record.clock_out_at || result.record.clock_out || null);
                
                mutate('my-attendance-today');
                mutate('team-attendance-today');
                toast.success('Clocked out successfully!');
            } else {
                // ── Rollback on Failure ──
                setAttendanceState(previousAttendance);
                setPresenceState(previousPresence);
                attendanceStateRef.current = previousAttendance;
                presenceStateRef.current = previousPresence;
                setClockOutTime(previousClockOut);
                
                setIsTracking(previousTracking);
                localStorage.setItem(STORAGE_KEY, String(previousTracking));
                if (previousTracking) startTracking();

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
    }, [mutate, presenceState, clockOutTime, isTracking, startTracking, stopTracking]);

    const refreshLocation = useCallback(async () => {
        setIsLoading(true);
        toast.loading("Acquiring high-precision GPS...", { id: 'gps-sync' });
        try {
            const position = await getAccuratePosition(15000, 35);
            toast.dismiss('gps-sync');
            const { latitude, longitude, accuracy } = position.coords;
            setLocation({ latitude, longitude, accuracy });
            
            // Sync both configuration and location
            await syncConfiguration(true);
            
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
    }, [mutate, syncConfiguration]);

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
        isPolling,
        refreshLocation,
        lastPulse,
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
        isPolling,
        refreshLocation,
        lastPulse,
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
