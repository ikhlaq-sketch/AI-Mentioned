'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTypewriter } from '@/hooks/useTypewriter';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, BarChart3, Globe, CheckCircle, TrendingUp, Users, Lock, Sparkles } from 'lucide-react';

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

const llmModels = ['ChatGPT', 'Gemini', 'Claude', 'Perplexity'];

export default function LandingPage() {
  const [modelIndex, setModelIndex] = useState(0);
  const [displayedModel, setDisplayedModel] = useState('');
  const typedModel = useTypewriter(llmModels[modelIndex], 60, 0);
  const [user, setUser] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  // Cycle through LLM models
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setModelIndex((prev) => (prev + 1) % llmModels.length);
    }, 3000);
    return () => clearInterval(cycleInterval);
  }, []);

  useEffect(() => {
    setDisplayedModel(typedModel);
  }, [typedModel]);

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
    <div className="min-h-screen bg-white text-[#0f172a] selection:bg-emerald-100">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
          <span className="text-2xl font-bold tracking-tight text-emerald-600">
            AIMentioned
          </span>
          <div className="flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hidden md:block text-gray-500 hover:text-gray-900 transition-colors">
                {link.label}
              </a>
            ))}
            <Link href="/login" className="text-gray-500 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-full text-white transition-all shadow-lg shadow-emerald-200">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        {/* Background ornaments */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-100/50 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-60 h-60 bg-teal-50/40 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Sparkles size={16} />
            AI Search Visibility Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            <span className="text-[#0f172a]">Get Ranked #1 in</span>{' '}
            <span className="text-emerald-600 inline-block min-w-[200px]">
              {displayedModel}
              <span className="animate-pulse text-emerald-400">|</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track how AI chatbots mention your brand. See why competitors rank above you. Get exact fixes deployed automatically through GitHub.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="group inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-8 py-4 rounded-full text-lg font-semibold text-white transition-all shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300">
              Start Free Trial
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 border-2 border-gray-200 hover:border-emerald-300 px-8 py-4 rounded-full text-lg font-medium text-gray-600 hover:text-emerald-600 transition-all">
              See How It Works
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Users size={16} />
              Trusted by 500+ businesses
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} />
              98% visibility improvement
            </div>
            <div className="flex items-center gap-2">
              <Lock size={16} />
              Enterprise-grade security
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-[#0f172a]">
          The AI Search Blind Spot
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          Most businesses have no idea if AI recommends them. Their competitors are already optimizing.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Zap className="w-8 h-8 text-emerald-500" />, stat: '40%', text: 'of searches now happen on AI platforms and bypass Google entirely.' },
            { icon: <Shield className="w-8 h-8 text-emerald-500" />, stat: '89%', text: 'of your competitors are already optimizing for AI visibility.' },
            { icon: <BarChart3 className="w-8 h-8 text-emerald-500" />, stat: '0%', text: 'of businesses know if AI recommends them or their competitors.' },
          ].map((item, i) => (
            <div key={i} className="group bg-white border border-gray-100 rounded-2xl p-8 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">{item.icon}</div>
              <p className="text-4xl font-bold text-[#0f172a] mb-2">{item.stat}</p>
              <p className="text-gray-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#0f172a]">
            From invisible to recommended in 4 steps
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Connect', desc: '60‑second website setup' },
              { step: '2', title: 'Scan', desc: 'AI scans ChatGPT, Gemini, Claude, Perplexity' },
              { step: '3', title: 'Analyse', desc: 'Visibility score & competitor gaps' },
              { step: '4', title: 'Fix', desc: 'Code fixes deployed via GitHub PR' },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-2xl font-bold text-emerald-600 group-hover:shadow-lg group-hover:shadow-emerald-100 transition-all">
                  {item.step}
                </div>
                <h3 className="text-[#0f172a] font-semibold text-lg">{item.title}</h3>
                <p className="text-gray-500 text-sm mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#0f172a]">
          Why AIMentioned?
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-50">
                <th className="text-left p-4 text-gray-700 font-semibold">Feature</th>
                <th className="p-4 text-emerald-600 font-semibold">AIMentioned</th>
                <th className="p-4 text-gray-400">OtterlyAI</th>
                <th className="p-4 text-gray-400">Peec AI</th>
                <th className="p-4 text-gray-400">Scrunch</th>
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
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-700">{row[0]}</td>
                  <td className="p-4 text-center text-emerald-600 font-medium">{row[1]}</td>
                  <td className="p-4 text-center text-gray-400">{row[2]}</td>
                  <td className="p-4 text-center text-gray-400">{row[3]}</td>
                  <td className="p-4 text-center text-gray-400">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-[#0f172a]">
            Simple, profitable pricing
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            All plans include AI monitoring, fix recommendations, and GitHub integration. Start free, upgrade when you're ready.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative bg-white border rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.highlighted ? 'border-emerald-400 shadow-lg shadow-emerald-100 ring-2 ring-emerald-400' : 'border-gray-200 hover:border-emerald-200'}`}>
                {plan.highlighted && (
                  <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                )}
                <h3 className="text-xl font-bold text-[#0f172a]">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-4xl font-bold text-[#0f172a]">{plan.price}</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{plan.sites} site{plan.sites > 1 ? 's' : ''} · {plan.queries.toLocaleString()} queries</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleCheckout(plan.variantId)} disabled={loadingPlan === plan.variantId}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.highlighted ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200' : 'border-2 border-gray-200 hover:border-emerald-300 text-gray-700'} ${loadingPlan === plan.variantId ? 'opacity-50 cursor-wait' : ''}`}>
                  {loadingPlan === plan.variantId ? 'Redirecting...' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#0f172a]">
          Frequently Asked Questions
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
            <details key={i} className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald-200 transition-colors">
              <summary className="cursor-pointer text-[#0f172a] font-medium list-none flex justify-between items-center">
                {item.q}
                <span className="text-emerald-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-500 mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-emerald-600 mb-3">AIMentioned</h3>
              <p className="text-sm text-gray-500">AI Search Visibility Platform. Track, analyze, and improve your brand presence across ChatGPT, Gemini, Claude, and Perplexity.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Legal</h3>
              <div className="space-y-2 text-sm">
                <Link href="/privacy" className="block text-gray-500 hover:text-emerald-600 transition">Privacy Policy</Link>
                <Link href="/terms" className="block text-gray-500 hover:text-emerald-600 transition">Terms of Service</Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Contact</h3>
              <div className="space-y-2 text-sm">
                <a href="mailto:AK.Systems@gmail.com" className="block text-gray-500 hover:text-emerald-600 transition">AK.Systems@gmail.com</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} AIMentioned. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}