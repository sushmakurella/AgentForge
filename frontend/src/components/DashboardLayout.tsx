import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bot,
  Plus,
  RefreshCw,
  Database,
  Wrench,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
  BarChart3,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSession, signOut } from '../services/auth';
import { createAgent, updateAgent, createTool } from '../services/api';
import AgentBuilderModal from './AgentBuilderModal';
import ToolBuilderModal from './ToolBuilderModal';
import AgentShareModal from './AgentShareModal';

export default function DashboardLayout() {
  const {
    theme,
    setTheme,
    agents,
    tools,
    providers,
    healthStatus,
    loading,
    loadAllData,
    isAgentModalOpen,
    setIsAgentModalOpen,
    editingAgent,
    setEditingAgent,
    isToolModalOpen,
    setIsToolModalOpen,
    sharingAgent,
    setSharingAgent,
  } = useApp();

  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md transition cursor-pointer text-xs font-medium ${
      isActive
        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
    }`;

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150 flex flex-col items-center p-4 md:p-8`}>
      {/* Top Header Bar */}
      <header className="w-full max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800/80 gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Agent Marketplace & Studio
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                v1.2
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enterprise Multi-Model Agent Platform • Neon PostgreSQL
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {healthStatus && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
              <Database className="w-3.5 h-3.5" /> Neon DB Online
            </span>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={() => {
              setEditingAgent(null);
              setIsAgentModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Agent
          </button>

          {/* User Profile & Sign Out */}
          {session?.user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {session.user.name || session.user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[120px]">
                    {session.user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition shadow-sm cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="w-full max-w-6xl mt-6 flex flex-col items-center">
        {/* Navigation Tabs Bar */}
        <div className="w-full flex items-center justify-between pb-5">
          <nav className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800">
            <NavLink to="/" end className={navItemClass}>
              <Bot className="w-3.5 h-3.5" /> Marketplace ({agents.length})
            </NavLink>
            <NavLink to="/chat" className={navItemClass}>
              <MessageSquare className="w-3.5 h-3.5" /> Playground
            </NavLink>
            <NavLink to="/tools" className={navItemClass}>
              <Wrench className="w-3.5 h-3.5" /> Tools ({tools.length})
            </NavLink>
            <NavLink to="/analytics" className={navItemClass}>
              <BarChart3 className="w-3.5 h-3.5" /> Token Analytics
            </NavLink>
            <NavLink to="/team" className={navItemClass}>
              <Users className="w-3.5 h-3.5" /> Team & Roles
            </NavLink>
          </nav>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Routed Page Content */}
        <div className="w-full">
          <Outlet />
        </div>
      </main>

      {/* Modals Mounted Globally */}
      <AgentBuilderModal
        isOpen={isAgentModalOpen || !!editingAgent}
        onClose={() => {
          setIsAgentModalOpen(false);
          setEditingAgent(null);
        }}
        onCreated={() => loadAllData()}
        agentToEdit={editingAgent}
        providers={providers}
        availableTools={tools}
        createAgentFn={createAgent}
        updateAgentFn={updateAgent}
      />

      <ToolBuilderModal
        isOpen={isToolModalOpen}
        onClose={() => setIsToolModalOpen(false)}
        onCreated={() => loadAllData()}
        createToolFn={createTool}
      />

      {sharingAgent && (
        <AgentShareModal
          agent={sharingAgent}
          isOpen={!!sharingAgent}
          onClose={() => setSharingAgent(null)}
          onUpdated={() => loadAllData()}
        />
      )}
    </div>
  );
}
