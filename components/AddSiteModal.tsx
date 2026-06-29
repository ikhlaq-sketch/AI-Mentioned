'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { X, Plus, Trash2, Globe, Zap, ChevronRight, ChevronLeft, Sparkles, Shield, Loader2 } from 'lucide-react';

export default function AddSiteModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditMessage, setAuditMessage] = useState('');
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [competitors, setCompetitors] = useState<{ domain: string; brand_name: string }[]>([]);
  const [scanMode, setScanMode] = useState<'auto' | 'manual'>('auto');

  const addCompetitor = () => setCompetitors([...competitors, { domain: '', brand_name: '' }]);
  const removeCompetitor = (i: number) => setCompetitors(competitors.filter((_, idx) => idx !== i));
  const updateCompetitor = (i: number, field: 'domain' | 'brand_name', value: string) => {
    const updated = [...competitors];
    updated[i][field] = value;
    setCompetitors(updated);
  };

  const pollAuditStatus = async (siteId: string, maxAttempts = 20) => {
    for (let i = 0; i < maxAttempts; i++) {
      const progress = Math.min(Math.round((i / maxAttempts) * 100), 92);
      setAuditProgress(progress);

      if (progress < 20) setAuditMessage('Crawling website data...');
      else if (progress < 45) setAuditMessage('Generating AI prompts...');
      else if (progress < 70) setAuditMessage('Querying ChatGPT, Gemini & Claude...');
      else if (progress < 88) setAuditMessage('Calculating visibility score...');
      else setAuditMessage('Generating recommendations...');

      try {
        const supabase = createClient();
        const { data } = await supabase.from('websites').select('last_audit_at, visibility_score').eq('id', siteId).single();
        if (data?.last_audit_at) {
          setAuditProgress(100);
          setAuditMessage('Analysis complete! Redirecting...');
          await new Promise(r => setTimeout(r, 1000));
          return true;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 2000));
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase.from('profiles').select('sites_limit').eq('id', user.id).single();
      const { count } = await supabase.from('websites').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

      if ((count ?? 0) >= (profile?.sites_limit ?? 0)) {
        throw new Error('You have reached your site limit. Please upgrade your plan.');
      }

      const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const { data: site, error: siteErr } = await supabase.from('websites').insert({
        user_id: user.id, domain, brand_name: brandName, category, scan_mode: scanMode,
      }).select().single();

      if (siteErr) throw siteErr;

      if (competitors.length > 0) {
        const validCompetitors = competitors.filter(c => c.domain.trim() !== '');
        if (validCompetitors.length > 0) {
          await supabase.from('competitors').insert(validCompetitors.map(c => ({
            website_id: site.id, user_id: user.id, domain: c.domain, brand_name: c.brand_name,
          })));
        }
      }

      // Fire background jobs
      fetch('/api/crawl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website_id: site.id }) });
      fetch('/api/audit/baseline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website_id: site.id }) });

      // Show progress and poll
      setAuditProgress(3);
      setAuditMessage('Starting analysis...');
      await pollAuditStatus(site.id);

      setOpen(false);
      router.refresh();
      router.push(`/sites/${site.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setAuditProgress(0);
      setAuditMessage('');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Website' },
    { num: 2, label: 'Competitors' },
    { num: 3, label: 'Scan Mode' },
  ];

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-200 flex items-center gap-2">
        <Plus size={16} /> Add New Site
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg p-0 relative overflow-hidden">
            <button onClick={() => { if (!loading && auditProgress === 0) setOpen(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
              <X size={20} />
            </button>

            {auditProgress > 0 ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {auditProgress === 100 ? (
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {auditProgress === 100 ? 'Analysis Complete!' : 'Setting Up Your Site'}
                </h2>
                <p className="text-sm text-gray-500 mb-6">{auditMessage}</p>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${auditProgress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
                    style={{ width: `${auditProgress}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-emerald-600">{auditProgress}%</p>
                <p className="text-xs text-gray-400 mt-4">
                  {auditProgress < 100 ? 'This usually takes 15-30 seconds' : 'Taking you to your dashboard...'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 pt-6 pb-4 px-6 bg-gray-50 border-b border-gray-100">
                  {steps.map((s, i) => (
                    <div key={s.num} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= s.num ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {step > s.num ? '✓' : s.num}
                      </div>
                      <span className={`text-sm font-medium ${step >= s.num ? 'text-emerald-600' : 'text-gray-400'}`}>{s.label}</span>
                      {i < 2 && <div className={`w-8 h-0.5 ${step > s.num ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Add New Website</h2>
                  <p className="text-sm text-gray-500 mb-6">Monitor your brand's AI visibility in 60 seconds.</p>

                  {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>}

                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Website URL</label>
                        <div className="relative mt-1">
                          <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Brand Name</label>
                        <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="My Company" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mt-1 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. CRM Software, Dental Services" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mt-1 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                      </div>
                      <button disabled={!url || !brandName || !category} onClick={() => setStep(2)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        Continue <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Add competitors to track their AI visibility <span className="text-gray-400">(optional)</span></p>
                      {competitors.map((comp, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <div className="flex-1 space-y-2">
                            <input type="text" value={comp.domain} onChange={(e) => updateCompetitor(idx, 'domain', e.target.value)} placeholder="competitor.com" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-emerald-400" />
                            <input type="text" value={comp.brand_name} onChange={(e) => updateCompetitor(idx, 'brand_name', e.target.value)} placeholder="Brand name" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-emerald-400" />
                          </div>
                          <button onClick={() => removeCompetitor(idx)} className="text-gray-400 hover:text-red-500 mt-1"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={addCompetitor} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"><Plus size={14} /> Add Competitor</button>
                      <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <button onClick={() => setStep(3)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">Continue <ChevronRight size={16} /></button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 mb-3">Choose how you want to monitor this site</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setScanMode('auto')} className={`p-4 rounded-xl border-2 text-left transition-all ${scanMode === 'auto' ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <Zap size={20} className={scanMode === 'auto' ? 'text-emerald-600' : 'text-gray-400'} />
                          <p className="font-semibold text-gray-900 mt-2">Auto</p>
                          <p className="text-xs text-gray-500 mt-1">Daily scans + weekly audits. Hands‑off.</p>
                        </button>
                        <button onClick={() => setScanMode('manual')} className={`p-4 rounded-xl border-2 text-left transition-all ${scanMode === 'manual' ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <Shield size={20} className={scanMode === 'manual' ? 'text-emerald-600' : 'text-gray-400'} />
                          <p className="font-semibold text-gray-900 mt-2">Manual</p>
                          <p className="text-xs text-gray-500 mt-1">Weekly audits only. You trigger extra scans.</p>
                        </button>
                      </div>
                      <button onClick={handleSubmit} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex justify-center items-center gap-2">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={16} />} Start Monitoring
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}