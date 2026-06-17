'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient, signOut } from '@/lib/supabase/client';
import { Home, Globe, Search, Lightbulb, FileText, Settings, LogOut } from 'lucide-react';
import QueryProgressBar from './QueryProgressBar';

export default function Sidebar() {
  const [profile, setProfile] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/sites', icon: Globe, label: 'My Sites' },
    { href: '/audits', icon: Search, label: 'Audit History' },
    { href: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
    { href: '/reports', icon: FileText, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-black border-r border-white/5 flex flex-col z-30 backdrop-blur-xl">
      <div className="p-5 text-2xl font-bold tracking-tight text-gradient">
        AIMentioned
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 shadow-[0_0_10px_rgba(139,92,246,0.15)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </a>
          );
        })}
      </nav>

      {profile && (
        <div className="p-4 border-t border-white/5 space-y-3">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-600/20 text-purple-300 rounded-full capitalize">
            {profile.plan}
          </span>
          <QueryProgressBar used={profile.queries_used} limit={profile.queries_limit} />
          <p className="text-xs text-gray-500 truncate">{profile.email}</p>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 w-full transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}