'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FileText, Calendar, Globe, Download, Lock } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const [websiteId, setWebsiteId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // Fetch sites
        const { data: sitesData } = await supabase
          .from('websites')
          .select('id, domain, brand_name')
          .eq('user_id', user.id);
        setSites(sitesData || []);
      }
      setLoadingProfile(false);
    };
    fetchData();
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
      
      if (res.status === 403) {
        const data = await res.json();
        alert(data.error || 'Upgrade required to access reports.');
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sightura-report-${websiteId}.pdf`;
      a.click();
    } catch { alert('Failed to generate report'); }
    finally { setLoading(false); }
  };

  // Show loading state while fetching profile
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  const isFreePlan = profile?.plan === 'free' || !profile?.plan;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Download Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate branded PDF reports for your websites.
          </p>
        </div>
      </div>

      {/* Locked UI for Free Users */}
      {isFreePlan ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm max-w-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Upgrade to Access Reports</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Generate branded PDF reports with full audit history, AI visibility scores, and actionable recommendations.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/?pricing=true#pricing"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-emerald-200"
            >
              Upgrade Plan
            </Link>
            <span className="text-xs text-gray-400">✓ No credit card required</span>
          </div>
        </div>
      ) : (
        /* Form Card (Paid Users) */
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

            <p className="text-xs text-gray-400 text-center">
              Reports include audit history, visibility score, and top recommendations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}