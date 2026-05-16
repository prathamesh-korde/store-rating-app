/**
 * AIChatWidget — Groq-powered AI assistant floating widget.
 * Uses Groq API with llama-3.3-70b model.
 * Properly formats responses with bullet points, bold, and spacing.
 */
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, Sparkles } from 'lucide-react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const SYSTEM_PROMPT = `You are StoreRate Assistant, a helpful AI for a store rating platform.
You help users discover stores, understand ratings, write reviews, and navigate the platform.
Keep responses concise, friendly, and well-formatted.

FORMATTING RULES (you must follow these strictly):
- Use bullet points (•) for lists. Each bullet MUST start on its own new line.
- Use **bold** for emphasis and headings.
- Use numbered lists (1. 2. 3.) when giving step-by-step instructions. Each step MUST be on its own line.
- Keep paragraphs short (2-3 sentences max).
- Add a blank line between sections.
- Never put multiple points on the same line.`;

function formatMessage(text) {
  if (!text) return null;

  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();

    // Empty line = spacer
    if (trimmed === '') return <div key={i} className="h-2" />;

    // Bold heading: **text**
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return <div key={i} className="font-bold text-slate-800 mt-2 mb-1">{trimmed.slice(2, -2)}</div>;
    }

    // Inline bold within text: replace **text** with <strong>
    let processedLine = trimmed;
    const hasBold = /\*\*(.+?)\*\*/g.test(processedLine);

    // Bullet points
    if (/^[•\-\*]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[•\-\*]\s*/, '');
      return (
        <div key={i} className="flex gap-2 mt-1 ml-1">
          <span className="text-indigo-400 flex-shrink-0 font-bold">•</span>
          <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      );
    }

    // Numbered list
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)/)[1];
      const content = trimmed.replace(/^\d+[\.\)]\s*/, '');
      return (
        <div key={i} className="flex gap-2 mt-1 ml-1">
          <span className="text-indigo-500 flex-shrink-0 font-bold text-xs w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center">{num}</span>
          <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      );
    }

    // Regular text with possible inline bold
    if (hasBold) {
      return <div key={i} dangerouslySetInnerHTML={{ __html: processedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />;
    }

    return <div key={i}>{trimmed}</div>;
  });
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '**Hi! I\'m StoreRate Assistant** 👋\n\nHow can I help you today?\n\n• Find and browse stores\n• Understand ratings & reviews\n• Write a review\n• Navigate the platform\n• Account & profile help' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && !minimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      if (!GROQ_API_KEY) {
        throw new Error('No API key configured');
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '**Connection Issue** ⚠️\n\nSorry, I\'m having trouble connecting right now.\n\n• Check your internet connection\n• Try again in a moment\n• Refresh the page if the issue persists'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 flex flex-col overflow-hidden transition-all duration-300 ${minimized ? 'h-14' : 'h-[480px]'}`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">StoreRate AI</p>
              <p className="text-[10px] text-indigo-200">Powered by Groq • Llama 3</p>
            </div>
            <button onClick={() => setMinimized(v => !v)} className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white">
              <ChevronDown size={16} className={`transition-transform ${minimized ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white">
              <X size={16} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-gradient-to-br from-indigo-100 to-violet-100'}`}>
                      {msg.role === 'user'
                        ? <User size={14} className="text-white" />
                        : <Bot size={14} className="text-indigo-600" />
                      }
                    </div>
                    <div className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                      }`}>
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-indigo-600" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-slate-200 bg-white flex gap-2 flex-shrink-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about stores, ratings..."
                  rows={1}
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none transition-all placeholder-slate-300 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 flex-shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {loading ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => { setOpen(v => !v); setMinimized(false); }}
        id="ai-chat-toggle-btn"
        className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Open AI Chat"
      >
        {open
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} className="text-white" />
        }
      </button>
    </div>
  );
}
