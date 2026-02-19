"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiGithub, FiGlobe, FiCpu, FiShield, FiHeart } from "react-icons/fi";

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    version: string;
}

export function AboutModal({ isOpen, onClose, version }: AboutModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all z-20"
                    >
                        <FiX className="w-5 h-5" />
                    </button>

                    <div className="p-8 lg:p-10 text-center space-y-8">
                        <div className="space-y-4">
                            <div className="mx-auto w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <span className="text-3xl font-black text-white">MD<span className="text-indigo-500">*</span></span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">MD Platform</h2>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Version</span>
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest">{version}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest">Beta</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
                            A bespoke, secure, and intelligent productivity ecosystem designed for high-performance teams and strategic maneuvers.
                        </p>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-indigo-400">
                                    <FiCpu className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Intelligent</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-emerald-400">
                                    <FiShield className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Secure</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-amber-400">
                                    <FiHeart className="w-5 h-5" />
                                00:00:00:00                                </div>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Bespoke</span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-6">
                                <a href="#" className="text-zinc-500 hover:text-white transition-colors"><FiGithub className="w-5 h-5" /></a>
                                <a href="#" className="text-zinc-500 hover:text-white transition-colors"><FiGlobe className="w-5 h-5" /></a>
                            </div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                                © 2026 MD TECHNOLOGIES. ALL RIGHTS RESERVED.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
