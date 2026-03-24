"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
    FiArrowRight, 
    FiZap, 
    FiShield, 
    FiBarChart2, 
    FiBriefcase, 
    FiChevronRight,
    FiCheck,
    FiUsers,
    FiCpu,
    FiTarget,
    FiGlobe,
    FiCalendar,
    FiActivity,
    FiBell,
    FiLock
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
    const [activeTab, setActiveTab] = React.useState('Dashboard');

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const containerRef = React.useRef<HTMLDivElement>(null);
    const zoomRef = React.useRef<HTMLDivElement>(null);
    const screensRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "center center",
                    end: "+=300%",
                    scrub: 0.5,
                    pin: true,
                    anticipatePin: 1,
                    snap: [0, 1/5.5, 2/5.5, 3/5.5, 4/5.5, 5/5.5, 1],
                }
            });

            // 1. Expansion phase
            tl.to(zoomRef.current, {
                maxWidth: '100%',
                width: '100%',
                padding: '0 2rem',
                duration: 1,
                ease: "power2.inOut"
            });

            // 2. Playback phase - cycle through 5 screens
            const screens = ['Dashboard', 'Tasks', 'Notes', 'Users', 'Time Off'];
            screens.forEach((screen, index) => {
                if (index > 0) {
                    // Fade in next screen
                    tl.to(`.screen-${index}`, {
                        opacity: 1,
                        duration: 1,
                        onStart: () => setActiveTab(screen),
                        onReverseComplete: () => setActiveTab(screens[index-1])
                    }, `screen-${index}`);
                }
            });

            // Wait at the end
            tl.to({}, { duration: 0.5 });
            
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass-card !bg-zinc-950/40 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.svg" alt="MD Logo" width={32} height={32} className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tightest text-white">MD<span className="text-emerald-500">Dash</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Features</Link>
                        <Link href="/wiki" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Wiki</Link>
                        <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Login</Link>
                        <Link 
                            href="#waitlist" 
                            className="px-6 py-2.5 rounded-full bg-white text-zinc-950 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            Join Waiting List
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 px-6 overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />
                <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full -z-10" />

                <div className="max-w-7xl mx-auto text-center space-y-10">
                    <motion.div 
                        {...fadeIn}
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-card border-white/10 text-zinc-400 text-[9px] font-bold uppercase tracking-[0.3em]"
                    >
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Intelligence v1.2.0-Alpha — Enterprise Ready
                    </motion.div>

                    <motion.h1 
                        {...fadeIn}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-[7.5rem] font-bold tracking-tightest leading-[0.95] text-white"
                    >
                        Strategic <br />
                        Command Center
                    </motion.h1>

                    <motion.p 
                        {...fadeIn}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl leading-relaxed"
                    >
                        A premium, AI-powered productivity platform designed for high-level management. 
                        Transform raw data into mission-critical insights with absolute data sovereignty.
                    </motion.p>                    <motion.div 
                        {...fadeIn}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8"
                    >
                        <Link 
                            href="#waitlist" 
                            className="w-full md:w-auto px-10 py-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 group transition-all active:scale-95 shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] border border-indigo-400/30"
                        >
                            Explore Platform <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link 
                            href="/login" 
                            className="w-full md:w-auto px-10 py-5 rounded-full glass-card hover:bg-white/[0.05] text-white text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
                        >
                            Executive Login
                        </Link>
                    </motion.div>

                    {/* Interface Showcase with GSAP Zoom */}
                    <div ref={containerRef} className="relative mt-20 pt-20 pb-40">
                        <div ref={zoomRef} className="relative mx-auto max-w-5xl">
                            <div className="relative p-2 rounded-[2.5rem] glass-card border-white/10 premium-shadow overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                
                                {/* Interface Content / Carousel */}
                                <div className="rounded-[2rem] overflow-hidden border border-white/5 bg-zinc-950/40 backdrop-blur-3xl">
                                    <div className="h-14 border-b border-white/10 bg-zinc-900/50 flex items-center px-6 justify-between">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/30" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
                                        </div>
                                        
                                        {/* Carousel Tabs */}
                                        <div className="flex items-center bg-white/[0.03] rounded-full p-1 border border-white/5 relative z-30 glass-card">
                                            {['Dashboard', 'Tasks', 'Notes', 'Users', 'Time Off'].map((tab) => (
                                                <button
                                                    key={tab}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveTab(tab);
                                                    }}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all relative z-40 ${
                                                        activeTab === tab 
                                                        ? 'bg-white text-zinc-950 shadow-lg' 
                                                        : 'text-zinc-500 hover:text-white'
                                                    }`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="w-20 flex justify-end">
                                            <Image src="/logo.svg" alt="Logo" width={20} height={20} className="opacity-50" />
                                        </div>
                                    </div>
                                    
                                    <div ref={screensRef} className="aspect-[16/10] bg-zinc-900 relative">
                                        {/* Stacked Screen Images for GSAP Playback */}
                                        {[
                                            { name: 'Dashboard', file: 'dashboard' },
                                            { name: 'Tasks', file: 'tasks' },
                                            { name: 'Notes', file: 'notes' },
                                            { name: 'Users', file: 'team' },
                                            { name: 'Time Off', file: 'approvals' }
                                        ].map((screen, index) => (
                                            <div 
                                                key={screen.name}
                                                className={`absolute inset-0 screen-${index}`}
                                                style={{ opacity: index === 0 ? 1 : 0, zIndex: index }}
                                            >
                                                <Image 
                                                    src={`/screenshots/${screen.file}.png`}
                                                    alt={`${screen.name} Interface`}
                                                    fill
                                                    className="object-cover"
                                                    priority={index === 0}
                                                />
                                            </div>
                                        ))}
                                        {/* Fallback pattern */}
                                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-950" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Floating Stats / Indicators */}
                            <div className="absolute -top-6 -right-6 p-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl z-20 hidden md:block">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">System Live</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -left-6 p-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl z-20 hidden md:block">
                                <div className="flex items-center gap-3">
                                    <FiLock className="text-indigo-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">End-to-End Encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>            {/* Features Section - Modern Corporate Half-Screens */}
            <section id="features" className="py-40 px-6 relative overflow-hidden bg-logo-gradient noise">
                <div className="max-w-7xl mx-auto space-y-32">
                    <div className="max-w-3xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                            Platform Pillars
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Built for Professional <br /> Orchestration</h2>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            MD-Dash is more than a dashboard. It&apos;s an intelligent ecosystem designed to 
                            amplify your cognitive focus and operational velocity.
                        </p>
                    </div>

                    <div className="space-y-40">
                        {[
                            {
                                title: "AI-Powered Command Center",
                                subtitle: "INTELLIGENCE V1.2",
                                desc: "Our local-first intelligence generates proactive daily briefings, prioritizes your agenda, and decomposes complex objectives into actionable paths.",
                                items: ["Proactive Morning Briefings", "Intelligent Task Prioritization", "Goal Decomposition Engine"],
                                image: "/screenshots/ai.png",
                                icon: FiZap,
                                reverse: false
                            },
                            {
                                title: "Precision Task Ecosystem",
                                subtitle: "OPERATIONS",
                                desc: "The Task Grid combines deep-work timers with integrated decision synthesis. Manage high-level projects with absolute clarity and zero friction.",
                                items: ["Integrated Deep-Work Timers", "Kanban & Grid Visualizations", "Cross-Project Dependency Mapping"],
                                image: "/screenshots/tasks.png",
                                icon: FiBriefcase,
                                reverse: true
                            },
                            {
                                title: "Zero-Cloud Sovereignty",
                                subtitle: "PRIVACY FIRST",
                                desc: "Absolute data sovereignty with local LLM processing via Ollama. Your mission-critical data never leaves your infrastructure.",
                                items: ["100% Local LLM Processing", "No Cloud Telemetry", "End-to-End Encrypted Storage"],
                                image: "/screenshots/team.png",
                                icon: FiShield,
                                reverse: false
                            }
                        ].map((feature, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className={`flex flex-col ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 lg:gap-24 items-center`}
                            >
                                <div className="flex-1 space-y-8">
                                    <div className="space-y-4">
                                        <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-2 block">{feature.subtitle}</span>
                                        <h3 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight text-white">{feature.title}</h3>
                                        <p className="text-zinc-400 text-lg leading-relaxed">{feature.desc}</p>
                                    </div>
                                    <ul className="space-y-4">
                                        {feature.items.map((item, j) => (
                                            <li key={j} className="flex items-center gap-3 text-sm text-zinc-300">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                                                    <FiCheck className="text-emerald-500" />
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl group">
                                        <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none" />
                                        <Image 
                                            src={feature.image} 
                                            alt={feature.title} 
                                            width={800}
                                            height={600}
                                            className="w-full h-auto group-hover:scale-105 transition-transform duration-1000" 
                                        />
                                    </div>
                                    {/* Accent Decoration */}
                                    <div className={`absolute -bottom-6 ${feature.reverse ? '-left-6' : '-right-6'} w-32 h-32 bg-logo-gradient blur-3xl opacity-50 -z-10`} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Interaction Section - NEW */}
            <section className="py-40 px-6 relative overflow-hidden bg-zinc-950 noise border-t border-white/5">
                <div className="max-w-7xl mx-auto text-center space-y-16">
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-[0.3em] text-xs">
                             Natural Intelligence Interface
                        </div>
                        <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-white leading-tight">Type or Speak. <br /> Your AI understands.</h2>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Whether you prefer precise keyboard syntax or natural voice commands, your MD-Dash AI Aide parses your mission with absolute fidelity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                                <FiArrowRight className="text-2xl text-zinc-400" />
                            </div>
                            <h4 className="text-xl font-bold text-white">Full Keyboard Control</h4>
                            <p className="text-zinc-500 text-sm">Lightning fast command processing for power users who thrive on speed.</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <FiActivity className="text-2xl text-emerald-500" />
                            </div>
                            <h4 className="text-xl font-bold text-white">Voice Command Nexus</h4>
                            <p className="text-zinc-500 text-sm">Whisper-quiet transcription and intent analysis for high-velocity hands-free ops.</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* The Journey Section - Refined */}
            <section className="py-40 px-6 relative overflow-hidden bg-zinc-950 noise">
                <div className="max-w-7xl mx-auto flex flex-col items-center space-y-20 w-full px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center w-full">
                        {/* Left Side: Steps */}
                        <div className="lg:col-span-2 space-y-10 text-left">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-[0.3em] text-[10px]">
                                    <FiActivity className="animate-pulse" /> The Operational Loop
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tightest leading-tight text-white">How MD-Dash Elevates Your Mission</h2>
                                <p className="text-zinc-500 text-sm leading-relaxed max-w-md font-medium">Our intelligence engine follows a precise four-stage protocol to transform raw data into high-velocity strategic execution.</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { step: "01", title: "Initialize Your Universe", desc: "Securely connect your calendars and data streams." },
                                    { step: "02", title: "Strategic Synthesis", desc: "The local AI Aide curates your proactive daily briefing." },
                                    { step: "03", title: "Execute with Precision", desc: "Deploy deep-work timers to tackle high-level objectives." },
                                    { step: "04", title: "Review & Evolve", desc: "Leverage analytics to optimize your operational velocity." }
                                ].map((item, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-6 rounded-2xl glass-card flex items-center gap-6 hover:bg-white/[0.04] transition-all group border-l-2 border-l-transparent hover:border-l-indigo-500"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-xs font-bold text-indigo-500 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                            {item.step}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold group-hover:text-indigo-400 transition-colors uppercase tracking-tightest">{item.title}</h4>
                                            <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-1 font-medium">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Right Side: Big Card */}
                        <div className="lg:col-span-3 relative lg:pl-12 w-full">
                            <div className="aspect-[4/3] rounded-[4rem] bg-zinc-900 border border-white/5 p-16 flex items-center justify-center relative overflow-hidden group shadow-[0_0_100px_rgba(99,102,241,0.15)]">
                                <FiTarget className="text-[18rem] text-white/[0.02] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-[2000ms]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[30rem] h-[30rem] rounded-full border border-white/5 border-dashed animate-[spin_40s_linear_infinite]" />
                                    <div className="absolute w-[22rem] h-[22rem] rounded-full border border-indigo-500/10 border-dashed animate-[spin_25s_linear_infinite_reverse]" />
                                    <div className="relative">
                                        {/* Pulse Rings */}
                                        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl animate-pulse-ring" />
                                        <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-[40px] animate-pulse-ring [animation-delay:1000ms]" />
                                        <div className="relative p-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.3)] z-10">
                                            <FiCpu className="text-8xl text-indigo-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Telemetry Overlay */}
                                <motion.div 
                                    className="absolute bottom-10 right-10 p-5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-white/5 space-y-2 hidden md:block"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Synthesis Engine: 98% Local</span>
                                    </div>
                                    <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-emerald-500" />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Decorative Background Glow */}
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10 animate-pulse" />
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 blur-[80px] -z-10 animate-pulse" />
                        </div>
                    </div>
                </div>
            </section>
            {/* Quote/Enterprise Section - Modernized */}
            <section className="py-40 px-6 relative overflow-hidden bg-zinc-950 noise">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-12 rounded-[3rem] glass-card space-y-8 hover:border-indigo-500/30 transition-all duration-500 group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                                <FiUsers className="text-3xl text-indigo-400" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-bold tracking-tightest">Custom Build</h3>
                                <p className="text-zinc-500 leading-relaxed text-lg font-medium">Need a bespoke instance tailored to your specific organizational taxonomy and workflows?</p>
                            </div>
                            <Link href="#" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors group/link uppercase text-xs tracking-widest">
                                Request a Quote <FiChevronRight className="group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="p-12 rounded-[3rem] glass-card space-y-8 hover:border-emerald-500/30 transition-all duration-500 group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                <FiGlobe className="text-3xl text-emerald-400" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-bold tracking-tightest">Enterprise</h3>
                                <p className="text-zinc-500 leading-relaxed text-lg font-medium">Scale MD-Dash across your entire executive team with advanced RBAC and dedicated local instances.</p>
                            </div>
                            <Link href="#" className="inline-flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors group/link uppercase text-xs tracking-widest">
                                Enterprise Solutions <FiChevronRight className="group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA / Waitlist Section - Modernized */}
            <section id="waitlist" className="py-40 px-6 relative overflow-hidden bg-zinc-950 noise border-t border-white/5 font-inter">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -z-10" />
                
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full glass-card border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                        Deployment Wave 04
                    </div>
                    <h2 className="text-4xl md:text-8xl font-bold tracking-tightest leading-[0.95] text-white">Ready for Operational <br /> Mastery?</h2>
                    <p className="text-zinc-500 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                        Join 200+ executive leaders orchestrating their missions with absolute precision and data sovereignty.
                    </p>
                    
                    <form className="relative max-w-lg mx-auto group">
                        <div className="relative">
                            <input 
                                type="email" 
                                placeholder="Enter executive email" 
                                className="w-full px-8 py-6 rounded-full bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all shadow-2xl"
                            />
                            <button 
                                type="submit" 
                                className="absolute right-2 top-2 bottom-2 px-8 py-3 rounded-full bg-white text-zinc-950 text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2"
                            >
                                Get Access <FiArrowRight />
                            </button>
                        </div>
                    </form>

                    <div className="flex flex-wrap items-center justify-center gap-12 pt-12 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                        <div className="text-xl font-black italic tracking-tighter">ELITE</div>
                        <div className="text-xl font-black italic tracking-tighter">PRIME</div>
                        <div className="text-xl font-black italic tracking-tighter">STRATEGIC</div>
                        <div className="text-xl font-black italic tracking-tighter">GLOBAL</div>
                    </div>
                </div>
            </section>

            {/* Footer - Professional */}
            <footer className="py-20 px-6 border-t border-white/5 bg-zinc-950 noise">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-12 pb-16">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Image src="/logo.svg" alt="MD Logo" width={32} height={32} />
                                <span className="text-xl font-bold tracking-tightest">MD<span className="text-emerald-500">Dash</span></span>
                            </div>
                            <p className="text-zinc-500 text-sm max-w-xs leading-relaxed font-medium">
                                The strategic command center for high-level management and precise operational execution.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Platform</h4>
                                <ul className="space-y-2 text-sm text-zinc-500">
                                    <li><Link href="#features" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                                    <li><Link href="/wiki" className="hover:text-indigo-400 transition-colors">Wiki</Link></li>
                                    <li><Link href="/login" className="hover:text-indigo-400 transition-colors">Enterprise Login</Link></li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Compliance</h4>
                                <ul className="space-y-2 text-sm text-zinc-500">
                                    <li><Link href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                                    <li><Link href="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
                                    <li>
                                        <button 
                                            onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
                                            className="hover:text-indigo-400 transition-colors text-left"
                                        >
                                            Cookie Settings
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Connect</h4>
                                <ul className="space-y-2 text-sm text-zinc-500">
                                    <li><Link href="mailto:intelligence@md-dash.com" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
                                    <li><Link href="#" className="hover:text-indigo-400 transition-colors">LinkedIn</Link></li>
                                    <li><Link href="#" className="hover:text-indigo-400 transition-colors">X / Twitter</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        <span>© 2026 MD-DASH INTELLIGENCE SYSTEM. ALL RIGHTS RESERVED.</span>
                        <div className="flex gap-6 text-zinc-500">
                            <span className="text-emerald-500/50">SYSTEM STATUS: OPTIMAL</span>
                            <span>VERSION 1.2.0-ALPHA</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
