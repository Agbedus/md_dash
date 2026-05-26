import React from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

const NoteWidget = dynamic(() => import('./widgets/NoteWidget'));
const TaskWidget = dynamic(() => import('./widgets/TaskWidget'));
const ProjectWidget = dynamic(() => import('./widgets/ProjectWidget'));
const EventWidget = dynamic(() => import('./widgets/EventWidget'));
const StatsWidget = dynamic(() => import('./widgets/StatsWidget'));

interface ChatBubbleProps {
  message: {
    id?: number | string;
    text: string;
    isUser: boolean;
  };
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  // Use a refined regex that won't miss the __WIDGET__ tags
  const parts = message.text ? message.text.split(/(__WIDGET__[\s\S]*?__WIDGET__)/g) : [];

  const renderWidget = (widgetToken: string) => {
    try {
      const jsonStr = widgetToken.replace(/__WIDGET__/g, '');
      const { widget, data } = JSON.parse(jsonStr);

      switch (widget) {
        case 'note':
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 gap-3 my-3">
              {Array.isArray(data) ? data.map((n: any) => <NoteWidget key={n.id} {...{note: n}} />) : <NoteWidget {...{note: data}} />}
            </motion.div>
          );
        case 'task':
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 gap-3 my-3">
              {Array.isArray(data) ? data.map((t: any) => <TaskWidget key={t.id} {...{task: t}} />) : <TaskWidget {...{task: data}} />}
            </motion.div>
          );
        case 'project':
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 gap-3 my-3">
              {Array.isArray(data) ? data.map((p: any) => <ProjectWidget key={p.id} {...{project: p}} />) : <ProjectWidget {...{project: data}} />}
            </motion.div>
          );
        case 'event':
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 gap-3 my-3">
              {Array.isArray(data) ? data.map((e: any) => <EventWidget key={e.id} {...{event: e}} />) : <EventWidget {...{event: data}} />}
            </motion.div>
          );
        case 'stats':
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="my-3">
              <StatsWidget title={data.title} stats={data.stats} />
            </motion.div>
          );
        default:
          return null;
      }
    } catch (e) {
      console.error('Failed to parse widget data:', e);
      return null;
    }
  };

  if (!message.text && !message.isUser) {
    return (
      <div className="flex justify-start mb-6 px-4 mt-2">
        <motion.div
          layoutId={message.id ? `bubble-${message.id}` : undefined}
          className="relative w-12 h-12 flex items-center justify-center"
        >
          {/* Subtle background glow */}
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-indigo-500 blur-xl"
          />

          {/* 4-point star SVG */}
          <motion.svg
            viewBox="0 0 24 24"
            className="w-8 h-8 relative z-10"
            animate={{ 
              rotate: [0, 180, 360], 
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{ 
              rotate: { duration: 6, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <defs>
              <linearGradient id={`star-gradient-${message.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8">
                  <animate attributeName="stop-color" values="#818cf8;#e879f9;#22d3ee;#818cf8" dur="4s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#e879f9">
                  <animate attributeName="stop-color" values="#e879f9;#22d3ee;#818cf8;#e879f9" dur="4s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>
            <path
              fill={`url(#star-gradient-${message.id})`}
              d="M12 0C12 0 12 10 22 12C12 14 12 24 12 24C12 24 12 14 2 12C12 10 12 0 12 0Z"
            />
          </motion.svg>

          {/* Orbiting particles */}
          <motion.div 
            animate={{ rotate: -360 }} 
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-4px]"
          >
            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full blur-[1px] -translate-x-1/2" />
            <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-fuchsia-400 rounded-full blur-[1px] -translate-x-1/2" />
          </motion.div>

        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <motion.div
        layoutId={message.id ? `bubble-${message.id}` : undefined}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={`
          max-w-2xl px-5 py-4 rounded-3xl shadow-sm overflow-hidden relative
          ${message.isUser 
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm' 
            : 'bg-card/80 backdrop-blur-xl text-foreground rounded-bl-sm border border-card-border/60'
          }
        `}
      >
        {parts.map((part, i) => {
          if (!part) return null;
          if (part.startsWith('__WIDGET__')) {
            return <React.Fragment key={i}>{renderWidget(part)}</React.Fragment>;
          }
          return (
            <div key={i} className={`prose prose-sm max-w-none ${message.isUser ? 'prose-invert' : 'dark:prose-invert'} prose-p:leading-relaxed prose-pre:bg-foreground/[0.05] prose-pre:border prose-pre:border-card-border prose-pre:text-foreground prose-code:text-indigo-400 prose-a:text-indigo-400`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part}
              </ReactMarkdown>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default ChatBubble;
