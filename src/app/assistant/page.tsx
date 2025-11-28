"use client";
import { useState, useEffect, useRef } from "react";
import ChatBubble from "@/components/ui/assistant/ChatBubble";
import ChatInput from "@/components/ui/assistant/ChatInput";
import AssistantCard from "@/components/ui/assistant/AssistantCard";
import type { Note } from "@/types/note";
import type { Task } from "@/types/task";

interface Message {
  id?: number;
  text?: string;
  isUser: boolean;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  data?: Note | Task;
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
        buffer += chunkValue;

        // Process buffer for JSON markers
        const jsonRegex = /__JSON__(.*?)__JSON__/g;
        let match;
        let lastIndex = 0;

        while ((match = jsonRegex.exec(buffer)) !== null) {
          // Add text before the JSON
          const textPart = buffer.substring(lastIndex, match.index);
          if (textPart) {
             accumulatedText += textPart;
             setMessages((prevMessages) => 
               prevMessages.map(msg => 
                 msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
               )
             );
          }

          // Process JSON
          try {
            const jsonStr = match[1];
            const data = JSON.parse(jsonStr);
            
            if (data.functionCall) {
               const { name, args } = data.functionCall;
               let structuredMessage: Message;
               
               if (name === 'createNote' || name === 'createTask') {
                 structuredMessage = {
                   isUser: false,
                   text: `I've created a new ${name.includes('Note') ? 'note' : 'task'} for you.`,
                   data: { id: Date.now(), ...args } as Note | Task,
                 };
               } else {
                 structuredMessage = {
                   isUser: false,
                   text: `I've received a request to perform: ${name}`,
                 };
               }
               // Add the structured message separately
               setMessages((prevMessages) => [...prevMessages, structuredMessage]);
            }
          } catch (e) {
            console.error("Failed to parse JSON from stream", e);
          }

          lastIndex = jsonRegex.lastIndex;
        }

        // Update buffer to keep only unprocessed part
        buffer = buffer.substring(lastIndex);
        
        // If no JSON found, just append to text (but be careful about partial JSON tags)
        // Simple approach: if buffer doesn't contain partial tag, flush it to text
        if (!buffer.includes("__JSON") && !buffer.includes("__")) {
           accumulatedText += buffer;
           buffer = "";
           setMessages((prevMessages) => 
             prevMessages.map(msg => 
               msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
             )
           );
        }
      }
      
      // Flush remaining buffer as text if it's not a tag
      if (buffer && !buffer.includes("__JSON__")) {
         accumulatedText += buffer;
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
          <div key={index}>
            {msg.text && <ChatBubble message={{ text: msg.text, isUser: msg.isUser }} />}
            {msg.data && (
              <AssistantCard item={msg.data} type={'content' in msg.data ? 'note' : 'task'} />
            )}
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
