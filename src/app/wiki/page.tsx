"use client";

import React from "react";
import {
    FiInfo,
    FiBookOpen,
    FiDatabase,
    FiArchive,
    FiExternalLink,
    FiChevronRight,
    FiCpu,
    FiShield,
    FiTarget,
    FiLayers,
    FiClock,
    FiZap
} from 'react-icons/fi';

export default function WikiPage() {
    const topics = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: FiInfo,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            subheadings: [
                { id: 'mission-briefing', title: 'Mission Briefing', icon: FiTarget },
                { id: 'ai-aide', title: 'The AI Aide', icon: FiZap },
                { id: 'local-llm', title: 'Local LLM Strategy', icon: FiShield },
            ]
        },
        {
            id: 'vectors',
            title: 'Operational Vectors',
            icon: FiLayers,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            subheadings: [
                { id: 'tasks-timers', title: 'Tasks & Timers', icon: FiClock },
                { id: 'decisions-hub', title: 'Decision Synthesis', icon: FiDatabase },
            ]
        },
        {
            id: 'api-reference',
            title: 'API Reference',
            icon: FiCpu,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            subheadings: [
                { id: 'secure-uplink', title: 'Secure Uplink', icon: FiShield },
                { id: 'payload-contracts', title: 'Payload Contracts', icon: FiLayers },
            ]
        },
        {
            id: 'resources',
            title: 'External Resources',
            icon: FiExternalLink,
            color: 'text-pink-400',
            bg: 'bg-pink-500/10',
            border: 'border-pink-500/20',
            subheadings: []
        },
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="px-4 py-8 max-w-[1600px] mx-auto h-[calc(100vh-40px)] flex flex-col">
            <div className="glass rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl flex flex-1 h-full mb-12">
                {/* Sidebar Topics */}
                <aside className="w-80 border-r border-white/5 flex flex-col bg-zinc-900/40 shrink-0">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <FiBookOpen className="text-lg text-indigo-400" />
                            </div>
                            <h1 className="text-base font-black text-white tracking-tight uppercase">Wiki</h1>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
                        {topics.map((topic) => (
                            <div key={topic.id} className="space-y-1">
                                <button
                                    onClick={() => scrollToSection(topic.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-100 bg-white/5 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-wider border border-white/5 group"
                                >
                                    <topic.icon className={`text-base ${topic.color} group-hover:scale-110 transition-transform`} />
                                    {topic.title}
                                </button>
                                <div className="ml-9 space-y-1">
                                    {topic.subheadings.map((sub) => (
                                        <button
                                            key={sub.id}
                                            onClick={() => scrollToSection(sub.id)}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all text-[11px] font-medium group"
                                        >
                                            <sub.icon className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                            {sub.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-white/5 bg-zinc-950/20">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center leading-none">Intelligence v0.1.0-beta</p>
                        </div>
                    </div>
                </aside>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto h-full no-scrollbar bg-zinc-950/20">
                    <div className="max-w-4xl mx-auto py-12 px-12 space-y-24">
                        {/* Getting Started */}
                        <section id="getting-started" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <FiInfo className="text-xl text-indigo-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white uppercase tracking-tight">Mission Briefing</h2>
                                <div className="h-1 w-20 bg-gradient-to-r from-indigo-500/50 to-transparent rounded-full" />
                            </div>

                            <div className="grid grid-cols-1 gap-12">
                                <article id="mission-briefing" className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <FiTarget className="text-indigo-400" />
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">The Platform Vision</h3>
                                    </div>
                                    <p className="text-zinc-400 text-base leading-relaxed font-medium">
                                        MD Platform is a bespoke, secure, and intelligent productivity environment designed for high-level executive oversight. The system integrates local intelligence with robust resource management to streamline decision-making and mission-critical workflows.
                                    </p>
                                </article>

                                <article id="ai-aide" className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <FiZap className="text-amber-400" />
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">The AI Aide</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                                            <h4 className="font-bold text-white text-sm">Proactive Briefings</h4>
                                            <p className="text-zinc-500 text-xs leading-relaxed">
                                                The central hub provides an intelligent overview of the day, pushing actionable insights rather than just raw data.
                                            </p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                                            <h4 className="font-bold text-white text-sm">Task Decomposition</h4>
                                            <p className="text-zinc-500 text-xs leading-relaxed">
                                                Convert high-level objectives into actionable checklists automatically using advanced reasoning models.
                                            </p>
                                        </div>
                                    </div>
                                </article>

                                <article id="local-llm" className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <FiShield className="text-emerald-400" />
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">Local Privacy Protocol</h3>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10 space-y-4">
                                        <p className="text-zinc-400 text-sm leading-relaxed">
                                            Intelligence is powered by local, open-source models (Llama 3 / Mistral) served via Ollama. This ensures complete data sovereignty: no mission data ever leaves the secure perimeter.
                                        </p>
                                        <div className="flex gap-4">
                                            <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Llama 3 Ready</span>
                                            <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Zero Tracking</span>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </section>

                        {/* Operational Vectors */}
                        <section id="vectors" className="space-y-10">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <FiLayers className="text-xl text-emerald-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white uppercase tracking-tight">Operational Vectors</h2>
                                <div className="h-1 w-20 bg-gradient-to-r from-emerald-500/50 to-transparent rounded-full" />
                            </div>

                            <div className="grid grid-cols-1 gap-12">
                                <article id="tasks-timers" className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <FiClock className="text-emerald-400" />
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">Tasks & Timers</h3>
                                    </div>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Precision time logging is integrated into every task via the TaskTimer system, enabling granular budget and resource analysis.
                                    </p>
                                </article>

                                <article id="decisions-hub" className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <FiDatabase className="text-emerald-400" />
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">Decision Synthesis</h3>
                                    </div>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        The Decisions Hub provides argument summarization and risk analysis, synthesizing disparate notes and documents into clear executive summaries.
                                    </p>
                                </article>
                            </div>
                        </section>

                        {/* API Reference */}
                        <section id="api-reference" className="space-y-10">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <FiCpu className="text-xl text-amber-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white uppercase tracking-tight">API Infrastructure</h2>
                                <div className="h-1 w-20 bg-gradient-to-r from-amber-500/50 to-transparent rounded-full" />
                            </div>

                            <article id="secure-uplink" className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <FiShield className="text-amber-400" />
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Secure Uplink</h3>
                                </div>
                                <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-6 font-mono text-xs text-zinc-500 space-y-4">
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-emerald-400">POST /api/v1/auth/login</span>
                                        <span className="text-zinc-600">MISSION_SECURE</span>
                                    </div>
                                    <p>Authentication via JWT (JSON Web Token) with secure cookie fallback for persistent state hydration.</p>
                                </div>
                            </article>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
