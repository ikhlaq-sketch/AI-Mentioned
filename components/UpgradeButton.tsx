'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowUpCircle, Sparkles } from 'lucide-react';

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?redirect=upgrade'); return; }
      router.push('/?pricing=true#pricing');
    } catch { alert('Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <button onClick={handleUpgrade} disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 disabled:opacity-50">
      <Sparkles size={16} />
      {loading ? 'Loading...' : 'Upgrade Plan'}
    </button>
  );
}