import React, { useEffect, useState, useRef } from 'react';
import { runSystemHealthCheck, DiagnosticLog } from '../api/newscatcher';
import { X, Play, Activity, CheckCircle2, AlertTriangle, XCircle, Loader2, Server } from 'lucide-react';

interface DiagnosticsProps {
  onClose: () => void;
}

const Diagnostics: React.FC<DiagnosticsProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const runTest = async () => {
    setIsRunning(true);
    setLogs([]);
    await runSystemHealthCheck((log) => {
      setLogs(prev => {
        // If updating a pending log for the same stage, replace it, otherwise append
        const existingIndex = prev.findIndex(l => l.stage === log.stage && l.status === 'pending');
        if (existingIndex >= 0) {
          const newLogs = [...prev];
          newLogs[existingIndex] = log;
          return newLogs;
        }
        return [...prev, log];
      });
    });
    setIsRunning(false);
  };

  useEffect(() => {
    runTest();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusIcon = (status: DiagnosticLog['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-orange-500" />;
      case 'pending': return <Loader2 size={16} className="text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: DiagnosticLog['status']) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'pending': return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-gray-200">
        
        {/* Header */}
        <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Activity size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">System Diagnostics</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Automation Test Suite</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-50 p-4 overflow-y-auto" ref={scrollRef}>
          <div className="space-y-3">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`p-3 rounded-xl border flex items-start gap-3 transition-all animate-in slide-in-from-left-2 duration-300 ${getStatusColor(log.status)}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getStatusIcon(log.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{log.stage}</span>
                    {log.status === 'success' && <span className="text-[10px] font-bold">OK</span>}
                  </div>
                  <p className="text-sm font-bold leading-snug">{log.message}</p>
                  {log.details && (
                    <p className="text-xs opacity-80 mt-1 font-mono bg-black/5 p-1.5 rounded inline-block break-all">
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {!isRunning && logs.length > 0 && logs.every(l => l.status !== 'error') && (
               <div className="text-center py-4">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    <CheckCircle2 size={14} /> All Systems Operational
                 </div>
               </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
             <Server size={14} />
             <span>NewsCatcher API Active</span>
          </div>
          <button 
            onClick={runTest}
            disabled={isRunning}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
          >
            {isRunning ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" /> Run Test Again
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Diagnostics;
