'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { User, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data }) => {
          setProfile(data);
          setName(data.full_name || '');
        });
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
    setMsg('Profile updated successfully!');
    setTimeout(() => setMsg(''), 3000);
    setSaving(false);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/billing/checkout/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback: redirect to pricing
        window.location.href = '/?pricing=true#pricing';
      }
    } catch {
      window.location.href = '/?pricing=true#pricing';
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setPortalLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ variant_id: '1796870' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = '/?pricing=true#pricing';
      }
    } catch {
      window.location.href = '/?pricing=true#pricing';
    } finally {
      setPortalLoading(false);
    }
  };

  if (!profile) return <LoadingSpinner />;

  const isFreePlan = !profile.plan || profile.plan.toLowerCase() === 'free';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and billing.</p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 space-y-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-xl">
          {activeTab === 'profile' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mt-1 focus:outline-none focus:border-emerald-400 transition-all" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <input type="email" value={profile.email} readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-400 mt-1 cursor-not-allowed" />
                </div>
                <button onClick={handleSaveProfile} disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
                  {saving && <LoadingSpinner size={14} />} Save Changes
                </button>
                {msg && <p className="text-emerald-600 text-sm font-medium">{msg}</p>}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Billing & Plan</h2>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Current Plan</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${isFreePlan ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>{profile.plan || 'free'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Queries Used</span>
                  <span className="text-sm font-semibold text-gray-900">{profile.queries_used || 0} / {profile.queries_limit || 100}</span>
                </div>
              </div>
              {isFreePlan ? (
                <button onClick={handleUpgrade} disabled={portalLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all">
                  {portalLoading ? <LoadingSpinner size={16} /> : null} Upgrade Plan
                </button>
              ) : (
                <button onClick={handleManageSubscription} disabled={portalLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all">
                  {portalLoading ? <LoadingSpinner size={16} /> : null} Manage Subscription
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}