import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Agent } from '../types';
import { getAgent } from '../services/api';
import ChatPlayground from '../components/ChatPlayground';

export default function ChatPage() {
  const { agentId } = useParams<{ agentId?: string }>();
  const { agents, loading, setEditingAgent, setIsAgentModalOpen } = useApp();
  const navigate = useNavigate();

  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (agentId) {
      const found = agents.find((a) => a.id === agentId || a.slug === agentId);
      if (found) {
        setActiveAgent(found);
      } else {
        // Fetch directly from API in case direct link was visited before agents loaded
        setFetching(true);
        getAgent(agentId)
          .then((agent) => setActiveAgent(agent))
          .catch((err) => {
            console.error('Failed to fetch agent for chat:', err);
            setActiveAgent(null);
          })
          .finally(() => setFetching(false));
      }
    } else if (agents.length > 0) {
      // Default to first agent if no agentId specified in route
      setActiveAgent(agents[0]);
      navigate(`/chat/${agents[0].id}`, { replace: true });
    }
  }, [agentId, agents, navigate]);

  if (fetching || (loading && !activeAgent)) {
    return (
      <div className="w-full flex items-center justify-center py-20 text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <Bot className="w-8 h-8 text-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold">Loading agent chat session...</span>
        </div>
      </div>
    );
  }

  if (!activeAgent) {
    return (
      <div className="w-full max-w-xl mx-auto text-center py-16 p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/30">
        <Bot className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2.5" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Agent Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Please select an agent from the marketplace to launch a chat session.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2.5">
          <button
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go to Marketplace
          </button>
          <button
            onClick={() => {
              setEditingAgent(null);
              setIsAgentModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Create Agent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Agent Quick Switcher Toolbar */}
      {agents.length > 1 && (
        <div className="w-full max-w-5xl mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Chatting with:</span>
            <select
              value={activeAgent.id}
              onChange={(e) => navigate(`/chat/${e.target.value}`)}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.model})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
          </button>
        </div>
      )}

      <ChatPlayground
        agent={activeAgent}
        onBack={() => navigate('/')}
        onEdit={(agent) => {
          setEditingAgent(agent);
          setIsAgentModalOpen(true);
        }}
      />
    </div>
  );
}
