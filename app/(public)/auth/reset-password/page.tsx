'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArrowRight, Mail, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ornaments */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-100/40 rounded-full blur-3xl opacity-50" />
      <div className="absolute top-40 right-10 w-48 h-48 bg-green-100/30 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-emerald-600 inline-block mb-4">
            AIMentioned
          </Link>
          <h2 className="text-3xl font-bold text-[#0f172a]">Reset Password</h2>
          <p className="text-gray-500 mt-2">Enter your email to receive a reset link</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl shadow-gray-100">
          {msg ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-600" size={32} />
              </div>
              <p className="text-[#0f172a] font-medium mb-4">{msg}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition"
              >
                Back to Sign In <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset}>
              <label className="text-sm font-semibold text-[#0f172a]">Email</label>
              <div className="relative mt-1 mb-4">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[#0f172a] focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl text-white font-semibold flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
              >
                {loading ? <LoadingSpinner size={18} /> : 'Send Reset Link'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {!msg && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Remember your password?{' '}
              <Link href="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}