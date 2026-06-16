'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient, signOut } from '@/lib/supabase/client';
import {
  Home,
  Globe,
  Search,
  Lightbulb,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import QueryProgressBar from './QueryProgressBar';

export default function Sidebar() {
  const [profile, setProfile] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
          .then(({ data }) => setProfile(data));
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
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f172a] border-r border-[#1e293b] flex flex-col z-30">
      <div className="p-4 text-2xl font-bold text-indigo-400">AIMentioned</div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#1e293b] text-indigo-400'
                  : 'text-[#64748b] hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </a>
          );
        })}
      </nav>

      {profile && (
        <div className="p-4 border-t border-[#1e293b] space-y-3">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-500/10 text-indigo-400 rounded-full capitalize">
            {profile.plan}
          </span>
          <QueryProgressBar
            used={profile.queries_used}
            limit={profile.queries_limit}
          />
          <p className="text-xs text-[#94a3b8] truncate">{profile.email}</p>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 w-full"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}