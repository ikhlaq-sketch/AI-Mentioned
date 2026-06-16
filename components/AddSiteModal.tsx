'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { X, Plus, Trash2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function AddSiteModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [competitors, setCompetitors] = useState<
    { domain: string; brand_name: string }[]
  >([]);
  const [scanMode, setScanMode] = useState<'auto' | 'manual'>('auto');

  const addCompetitor = () => {
    setCompetitors([...competitors, { domain: '', brand_name: '' }]);
  };

  const removeCompetitor = (i: number) => {
    setCompetitors(competitors.filter((_, idx) => idx !== i));
  };

  const updateCompetitor = (
    i: number,
    field: 'domain' | 'brand_name',
    value: string
  ) => {
    const updated = [...competitors];
    updated[i][field] = value;
    setCompetitors(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('sites_limit')
        .eq('id', user.id)
        .single();

      const { count } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count ?? 0) >= (profile?.sites_limit ?? 0)) {
        throw new Error(
          'You have reached your site limit. Please upgrade your plan.'
        );
      }

      const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const { data: site, error: siteErr } = await supabase
        .from('websites')
        .insert({
          user_id: user.id,
          domain,
          brand_name: brandName,
          category,
          scan_mode: scanMode,
        })
        .select()
        .single();

      if (siteErr) throw siteErr;

      // Save valid competitors only
      if (competitors.length > 0) {
        const validCompetitors = competitors.filter(
          (c) => c.domain.trim() !== ''
        );
        if (validCompetitors.length > 0) {
          await supabase.from('competitors').insert(
            validCompetitors.map((c) => ({
              website_id: site.id,
              user_id: user.id,
              domain: c.domain,
              brand_name: c.brand_name,
            }))
          );
        }
      }

      // Fire-and-forget background jobs (no await so modal closes instantly)
      fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_id: site.id }),
      });
      fetch('/api/audit/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_id: site.id }),
      });

      setOpen(false);
      router.refresh();
      router.push(`/sites/${site.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-500"
      >
        + Add New Site
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] w-full max-w-md p-6 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-[#94a3b8] hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold text-white mb-4">Add New Site</h2>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#94a3b8]">Website URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#94a3b8]">Brand Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="My Company"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#94a3b8]">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. CRM Software, Dental Services"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1"
                  />
                </div>
                <button
                  disabled={!url || !brandName || !category}
                  onClick={() => setStep(2)}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-[#94a3b8]">
                  Add competitors to track their AI visibility (optional)
                </p>
                {competitors.map((comp, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={comp.domain}
                        onChange={(e) =>
                          updateCompetitor(idx, 'domain', e.target.value)
                        }
                        placeholder="competitor.com"
                        className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white"
                      />
                      <input
                        type="text"
                        value={comp.brand_name}
                        onChange={(e) =>
                          updateCompetitor(idx, 'brand_name', e.target.value)
                        }
                        placeholder="Brand name"
                        className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1"
                      />
                    </div>
                    <button
                      onClick={() => removeCompetitor(idx)}
                      className="text-red-400 hover:text-red-300 mt-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCompetitor}
                  className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                >
                  <Plus size={14} /> Add Competitor
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-[#334155] text-white py-2 rounded-lg hover:bg-[#475569]"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-[#94a3b8]">Choose scan mode</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setScanMode('auto')}
                    className={`p-3 rounded-lg border ${
                      scanMode === 'auto'
                        ? 'border-indigo-400 bg-indigo-400/10'
                        : 'border-[#334155] bg-[#0f172a]'
                    } text-left`}
                  >
                    <p className="text-white font-medium">Auto</p>
                    <p className="text-xs text-[#94a3b8] mt-1">
                      Daily scans + weekly audits. Hands‑off.
                    </p>
                  </button>
                  <button
                    onClick={() => setScanMode('manual')}
                    className={`p-3 rounded-lg border ${
                      scanMode === 'manual'
                        ? 'border-indigo-400 bg-indigo-400/10'
                        : 'border-[#334155] bg-[#0f172a]'
                    } text-left`}
                  >
                    <p className="text-white font-medium">Manual</p>
                    <p className="text-xs text-[#94a3b8] mt-1">
                      Weekly audits only. You trigger extra scans.
                    </p>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-[#334155] text-white py-2 rounded-lg hover:bg-[#475569]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50 flex justify-center items-center"
                  >
                    {loading ? <LoadingSpinner size={20} /> : 'Start Monitoring'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}