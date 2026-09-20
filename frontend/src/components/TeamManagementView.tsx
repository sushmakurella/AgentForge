import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Bot,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { getOrganizationMembers, addOrInviteMember, updateMemberRole } from '../services/api';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CREATOR' | 'MEMBER';
  image?: string;
  agentsCount: number;
  organizationName: string;
  createdAt: string;
}

export default function TeamManagementView() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'CREATOR' | 'MEMBER'>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getOrganizationMembers();
      setMembers(data || []);
    } catch (err: any) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setFeedback(null);
    try {
      await addOrInviteMember({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        role: inviteRole,
      });
      setFeedback({ type: 'success', text: `Successfully added ${inviteEmail} as ${inviteRole}!` });
      setInviteEmail('');
      setInviteName('');
      loadMembers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to add member' });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateMemberRole(userId, newRole);
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole as any } : m)));
    } catch (err: any) {
      alert(`Failed to update role: ${err.message}`);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Organization & Role-Based Access Control
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Multi-Tenancy
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your organization members, assign access privileges, and configure agent collaboration
          </p>
        </div>

        <button
          onClick={loadMembers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Role Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Admin Role</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Full organizational control. Can invite/remove members, manage billing, change member roles, and view organization-wide token analytics.
          </p>
          <span className="mt-2 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
            Highest Privileges
          </span>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Bot className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Creator Role</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Agent Studio developer. Can create, edit, test, and publish custom agents, integrate custom tools, and share permissions with teammates.
          </p>
          <span className="mt-2 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
            Agent Builder Access
          </span>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Member Role</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Standard collaborator. Can view and chat with agents shared with the organization, but cannot modify prompt templates or delete agents.
          </p>
          <span className="mt-2 text-[10px] font-mono text-slate-500 font-semibold">
            Chat & Execution Only
          </span>
        </div>
      </div>

      {/* Invite Member Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            Invite or Add Team Member
          </h3>
        </div>

        {feedback && (
          <div
            className={`p-3 mb-3 rounded-md text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="sm:col-span-1">
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Name (e.g. Jordan Lee)"
              className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="MEMBER">Member</option>
              <option value="CREATOR">Creator</option>
              <option value="ADMIN">Admin</option>
            </select>

            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="flex-1 py-2 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Organization Members ({members.length})</h3>
          </div>
          <span className="text-[11px] text-slate-400">Default Workspace</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-4">Member Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Assigned Role</th>
                <th className="py-2.5 px-4">Agents Built</th>
                <th className="py-2.5 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    {m.image ? (
                      <img src={m.image} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                        {(m.name || m.email)[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{m.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="CREATOR">CREATOR</option>
                      <option value="MEMBER">MEMBER</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{m.agentsCount}</td>
                  <td className="py-3 px-4 text-[11px] text-slate-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

