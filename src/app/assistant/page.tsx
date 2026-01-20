"use client";
import { useState, useEffect, useRef } from "react";
import ChatBubble from "@/components/ui/assistant/ChatBubble";
import ChatInput from "@/components/ui/assistant/ChatInput";

interface Message {
  id?: number;
  text: string;
  isUser: boolean;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I'm your AI assistant. How can I help you today?", isUser: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // auto-scroll to bottom when messages change
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    const newUserMessage: Message = { text, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    // Create a placeholder for the AI response
    const aiMessageId = Date.now();
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: "", isUser: false, id: aiMessageId },
    ]);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });
        accumulatedText += chunkValue;

        setMessages((prevMessages) => 
          prevMessages.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
          )
        );
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = { text: "Sorry, I couldn't connect to the assistant. Please check your configuration.", isUser: false };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto h-full">
      <div ref={containerRef} className="chat-window flex-grow p-6 space-y-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={msg.id || index}>
            <ChatBubble message={{ text: msg.text, isUser: msg.isUser }} />
          </div>
        ))}
        {isLoading && <ChatBubble message={{ text: "Thinking...", isUser: false }} />}
      </div>
      <ChatInput onSendMessage={handleSendMessage} />

      <style jsx>{`
        /* Hide scrollbar but keep scroll functionality */
        .chat-window::-webkit-scrollbar { display: none; }
        .chat-window { -ms-overflow-style: none; scrollbar-width: none; }

        /* Optional: smooth scrolling */
        .chat-window { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
