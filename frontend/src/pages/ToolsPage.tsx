import { Plus, Code2, Globe, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ToolsPage() {
  const { tools, setIsToolModalOpen, handleDeleteTool } = useApp();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
            Callable Tools Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sandboxed JavaScript functions & authenticated REST endpoints
          </p>
        </div>
        <button
          onClick={() => setIsToolModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Register Custom Tool
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2 flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                  {tool.toolType === 'CODE' ? (
                    <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                  {tool.name}
                </span>
                {!tool.isSystem && (
                  <button
                    onClick={() => handleDeleteTool(tool.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition cursor-pointer"
                    title="Delete Tool"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {tool.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>
                {tool.toolType === 'CODE'
                  ? 'SANDBOXED JS'
                  : `${tool.httpMethod || 'POST'} • ${tool.authType || 'NONE'}`}
              </span>
              {tool.isSystem ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                  Built-in
                </span>
              ) : (
                <span className="text-purple-600 dark:text-purple-400 font-sans font-medium">
                  {tool.toolType === 'CODE' ? 'JS Function' : 'REST API'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
