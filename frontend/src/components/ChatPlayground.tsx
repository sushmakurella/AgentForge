import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, ArrowLeft, Sparkles, Code2, Globe, Pencil } from 'lucide-react';
import { Agent, ChatMessage } from '../types';
import { sendChatMessage } from '../services/api';

interface Props {
  agent: Agent;
  onBack: () => void;
  onEdit?: (agent: Agent) => void;
}

export default function ChatPlayground({ agent, onBack, onEdit }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: `Hello! I am **${agent.name}**.\n\n${agent.description || 'How can I assist you today?'}`,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(agent.id, userMessage.content, sessionId);
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      const assistantMessage: ChatMessage = {
        id: response.message.id || Date.now().toString(),
        role: 'assistant',
        content: response.message.content || 'Action executed successfully.',
        toolCalls: response.message.toolCalls,
        createdAt: response.message.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `⚠️ Error executing request: ${err.message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col h-[78vh] overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shadow-sm"
            title="Back to Marketplace"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">{agent.name}</h2>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {agent.model}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Provider: <strong className="text-slate-700 dark:text-slate-200 capitalize">{agent.provider}</strong></span>
              <span>•</span>
              <span>Temp: <strong className="text-slate-700 dark:text-slate-200">{agent.temperature}</strong></span>
            </div>
          </div>
        </div>

        {/* Attached Tools & Edit Button */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1">
            {agent.tools && agent.tools.length > 0 ? (
              agent.tools.map((at) => (
                <span
                  key={at.toolId}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono shadow-xs"
                >
                  {at.tool.toolType === 'CODE' ? (
                    <Code2 className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Globe className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                  )}
                  {at.tool.name}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-400">No tools attached</span>
            )}
          </div>

          {onEdit && (
            <button
              onClick={() => onEdit(agent)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shadow-sm"
              title="Edit Agent Instructions & Configuration"
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Edit Agent</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-xs'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[82%] rounded-lg p-3 text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 shadow-xs'
              }`}
            >
              {msg.content}

              {/* Tool Invocations Badge */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                  <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Tools Invoked:
                  </div>
                  {msg.toolCalls.map((tc: any, i: number) => (
                    <div
                      key={i}
                      className="text-[10px] font-mono bg-slate-50 dark:bg-slate-950 p-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {tc.toolName || tc.name}({JSON.stringify(tc.args || tc.parameters || {})})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              Thinking and formulating response...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${agent.name}...`}
          disabled={loading}
          className="flex-1 px-3.5 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
