'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
          .then(({ data }) => {
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
    setMsg('Profile updated.');
    setSaving(false);
  };

  // Function for Paid Users (Opens Customer Portal)
  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/checkout/portal', { 
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Could not open billing portal.');
      }
    } catch (err) {
      alert('Something went wrong.');
    } finally {
      setPortalLoading(false);
    }
  };

  // Function for Free Users (Opens Payment Checkout)
  const handleUpgrade = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✅ FIX: Replaced '123456' with your actual Starter Variant ID
        body: JSON.stringify({ variant_id: '1796870' }) 
      });
      const data = await res.json();
      
      if (data.url) {
        // Redirects directly to the Lemon Squeezy hosted checkout page
        window.location.href = data.url; 
      } else {
        alert(data.error || 'Could not initiate checkout.');
      }
    } catch (err) {
      alert('Something went wrong.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (!profile) return <LoadingSpinner />;

  // Determine if the user is free or paid
  const isFreePlan = !profile.plan || profile.plan.toLowerCase() === 'free';

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      <div className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] max-w-xl space-y-6">
        
        {/* Profile Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-[#94a3b8]">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-[#94a3b8]">Email</label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-gray-500 mt-1 cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm flex items-center gap-2 text-white"
            >
              {saving && <LoadingSpinner size={14} />}
              Save
            </button>
            {msg && <p className="text-green-400 text-sm">{msg}</p>}
          </div>
        </div>

        {/* Billing Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Billing</h2>
          <p className="text-[#94a3b8]">
            Plan:{' '}
            <span className="text-indigo-400 capitalize">{profile.plan || 'free'}</span>
          </p>
          <p className="text-[#94a3b8]">
            Queries: {profile.queries_used || 0}/{profile.queries_limit || 100}
          </p>
          
          {/* Dynamically show the correct button based on their plan */}
          {isFreePlan ? (
            <button
              onClick={handleUpgrade}
              disabled={portalLoading}
              className="mt-3 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm flex items-center gap-2 text-white transition-colors"
            >
              {portalLoading && <LoadingSpinner size={14} />}
              Upgrade Plan
            </button>
          ) : (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="mt-3 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm flex items-center gap-2 text-white transition-colors"
            >
              {portalLoading && <LoadingSpinner size={14} />}
              Manage Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  );
}