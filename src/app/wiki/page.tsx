"use client";

import React from "react";
import {
    FiInfo,
    FiBookOpen,
    FiDatabase,
    FiExternalLink,
    FiCpu,
    FiShield,
    FiTarget,
    FiLayers,
    FiClock,
    FiZap,
    FiBarChart2,
    FiCalendar,
    FiUsers,
    FiBell,
    FiMapPin,
    FiBriefcase
} from 'react-icons/fi';

export default function WikiPage() {
    const topics = [
        {
            id: 'mission-control',
            title: 'Mission Control',
            icon: FiTarget,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            subheadings: [
                { id: 'platform-vision', title: 'Platform Vision', icon: FiInfo },
                { id: 'ai-aide', title: 'The AI Partner', icon: FiZap },
                { id: 'privacy-first', title: 'Privacy & Security', icon: FiShield },
            ]
        },
        {
            id: 'analytics-hub',
            title: 'Analytics Hub',
            icon: FiBarChart2,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            subheadings: [
                { id: 'productivity-trends', title: 'Productivity Trends', icon: FiBarChart2 },
                { id: 'workload-mastery', title: 'Workload Mastery', icon: FiLayers },
                { id: 'top-3-focus', title: 'Top 3 Focus', icon: FiTarget },
            ]
        },
        {
            id: 'operational-mastery',
            title: 'Operations',
            icon: FiBriefcase,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            subheadings: [
                { id: 'tasks-timers', title: 'Tasks & Timers', icon: FiClock },
                { id: 'project-pulse', title: 'Project Pulse', icon: FiActivity },
                { id: 'decision-synthesis', title: 'Decision Synthesis', icon: FiDatabase },
            ]
        },
        {
            id: 'strategic-scheduling',
            title: 'Scheduling',
            icon: FiCalendar,
            color: 'text-pink-400',
            bg: 'bg-pink-500/10',
            border: 'border-pink-500/20',
            subheadings: [
                { id: 'advanced-calendar', title: 'Advanced Calendar', icon: FiCalendar },
                { id: 'timeline-view', title: 'Timeline (Gantt)', icon: FiLayers },
            ]
        },
        {
            id: 'team-presence',
            title: 'Team & Presence',
            icon: FiUsers,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20',
            subheadings: [
                { id: 'attendance-presence', title: 'Attendance', icon: FiMapPin },
                { id: 'leave-management', title: 'Leave & Time-Off', icon: FiClock },
                { id: 'announcements', title: 'Announcements', icon: FiBell },
            ]
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
                            <h1 className="text-base font-medium text-white tracking-tight uppercase">Platform Wiki</h1>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
                        {topics.map((topic) => (
                            <div key={topic.id} className="space-y-1">
                                <button
                                    onClick={() => scrollToSection(topic.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-100 bg-white/[0.03] hover:bg-white/[0.06] transition-all text-xs font-semibold uppercase tracking-wider border border-white/5 group"
                                >
                                    <topic.icon className={`text-base ${topic.color} group-hover:scale-110 transition-transform`} />
                                    {topic.title}
                                </button>
                                <div className="ml-9 space-y-1">
                                    {topic.subheadings.map((sub) => (
                                        <button
                                            key={sub.id}
                                            onClick={() => scrollToSection(sub.id)}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all text-[11px] font-medium group"
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
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 group hover:border-indigo-500/30 transition-colors cursor-default">
                            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider text-center leading-none group-hover:text-indigo-400 transition-colors">MD-Dash v1.2.0-Alpha</p>
                        </div>
                    </div>
                </aside>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto h-full no-scrollbar bg-zinc-950/20">
                    <div className="max-w-4xl mx-auto py-12 px-12 space-y-32">
                        
                        {/* Mission Control */}
                        <section id="mission-control" className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <SectionHeader icon={FiTarget} title="Mission Control" color="text-indigo-400" />
                            
                            <div className="grid grid-cols-1 gap-12">
                                <article id="platform-vision" className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <FiInfo className="text-indigo-400" />
                                        <h3 className="text-lg font-medium text-white uppercase tracking-wider">The Strategic Vision</h3>
                                    </div>
                                    <p className="text-zinc-400 text-lg leading-relaxed font-medium bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                                        MD-Dash is your bespoke intelligence environment. Designed for high-level executive oversight, it transforms raw data into mission-critical insights, ensuring you stay ahead of the curve.
                                    </p>
                                </article>

                                <article id="ai-aide" className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <FiZap className="text-amber-400" />
                                        <h3 className="text-lg font-medium text-white uppercase tracking-wider">The AI Partner</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FeatureCard 
                                            title="Proactive Briefings" 
                                            description="Natural language summaries of your day, analyzing your calendar and tasks before you even start."
                                            icon={FiZap}
                                            color="text-amber-400"
                                        />
                                        <FeatureCard 
                                            title="Task Decomposition" 
                                            description="Automatically break down complex objectives into manageable, actionable checklists using local LLM reasoning."
                                            icon={FiLayers}
                                            color="text-indigo-400"
                                        />
                                    </div>
                                </article>

                                <article id="privacy-first" className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <FiShield className="text-emerald-400" />
                                        <h3 className="text-lg font-medium text-white uppercase tracking-wider">Privacy & Security</h3>
                                    </div>
                                    <div className="p-8 rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/10 space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                            <FiShield className="text-8xl text-emerald-400" />
                                        </div>
                                        <p className="text-zinc-400 text-base leading-relaxed relative z-10">
                                            Intelligence is powered by local, open-source models (Llama 3 / Mistral) served via Ollama. This ensures **Absolute Data Sovereignty**: your mission data never leaves your secure perimeter.
                                        </p>
                                        <div className="flex gap-3 relative z-10">
                                            <span className="px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Local-Only</span>
                                            <span className="px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Zero Tracking</span>
                                            <span className="px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">JWT Secured</span>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </section>

                        {/* Analytics Hub */}
                        <section id="analytics-hub" className="space-y-12">
                            <SectionHeader icon={FiBarChart2} title="Analytics Hub" color="text-amber-400" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FeatureCard 
                                    id="productivity-trends"
                                    title="Productivity Trends" 
                                    description="Visualized trends of completed vs. pending work to measure true operational velocity."
                                    icon={FiActivity}
                                    color="text-amber-400"
                                />
                                <FeatureCard 
                                    id="workload-mastery"
                                    title="Workload Mastery" 
                                    description="Deep-tier analysis of task distribution across projects and team members."
                                    icon={FiUsers}
                                    color="text-indigo-400"
                                />
                                <FeatureCard 
                                    id="top-3-focus"
                                    title="Top 3 Focus" 
                                    description="AI-driven prioritization suggesting the most critical items to tackle each day."
                                    icon={FiTarget}
                                    color="text-rose-400"
                                />
                            </div>
                        </section>

                        {/* Operational Mastery */}
                        <section id="operational-mastery" className="space-y-12">
                            <SectionHeader icon={FiBriefcase} title="Operations" color="text-emerald-400" />
                            
                            <div className="grid grid-cols-1 gap-8">
                                <article id="tasks-timers" className="flex items-start gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <FiClock className="text-2xl text-emerald-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Tasks & Timers</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed">
                                            Precision time logging is integrated into every move. The TaskTimer system enables granular resource analysis and automatic status updates.
                                        </p>
                                    </div>
                                </article>

                                <article id="project-pulse" className="flex items-start gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                        <FiLayers className="text-2xl text-indigo-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Project Pulse</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed">
                                            Track initiatives from planning to delivery. Use multi-dimensional views to monitor overlapping timelines and resource health.
                                        </p>
                                    </div>
                                </article>

                                <article id="decision-synthesis" className="flex items-start gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform">
                                        <FiDatabase className="text-2xl text-amber-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Decision Synthesis</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed">
                                            Turn brainstorming into action. The Decisions Hub synthesizes disparate notes into clear, actionable executive summaries.
                                        </p>
                                    </div>
                                </article>
                            </div>
                        </section>

                        {/* Strategic Scheduling */}
                        <section id="strategic-scheduling" className="space-y-12">
                            <SectionHeader icon={FiCalendar} title="Scheduling" color="text-pink-400" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <article id="advanced-calendar" className="space-y-4">
                                    <div className="aspect-video rounded-2xl bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/20 flex items-center justify-center group overflow-hidden">
                                        <FiCalendar className="text-6xl text-pink-400/50 group-hover:scale-125 transition-transform duration-700" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Advanced Calendar</h3>
                                    <p className="text-zinc-500 text-xs leading-relaxed">
                                        High-density layouts for Month, Week, and Day views, featuring intelligent grouping for tasks, events, and milestones.
                                    </p>
                                </article>
                                <article id="timeline-view" className="space-y-4">
                                    <div className="aspect-video rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 flex items-center justify-center group overflow-hidden">
                                        <FiLayers className="text-6xl text-indigo-400/50 group-hover:scale-125 transition-transform duration-700" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Timeline (Gantt) View</h3>
                                    <p className="text-zinc-500 text-xs leading-relaxed">
                                        A specialized view for long-term initiatives, allowing you to see overlapping timelines and organizational time-off.
                                    </p>
                                </article>
                            </div>
                        </section>

                        {/* Team & Presence */}
                        <section id="team-presence" className="space-y-12">
                            <SectionHeader icon={FiUsers} title="Team & Presence" color="text-cyan-400" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div id="attendance-presence" className="p-6 rounded-2xl bg-cyan-500/[0.02] border border-cyan-500/10 space-y-3">
                                    <FiMapPin className="text-cyan-400 text-lg" />
                                    <h4 className="font-bold text-white text-sm uppercase">Attendance</h4>
                                    <p className="text-zinc-500 text-[11px] leading-relaxed">Real-time tracking of office location and presence state based on secure check-ins.</p>
                                </div>
                                <div id="leave-management" className="p-6 rounded-2xl bg-pink-500/[0.02] border border-pink-500/10 space-y-3">
                                    <FiClock className="text-pink-400 text-lg" />
                                    <h4 className="font-bold text-white text-sm uppercase">Leave & Time-Off</h4>
                                    <p className="text-zinc-500 text-[11px] leading-relaxed">Integrated request system with automatic calendar blocking and assignment guards.</p>
                                </div>
                                <div id="announcements" className="p-6 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10 space-y-3">
                                    <FiBell className="text-amber-400 text-lg" />
                                    <h4 className="font-bold text-white text-sm uppercase">Announcements</h4>
                                    <p className="text-zinc-500 text-[11px] leading-relaxed">System-wide broadcasts with real-time delivery and priority-based alerts.</p>
                                </div>
                            </div>
                        </section>

                        {/* Footer Spacer */}
                        <div className="h-24" />
                    </div>
                </main>
            </div>
        </div>
    );
}

// Helper for section headers
const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <div className="space-y-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-zinc-900/50 shadow-inner group hover:scale-105 transition-transform duration-300`}>
            <Icon className={`text-xl ${color}`} />
        </div>
        <h2 className="text-4xl font-bold text-white uppercase tracking-tight">{title}</h2>
        <div className={`h-1 w-20 bg-gradient-to-r ${color.replace('text-', 'from-').replace('-400', '-500/50')} to-transparent rounded-full`} />
    </div>
);

// Helper for feature cards
const FeatureCard = ({ id, title, description, icon: Icon, color }: { id?: string, title: string, description: string, icon?: any, color: string }) => (
    <div id={id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group">
        {Icon && <Icon className={`text-lg ${color} mb-1 group-hover:scale-110 transition-transform`} />}
        <h4 className="font-bold text-white text-sm uppercase tracking-wide">{title}</h4>
        <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
    </div>
);

// Placeholder for FiActivity which was missing in imports but used in cards
const FiActivity = (props: any) => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);
