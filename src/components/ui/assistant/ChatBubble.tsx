import React from 'react';

interface ChatBubbleProps {
  message: {
    text: string;
    isUser: boolean;
  };
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-lg px-5 py-3 rounded-2xl shadow-sm backdrop-blur-md
          ${message.isUser 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none' 
            : 'glass text-zinc-100 rounded-bl-none border border-white/10'
          }
        `}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatBubble;
