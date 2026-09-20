import { useState, useEffect } from 'react';
import { X, Globe, Building2, Lock, Shield, UserPlus, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Agent } from '../types';
import { getAgentPermissions, updateAgentPermissions, getOrganizationMembers } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onUpdated?: () => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignedPermission {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  permissionLevel: 'CAN_CHAT' | 'CAN_EDIT' | 'CAN_MANAGE';
}

export default function AgentShareModal({ isOpen, onClose, agent, onUpdated }: Props) {
  const [accessScope, setAccessScope] = useState<'PRIVATE' | 'ORGANIZATION' | 'PUBLIC'>('ORGANIZATION');
  const [permissions, setPermissions] = useState<AssignedPermission[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Add permission inputs
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'CAN_CHAT' | 'CAN_EDIT' | 'CAN_MANAGE'>('CAN_CHAT');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && agent) {
      loadData();
    }
  }, [isOpen, agent]);

  const loadData = async () => {
    if (!agent) return;
    setLoading(true);
    setError(null);
    try {
      const [permData, membersData] = await Promise.all([
        getAgentPermissions(agent.id).catch(() => null),
        getOrganizationMembers().catch(() => []),
      ]);

      if (permData) {
        setAccessScope((permData.accessScope as any) || 'ORGANIZATION');
        setPermissions(permData.permissions || []);
      }
      setMembers(membersData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !agent) return null;

  const handleAddPermission = () => {
    if (!selectedUserId) return;
    const member = members.find((m) => m.id === selectedUserId);
    if (!member) return;

    // Check if already in list
    if (permissions.some((p) => p.userId === selectedUserId)) {
      setPermissions((prev) =>
        prev.map((p) => (p.userId === selectedUserId ? { ...p, permissionLevel: selectedLevel } : p))
      );
    } else {
      setPermissions((prev) => [
        ...prev,
        {
          userId: member.id,
          userName: member.name,
          userEmail: member.email,
          permissionLevel: selectedLevel,
        },
      ]);
    }
    setSelectedUserId('');
  };

  const handleRemovePermission = (userId: string) => {
    setPermissions((prev) => prev.filter((p) => p.userId !== userId));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateAgentPermissions(agent.id, {
        accessScope,
        permissions: permissions.map((p) => ({
          userId: p.userId,
          permissionLevel: p.permissionLevel,
        })),
      });
      setMessage('Permissions updated successfully!');
      if (onUpdated) onUpdated();
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Share & Permissions: {agent.name}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Configure who can access, chat with, and edit this agent
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs">Loading permissions...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

          {/* Section 1: Access Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
              General Access Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Private */}
              <button
                type="button"
                onClick={() => setAccessScope('PRIVATE')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                  accessScope === 'PRIVATE'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Lock className={`w-4 h-4 ${accessScope === 'PRIVATE' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  {accessScope === 'PRIVATE' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Private</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Only you can view and chat
                  </span>
                </div>
              </button>

              {/* Organization */}
              <button
                type="button"
                onClick={() => setAccessScope('ORGANIZATION')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                  accessScope === 'ORGANIZATION'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Building2 className={`w-4 h-4 ${accessScope === 'ORGANIZATION' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  {accessScope === 'ORGANIZATION' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Organization</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    All team members can chat
                  </span>
                </div>
              </button>

              {/* Public Marketplace */}
              <button
                type="button"
                onClick={() => setAccessScope('PUBLIC')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                  accessScope === 'PUBLIC'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Globe className={`w-4 h-4 ${accessScope === 'PUBLIC' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  {accessScope === 'PUBLIC' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Public</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Anyone in marketplace
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Specific Teammate Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Member Access & Collaboration
              </label>
              <span className="text-[10px] text-slate-400">Granular rights</span>
            </div>

            {/* Add Member Row */}
            <div className="flex items-center gap-2 mb-3">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select team member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="CAN_CHAT">Can Chat</option>
                <option value="CAN_EDIT">Can Edit</option>
                <option value="CAN_MANAGE">Can Manage</option>
              </select>

              <button
                type="button"
                onClick={handleAddPermission}
                disabled={!selectedUserId}
                className="px-3 py-1.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* Permissions List */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden max-h-40 overflow-y-auto">
              {permissions.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No individual member overrides set. General Access Scope applies.
                </div>
              ) : (
                permissions.map((p) => (
                  <div key={p.userId} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">{p.userName}</span>
                      <span className="text-[10px] text-slate-400 block">{p.userEmail}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                          p.permissionLevel === 'CAN_EDIT'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : p.permissionLevel === 'CAN_MANAGE'
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        {p.permissionLevel.replace('_', ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePermission(p.userId)}
                        className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                        title="Remove permission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Save Permissions</span>
          </button>
        </div>
      </div>
    </div>
  );
}

