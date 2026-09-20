import { useNavigate } from 'react-router-dom';
import {
  Bot,
  MessageSquare,
  Pencil,
  Trash2,
  Share2,
  Code2,
  Globe,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MarketplacePage() {
  const {
    agents,
    loading,
    setEditingAgent,
    setIsAgentModalOpen,
    setSharingAgent,
    handleDeleteAgent,
  } = useApp();

  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
            Agents Marketplace & Library
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Discover, test, and deploy multi-model autonomous agents
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => navigate(`/chat/${agent.id}`)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 hover:border-indigo-500/70 dark:hover:border-indigo-500/70 rounded-lg p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {agent.name}
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {agent.model}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSharingAgent(agent);
                    }}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Share & Manage Permissions"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAgent(agent);
                      setIsAgentModalOpen(true);
                    }}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Edit Agent Configuration"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteAgent(e, agent.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Delete Agent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {agent.description || agent.systemPrompt}
              </p>

              {/* Attached Tools Tags */}
              {agent.tools && agent.tools.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {agent.tools.slice(0, 3).map((at) => (
                    <span
                      key={at.toolId}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 flex items-center gap-1"
                    >
                      {at.tool.toolType === 'CODE' ? (
                        <Code2 className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Globe className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                      )}
                      {at.tool.name}
                    </span>
                  ))}
                  {agent.tools.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      +{agent.tools.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 capitalize">{agent.provider}</span>
              <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-semibold group-hover:translate-x-0.5 transition">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && !loading && (
        <div className="text-center py-16 p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/30">
          <Bot className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2.5" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Agents Created Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Build your first no-code agent powered by Gemini or OpenAI with custom tools and guardrails.
          </p>
          <button
            onClick={() => {
              setEditingAgent(null);
              setIsAgentModalOpen(true);
            }}
            className="mt-3.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1.5 mx-auto"
          >
            <Plus className="w-4 h-4" /> Create First Agent
          </button>
        </div>
      )}
    </div>
  );
}
