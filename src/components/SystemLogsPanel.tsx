import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { SystemAuditLog } from '../types';
import { apiClient } from '../services/apiClient';

export const SystemLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLogs(await apiClient.getAuditLogs(100));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os logs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLogs();
  }, [refreshLogs]);

  return (
    <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Logs do sistema</h2>
          <p className="mt-1 text-xs text-slate-400">Eventos de auditoria normalizados e persistidos no banco de dados.</p>
        </div>
        <button onClick={() => void refreshLogs()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-3">Data</th>
              <th className="px-3 py-3">Usuário</th>
              <th className="px-3 py-3">Ação</th>
              <th className="px-3 py-3">Recurso</th>
              <th className="px-3 py-3">Organização</th>
              <th className="px-3 py-3">IP</th>
              <th className="px-3 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {logs.map(log => (
              <tr key={log.id} className="align-top hover:bg-slate-800/30">
                <td className="whitespace-nowrap px-3 py-3 text-slate-300">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                <td className="px-3 py-3 text-slate-300">{log.userEmail || log.userId || 'Sistema'}</td>
                <td className="px-3 py-3 font-semibold text-cyan-300">{log.action}</td>
                <td className="px-3 py-3 text-slate-300">{log.resource}{log.resourceId ? ` · ${log.resourceId}` : ''}</td>
                <td className="px-3 py-3 font-mono text-slate-400">{log.organizationId}</td>
                <td className="px-3 py-3 font-mono text-slate-400">{log.ipAddress || '—'}</td>
                <td className="max-w-56 break-words px-3 py-3 text-slate-400">{log.details ? JSON.stringify(log.details) : '—'}</td>
              </tr>
            ))}
            {!isLoading && logs.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">Nenhum log de auditoria registrado.</td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">Carregando logs…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
