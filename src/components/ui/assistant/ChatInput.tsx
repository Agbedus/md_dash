'use client';

import React from 'react';
import { FiSend, FiMic, FiMicOff, FiPaperclip, FiGlobe } from 'react-icons/fi';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: { new(): SpeechRecognition };
  webkitSpeechRecognition?: { new(): SpeechRecognition };
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  // baseText holds committed / typed / final speech text
  const [baseText, setBaseText] = React.useState('');
  // interimText holds live (interim) speech recognition results
  const [interimText, setInterimText] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
// track last final transcript to avoid duplicate appends
  const lastFinalRef = React.useRef<string>('');

  // Initialize SpeechRecognition if available
  React.useEffect(() => {
    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.interimResults = true;
    recog.continuous = false;
    recog.lang = 'en-US';

    recog.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      // If we got a final segment, append it once to baseText and clear interim
      if (final) {
        const finalTrim = final.trim();
        // avoid appending identical final transcripts multiple times
        if (finalTrim && lastFinalRef.current !== finalTrim) {
          setBaseText((prev) => (prev ? prev + ' ' : '') + finalTrim);
          lastFinalRef.current = finalTrim;
        }
        setInterimText('');
      } else {
        // otherwise update interim display (don't mutate baseText)
        setInterimText(interim);
      }
    };

    recog.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recog;

    return () => {
      try {
        recog.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, []);

  const toggleRecording = () => {
    const recog = recognitionRef.current;
    if (!recog) return;

    if (isRecording) {
      try { recog.stop(); } catch {}
      setIsRecording(false);
    } else {
      try {
        // reset last final for new session
        lastFinalRef.current = '';
        recog.start();
        setIsRecording(true);
      } catch (e) {
        // start can throw if called twice quickly
        console.warn('SpeechRecognition start error', e);
        setIsRecording(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // combine committed baseText and any interim text for submission
    const combined = (baseText + (interimText ? ' ' + interimText : '')).trim();
    if (combined) {
      onSendMessage(combined);
      setBaseText('');
      setInterimText('');
      lastFinalRef.current = '';
       // if recording, stop
       if (isRecording && recognitionRef.current) {
         try { recognitionRef.current.stop(); } catch {};
         setIsRecording(false);
       }
    }
  };

  // derived value shown in the input: base + interim (space separated)
  const displayValue = (baseText + (interimText ? ' ' + interimText : '')).trimStart();

  const isSpeechSupported = typeof window !== 'undefined' && (!!(window as unknown as WindowWithSpeech).SpeechRecognition || !!(window as unknown as WindowWithSpeech).webkitSpeechRecognition);

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="glass p-2 relative flex flex-col w-full max-w-full rounded-3xl border border-white/10 transition-all duration-300 focus-within:border-white/20 focus-within:bg-white/5">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => { setBaseText(e.target.value); setInterimText(''); }}
          placeholder="Type a message or use voice..."
          className="flex-grow bg-transparent text-white placeholder:text-zinc-500 px-4 py-3 rounded-full focus:outline-none"
          aria-label="Message"
        />

        <div className="flex items-center justify-between pl-2 pr-2 pb-1 mt-1">
          <div className="flex items-center gap-1">
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onSendMessage(`Attached file: ${file.name}`);
                    e.currentTarget.value = '';
                  }
                }}
            />

            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Attach file"
                title="Attach file"
            >
              <FiPaperclip className="w-5 h-5"/>
            </button>

            <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter URL to attach');
                  if (url) onSendMessage(url);
                }}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Attach URL"
                title="Attach URL"
            >
              <FiGlobe className="w-5 h-5"/>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isSpeechSupported && (
                <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-2 rounded-full transition-all duration-200 ${isRecording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                    aria-pressed={isRecording}
                    aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                    title={isRecording ? 'Stop' : 'Voice'}
                >
                  {isRecording ? <FiMicOff className="w-5 h-5"/> : <FiMic className="w-5 h-5"/>}
                </button>
            )}

            <button
                type="submit"
                className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-200 focus:outline-none active:scale-95"
                aria-label="Send message"
                title="Send"
            >
              <FiSend className="w-4 h-4 ml-0.5"/>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
