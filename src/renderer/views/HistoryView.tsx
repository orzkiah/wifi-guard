import React from 'react';
import { History } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const HistoryView: React.FC = () => {
  const { events } = useAppStore();

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'DEVICE_FIRST_SEEN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">NEW DEVICE</span>;
      case 'DEVICE_BLOCKED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">BLOCKED</span>;
      case 'DEVICE_UNBLOCKED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">UNBLOCKED</span>;
      case 'DEVICE_TRUSTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">TRUSTED</span>;
      case 'DEVICE_CONNECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800">CONNECTED</span>;
      case 'DEVICE_DISCONNECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">DISCONNECTED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">{type}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full pb-8 select-none">
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <History className="w-5 h-5 text-sky-400" />
          Network Activity & Event History
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Auditable timeline of new connections, state changes, and MAC filter modifications
        </p>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {events.map((evt) => {
                let metadata: any = {};
                try {
                  metadata = JSON.parse(evt.metadataJson);
                } catch {
                  // Ignore
                }

                return (
                  <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getEventBadge(evt.eventType)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {metadata.hostname && (
                        <span className="font-semibold text-white mr-2">{metadata.hostname}</span>
                      )}
                      {metadata.mac && (
                        <span className="font-mono text-slate-400 mr-2">[{metadata.mac}]</span>
                      )}
                      {metadata.ip && (
                        <span className="font-mono text-slate-400 mr-2">IP: {metadata.ip}</span>
                      )}
                      {metadata.customName && (
                        <span className="text-slate-300">Renamed to "{metadata.customName}"</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {events.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    No activity logs recorded yet. Events will appear as devices connect and change state.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
