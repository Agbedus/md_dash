"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FiClock, FiTrash2, FiPlus, FiChevronUp, FiChevronDown, FiX, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

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
  try {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(date);
    const day = new Intl.DateTimeFormat('en-US', {
      weekday: "short",
      month: "short",
      day: "2-digit",
      timeZone: tz,
    }).format(date);
    return { time, day };
  } catch (e) {
    return { time: "--:--", day: "Invalid TZ" };
  }
}

const LS_KEY = "mdp_tz_clocks_v2";

export default function TimezoneClocks() {
  const [now, setNow] = useState<Date>(new Date());
  const [clocks, setClocks] = useState<ClockItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length > 0) {
            return arr.map(tz => ({ id: Math.random().toString(36).substr(2, 9), tz }));
          }
        }
      }
    } catch (e) {
      console.error("Failed to load clocks from LS", e);
    }
    return [{ id: 'utc-default', tz: 'UTC' }];
  });
  const [selected, setSelected] = useState<string>("UTC");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Persist clocks
  useEffect(() => {
    if (clocks.length > 0) {
      localStorage.setItem(LS_KEY, JSON.stringify(clocks.map(c => c.tz)));
    }
  }, [clocks]);

  const addClock = () => {
    if (!selected) return;
    if (clocks.some(c => c.tz === selected)) {
        setIsAdding(false);
        return;
    }
    setClocks(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), tz: selected }]);
    setIsAdding(false);
    setIsExpanded(true);
  };

  const removeClock = (id: string) => {
    setClocks(prev => prev.filter(c => c.id !== id));
  };

  const utcClock = clocks.find(c => c.tz === 'UTC') || { id: 'utc', tz: 'UTC' };
  const otherClocks = clocks.filter(c => c.tz !== 'UTC');

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-row-reverse items-end gap-3 pointer-events-none">
      {/* Main UTC Toggle Button */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-zinc-900/90 border border-white/20 rounded-2xl p-3 flex items-center gap-4 shadow-2xl hover:border-white/30 transition-all group backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FiClock className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-white text-lg font-black tracking-tight leading-none">
                {formatInTZ(now, 'UTC').time}
              </div>
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Universal Time</div>
            </div>
          </div>
          <div className="pl-2 border-l border-white/10">
            {isExpanded ? <FiChevronDown className="text-zinc-500 group-hover:text-white transition-colors" /> : <FiChevronUp className="text-zinc-500 group-hover:text-white transition-colors" />}
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="flex flex-row-reverse items-center gap-2 pointer-events-auto"
          >
           {isAdding ? (
              <div className="bg-zinc-900/95 border border-indigo-500/50 rounded-xl p-2 flex items-center gap-2 shadow-2xl backdrop-blur-xl">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="bg-black text-white text-xs px-2 py-1.5 rounded-lg border border-white/20 outline-none focus:border-indigo-500/50"
                >
                  {COMMON_TIMEZONES.map((opt) => (
                    <option key={opt.tz} value={opt.tz}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button onClick={addClock} className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                  <FiCheck className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setIsAdding(false)} className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors">
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center justify-center h-[52px] w-[52px] rounded-xl border border-dashed border-white/20 hover:border-white/40 text-zinc-500 hover:text-zinc-300 transition-all bg-zinc-900/50 hover:bg-zinc-900/80 backdrop-blur-md"
                title="Add Timezone"
              >
                <FiPlus className="h-5 w-5" />
              </button>
            )}

            {otherClocks.map((c) => {
              const { time, day } = formatInTZ(now, c.tz);
              return (
                <div key={c.id} className="bg-zinc-900/90 border border-white/20 rounded-xl p-3 flex items-center justify-between gap-4 min-w-[160px] shadow-2xl backdrop-blur-xl group/item">
                  <div>
                    <div className="text-white text-base font-bold tracking-tight">{time}</div>
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{day} • {c.tz.split('/').pop()?.replace('_', ' ')}</div>
                  </div>
                  <button onClick={() => removeClock(c.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors opacity-0 group-hover/item:opacity-100">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
