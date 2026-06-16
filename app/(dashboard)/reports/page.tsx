'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ReportsPage() {
  const [websiteId, setWebsiteId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<any[]>([]);

  // ✅ Fixed: use useEffect for async side effect
  useEffect(() => {
    const fetchSites = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('websites')
          .select('id, domain')
          .eq('user_id', user.id);
        setSites(data || []);
      }
    };
    fetchSites();
  }, []);

  const generateReport = async () => {
    if (!websiteId || !dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_id: websiteId, date_from: dateFrom, date_to: dateTo }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aimentioned-report-${websiteId}.pdf`;
      a.click();
    } catch (err) {
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Download Reports</h1>
      <div className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#94a3b8]">Website</label>
            <select value={websiteId} onChange={(e) => setWebsiteId(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1">
              <option value="">Select a site</option>
              {sites.map((site: any) => (
                <option key={site.id} value={site.id}>{site.domain}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-[#94a3b8]">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-sm text-[#94a3b8]">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1" />
            </div>
          </div>
          <button onClick={generateReport} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg flex items-center gap-2">
            {loading && <LoadingSpinner size={16} />}
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}