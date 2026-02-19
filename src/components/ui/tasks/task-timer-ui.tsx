'use client';

import React, { useState } from 'react';
import { useTaskTimer } from '@/providers/task-timer-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPause, FiPlay, FiSquare, FiClock, FiMaximize2, FiExternalLink } from 'react-icons/fi';
import { format } from 'date-fns';

export function TaskTimerUI() {
    const { activeTask, isPaused, elapsedTime, pauseTimer, resumeTimer, stopTimer } = useTaskTimer();

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!activeTask) return null;

    return (
        <AnimatePresence>
            {!isPaused && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-2xl glass border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden"
                    >
                        {/* Background subtle pulse */}
                        <div className="absolute inset-0 bg-indigo-500/5 animate-pulse-slow pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                            <div className="space-y-2">
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                    Current Mission
                                </span>
                                <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight uppercase leading-tight max-w-md mx-auto">
                                    {activeTask.name}
                                </h2>
                                {activeTask.description && (
                                    <p className="text-zinc-500 text-sm lg:text-base font-medium max-w-sm mx-auto">
                                        {activeTask.description}
                                    </p>
                                )}
                            </div>

                            <div className="relative">
                                <div className="text-6xl lg:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
                                    {formatTime(elapsedTime)}
                                </div>
                                <div className="absolute -top-4 -right-12 px-2 py-1 rounded-md bg-zinc-900 border border-white/10 flex items-center gap-1.5 opacity-60">
                                    <FiClock className="text-indigo-400 w-3 h-3" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Focus</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 lg:gap-8 pt-4">
                                <button
                                    onClick={pauseTimer}
                                    className="group relative flex flex-col items-center gap-2 transition-all hover-scale"
                                >
                                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:border-amber-500/30 transition-all shadow-lg">
                                        <FiPause className="w-6 h-6 lg:w-8 lg:h-8 text-white group-hover:text-amber-400 transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-amber-400 transition-colors">Break</span>
                                </button>

                                <button
                                    onClick={stopTimer}
                                    className="group relative flex flex-col items-center gap-2 transition-all hover-scale"
                                >
                                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:border-rose-500/30 transition-all shadow-xl">
                                        <FiSquare className="w-8 h-8 lg:w-10 lg:h-10 text-rose-400 group-hover:text-rose-300 transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest group-hover:text-rose-400 transition-colors">Finish Task</span>
                                </button>
                            </div>

                            <div className="pt-8 w-full border-t border-white/5">
                                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                                    Navigation locked until session complete or pause.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {isPaused && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, x: 50, y: 50 }}
                    animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, x: 50, y: 50 }}
                    className="fixed bottom-8 right-8 z-[101]"
                >
                    <button
                        onClick={resumeTimer}
                        className="group flex items-center gap-4 p-2 pl-4 lg:pl-6 rounded-2xl glass border border-white/10 shadow-2xl hover:border-indigo-500/30 transition-all hover-scale bg-zinc-900/80 backdrop-blur-md"
                    >
                        <div className="flex flex-col items-start gap-0.5 overflow-hidden max-w-[120px] lg:max-w-[200px]">
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest whitespace-nowrap">Paused: {activeTask.name}</span>
                            <span className="text-lg lg:text-xl font-black text-white tracking-tight tabular-nums">{formatTime(elapsedTime)}</span>
                        </div>
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500/30 group-hover:border-indigo-500/40 transition-all shadow-lg">
                            <FiPlay className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400 group-hover:text-white fill-current transition-all" />
                        </div>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
