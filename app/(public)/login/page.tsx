'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, signInWithGoogle } from '@/lib/supabase/client';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-white text-center">Welcome back</h2>
        <p className="text-[#94a3b8] text-sm text-center mb-6">Sign in to AIMentioned</p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-[#94a3b8]">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1" />
          </div>
          <div>
            <label className="text-sm text-[#94a3b8]">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1" />
            {/* Forgot password link */}
            <div className="text-right mt-1">
              <Link href="/auth/reset-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                Forgot password?
              </Link>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg text-white flex justify-center items-center">
            {loading ? <LoadingSpinner size={18} /> : 'Sign In'}
          </button>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-[#334155]"></div>
          <span className="px-3 text-[#64748b] text-sm">OR</span>
          <div className="flex-1 border-t border-[#334155]"></div>
        </div>
        <button onClick={signInWithGoogle}
          className="w-full border border-[#334155] hover:border-white py-2 rounded-lg text-white flex items-center justify-center gap-2">
          Continue with Google
        </button>
        <p className="text-center text-sm text-[#94a3b8] mt-4">
          Don't have an account? <Link href="/register" className="text-indigo-400">Sign up</Link>
        </p>
      </div>
    </div>
  );
}