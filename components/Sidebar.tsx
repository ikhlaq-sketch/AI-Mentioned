'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient, signOut } from '@/lib/supabase/client';
import { Home, Globe, Search, Lightbulb, FileText, Settings, LogOut, ArrowUpCircle } from 'lucide-react';
import QueryProgressBar from './QueryProgressBar';
import Link from 'next/link';

export default function Sidebar() {
  const [profile, setProfile] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    // Poll every 10 seconds to keep query count updated
    const interval = setInterval(fetchProfile, 10000);
    return () => clearInterval(interval);
  }, [fetchProfile]);

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/sites', icon: Globe, label: 'My Sites' },
    { href: '/audits', icon: Search, label: 'Audit History' },
    { href: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
    { href: '/reports', icon: FileText, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isFreePlan = profile?.plan === 'free';

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-30">
      <Link href="/dashboard" className="p-5 border-b border-gray-100">
        <span className="text-2xl font-bold tracking-tight text-emerald-600">Sightura</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <item.icon size={18} /> {item.label}
            </Link>
          );
        })}
      </nav>

      {profile && (
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${isFreePlan ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>{profile.plan}</span>
            {isFreePlan && <Link href="/?pricing=true#pricing" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"><ArrowUpCircle size={12} />Upgrade</Link>}
          </div>
          <QueryProgressBar used={profile.queries_used} limit={profile.queries_limit} />
          <div className="flex items-center gap-2 pt-1">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">{profile.full_name?.[0] || profile.email?.[0]?.toUpperCase() || 'U'}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{profile.full_name || 'User'}</p><p className="text-xs text-gray-400 truncate">{profile.email}</p></div>
          </div>
          <button onClick={() => signOut()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 w-full transition-colors pt-1"><LogOut size={16} />Sign Out</button>
        </div>
      )}
    </aside>
  );
}