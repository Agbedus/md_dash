'use client';

import React, { useState, useEffect } from 'react';
import type { OfficeLocation } from '@/types/attendance';
import { createOfficeLocation, updateOfficeLocation } from '@/app/(dashboard)/attendance/actions';
import { FiMapPin, FiPlus, FiCheck, FiMap, FiX } from 'react-icons/fi';
import { toast } from '@/lib/toast';
import PolicyEditor from './policy-editor';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./office-map'), {
    ssr: false,
    loading: () => <div className="w-full h-full min-h-[400px] rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-center p-8 text-center text-zinc-500 text-sm">Loading visualizer...</div>
});

export default function OfficeSettings({ initialLocations }: { initialLocations: OfficeLocation[] }) {
    const [locations, setLocations] = useState(initialLocations);
    const [selectedId, setSelectedId] = useState<number | 'new'>(
        locations.length > 0 ? locations[0].id : 'new'
    );
    const [activeRightTab, setActiveRightTab] = useState<'details' | 'policy'>('details');

    // Form state for currently selected office
    const [form, setForm] = useState(() => {
        if (initialLocations.length > 0) {
            const loc = initialLocations[0];
            return {
                name: loc.name,
                latitude: String(loc.latitude),
                longitude: String(loc.longitude),
                in_office_radius_meters: String(loc.in_office_radius_meters),
                temporarily_out_radius_meters: String(loc.temporarily_out_radius_meters),
                out_of_office_radius_meters: String(loc.out_of_office_radius_meters),
            };
        }
        return {
            name: '',
            latitude: '',
            longitude: '',
            in_office_radius_meters: '100',
            temporarily_out_radius_meters: '500',
            out_of_office_radius_meters: '1000',
        };
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSelect = (id: number | 'new') => {
        setSelectedId(id);
        if (id === 'new') {
            setActiveRightTab('details');
            setForm({
                name: '',
                latitude: '',
                longitude: '',
                in_office_radius_meters: '100',
                temporarily_out_radius_meters: '500',
                out_of_office_radius_meters: '1000',
            });
        } else {
            const loc = locations.find(l => l.id === id);
            if (loc) {
                setForm({
                    name: loc.name,
                    latitude: String(loc.latitude),
                    longitude: String(loc.longitude),
                    in_office_radius_meters: String(loc.in_office_radius_meters),
                    temporarily_out_radius_meters: String(loc.temporarily_out_radius_meters),
                    out_of_office_radius_meters: String(loc.out_of_office_radius_meters),
                });
            }
        }
    };

    const handleSaveOffice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const data = {
            name: form.name,
            latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
            in_office_radius_meters: parseInt(form.in_office_radius_meters),
            temporarily_out_radius_meters: parseInt(form.temporarily_out_radius_meters),
            out_of_office_radius_meters: parseInt(form.out_of_office_radius_meters),
        };

        if (selectedId === 'new') {
            const result = await createOfficeLocation(data);
            if (result.success && result.location) {
                toast.success('Office location created');
                setLocations(prev => [...prev, result.location]);
                setSelectedId(result.location.id);
            } else {
                toast.error(result.error || 'Failed to create location');
            }
        } else {
            const result = await updateOfficeLocation(selectedId, data);
            if (result.success && result.location) {
                toast.success('Office location updated');
                setLocations(prev => prev.map(l => l.id === selectedId ? result.location : l));
            } else {
                toast.error(result.error || 'Failed to update location');
            }
        }
        setIsSaving(false);
    };

    const inputClass = "w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-colors";
    const labelClass = "block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5";

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sidebar */}
            <div className="glass p-3 rounded-2xl border border-white/5 space-y-1.5 h-fit">
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2">Offices</h3>
                
                {locations.map(loc => (
                    <button
                        key={loc.id}
                        onClick={() => handleSelect(loc.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left transition-all ${
                            selectedId === loc.id 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'text-zinc-500 hover:text-white hover:bg-white/[0.04] border border-transparent'
                        }`}
                    >
                        <FiMapPin className="text-xs shrink-0" />
                        <span className="text-xs font-semibold truncate">{loc.name}</span>
                    </button>
                ))}

                <div className="pt-2 mt-2 border-t border-white/5 pl-px pr-px">
                    <button
                        onClick={() => handleSelect('new')}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                            selectedId === 'new'
                                ? 'bg-white/[0.08] text-white border border-white/10'
                                : 'text-zinc-400 hover:text-white bg-white/[0.02] border border-dashed border-white/10 hover:border-white/20'
                        }`}
                    >
                        <FiPlus className="text-sm" />
                        Add New Office
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="md:col-span-3">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Left side: Forms / Policy */}
                    <div className="space-y-4">
                        {/* Tabs for Details vs Policy */}
                        {selectedId !== 'new' && (
                            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit">
                                <button
                                    onClick={() => setActiveRightTab('details')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                        activeRightTab === 'details'
                                            ? 'bg-white/[0.08] text-white border border-white/10'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                                    }`}
                                >
                                    Office Details
                                </button>
                                <button
                                    onClick={() => setActiveRightTab('policy')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                        activeRightTab === 'policy'
                                            ? 'bg-white/[0.08] text-white border border-white/10'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                                    }`}
                                >
                                    Attendance Policy
                                </button>
                            </div>
                        )}

                        {activeRightTab === 'details' && (
                            <div className="glass p-4 rounded-2xl border border-white/5">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                                    <FiMap className="text-emerald-400" />
                                    {selectedId === 'new' ? 'Create Office Location' : 'Office Details'}
                                </h3>
                                
                                <form onSubmit={handleSaveOffice} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className={labelClass}>Office Name</label>
                                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="Headquarters" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelClass}>Latitude</label>
                                                <input type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} className={inputClass} placeholder="5.6037" required />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Longitude</label>
                                                <input type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} className={inputClass} placeholder="-0.1870" required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-3 mt-3">
                                        <div>
                                            <label className={labelClass}>In Office (m)</label>
                                            <input type="number" value={form.in_office_radius_meters} onChange={e => setForm(f => ({ ...f, in_office_radius_meters: e.target.value }))} className={inputClass} required />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Temp Out (m)</label>
                                            <input type="number" value={form.temporarily_out_radius_meters} onChange={e => setForm(f => ({ ...f, temporarily_out_radius_meters: e.target.value }))} className={inputClass} required />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Out Of Office (m)</label>
                                            <input type="number" value={form.out_of_office_radius_meters} onChange={e => setForm(f => ({ ...f, out_of_office_radius_meters: e.target.value }))} className={inputClass} required />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                                        >
                                            <FiCheck className="text-sm" />
                                            {isSaving ? 'Saving...' : 'Save Office Details'}
                                        </button>
                                        {selectedId === 'new' && locations.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleSelect(locations[0].id)}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
                                            >
                                                <FiX className="text-sm" />
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Policy Editor */}
                        {activeRightTab === 'policy' && selectedId !== 'new' && (
                            <PolicyEditor officeLocationId={selectedId} />
                        )}
                    </div>

                    {/* Right side: Map Visualization */}
                    <div className="h-full min-h-[400px]">
                        <MapComponent 
                            latitude={parseFloat(form.latitude) || 0}
                            longitude={parseFloat(form.longitude) || 0}
                            inOfficeRadius={parseInt(form.in_office_radius_meters) || 0}
                            temporarilyOutRadius={parseInt(form.temporarily_out_radius_meters) || 0}
                            outOfOfficeRadius={parseInt(form.out_of_office_radius_meters) || 0}
                            name={form.name}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
