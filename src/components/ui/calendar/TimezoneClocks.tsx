"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FiClock, FiTrash2, FiPlus } from "react-icons/fi";

interface ClockItem {
  id: string;
  tz: string;
}

const COMMON_TIMEZONES = [
  { tz: "UTC", label: "UTC" },
  { tz: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { tz: "America/Denver", label: "Denver (MT)" },
  { tz: "America/Chicago", label: "Chicago (CT)" },
  { tz: "America/New_York", label: "New York (ET)" },
  { tz: "Europe/London", label: "London (BST/GMT)" },
  { tz: "Europe/Berlin", label: "Berlin (CET)" },
  { tz: "Africa/Accra", label: "Accra (GMT)" },
  { tz: "Africa/Lagos", label: "Lagos (WAT)" },
  { tz: "Asia/Dubai", label: "Dubai (GST)" },
  { tz: "Asia/Kolkata", label: "Kolkata (IST)" },
  { tz: "Asia/Singapore", label: "Singapore (SGT)" },
  { tz: "Asia/Tokyo", label: "Tokyo (JST)" },
  { tz: "Australia/Sydney", label: "Sydney (AEST)" },
];

function formatInTZ(date: Date, tz: string) {
  // HH:mm, e.g. 13:05
  const time = new Intl.DateTimeFormat('en-US', {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(date);
  // e.g. Sat, Aug 10
  const day = new Intl.DateTimeFormat('en-US', {
    weekday: "short",
    month: "short",
    day: "2-digit",
    timeZone: tz,
  }).format(date);
  return { time, day };
}

const LS_KEY = "mdp_tz_clocks_v1";

export default function TimezoneClocks() {
  const [now, setNow] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);
  const [clocks, setClocks] = useState<ClockItem[]>([]);
  const [selected, setSelected] = useState<string>("UTC");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tzOptions = useMemo(() => COMMON_TIMEZONES, []);

  // Load saved clocks from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
      if (raw) {
        const arr = JSON.parse(raw) as unknown;
        if (Array.isArray(arr)) {
          const sanitized = arr.filter((z) => typeof z === 'string') as string[];
          if (sanitized.length > 0) {
            setClocks(sanitized.map((tz) => ({ id: crypto.randomUUID(), tz })));
            setMounted(true);
            return;
          }
        }
      }
      // fallback default: current timezone
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setClocks([{ id: crypto.randomUUID(), tz }]);
      setMounted(true);
    } catch {
      // ignore
    }
  }, []);

  // Persist clocks to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_KEY, JSON.stringify(clocks.map((c) => c.tz)));
      }
    } catch {
      // ignore
    }
  }, [clocks]);

  function addClock() {
    if (!selected) return;
    setClocks((c) => [...c, { id: crypto.randomUUID(), tz: selected }]);
  }

  function removeClock(id: string) {
    setClocks((c) => c.filter((x) => x.id !== id));
  }

  return (
    <div className="sticky bottom-0 z-50 bg-slate-950/80 backdrop-blur-sm border-t border-slate-700/60 p-4">
      <div className="max-w-full mx-auto">
        <div className="w-full border border-slate-700/60 rounded-xl p-4 bg-slate-900/95 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <FiClock className="h-4 w-4" />
              <span className="text-sm font-medium">Timezones</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="bg-slate-900 text-slate-200 text-xs px-2 py-2 rounded-md border border-slate-700"
              >
                {tzOptions.map((opt) => (
                  <option key={opt.tz} value={opt.tz}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button onClick={addClock} className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs">
                <FiPlus className="h-3 w-3" /> Add
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {mounted && clocks.map((c) => {
              const { time, day } = formatInTZ(now, c.tz);
              return (
                <div key={c.id} className="border border-slate-700/60 rounded-md p-3 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 text-lg font-semibold tracking-tight">{time}</div>
                    <div className="text-slate-400 text-xs">{day} • {c.tz}</div>
                  </div>
                  <button onClick={() => removeClock(c.id)} className="p-2 text-slate-400 hover:text-red-400">
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
