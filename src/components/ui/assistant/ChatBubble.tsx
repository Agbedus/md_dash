import React from 'react';
import dynamic from 'next/dynamic';

const NoteWidget = dynamic(() => import('./widgets/NoteWidget'));
const TaskWidget = dynamic(() => import('./widgets/TaskWidget'));
const ProjectWidget = dynamic(() => import('./widgets/ProjectWidget'));
const EventWidget = dynamic(() => import('./widgets/EventWidget'));
const StatsWidget = dynamic(() => import('./widgets/StatsWidget'));

interface ChatBubbleProps {
  message: {
    text: string;
    isUser: boolean;
  };
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const parts = message.text.split(/(__WIDGET__.*?__WIDGET__)/g);

  const renderWidget = (widgetToken: string) => {
    try {
      const jsonStr = widgetToken.replace(/__WIDGET__/g, '');
      const { widget, data } = JSON.parse(jsonStr);

      switch (widget) {
        case 'note':
          return (
            <div className="grid grid-cols-1 gap-3 my-3">
              {Array.isArray(data) ? data.map((n: any) => <NoteWidget key={n.id} {...{note: n}} />) : <NoteWidget {...{note: data}} />}
            </div>
          );
        case 'task':
          return (
            <div className="grid grid-cols-1 gap-3 my-3">
              {Array.isArray(data) ? data.map((t: any) => <TaskWidget key={t.id} {...{task: t}} />) : <TaskWidget {...{task: data}} />}
            </div>
          );
        case 'project':
          return (
            <div className="grid grid-cols-1 gap-3 my-3">
              {Array.isArray(data) ? data.map((p: any) => <ProjectWidget key={p.id} {...{project: p}} />) : <ProjectWidget {...{project: data}} />}
            </div>
          );
        case 'event':
          return (
            <div className="grid grid-cols-1 gap-3 my-3">
              {Array.isArray(data) ? data.map((e: any) => <EventWidget key={e.id} {...{event: e}} />) : <EventWidget {...{event: data}} />}
            </div>
          );
        case 'stats':
          return <StatsWidget title={data.title} stats={data.stats} />;
        default:
          return null;
      }
    } catch (e) {
      console.error('Failed to parse widget data:', e);
      return null;
    }
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-lg px-5 py-3 rounded-2xl shadow-sm backdrop-blur-md
          ${message.isUser 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none' 
            : 'glass text-zinc-100 rounded-bl-none border border-white/5'
          }
        `}
      >
        {parts.map((part, i) => {
          if (part.startsWith('__WIDGET__')) {
            return <React.Fragment key={i}>{renderWidget(part)}</React.Fragment>;
          }
          return (
            <p key={i} className="whitespace-pre-wrap leading-relaxed inline">
              {part}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default ChatBubble;
