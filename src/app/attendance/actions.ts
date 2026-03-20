'use server';

import { auth } from '@/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { AttendanceRecord, OfficeLocation, AttendancePolicy } from '@/types/attendance';

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

// ── Helper ──────────────────────────────────────────────────────────

async function getAuthHeaders() {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    const token = session?.user?.accessToken;
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

// ── Staff: My Attendance ────────────────────────────────────────────

export async function getMyAttendanceToday(): Promise<AttendanceRecord | null> {
    const headers = await getAuthHeaders();
    if (!headers) return null;

    try {
        const res = await fetch(`${API_BASE_URL}/attendance/me/today`, {
            method: 'GET',
            headers,
            next: { tags: ['attendance-my'], revalidate: 30 },
        });
        if (!res.ok) {
            if (res.status === 404) return null;
            console.error("getMyAttendanceToday:", res.status, await res.text());
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error("Error fetching my attendance today:", error);
        return null;
    }
}

export async function getMyAttendanceHistory(): Promise<AttendanceRecord[]> {
    const headers = await getAuthHeaders();
    if (!headers) return [];

    try {
        const res = await fetch(`${API_BASE_URL}/attendance/me/history`, {
            method: 'GET',
            headers,
            next: { tags: ['attendance-history'], revalidate: 60 },
        });
        if (!res.ok) {
            console.error("getMyAttendanceHistory:", res.status, await res.text());
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error("Error fetching my attendance history:", error);
        return [];
    }
}

// ── Staff: Location Update ──────────────────────────────────────────

export async function updateLocation(
    latitude: number,
    longitude: number,
    accuracy: number,
    officeLocationId?: number,
) {
    const headers = await getAuthHeaders();
    if (!headers) return { success: false, error: "Unauthorized" };

    try {
        // If no office location ID provided, try to get the first one
        let resolvedOfficeId = officeLocationId;
        if (!resolvedOfficeId) {
            const locations = await getOfficeLocations();
            if (locations.length > 0) {
                resolvedOfficeId = locations[0].id;
            } else {
                return { success: false, error: "No office location configured. Ask your admin to create one." };
            }
        }

        const res = await fetch(`${API_BASE_URL}/attendance/location-update`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                latitude,
                longitude,
                accuracy_meters: accuracy,
                office_location_id: resolvedOfficeId,
                recorded_at: new Date().toISOString(),
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("updateLocation:", res.status, errorText);
            return { success: false, error: `API Error ${res.status}: ${errorText}` };
        }

        const data = await res.json();
        
        // Transform API response to match AttendanceRecord type if needed
        const record: AttendanceRecord = {
            id: data.id || 0,
            user_id: '', // Not returned in location-update summary
            date: new Date().toISOString().split('T')[0],
            clock_in: data.clock_in_at || null,
            clock_out: data.clock_out_at || null,
            presence_state: data.presence_state,
            attendance_state: data.attendance_state,
            total_hours: null,
            created_at: null,
            updated_at: null,
        };

        revalidateTag('attendance-my', 'max');
        return { success: true, record };
    } catch (error) {
        console.error("Error updating location:", error);
        return { success: false, error: "Network error" };
    }
}

// ── Manager: Team Attendance ────────────────────────────────────────

export async function getTeamAttendanceToday(): Promise<AttendanceRecord[]> {
    const headers = await getAuthHeaders();
    if (!headers) return [];

    try {
        const res = await fetch(`${API_BASE_URL}/attendance/team/today`, {
            method: 'GET',
            headers,
            next: { tags: ['attendance-team'], revalidate: 30 },
        });
        if (!res.ok) {
            console.error("getTeamAttendanceToday:", res.status, await res.text());
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error("Error fetching team attendance:", error);
        return [];
    }
}

export async function getUserAttendanceHistory(userId: string): Promise<AttendanceRecord[]> {
    const headers = await getAuthHeaders();
    if (!headers) return [];

    try {
        const res = await fetch(`${API_BASE_URL}/attendance/${userId}/history`, {
            method: 'GET',
            headers,
            next: { revalidate: 60 },
        });
        if (!res.ok) {
            console.error("getUserAttendanceHistory:", res.status, await res.text());
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error("Error fetching user attendance history:", error);
        return [];
    }
}

// ── Manager: Override ───────────────────────────────────────────────

export async function overrideAttendance(
    recordId: number,
    clockIn: string | null,
    clockOut: string | null,
) {
    const headers = await getAuthHeaders();
    if (!headers) return { success: false, error: "Unauthorized" };

    try {
        const res = await fetch(`${API_BASE_URL}/attendance/${recordId}/override`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                clock_in: clockIn,
                clock_out: clockOut,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("overrideAttendance:", res.status, errorText);
            return { success: false, error: `API Error ${res.status}: ${errorText}` };
        }

        revalidateTag('attendance-team', 'max');
        revalidateTag('attendance-my', 'max');
        revalidatePath('/attendance');
        return { success: true, record: await res.json() };
    } catch (error) {
        console.error("Error overriding attendance:", error);
        return { success: false, error: "Network error" };
    }
}

// ── Admin: Office Locations ─────────────────────────────────────────

export async function getOfficeLocations(): Promise<OfficeLocation[]> {
    const headers = await getAuthHeaders();
    if (!headers) return [];

    try {
        // The API docs don't list a GET all endpoint explicitly,
        // so we'll try the base path; fall back to empty if not supported
        const res = await fetch(`${API_BASE_URL}/attendance/office-locations`, {
            method: 'GET',
            headers,
            next: { tags: ['office-locations'], revalidate: 300 },
        });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export async function createOfficeLocation(data: {
    name: string;
    latitude: number;
    longitude: number;
    in_office_radius_meters?: number;
    temporarily_out_radius_meters?: number;
    out_of_office_radius_meters?: number;
}) {
    const headers = await getAuthHeaders();
    if (!headers) return { success: false, error: "Unauthorized" };

    try {
        const res = await fetch(`${API_BASE_URL}/attendance/office-locations`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errorText = await res.text();
            return { success: false, error: `API Error ${res.status}: ${errorText}` };
        }

        revalidateTag('office-locations', 'max');
        revalidatePath('/attendance');
        return { success: true, location: await res.json() };
    } catch (error) {
        return { success: false, error: "Network error" };
    }
}

export async function updateOfficeLocation(id: number, data: Partial<OfficeLocation>) {
    const headers = await getAuthHeaders();
    if (!headers) return { success: false, error: "Unauthorized" };

    try {
        const res = await fetch(`${API_BASE_URL}/attendance/office-locations/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errorText = await res.text();
            return { success: false, error: `API Error ${res.status}: ${errorText}` };
        }

        revalidateTag('office-locations', 'max');
        revalidatePath('/attendance');
        return { success: true, location: await res.json() };
    } catch (error) {
        return { success: false, error: "Network error" };
    }
}

// ── Admin: Attendance Policy ────────────────────────────────────────

export async function getAttendancePolicy(officeLocationId: number): Promise<AttendancePolicy | null> {
    const headers = await getAuthHeaders();
    if (!headers) return null;

    try {
        const res = await fetch(`${API_BASE_URL}/attendance-policy/${officeLocationId}`, {
            method: 'GET',
            headers,
            next: { tags: ['attendance-policy'], revalidate: 300 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function updateAttendancePolicy(
    officeLocationId: number,
    data: Partial<AttendancePolicy>
) {
    const headers = await getAuthHeaders();
    if (!headers) return { success: false, error: "Unauthorized" };

    try {
        const res = await fetch(`${API_BASE_URL}/attendance-policy/${officeLocationId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errorText = await res.text();
            return { success: false, error: `API Error ${res.status}: ${errorText}` };
        }

        revalidateTag('attendance-policy', 'max');
        revalidatePath('/attendance');
        return { success: true, policy: await res.json() };
    } catch (error) {
        return { success: false, error: "Network error" };
    }
}

// ── Client-side fetch for SWR polling ───────────────────────────────

export async function fetchTeamAttendanceLive(): Promise<AttendanceRecord[]> {
    return getTeamAttendanceToday();
}

export async function fetchMyAttendanceLive(): Promise<AttendanceRecord | null> {
    return getMyAttendanceToday();
}
