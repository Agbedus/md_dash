'use client';

import React, { useState } from 'react';
import type { AttendanceRecord, OfficeLocation } from '@/types/attendance';
import AttendanceStatusCard from './attendance-status-card';
import AttendanceHistoryTable from './attendance-history-table';
import TeamAttendanceGrid from './team-attendance-grid';
import OfficeSettings from './office-settings';
import { FiUser, FiUsers, FiSettings } from 'react-icons/fi';

export interface AttendancePageClientProps {
    myToday: AttendanceRecord | null;
    myHistory: AttendanceRecord[];
    teamToday: AttendanceRecord[];
    officeLocations: OfficeLocation[];
    users: any[];
    isManager: boolean;
    isAdmin: boolean;
    currentUserId: string;
}

type TabId = 'my' | 'team' | 'admin';

export default function AttendancePageClient({
    myToday,
    myHistory,
    teamToday,
    officeLocations,
    users,
    isManager,
    isAdmin,
    currentUserId,
}: AttendancePageClientProps) {
    const [activeTab, setActiveTab] = useState<TabId>('my');

    const tabs: { id: TabId; label: string; icon: React.ElementType; visible: boolean }[] = [
        { id: 'my', label: 'My Attendance', icon: FiUser, visible: true },
        { id: 'team', label: 'Team', icon: FiUsers, visible: isManager },
        { id: 'admin', label: 'Settings', icon: FiSettings, visible: isAdmin },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl lg:text-4xl font-bold text-white tracking-tight">
                    Attendance & Presence
                </h1>
                <p className="text-zinc-400 text-sm lg:text-lg mt-1">
                    Track your attendance, location, and team presence in real-time.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit mb-8">
                {tabs.filter(t => t.visible).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            activeTab === tab.id
                                ? 'bg-white/[0.08] text-white border border-white/10'
                                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                        }`}
                    >
                        <tab.icon className="text-sm" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'my' && (
                <div className="space-y-6">
                    <AttendanceStatusCard record={myToday} />
                    <AttendanceHistoryTable records={myHistory} />
                </div>
            )}

            {activeTab === 'team' && isManager && (
                <TeamAttendanceGrid
                    initialRecords={teamToday}
                    users={users}
                />
            )}

            {activeTab === 'admin' && isAdmin && (
                <OfficeSettings initialLocations={officeLocations} />
            )}
        </div>
    );
}
