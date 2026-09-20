import { createContext, useContext, useState, useEffect, ReactNode, MouseEvent } from 'react';
import { Agent, ProviderMeta, Tool } from '../types';
import {
  getHealth,
  getProviders,
  getAgents,
  getTools,
  deleteAgent,
  deleteTool,
} from '../services/api';
import { useSession } from '../services/auth';

interface AppContextType {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  agents: Agent[];
  tools: Tool[];
  providers: ProviderMeta[];
  healthStatus: any;
  loading: boolean;
  loadAllData: () => Promise<void>;
  isAgentModalOpen: boolean;
  setIsAgentModalOpen: (open: boolean) => void;
  editingAgent: Agent | null;
  setEditingAgent: (agent: Agent | null) => void;
  isToolModalOpen: boolean;
  setIsToolModalOpen: (open: boolean) => void;
  sharingAgent: Agent | null;
  setSharingAgent: (agent: Agent | null) => void;
  handleDeleteAgent: (e: MouseEvent, id: string) => Promise<void>;
  handleDeleteTool: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [providers, setProviders] = useState<ProviderMeta[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Editing
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [sharingAgent, setSharingAgent] = useState<Agent | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#020617';
      document.body.style.color = '#f8fafc';
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (session?.user) {
      loadAllData();
    }
  }, [session?.user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [h, p, a, t] = await Promise.all([
        getHealth().catch(() => null),
        getProviders().catch(() => []),
        getAgents().catch(() => []),
        getTools().catch(() => []),
      ]);
      setHealthStatus(h);
      setProviders(p);
      setAgents(a);
      setTools(t);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await deleteAgent(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    try {
      await deleteTool(id);
      setTools((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
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
        handleDeleteAgent,
        handleDeleteTool,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
