'use client';
import { useTypewriter } from '@/hooks/useTypewriter';
import Link from 'next/link';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export default function LandingPage() {
  const headline = 'Get Mentioned in AI Answers. Automatically.';
  const typed = useTypewriter(headline, 40, 200);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 md:px-8 border-b border-[#1e293b] sticky top-0 bg-[#0f172a]/80 backdrop-blur z-50">
        <span className="text-2xl font-bold tracking-tight text-indigo-400">
          AIMentioned
        </span>
        <div className="flex items-center gap-4 text-sm">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hidden sm:block text-[#94a3b8] hover:text-white transition"
            >
              {link.label}
            </a>
          ))}
          <Link href="/login" className="text-[#94a3b8] hover:text-white transition">
            Log in
          </Link>
          <Link
            href="/register"
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition"
          >
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 min-h-[4rem]">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {typed}
          </span>
          <span className="animate-pulse text-indigo-300">|</span>
        </h1>
        <p className="text-lg md:text-xl text-[#94a3b8] max-w-3xl mx-auto mb-8">
          Track how ChatGPT, Gemini, Claude, and Perplexity mention your brand.
          Understand why competitors appear instead of you. Get exact fixes deployed automatically through GitHub.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/register"
            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg font-medium transition"
          >
            Start Free Trial
          </Link>
          <a
            href="#features"
            className="border border-[#334155] hover:border-white px-8 py-3 rounded-lg transition"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* Problem Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">The AI Search Blind Spot</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            '40% of searches now happen on AI platforms and bypass Google entirely.',
            'Your competitors are already optimizing for AI visibility. Are you?',
            'Most businesses have no idea if AI recommends them or their competitors.',
          ].map((text, i) => (
            <div
              key={i}
              className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] hover:border-indigo-400 transition"
            >
              <p className="text-[#94a3b8]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">From invisible to recommended in 4 steps</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Connect', desc: '60‑second website setup' },
            { step: '2', title: 'Scan', desc: 'AI scans ChatGPT, Gemini, Claude, Perplexity' },
            { step: '3', title: 'Analyse', desc: 'Visibility score & competitor gaps' },
            { step: '4', title: 'Fix', desc: 'Code fixes deployed via GitHub PR' },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] text-center hover:border-indigo-400 transition"
            >
              <div className="text-3xl font-bold text-indigo-400 mb-2">{item.step}</div>
              <h3 className="text-white font-semibold">{item.title}</h3>
              <p className="text-[#94a3b8] text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Competitor comparison table */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Why AIMentioned?</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-[#1e293b] rounded-xl overflow-hidden border border-[#334155]">
            <thead>
              <tr className="bg-[#0f172a]">
                <th className="text-left p-4 text-[#94a3b8]">Feature</th>
                <th className="p-4 text-indigo-400">AIMentioned</th>
                <th className="p-4 text-[#94a3b8]">OtterlyAI</th>
                <th className="p-4 text-[#94a3b8]">Peec AI</th>
                <th className="p-4 text-[#94a3b8]">Scrunch</th>
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
                <tr key={i} className="border-t border-[#334155]">
                  <td className="p-4 text-[#94a3b8]">{row[0]}</td>
                  <td className="p-4 text-center">{row[1]}</td>
                  <td className="p-4 text-center text-[#94a3b8]">{row[2]}</td>
                  <td className="p-4 text-center text-[#94a3b8]">{row[3]}</td>
                  <td className="p-4 text-center text-[#94a3b8]">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Simple, profitable pricing</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { name: 'Starter', price: '$49', sites: 1, queries: 100, features: '3 LLMs, GitHub' },
            { name: 'Growth', price: '$99', sites: 5, queries: 500, features: 'Unlimited competitors, team', popular: true },
            { name: 'Scale', price: '$199', sites: 10, queries: 1000, features: '4 LLMs, API access' },
            { name: 'Agency Pro', price: '$379', sites: 20, queries: 2000, features: 'Multi‑repo, premium support' },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`bg-[#1e293b] p-6 rounded-xl border border-[#334155] flex flex-col ${
                plan.popular ? 'ring-2 ring-indigo-400' : ''
              } hover:scale-[1.02] transition-transform`}
            >
              {plan.popular && (
                <span className="bg-indigo-600 text-xs px-2 py-0.5 rounded-full self-start mb-2">Most Popular</span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-3xl font-bold mt-2">{plan.price}<span className="text-base font-normal text-[#94a3b8]">/mo</span></p>
              <p className="text-sm text-[#94a3b8] mt-2">{plan.sites} site{plan.sites > 1 ? 's' : ''} · {plan.queries} queries</p>
              <p className="text-sm text-[#94a3b8] mt-1">{plan.features}</p>
              <Link
                href="/register"
                className="mt-auto bg-indigo-600 hover:bg-indigo-500 text-center py-2 rounded-lg mt-4 transition"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'What is GEO and AEO?', a: 'Generative Engine Optimization and Answer Engine Optimization are techniques to improve how AI models reference your brand.' },
            { q: 'Which AI models do you monitor?', a: 'ChatGPT, Gemini, Claude, and Perplexity (plus more on higher plans).' },
            { q: 'What counts as a query?', a: 'Every time we ask an AI model a question about your brand or competitors counts as one query.' },
            { q: 'Can I switch between Auto and Manual mode?', a: 'Yes, you can change the scan mode per website at any time.' },
            { q: 'How does GitHub integration work?', a: 'Connect your repository via OAuth, and we create Pull Requests with schema/code fixes.' },
            { q: 'What happens when I reach my query limit?', a: 'On Starter, scanning stops until your reset date. On paid plans, you can use overage at $0.05/query.' },
          ].map((item, i) => (
            <details key={i} className="bg-[#1e293b] p-4 rounded-xl border border-[#334155] group">
              <summary className="cursor-pointer text-white font-medium">{item.q}</summary>
              <p className="text-[#94a3b8] mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e293b] py-8 text-center text-sm text-[#64748b]">
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