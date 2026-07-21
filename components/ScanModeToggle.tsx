'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Shield, Loader2 } from 'lucide-react';

export default function ScanModeToggle({ siteId, currentMode }: { siteId: string; currentMode: string }) {
  const [mode, setMode] = useState(currentMode);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<string | null>(null);
  const router = useRouter();

  const handleToggle = (newMode: string) => {
    setPendingMode(newMode);
    setShowConfirm(true);
  };

  const confirmToggle = async () => {
    if (!pendingMode) return;
    setLoading(true);
    try {
      const res = await fetch('/api/sites/toggle-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_id: siteId, scan_mode: pendingMode }),
      });
      if (res.ok) {
        setMode(pendingMode);
        router.refresh();
      }
    } catch {}
    setLoading(false);
    setShowConfirm(false);
    setPendingMode(null);
  };

  const isAuto = mode === 'auto';

  return (
    <>
      <button
        onClick={() => handleToggle(isAuto ? 'manual' : 'auto')}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
          isAuto
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
        }`}
      >
        {isAuto ? <Zap size={12} /> : <Shield size={12} />}
        {isAuto ? 'Auto' : 'Manual'}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 sm:p-6 max-w-sm w-full mx-auto text-center">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              Switch to {pendingMode === 'auto' ? 'Auto' : 'Manual'} Mode?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {pendingMode === 'auto'
                ? 'Auto mode runs daily scans + weekly audits automatically. 88-100 queries/month.'
                : 'Manual mode runs weekly audits only. You control when extra scans run. 36-48 queries/month.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmToggle}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}