import { Agent, CreateAgentPayload, CreateToolPayload, ProviderMeta, Tool } from '../types';

const API_BASE = 'http://localhost:4000/api';

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch health`);
  return res.json();
}

export async function getProviders(): Promise<ProviderMeta[]> {
  const res = await fetch(`${API_BASE}/agents/meta/providers`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch providers`);
  return res.json();
}

export async function getAgents(onlyPublic?: boolean): Promise<Agent[]> {
  const url = onlyPublic ? `${API_BASE}/agents?public=true` : `${API_BASE}/agents`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch agents`);
  return res.json();
}

export async function getAgent(idOrSlug: string): Promise<Agent> {
  const res = await fetch(`${API_BASE}/agents/${idOrSlug}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch agent`);
  return res.json();
}

export async function createAgent(payload: CreateAgentPayload): Promise<Agent> {
  const res = await fetch(`${API_BASE}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to create agent`);
  }
  return res.json();
}

export async function updateAgent(id: string, payload: Partial<CreateAgentPayload>): Promise<Agent> {
  const res = await fetch(`${API_BASE}/agents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to update agent`);
  }
  return res.json();
}

export async function deleteAgent(id: string) {
  const res = await fetch(`${API_BASE}/agents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete agent`);
  return res.json();
}

export async function getTools(): Promise<Tool[]> {
  const res = await fetch(`${API_BASE}/tools`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch tools`);
  return res.json();
}

export async function createTool(payload: CreateToolPayload): Promise<Tool> {
  const res = await fetch(`${API_BASE}/tools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to register tool`);
  }
  return res.json();
}

export async function deleteTool(id: string) {
  const res = await fetch(`${API_BASE}/tools/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete tool`);
  return res.json();
}

export async function sendChatMessage(agentId: string, message: string, sessionId?: string) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, message, sessionId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Chat failed`);
  }
  return res.json();
}

export async function getChatHistory(sessionId: string) {
  const res = await fetch(`${API_BASE}/chat/history/${sessionId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch history`);
  return res.json();
}

// --- Analytics & Token Usage ---
export async function getTokenUsageStats(params?: { agentId?: string; userId?: string }) {
  let url = `${API_BASE}/analytics/tokens`;
  if (params?.agentId) {
    url += `?agentId=${encodeURIComponent(params.agentId)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch token usage`);
  return res.json();
}

// --- Organization & Permissions ---
export async function getOrganizationMembers() {
  const res = await fetch(`${API_BASE}/organization/members`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch team members`);
  return res.json();
}

export async function addOrInviteMember(data: { email: string; name?: string; role?: string }) {
  const res = await fetch(`${API_BASE}/organization/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}: Failed to invite member`);
  }
  return res.json();
}

export async function updateMemberRole(userId: string, role: string) {
  const res = await fetch(`${API_BASE}/organization/members/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}: Failed to update role`);
  }
  return res.json();
}

export async function getAgentPermissions(agentId: string) {
  const res = await fetch(`${API_BASE}/agents/${agentId}/permissions`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch permissions`);
  return res.json();
}

export async function updateAgentPermissions(
  agentId: string,
  data: { accessScope?: string; permissions?: { userId: string; permissionLevel: string }[] },
) {
  const res = await fetch(`${API_BASE}/agents/${agentId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}: Failed to update permissions`);
  }
  return res.json();
}


