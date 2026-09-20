import { useState, useEffect } from 'react';
import {
  Coins,
  Cpu,
  Activity,
  Bot,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import { getTokenUsageStats } from '../services/api';

interface SummaryData {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  totalInteractions: number;
  totalAgents: number;
}

interface AgentUsage {
  agentId: string;
  agentName: string;
  model: string;
  provider: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  interactionsCount: number;
  percentage: number;
}

interface ActivityItem {
  id: string;
  agentId: string;
  agentName: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimate: number;
  createdAt: string;
}

export default function TokenUsageDashboard() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData>({
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalCost: 0,
    totalInteractions: 0,
    totalAgents: 0,
  });
  const [byAgent, setByAgent] = useState<AgentUsage[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getTokenUsageStats();
      if (data?.summary) setSummary(data.summary);
      if (data?.byAgent) setByAgent(data.byAgent);
      if (data?.recentActivity) setRecentActivity(data.recentActivity);
    } catch (err) {
      console.error('Failed to load token analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTokens = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return val.toLocaleString();
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Token Consumption & Usage Analytics
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Live Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time LLM token metering, prompt vs. completion splits, and cost estimates across your agents
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Tokens */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tokens</span>
            <div className="w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {formatTokens(summary.totalTokens)}
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-normal">tokens</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ArrowDownRight className="w-3 h-3" />
              In: {formatTokens(summary.promptTokens)}
            </span>
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
              <ArrowUpRight className="w-3 h-3" />
              Out: {formatTokens(summary.completionTokens)}
            </span>
          </div>
        </div>

        {/* Card 2: Estimated Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Estimated Cost</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              ${summary.totalCost < 0.01 && summary.totalCost > 0 ? summary.totalCost.toFixed(5) : summary.totalCost.toFixed(3)}
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-normal">USD</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            Based on active model inference rates
          </div>
        </div>

        {/* Card 3: Monitored Agents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Agents</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {summary.totalAgents}
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-normal">consuming tokens</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            {summary.totalInteractions} total interactions
          </div>
        </div>

        {/* Card 4: Efficiency Metric */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Tokens / Chat</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {summary.totalInteractions > 0
                ? Math.round(summary.totalTokens / summary.totalInteractions).toLocaleString()
                : '0'}
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-normal">tokens/reply</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            Optimized prompt budgeting
          </div>
        </div>
      </div>

      {/* Main Breakdown Section: Table by Agent */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Agent Consumption Breakdown
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {byAgent.length} {byAgent.length === 1 ? 'agent' : 'agents'} registered
          </span>
        </div>

        {byAgent.length === 0 ? (
          <div className="p-8 text-center">
            <Bot className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">No token consumption recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Start chatting with an agent in the Playground to record live token telemetry!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">Agent Name</th>
                  <th className="py-2.5 px-4">Model & Provider</th>
                  <th className="py-2.5 px-4">Interactions</th>
                  <th className="py-2.5 px-4">Input (Prompt)</th>
                  <th className="py-2.5 px-4">Output (Reply)</th>
                  <th className="py-2.5 px-4">Total Tokens</th>
                  <th className="py-2.5 px-4">Est. Cost ($)</th>
                  <th className="py-2.5 px-4">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                {byAgent.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate max-w-[160px]">{agent.agentName}</span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {agent.model}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{agent.interactionsCount}</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">{agent.promptTokens.toLocaleString()}</td>
                    <td className="py-3 px-4 text-purple-600 dark:text-purple-400">{agent.completionTokens.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {agent.totalTokens.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      ${agent.totalCost < 0.01 ? agent.totalCost.toFixed(5) : agent.totalCost.toFixed(3)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, agent.percentage)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{agent.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real-time Usage Activity Log */}
      {recentActivity.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recent Consumption Events</h3>
            </div>
            <span className="text-[11px] text-slate-400">Last {recentActivity.length} interactions</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="px-5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 mr-2">{item.agentName}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {item.model}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-[11px]">
                  <span className="text-slate-500">
                    <span className="text-emerald-600 dark:text-emerald-400">+{item.promptTokens}</span> in /{' '}
                    <span className="text-purple-600 dark:text-purple-400">+{item.completionTokens}</span> out
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {item.totalTokens.toLocaleString()} tokens
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

