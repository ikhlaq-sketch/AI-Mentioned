'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTypewriter } from '@/hooks/useTypewriter';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, BarChart3, Globe, CheckCircle } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

const plans = [
  {
    name: 'Starter',
    price: '$49',
    variantId: '1796870',
    sites: 1,
    queries: 100,
    features: [
      '1 website monitoring',
      '100 AI queries/month',
      'Hard cap – no overage fees',
      'Auto or Manual scan mode',
      '2 competitor tracking',
      '3 AI models (Gemini Flash, GPT‑4o‑mini, Claude Haiku)',
      'GitHub integration',
      'Copy‑paste schema fixes',
      '6 months history',
      'Email alerts',
    ],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$99',
    variantId: '1796861',
    sites: 5,
    queries: 500,
    features: [
      '5 website monitoring',
      '500 AI queries/month',
      '$0.05/query overage',
      'Auto or Manual per site',
      'Unlimited competitors',
      '3 AI models (Gemini Flash, GPT‑4o‑mini, Claude Haiku)',
      'GitHub integration',
      'Agency dashboard',
      'White‑label client reports',
      'Team members',
      'Email alerts',
    ],
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '$199',
    variantId: '1796866',
    sites: 10,
    queries: 1000,
    features: [
      '10 website monitoring',
      '1,000 AI queries/month',
      '$0.05/query overage',
      'Priority processing queue',
      'Auto or Manual per site',
      'Unlimited competitors',
      '4 AI models (adds Perplexity Sonar)',
      'GitHub integration',
      'API access',
      'White‑label reports',
      'Advanced competitor intelligence',
      'Email alerts',
    ],
    highlighted: false,
  },
  {
    name: 'Agency Pro',
    price: '$379',
    variantId: '1796868',
    sites: 20,
    queries: 2000,
    features: [
      '20 website monitoring',
      '2,000 AI queries/month',
      '$0.05/query overage',
      'Fastest processing queue',
      'Auto or Manual per site',
      'Unlimited competitors',
      '4 AI models (adds Perplexity Sonar)',
      'Multiple GitHub repos (one per site)',
      'Team permissions & role‑based access',
      'Premium support',
      'Enterprise integrations',
      'Email alerts',
    ],
    highlighted: false,
  },
];

export default function LandingPage() {
  const headline = 'Get Mentioned in AI Answers. Automatically.';
  const typed = useTypewriter(headline, 40, 200);
  const [user, setUser] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleCheckout = async (variantId: string) => {
  if (!user) {
    router.push('/login?redirect=pricing');
    return;
  }

  setLoadingPlan(variantId);
  try {
    // Get the current session token
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert('Session expired. Please log in again.');
      router.push('/login?redirect=pricing');
      return;
    }

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ variant_id: variantId }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Checkout failed. Please try again.');
    }
  } catch (err) {
    alert('Something went wrong. Please try again.');
  } finally {
    setLoadingPlan(null);
  }
};

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
          <span className="text-2xl font-bold tracking-tight text-gradient">
            AIMentioned
          </span>
          <div className="flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hidden md:block text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-purple-600 hover:bg-purple-500 px-5 py-2.5 rounded-full text-white transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute top-40 right-0 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 min-h-[4rem] leading-tight">
            <span className="text-gradient">{typed}</span>
            <span className="animate-cursor text-purple-300">|</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            Track how AI chatbots mention your brand. See why competitors rank above you. Get fixes deployed automatically.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-full text-lg font-semibold transition-all hover:glow-strong"
            >
              Start Free Trial
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 border border-white/10 hover:border-white/30 px-8 py-4 rounded-full text-lg font-medium transition-all backdrop-blur-sm"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          The <span className="text-gradient">AI Search Blind Spot</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-8 h-8 text-purple-400" />,
              stat: '40%',
              text: 'of searches now happen on AI platforms and bypass Google entirely.',
            },
            {
              icon: <Shield className="w-8 h-8 text-purple-400" />,
              stat: '89%',
              text: 'of your competitors are already optimizing for AI visibility.',
            },
            {
              icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
              stat: '0%',
              text: 'of businesses know if AI recommends them or their competitors.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="mb-4">{item.icon}</div>
              <p className="text-4xl font-bold text-white mb-2">{item.stat}</p>
              <p className="text-gray-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          From invisible to <span className="text-gradient">recommended</span> in 4 steps
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Connect', desc: '60‑second website setup' },
            { step: '2', title: 'Scan', desc: 'AI scans ChatGPT, Gemini, Claude, Perplexity' },
            { step: '3', title: 'Analyse', desc: 'Visibility score & competitor gaps' },
            { step: '4', title: 'Fix', desc: 'Code fixes deployed via GitHub PR' },
          ].map((item) => (
            <div
              key={item.step}
              className="text-center group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-2xl font-bold text-purple-400 group-hover:glow-strong">
                {item.step}
              </div>
              <h3 className="text-white font-semibold text-lg">{item.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Why <span className="text-gradient">AIMentioned</span>?
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-900/30">
                <th className="text-left p-4 text-gray-300">Feature</th>
                <th className="p-4 text-purple-300 font-semibold">AIMentioned</th>
                <th className="p-4 text-gray-500">OtterlyAI</th>
                <th className="p-4 text-gray-500">Peec AI</th>
                <th className="p-4 text-gray-500">Scrunch</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['AI Monitoring', '✅', '✅', '✅', '✅'],
                ['Fix Recommendations', '✅', 'Partial', '❌', '✅'],
                ['Copy‑Paste Fixes', '✅', '❌', '❌', '✅'],
                ['GitHub PR Auto‑Fix', '✅', '❌', '❌', '❌'],
                ['Price (100 queries)', '$49', '$189+', '$89+', '$250+'],
                ['5‑brand agency', '$99', '$945+', '$445+', '$500+'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition">
                  <td className="p-4 text-gray-300">{row[0]}</td>
                  <td className="p-4 text-center text-purple-400 font-medium">{row[1]}</td>
                  <td className="p-4 text-center text-gray-500">{row[2]}</td>
                  <td className="p-4 text-center text-gray-500">{row[3]}</td>
                  <td className="p-4 text-center text-gray-500">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
          Simple, <span className="text-gradient">profitable</span> pricing
        </h2>
        <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
          All plans include AI monitoring, fix recommendations, and GitHub integration. Start free, upgrade when you're ready.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white/5 border backdrop-blur-sm rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                plan.highlighted ? 'border-purple-400/50 glow' : 'border-white/10 hover:border-white/20'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {plan.sites} site{plan.sites > 1 ? 's' : ''} · {plan.queries.toLocaleString()} queries
              </p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(plan.variantId)}
                disabled={loadingPlan === plan.variantId}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlighted
                    ? 'bg-purple-600 hover:bg-purple-500 text-white glow'
                    : 'border border-white/10 hover:border-white/30 text-white'
                } ${loadingPlan === plan.variantId ? 'opacity-50 cursor-wait' : ''}`}
              >
                {loadingPlan === plan.variantId ? 'Redirecting...' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Frequently Asked <span className="text-gradient">Questions</span>
        </h2>
        <div className="space-y-4">
          {[
            { q: 'What is GEO and AEO?', a: 'Generative Engine Optimization and Answer Engine Optimization are techniques to improve how AI models reference your brand.' },
            { q: 'Which AI models do you monitor?', a: 'ChatGPT, Gemini, Claude, and Perplexity (plus more on higher plans).' },
            { q: 'What counts as a query?', a: 'Every time we ask an AI model a question about your brand or competitors counts as one query.' },
            { q: 'Can I switch between Auto and Manual mode?', a: 'Yes, you can change the scan mode per website at any time.' },
            { q: 'How does GitHub integration work?', a: 'Connect your repository via OAuth, and we create Pull Requests with schema/code fixes.' },
            { q: 'What happens when I reach my query limit?', a: 'On Starter, scanning stops until your reset date. On paid plans, you can use overage at $0.05/query.' },
            { q: 'How long until my visibility score improves?', a: 'Most users see improvements within 2–4 weeks after implementing our fix recommendations.' },
            { q: 'Do you offer refunds?', a: 'Yes, we offer a 14‑day money‑back guarantee on all paid plans.' },
          ].map((item, i) => (
            <details key={i} className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-400/30 transition-colors backdrop-blur-sm">
              <summary className="cursor-pointer text-white font-medium list-none flex justify-between items-center">
                {item.q}
                <span className="text-purple-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-400 mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-500">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="mailto:support@aimentioned.com" className="hover:text-white transition">Contact</Link>
        </div>
        <p>© {new Date().getFullYear()} AIMentioned. All rights reserved.</p>
      </footer>
    </div>
  );
}