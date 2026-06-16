'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) setMsg(error.message);
    else setMsg('Password reset link sent. Check your email.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-white mb-4">Reset Password</h2>
        {msg && <p className="text-sm text-[#94a3b8] mb-3">{msg}</p>}
        <form onSubmit={handleReset}>
          <label className="text-sm text-[#94a3b8]">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1 mb-4" />
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg text-white flex justify-center">
            {loading ? <LoadingSpinner size={18} /> : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}