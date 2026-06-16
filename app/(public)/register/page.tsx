'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, signInWithGoogle } from '@/lib/supabase/client';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) setError(error.message);
    else router.push('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-white text-center">Start Free Trial</h2>
        <p className="text-[#94a3b8] text-sm text-center mb-6">No credit card required</p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm text-[#94a3b8]">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1" />
          </div>
          <div>
            <label className="text-sm text-[#94a3b8]">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1" />
          </div>
          <div>
            <label className="text-sm text-[#94a3b8]">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white mt-1" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg text-white flex justify-center items-center">
            {loading ? <LoadingSpinner size={18} /> : 'Create Account'}
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
          Already have an account? <Link href="/login" className="text-indigo-400">Sign in</Link>
        </p>
      </div>
    </div>
  );
}