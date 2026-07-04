'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMaximize2, FiZap, FiCpu, FiTerminal } from 'react-icons/fi';
import { useRouter, usePathname } from 'next/navigation';
import ChatBubble from './ChatBubble';

interface Message {
  id?: number;
  text: string;
  isUser: boolean;
}

const STORAGE_KEY = 'md_assistant_chat_messages';

const GREETINGS = [
  "Hey! I'm your AI assistant — ask me anything",
  "Need help with tasks, notes, or projects?",
  "I can generate reports, summarize, and more",
  "What are you working on today?",
];

export default function AssistantOrb() {
  const [isFocused, setIsFocused] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [greetingIdx, setGreetingIdx] = useState(0);
  const [iconIdx, setIconIdx] = useState(0);
  const ICONS = [FiZap, FiCpu, FiTerminal];
  const router = useRouter();
  const pathname = usePathname();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isOnAssistantPage = pathname === '/assistant';

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFocused) {
        setGreetingIdx(prev => (prev + 1) % GREETINGS.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isFocused]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIdx(prev => (prev + 1) % ICONS.length);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { text, isUser: true, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { text: '', isUser: false, id: aiMsgId }]);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        let errorMsg = 'Failed to fetch response';
        try { const errData = JSON.parse(bodyText); errorMsg = errData.error || errorMsg; } catch { errorMsg = bodyText || errorMsg; }
        throw new Error(errorMsg);
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        accumulated += decoder.decode(value, { stream: !done });
        setMessages(prev =>
          prev.map(msg => (msg.id === aiMsgId ? { ...msg, text: accumulated } : msg))
        );
      }
    } catch (error) {
      const errString = error instanceof Error ? error.message : 'Unknown error';
      setMessages(prev => [
        ...prev,
        { text: `Sorry, I encountered an error: ${errString}`, isUser: false, id: Date.now() + 2 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    handleSendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpenFullPage = () => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
    router.push('/assistant');
  };

  if (isOnAssistantPage) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      {/* Backdrop blur when focused with messages */}
      <AnimatePresence>
        {isFocused && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>

      <div
        className="w-full max-w-2xl mx-4 transition-all duration-500 ease-out"
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsFocused(false);
          }
        }}
      >
        <AnimatePresence>
          {isFocused && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="max-h-[40vh] overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
                {messages.map(msg => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
                <div ref={bottomRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative mx-4 mb-2">
          <div className="relative rounded-3xl bg-zinc-950 overflow-hidden border border-white/[0.05]">
            <div className="absolute inset-0 pointer-events-none z-0 shimmer-sweep" />

            <div className="flex items-center gap-3 px-4 py-3 relative z-10">
              <div className="shrink-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={iconIdx}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.15 }}
                  >
                    {(() => {
                      const Icon = ICONS[iconIdx];
                      return <Icon className="w-4 h-4 text-indigo-400" />;
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex-1 min-w-0">
                {isFocused || input.length > 0 ? (
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    rows={1}
                    className="w-full bg-transparent text-base text-white placeholder-zinc-500 resize-none focus:outline-none scrollbar-hide font-medium"
                    style={{ minHeight: '22px', maxHeight: '120px' }}
                  />
                ) : (
                  <button
                    onClick={() => {
                      setIsFocused(true);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className="w-full text-left"
                  >
                    <div className="relative h-6 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={greetingIdx}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.35, ease: 'easeInOut' }}
                          className="text-base text-zinc-400 font-medium"
                        >
                          {GREETINGS[greetingIdx]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleOpenFullPage}
                  className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
                  title="Open full screen"
                >
                  <FiMaximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2.5 bg-zinc-700/60 text-white/80 rounded-2xl hover:bg-zinc-600/60 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Send"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          25% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-sweep {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
          animation: shimmer-sweep 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
