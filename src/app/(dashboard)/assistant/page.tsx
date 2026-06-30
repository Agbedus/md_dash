"use client";
import { useState, useEffect, useRef } from "react";
import ChatBubble from "@/components/ui/assistant/ChatBubble";
import ChatInput from "@/components/ui/assistant/ChatInput";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare, FiList, FiTrendingUp, FiCpu, FiCalendar, FiClock } from "react-icons/fi";
import { useDashboard } from "@/components/ui/dashboard-layout";

interface Message {
  id?: number;
  text: string;
  isUser: boolean;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportThinking, setShowReportThinking] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const { setHideContentScroll } = useDashboard();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHideContentScroll(true);
    return () => setHideContentScroll(false);
  }, [setHideContentScroll]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, showReportThinking]);

  const handleSendMessage = async (text: string) => {
    const isReport = /monthly report|monthly summary|end-of-month|generate.*report/i.test(text);
    setReportReady(false);

    const newUserMessage: Message = { text, isUser: true, id: Date.now() };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    if (isReport) setShowReportThinking(true);

    const aiMessageId = Date.now() + 1;
    setMessages((prev) => [...prev, { text: "", isUser: false, id: aiMessageId }]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        let errorMsg = "Failed to fetch response";
        try {
          const errData = JSON.parse(bodyText);
          errorMsg = errData.error || errorMsg;
        } catch {
          errorMsg = bodyText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";
      let reportMarkerFound = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        accumulatedText += decoder.decode(value, { stream: !done });

        if (isReport && !reportMarkerFound && accumulatedText.includes("__REPORT__")) {
          reportMarkerFound = true;
          setShowReportThinking(false);
          setReportReady(true);
          const markerIdx = accumulatedText.indexOf("__REPORT__");
          accumulatedText = accumulatedText.slice(markerIdx + "__REPORT__".length);
        }

        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg))
        );
      }
    } catch (error) {
      const errString = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { text: `Sorry, I encountered an error: ${errString}`, isUser: false, id: Date.now() + 2 },
      ]);
      setShowReportThinking(false);
    } finally {
      setIsLoading(false);
      setShowReportThinking(false);
    }
  };

  const quickActions = [
    { icon: FiList, title: "Show my tasks", desc: "View pending and active tasks", action: "Show me my pending tasks" },
    { icon: FiTrendingUp, title: "Productivity stats", desc: "Get an overview of your progress", action: "Show my productivity stats" },
    { icon: FiMessageSquare, title: "Summarize notes", desc: "Condense your recent thoughts", action: "Summarize my recent notes" },
    { icon: FiCalendar, title: "Monthly report", desc: "Generate a full monthly summary", action: "Generate my monthly report" },
  ];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* ── Header — Fixed at the top ── */}
      <div className="z-20 flex-shrink-0 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-card-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <FiCpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-none">AI Assistant</h1>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">Intelligent Copilot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Ready</span>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* ── Scrollable chat area ── */}
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-32 scrollbar-hide"
        >
            {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full text-center space-y-6 py-10 max-w-5xl mx-auto">
                <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-500/20"
                >
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">How can I help you today?</h1>
                <p className="text-text-muted text-lg max-w-lg mx-auto font-medium">
                    I can help you manage your tasks, summarize your notes, and stay on top of your projects.
                </p>
                </motion.div>

                {/* Quick action cards */}
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full mt-4"
                >
                {quickActions.map((item, idx) => (
                    <button
                    key={idx}
                    onClick={() => handleSendMessage(item.action)}
                    className="flex flex-col items-start p-5 bg-foreground/[0.03] border border-card-border rounded-2xl hover:bg-foreground/[0.06] hover:border-indigo-500/30 transition-all active:scale-[0.98] text-left group"
                    >
                    <div className="p-2.5 bg-foreground/[0.05] border border-card-border text-text-muted group-hover:text-indigo-400 group-hover:border-indigo-500/30 rounded-xl mb-3 transition-colors">
                        <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1 uppercase tracking-wider">{item.title}</h3>
                    <p className="text-xs text-text-muted">{item.desc}</p>
                    </button>
                ))}
                </motion.div>
            </div>
            ) : (
            <div className="max-w-4xl mx-auto w-full space-y-4">
                {showReportThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-4 px-5 py-5 rounded-3xl bg-card/80 backdrop-blur-xl border border-card-border/60 max-w-2xl"
                  >
                    <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-indigo-500 blur-lg"
                      />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <FiClock className="w-5 h-5 text-indigo-400 relative z-10" />
                      </motion.div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">Generating your monthly report</p>
                      <p className="text-xs text-text-muted font-medium">
                        Analyzing tasks, projects, attendance, and more...
                      </p>
                    </div>
                  </motion.div>
                )}
                <AnimatePresence initial={false}>
                {messages.map((msg) => (
                    <ChatBubble key={msg.id} message={{ text: msg.text, isUser: msg.isUser, id: msg.id }} />
                ))}
                </AnimatePresence>
                {/* Invisible anchor to scroll into view */}
                <div ref={bottomRef} />
            </div>
            )}
        </div>

        {/* ── Fixed input bar — Absolutely positioned at the bottom of the content area ── */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent z-10 pb-4">
            <div className="max-w-4xl mx-auto w-full">
                <ChatInput onSendMessage={handleSendMessage} />
            </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
