'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FileText, Calendar, Globe, Download } from 'lucide-react';

export default function ReportsPage() {
  const [websiteId, setWebsiteId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => {
    const fetchSites = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('websites').select('id, domain, brand_name').eq('user_id', user.id);
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
      a.download = `Sightura-report-${websiteId}.pdf`;
      a.click();
    } catch { alert('Failed to generate report'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Download Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate branded PDF reports for your websites.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 max-w-xl w-full shadow-sm">
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
              <Globe size={16} className="text-emerald-500" />
              Website
            </label>
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
            >
              <option value="">Select a site</option>
              {sites.map((site: any) => (
                <option key={site.id} value={site.id}>
                  {site.brand_name || site.domain} ({site.domain})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
                <Calendar size={16} className="text-emerald-500" />
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
                <Calendar size={16} className="text-emerald-500" />
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
              />
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={loading || !websiteId || !dateFrom || !dateTo}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all"
          >
            {loading ? <LoadingSpinner size={18} /> : <Download size={18} />}
            {loading ? 'Generating...' : 'Generate PDF Report'}
          </button>
        </div>
      </div>
    </div>
  );
}