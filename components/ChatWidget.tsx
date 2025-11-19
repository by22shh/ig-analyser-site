import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import { InstagramProfile, StrategicReport } from '../types';
import { createChatSession, ChatSession } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'intro', 
      role: 'model', 
      text: t('chat_intro', { username: profile.username }) 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatSessionRef = useRef<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chips for quick questions
  const quickQuestions = [
      t('chat_chips_1'),
      t('chat_chips_2'),
      t('chat_chips_3')
  ];

  // Initialize chat session once
  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession(profile, report);
    }
  }, [profile, report]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
      if (!text.trim() || !chatSessionRef.current) return;

      const userMsgId = Date.now().toString();
      
      setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: text }]);
      setInput('');
      setIsTyping(true);
  
      try {
        const stream = chatSessionRef.current.sendMessageStream(text);
        
        const botMsgId = (Date.now() + 1).toString();
        let fullResponse = "";
  
        // Optimistically add empty bot message to stream into
        setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: "" }]);
  
        for await (const chunk of stream) {
          if (chunk) {
            fullResponse += chunk;
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
          text: t('chat_error') 
        }]);
      } finally {
        setIsTyping(false);
      }
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Markdown Rendering Logic ---

  const renderInlineFormatting = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-cyber-accent">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
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
      
      if (trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.endsWith('*'))) {
        const content = trimmed.substring(2);
        currentList.push(
          <li key={`li-${index}`} className="ml-4 list-disc marker:text-cyber-accent/50 pl-1">
            {renderInlineFormatting(content)}
          </li>
        );
      } else {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="mb-3 space-y-1 text-left">
              {currentList}
            </ul>
          );
          currentList = [];
        }

        if (!trimmed) return;

        elements.push(
          <p key={`p-${index}`} className="mb-2 last:mb-0 leading-relaxed">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    });

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
    <div className="bg-cyber-900/30 border border-cyber-800 rounded-xl overflow-hidden flex flex-col h-[600px] break-inside-avoid relative">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-cyber-900/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyber-900 border border-cyber-accent/50 flex items-center justify-center text-cyber-accent shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Bot className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-display font-bold text-white text-sm tracking-wider">{t('chat_title')}</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Online • Gemini Pro</span>
                </div>
            </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-cyber-700 scrollbar-track-transparent bg-black/20">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border shadow-lg
                        ${msg.role === 'model' 
                            ? 'bg-cyber-900 border-cyber-accent/50 text-cyber-accent' 
                            : 'bg-slate-800 border-slate-600 text-slate-200'}
                    `}>
                        {msg.role === 'model' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`
                        max-w-[85%] p-4 rounded-2xl text-sm font-sans shadow-md
                        ${msg.role === 'model' 
                            ? 'bg-cyber-900/80 border border-cyber-700/50 text-slate-200 rounded-tl-none' 
                            : 'bg-cyber-accent/10 border border-cyber-accent/20 text-cyan-50 rounded-tr-none'}
                    `}>
                        {renderMessageText(msg.text)}
                    </div>
                </div>
            ))}
            {isTyping && (
                    <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyber-900 border border-cyber-accent/50 text-cyber-accent flex items-center justify-center">
                        <Sparkles className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div className="bg-cyber-900/80 border border-cyber-700/50 p-4 rounded-2xl rounded-tl-none flex gap-1">
                        <div className="w-1.5 h-1.5 bg-cyber-accent/50 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-1.5 h-1.5 bg-cyber-accent/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1.5 h-1.5 bg-cyber-accent/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-cyber-900/50 border-t border-white/10 space-y-3">
            {/* Quick Questions Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mask-linear-fade">
                {quickQuestions.map((q, idx) => (
                    <button
                        key={idx}
                        onClick={() => sendMessage(q)}
                        disabled={isTyping}
                        className="whitespace-nowrap px-3 py-1.5 rounded-full bg-cyber-800/50 border border-cyber-accent/20 text-[10px] text-cyber-accent hover:bg-cyber-accent/10 hover:border-cyber-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <MessageSquare className="w-3 h-3" />
                        {q}
                    </button>
                ))}
            </div>

            <div className="relative">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat_placeholder')}
                    className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent/50 transition-all font-mono text-sm shadow-inner"
                    disabled={isTyping}
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyber-accent hover:bg-cyan-400 text-black rounded-lg transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
  );
};
