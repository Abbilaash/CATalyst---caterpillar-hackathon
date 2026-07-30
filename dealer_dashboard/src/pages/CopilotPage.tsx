import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, ArrowUpRight, Bot, Zap } from 'lucide-react';
import { copilotSuggestions, copilotMockReply } from '@/data/mock';
import { PageContainer, PageHeader } from '@/components/ui/Page';

interface Msg { role: 'user' | 'ai'; text: string; }

export function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: "I'm your CAT fleet copilot. I can analyze utilization, surface revenue at risk, recommend relocations, and flag expiring rentals. Ask away." },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'ai', text: copilotMockReply(text) }]);
      setTyping(false);
    }, 900);
  };

  return (
    <PageContainer title="AI Copilot">
      <PageHeader title="AI Copilot" subtitle="Your fleet-aware assistant for decisions and analysis." />

      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex h-[calc(100vh-16rem)] flex-col overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cat-yellow/15 text-cat-yellow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">CAT Copilot</div>
              <div className="flex items-center gap-1.5 text-[10px] text-ink-200">
                <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse-soft" />
                Online · Fleet-aware · GPT-Powered
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-cat-yellow/10 px-2.5 py-1 text-[10px] font-medium text-cat-yellow">
              <Zap className="h-3 w-3" /> Enterprise
            </div>
          </div>

          <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'ai' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cat-yellow/15 text-cat-yellow">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-cat-yellow text-ink-900 rounded-br-md'
                      : 'bg-ink-500/60 text-ink-50 rounded-bl-md'
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
            {typing && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cat-yellow/15 text-cat-yellow">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-ink-500/60 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-ink-100"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="border-t border-white/[0.06] px-5 py-4">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink-200">
                Suggested prompts
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {copilotSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="group flex items-center justify-between rounded-lg border border-white/[0.06] bg-ink-500/40 px-3 py-2.5 text-left text-xs text-ink-100 transition-colors hover:border-cat-yellow/30 hover:bg-ink-500/60"
                  >
                    {s}
                    <ArrowUpRight className="h-3.5 w-3.5 text-ink-200 transition-colors group-hover:text-cat-yellow" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-white/[0.06] p-4">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your fleet..."
                className="flex-1 rounded-lg border border-white/[0.06] bg-ink-500/40 px-4 py-2.5 text-sm text-ink-50 placeholder:text-ink-200 focus:border-cat-yellow/40 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-cat-yellow text-ink-900 transition-colors hover:bg-cat-yellow-soft"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}
