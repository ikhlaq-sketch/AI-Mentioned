'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowUpCircle } from 'lucide-react';

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=upgrade');
        return;
      }

      // Redirect to pricing section on landing page
      router.push('/?pricing=true#pricing');
    } catch (err) {
      alert('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-400/30 text-purple-300 rounded-full text-sm font-medium hover:bg-purple-600/30 hover:border-purple-400/50 transition-all hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50"
    >
      <ArrowUpCircle size={16} />
      {loading ? 'Loading...' : 'Upgrade Plan'}
    </button>
  );
}