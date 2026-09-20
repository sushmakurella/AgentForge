export interface ModelOption {
  id: string;
  name: string;
  default: boolean;
  contextTokens: number;
}

export interface ProviderMeta {
  id: string;
  name: string;
  description: string;
  requiresKey: boolean;
  models: ModelOption[];
}

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  toolType?: 'API' | 'CODE';
  code?: string;
  endpointUrl?: string;
  httpMethod?: string;
  customHeaders?: string;
  requestBodyFormat?: string;
  authType: 'NONE' | 'BEARER' | 'CUSTOM_HEADER' | 'BASIC' | 'HMAC';
  hasSecret?: boolean;
  headerKey?: string;
  signingSecret?: string;
  isSystem?: boolean;
  parametersSchema?: any;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  slug: string;
  provider: string;
  model: string;
  systemPrompt: string;
  instructions?: string;
  guardrails?: string;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
  status: string;
  hasCustomKey?: boolean;
  tools?: {
    agentId: string;
    toolId: string;
    tool: Tool;
  }[];
  _count?: {
    sessions: number;
    documents: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentPayload {
  name: string;
  description?: string;
  provider: string;
  model: string;
  systemPrompt: string;
  instructions?: string;
  guardrails?: string;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
  customVendorApiKey?: string;
  toolIds: string[];
}

export interface CreateToolPayload {
  name: string;
  description: string;
  toolType?: 'API' | 'CODE';
  code?: string;
  endpointUrl?: string;
  httpMethod?: string;
  customHeaders?: string;
  requestBodyFormat?: string;
  authType?: string;
  authSecret?: string;
  headerKey?: string;
  signingSecret?: string;
  parametersSchema?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: any[];
  createdAt: string;
}

