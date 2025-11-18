
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { InstagramProfile, StrategicReport } from '../types';
import { createChatSession } from '../services/geminiService';

interface ChatWidgetProps {
  profile: InstagramProfile;
  report: StrategicReport;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ profile, report }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'intro', 
      role: 'model', 
      text: `Досье на @${profile.username} загружено в память. Я готов ответить на вопросы по деталям фото, психотипу или помочь составить сообщение для контакта.` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session once
  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession(profile, report);
    }
  }, [profile, report]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsgId = Date.now().toString();
    const userText = input;
    
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: userText });
      
      const botMsgId = (Date.now() + 1).toString();
      let fullResponse = "";

      // Optimistically add empty bot message to stream into
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: "" }]);

      for await (const chunk of result) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
          fullResponse += chunkText;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === botMsgId ? { ...msg, text: fullResponse } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Произошла ошибка связи с нейроядром. Попробуйте еще раз." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Markdown Rendering Logic ---

  const renderInlineFormatting = (text: string): React.ReactNode => {
    // Split by bold (**text**) or italic (*text*)
    // Capturing parentheses include the delimiters in the result array
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-cyber-accent">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
         // Avoid matching single * characters used as bullets if they passed through
        return <em key={i} className="italic text-cyber-accent/80">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Detect list items (starting with - or *)
      if (trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.endsWith('*'))) {
        const content = trimmed.substring(2);
        currentList.push(
          <li key={`li-${index}`} className="ml-4 list-disc marker:text-cyber-accent/50 pl-1">
            {renderInlineFormatting(content)}
          </li>
        );
      } else {
        // Flush accumulated list
        if (currentList.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="mb-3 space-y-1 text-left">
              {currentList}
            </ul>
          );
          currentList = [];
        }

        if (!trimmed) {
            return; // Skip empty lines, handled by margin
        }

        // Regular Paragraph
        elements.push(
          <p key={`p-${index}`} className="mb-2 last:mb-0 leading-relaxed">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    });

    // Flush remaining list at the end
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-end`} className="mb-2 space-y-1 text-left">
          {currentList}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[450px] h-[500px] bg-[#0f172a]/95 backdrop-blur-xl border border-cyber-accent/30 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out] relative">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-cyber-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-cyber-accent font-display font-bold tracking-wider text-sm">ZRETI AI ASSISTANT</span>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyber-700 scrollbar-track-transparent">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border
                            ${msg.role === 'model' 
                                ? 'bg-cyber-900 border-cyber-accent/50 text-cyber-accent' 
                                : 'bg-slate-700 border-slate-600 text-slate-200'}
                        `}>
                            {msg.role === 'model' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div className={`
                            max-w-[85%] p-3 rounded-2xl text-sm font-mono
                            ${msg.role === 'model' 
                                ? 'bg-cyber-800/50 border border-cyber-700/50 text-slate-200 rounded-tl-none' 
                                : 'bg-cyber-accent/10 border border-cyber-accent/20 text-cyan-50 rounded-tr-none'}
                        `}>
                            {/* Use Custom Renderer instead of direct text output */}
                            {renderMessageText(msg.text)}
                        </div>
                    </div>
                ))}
                {isTyping && (
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyber-900 border border-cyber-accent/50 text-cyber-accent flex items-center justify-center">
                            <Sparkles className="w-4 h-4 animate-spin-slow" />
                        </div>
                        <div className="bg-cyber-800/50 border border-cyber-700/50 p-3 rounded-2xl rounded-tl-none flex gap-1">
                            <div className="w-2 h-2 bg-cyber-accent/50 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                            <div className="w-2 h-2 bg-cyber-accent/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-cyber-accent/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-cyber-900/80 border-t border-white/10">
                <div className="relative">
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Спроси о деталях или попроси совет..."
                        className="w-full bg-[#020617] border border-slate-700 rounded-lg py-3 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent/50 transition-all font-mono text-sm"
                        disabled={isTyping}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-cyber-accent/20 hover:bg-cyber-accent text-cyber-accent hover:text-black rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Background Grid inside Chat */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none -z-10"></div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
            group relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all duration-300
            ${isOpen ? 'bg-slate-800 text-slate-400 rotate-90' : 'bg-cyber-accent text-black hover:scale-110 hover:shadow-[0_0_50px_rgba(34,211,238,0.6)]'}
        `}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        
        {/* Ripple Effect when closed */}
        {!isOpen && (
            <span className="absolute inset-0 rounded-full border border-cyber-accent animate-ping opacity-75"></span>
        )}
      </button>
    </div>
  );
};
