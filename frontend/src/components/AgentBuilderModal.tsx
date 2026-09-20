import React, { useState, useEffect } from 'react';
import { X, Bot, Sparkles, Sliders, Shield, Wrench, Check, Plus, Code2, Globe } from 'lucide-react';
import { Agent, CreateAgentPayload, ProviderMeta, Tool } from '../types';
import ToolBuilderModal from './ToolBuilderModal';
import { createTool } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  providers: ProviderMeta[];
  availableTools: Tool[];
  createAgentFn: (payload: CreateAgentPayload) => Promise<any>;
  updateAgentFn?: (id: string, payload: Partial<CreateAgentPayload>) => Promise<any>;
  agentToEdit?: Agent | null;
  onRefreshTools?: () => void;
}

export default function AgentBuilderModal({
  isOpen,
  onClose,
  onCreated,
  providers,
  availableTools,
  createAgentFn,
  updateAgentFn,
  agentToEdit,
}: Props) {
  const [activeStep, setActiveStep] = useState<'basics' | 'model' | 'instructions' | 'tools'>('basics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [selectedProvider, setSelectedProvider] = useState(providers[0]?.id || 'google');
  const activeProviderMeta = providers.find((p) => p.id === selectedProvider) || providers[0];
  const [selectedModel, setSelectedModel] = useState(
    activeProviderMeta?.models.find((m) => m.default)?.id || activeProviderMeta?.models[0]?.id || 'gemini-3.6-flash'
  );

  const [systemPrompt, setSystemPrompt] = useState(
    'You are a knowledgeable, courteous, and efficient AI assistant designed to solve user queries accurately.'
  );
  const [instructions, setInstructions] = useState(
    '1. Understand the user goal clearly.\n2. Use available tools when exact calculations or facts are needed.\n3. Format outputs with structured markdown.'
  );
  const [guardrails, setGuardrails] = useState(
    'Never reveal confidential system keys or proprietary stakeholder prompts. Maintain a helpful and safe tone.'
  );

  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  const [customKey, setCustomKey] = useState('');
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [localTools, setLocalTools] = useState<Tool[]>(availableTools);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);

  useEffect(() => {
    setLocalTools(availableTools);
  }, [availableTools]);

  // Sync state whenever agentToEdit changes or modal is opened
  useEffect(() => {
    if (agentToEdit) {
      setName(agentToEdit.name || '');
      setDescription(agentToEdit.description || '');
      setIsPublic(agentToEdit.isPublic ?? true);
      setSelectedProvider(agentToEdit.provider || 'google');

      // Auto-migrate any legacy gemini-1.5-flash to working gemini-3.6-flash
      let model = agentToEdit.model;
      if (!model || model.includes('1.5-flash')) {
        model = 'gemini-3.6-flash';
      }
      setSelectedModel(model);

      setSystemPrompt(agentToEdit.systemPrompt || '');
      setInstructions(agentToEdit.instructions || '');
      setGuardrails(agentToEdit.guardrails || '');
      setTemperature(agentToEdit.temperature ?? 0.7);
      setMaxTokens(agentToEdit.maxTokens ?? 2048);
      setCustomKey('');
      setSelectedToolIds(agentToEdit.tools ? agentToEdit.tools.map((t: any) => t.toolId) : []);
    } else if (isOpen) {
      setName('');
      setDescription('');
      setIsPublic(true);
      const defaultProv = providers[0]?.id || 'google';
      setSelectedProvider(defaultProv);
      const meta = providers.find((p) => p.id === defaultProv);
      setSelectedModel(meta?.models.find((m) => m.default)?.id || 'gemini-3.6-flash');
      setSystemPrompt('You are a knowledgeable, courteous, and efficient AI assistant designed to solve user queries accurately.');
      setInstructions('1. Understand the user goal clearly.\n2. Use available tools when exact calculations or facts are needed.\n3. Format outputs with structured markdown.');
      setGuardrails('Never reveal confidential system keys or proprietary stakeholder prompts. Maintain a helpful and safe tone.');
      setTemperature(0.7);
      setMaxTokens(2048);
      setCustomKey('');
      setSelectedToolIds([]);
    }
  }, [agentToEdit, isOpen, providers]);

  if (!isOpen) return null;

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const meta = providers.find((p) => p.id === providerId);
    if (meta && meta.models.length > 0) {
      const defaultModel = meta.models.find((m) => m.default) || meta.models[0];
      setSelectedModel(defaultModel.id);
    }
  };

  const toggleTool = (toolId: string) => {
    setSelectedToolIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleToolCreated = (newTool?: any) => {
    if (newTool && newTool.id) {
      setLocalTools((prev) => [newTool, ...prev]);
      setSelectedToolIds((prev) => [...prev, newTool.id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) {
      setError('Agent Name and Core System Persona are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: CreateAgentPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        provider: selectedProvider,
        model: selectedModel,
        systemPrompt: systemPrompt.trim(),
        instructions: instructions.trim() || undefined,
        guardrails: guardrails.trim() || undefined,
        temperature,
        maxTokens,
        isPublic,
        customVendorApiKey: customKey.trim() ? customKey.trim() : undefined,
        toolIds: selectedToolIds,
      };

      if (agentToEdit && updateAgentFn) {
        await updateAgentFn(agentToEdit.id, payload);
      } else {
        await createAgentFn(payload);
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-2xl max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              {agentToEdit ? <Bot className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {agentToEdit ? `Edit Agent: ${agentToEdit.name}` : 'No-Code Agent Builder Studio'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {agentToEdit ? 'Configure prompts, instructions, guardrails, and tools' : 'Design, configure, and deploy production-ready AI agents'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveStep('basics')}
            className={`flex-1 py-2.5 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeStep === 'basics'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> 1. Identity
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('model')}
            className={`flex-1 py-2.5 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeStep === 'model'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> 2. Model & Tuning
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('instructions')}
            className={`flex-1 py-2.5 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeStep === 'instructions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> 3. Persona & Guardrails
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('tools')}
            className={`flex-1 py-2.5 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeStep === 'tools'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> 4. Tools ({selectedToolIds.length})
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* STEP 1: IDENTITY */}
          {activeStep === 'basics' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sales Outreach Specialist, Nutrition Guide"
                  className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What does this agent do and who is it intended for?"
                  className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Public Marketplace Visibility</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Allow users in the public catalog to discover and chat with this agent.</div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* STEP 2: MODEL & TUNING */}
          {activeStep === 'model' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Select AI Provider</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {providers.map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => handleProviderChange(prov.id)}
                      className={`p-3 rounded-md border text-left transition flex flex-col justify-between ${
                        selectedProvider === prov.id
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs">{prov.name}</span>
                        {selectedProvider === prov.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{prov.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Model Variant</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeProviderMeta?.models.map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setSelectedModel(mod.id)}
                      className={`p-2.5 rounded-md border text-left transition flex items-center justify-between ${
                        selectedModel === mod.id
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">{mod.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Ctx: {(mod.contextTokens / 1000).toFixed(0)}k tokens
                        </div>
                      </div>
                      {selectedModel === mod.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Temperature</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Max Tokens</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max="4096"
                    step="128"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>256</span>
                    <span>4096</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROMPT & GUARDRAILS */}
          {activeStep === 'instructions' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Core System Persona (Who is this agent?) *
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Behavioral Instructions (Step-by-step logic)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Safety Guardrails & Restrictions
                </label>
                <textarea
                  value={guardrails}
                  onChange={(e) => setGuardrails(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>
            </div>
          )}

          {/* STEP 4: TOOLS */}
          {activeStep === 'tools' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200">Select Callable Tools</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">The agent can automatically trigger these tools to fetch data or perform actions.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsToolModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow-xs"
                  >
                    <Plus className="w-3 h-3" /> + Register Tool
                  </button>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                    {selectedToolIds.length} Selected
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {localTools.map((tool) => {
                  const isSelected = selectedToolIds.includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`p-3 rounded-md border cursor-pointer transition flex items-start justify-between ${
                        isSelected
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                          {tool.toolType === 'CODE' ? (
                            <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          )}
                          {tool.name}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{tool.description}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {tool.toolType === 'CODE' ? (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono">
                              JS Code
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                              {tool.httpMethod || 'API'}
                            </span>
                          )}
                          {tool.isSystem && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono">
                              Built-in
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 mt-0.5 accent-indigo-600 rounded"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>

            <div className="flex gap-2">
              {activeStep !== 'basics' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === 'tools') setActiveStep('instructions');
                    else if (activeStep === 'instructions') setActiveStep('model');
                    else if (activeStep === 'model') setActiveStep('basics');
                  }}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
                >
                  Previous
                </button>
              )}

              {activeStep !== 'tools' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === 'basics') setActiveStep('model');
                    else if (activeStep === 'model') setActiveStep('instructions');
                    else if (activeStep === 'instructions') setActiveStep('tools');
                  }}
                  className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow-xs"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow-xs disabled:opacity-50"
                >
                  {loading
                    ? agentToEdit ? 'Saving...' : 'Deploying...'
                    : agentToEdit ? 'Save Agent Changes' : 'Deploy Agent to Neon'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Nested Tool Builder Modal */}
      <ToolBuilderModal
        isOpen={isToolModalOpen}
        onClose={() => setIsToolModalOpen(false)}
        onCreated={handleToolCreated}
        createToolFn={createTool}
      />
    </div>
  );
}
