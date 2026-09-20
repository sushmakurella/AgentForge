import React, { useState } from 'react';
import { X, Wrench, Shield, Globe, Code2, Plus, Trash2, HelpCircle } from 'lucide-react';
import { CreateToolPayload, ParameterDefinition } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newTool?: any) => void;
  createToolFn: (payload: CreateToolPayload) => Promise<any>;
}

const DEFAULT_CODE_TEMPLATE = `function execute(args) {
  // 'args' contains the input parameters defined below
  // e.g. const { amount, rate } = args;
  
  return {
    status: "success",
    result: "Executed successfully with arguments: " + JSON.stringify(args)
  };
}`;

export default function ToolBuilderModal({ isOpen, onClose, onCreated, createToolFn }: Props) {
  const [toolType, setToolType] = useState<'CODE' | 'API'>('CODE');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Code Tool state
  const [code, setCode] = useState(DEFAULT_CODE_TEMPLATE);

  // API Tool state
  const [endpointUrl, setEndpointUrl] = useState('');
  const [httpMethod, setHttpMethod] = useState('POST');
  const [customHeaders, setCustomHeaders] = useState('');
  const [requestBodyFormat, setRequestBodyFormat] = useState('');
  const [authType, setAuthType] = useState('NONE');
  const [authSecret, setAuthSecret] = useState('');
  const [headerKey, setHeaderKey] = useState('X-API-KEY');
  const [signingSecret, setSigningSecret] = useState('');

  // Dynamic Parameters state
  const [parameters, setParameters] = useState<ParameterDefinition[]>([
    { name: '', type: 'string', description: '', required: true },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      { name: '', type: 'string', description: '', required: false },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleUpdateParameter = (index: number, field: keyof ParameterDefinition, value: any) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tool name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Tool description is required so the AI model knows when to use it.');
      return;
    }

    if (toolType === 'API' && !endpointUrl.trim()) {
      setError('Endpoint URL is required for REST API tools.');
      return;
    }

    if (toolType === 'CODE' && !code.trim()) {
      setError('JavaScript code implementation is required.');
      return;
    }

    setLoading(true);
    setError(null);

    // Build parametersSchema
    const properties: Record<string, any> = {};
    const required: string[] = [];

    parameters.forEach((param) => {
      const cleanName = param.name.trim();
      if (cleanName) {
        properties[cleanName] = {
          type: param.type,
          description: param.description.trim() || undefined,
        };
        if (param.required) {
          required.push(cleanName);
        }
      }
    });

    const parametersSchema = JSON.stringify({
      type: 'object',
      properties,
      required,
    });

    try {
      const created = await createToolFn({
        name: name.trim().toLowerCase().replace(/\s+/g, '_'),
        description: description.trim(),
        toolType,
        code: toolType === 'CODE' ? code.trim() : undefined,
        endpointUrl: toolType === 'API' ? endpointUrl.trim() : undefined,
        httpMethod: toolType === 'API' ? httpMethod : 'POST',
        customHeaders: toolType === 'API' && customHeaders.trim() ? customHeaders.trim() : undefined,
        requestBodyFormat: toolType === 'API' && requestBodyFormat.trim() ? requestBodyFormat.trim() : undefined,
        authType: toolType === 'API' ? authType : 'NONE',
        authSecret: toolType === 'API' && authSecret.trim() ? authSecret.trim() : undefined,
        headerKey: toolType === 'API' && headerKey.trim() ? headerKey.trim() : undefined,
        signingSecret: toolType === 'API' && signingSecret.trim() ? signingSecret.trim() : undefined,
        parametersSchema,
      });

      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create tool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-2xl max-h-[88vh] shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Register Custom Tool</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Add a JavaScript function or REST API endpoint for AI agents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Tool Type Switcher Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Execution Mechanism</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setToolType('CODE')}
                className={`flex items-center gap-2.5 p-3 rounded-md border text-left transition ${
                  toolType === 'CODE'
                    ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-500 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded ${toolType === 'CODE' ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">JavaScript Code</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Sandboxed Node.js VM execution</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setToolType('API')}
                className={`flex items-center gap-2.5 p-3 rounded-md border text-left transition ${
                  toolType === 'API'
                    ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-500 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded ${toolType === 'API' ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">REST API Endpoint</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Outbound webhook / external service</div>
                </div>
              </button>
            </div>
          </div>

          {/* Tool Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tool Function Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. calculate_discount, query_crm"
                className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Calculates order discounts based on loyalty tier"
                className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
                required
              />
            </div>
          </div>

          {/* Dynamic Input Parameters Schema Builder */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Input Parameters (Arguments)</span>
              </div>
              <button
                type="button"
                onClick={handleAddParameter}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-medium transition"
              >
                <Plus className="w-3 h-3" /> Add Parameter
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              The AI model extracts these arguments from the user's message before calling the tool.
            </p>

            {parameters.length === 0 ? (
              <div className="py-2.5 text-center text-xs text-slate-400 italic">
                No arguments configured.
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                {parameters.map((param, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Name (e.g. amount)"
                        value={param.name}
                        onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={param.type}
                        onChange={(e) => handleUpdateParameter(index, 'type', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                    </div>
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Description (e.g. Total order amount)"
                        value={param.description}
                        onChange={(e) => handleUpdateParameter(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={param.required}
                          onChange={(e) => handleUpdateParameter(index, 'required', e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-purple-600"
                        />
                        <span>Req</span>
                      </label>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveParameter(index)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditional Mode 1: JavaScript Code Editor */}
          {toolType === 'CODE' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">JavaScript Implementation</label>
                <span className="text-[10px] text-slate-400">Sandboxed Node.js VM (3s timeout)</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={7}
                className="w-full px-3 py-2.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
                required
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Write a function named <code className="text-purple-600 dark:text-purple-300 font-mono">execute(args)</code> that returns a result object or string.
              </p>
            </div>
          )}

          {/* Conditional Mode 2: REST API Endpoint & Headers */}
          {toolType === 'API' && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2.5">
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Endpoint URL *</label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="url"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder="https://api.mycompany.com/v1/orders"
                      className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
                      required={toolType === 'API'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">HTTP Method</label>
                  <select
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>

              {/* Custom Headers & Request Format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Custom Headers (JSON)</label>
                  <input
                    type="text"
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    placeholder='{"X-App-ID": "app_100"}'
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Request JSON Format</label>
                  <input
                    type="text"
                    value={requestBodyFormat}
                    onChange={(e) => setRequestBodyFormat(e.target.value)}
                    placeholder='{"data": "$args"}'
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Authentication */}
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Outbound Authentication
                </div>

                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="NONE">None (Public Endpoint)</option>
                  <option value="BEARER">Bearer Token (Authorization: Bearer ...)</option>
                  <option value="CUSTOM_HEADER">Custom Header (e.g. X-API-KEY)</option>
                  <option value="BASIC">Basic Auth (user:pass)</option>
                  <option value="HMAC">HMAC SHA-256 Request Signing</option>
                </select>

                {authType === 'BEARER' && (
                  <input
                    type="password"
                    value={authSecret}
                    onChange={(e) => setAuthSecret(e.target.value)}
                    placeholder="Enter Bearer Token (Encrypted with AES-256)"
                    className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                )}

                {authType === 'CUSTOM_HEADER' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={headerKey}
                      onChange={(e) => setHeaderKey(e.target.value)}
                      placeholder="Header Name"
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <input
                      type="password"
                      value={authSecret}
                      onChange={(e) => setAuthSecret(e.target.value)}
                      placeholder="Secret Value"
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                )}

                {authType === 'BASIC' && (
                  <input
                    type="password"
                    value={authSecret}
                    onChange={(e) => setAuthSecret(e.target.value)}
                    placeholder="Username:Password"
                    className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                )}

                {authType === 'HMAC' && (
                  <input
                    type="text"
                    value={signingSecret}
                    onChange={(e) => setSigningSecret(e.target.value)}
                    placeholder="Shared Signing Secret (e.g. whsec_...)"
                    className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Register Tool in Neon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
