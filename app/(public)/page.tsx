'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTypewriter } from '@/hooks/useTypewriter';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, BarChart3, Globe, CheckCircle, TrendingUp, Users, Lock, Sparkles, Star, Target, Trophy, Quote } from 'lucide-react';
import Image from 'next/image'; // ✅ for professional profile pics

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

// ✅ Professional testimonial data – replace with real images later
const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director, TechFlow',
    image: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=059669&color=fff&size=96',
    quote: 'AIMentioned completely transformed how we think about SEO. Within 3 weeks of implementing their schema fixes, we saw a 40% increase in AI-driven traffic.',
    rating: 5,
  },
  {
    name: 'David Chen',
    role: 'CEO, GrowthBase',
    image: 'https://ui-avatars.com/api/?name=David+Chen&background=059669&color=fff&size=96',
    quote: 'The competitor gap analysis alone is worth the subscription. We discovered competitors were ranking above us in ChatGPT simply because they had FAQ schema. Fixed it in one click.',
    rating: 5,
  },
  {
    name: 'Maria Rodriguez',
    role: 'SEO Lead, AgencyPro',
    image: 'https://ui-avatars.com/api/?name=Maria+Rodriguez&background=059669&color=fff&size=96',
    quote: 'We manage 15 client websites. AIMentioned\'s multi-site dashboard and GitHub auto-deploy saved us hours of manual work every week.',
    rating: 5,
  },
];

const plans = [
  {
    name: 'Starter', price: '$49', variantId: '1796870', sites: 1, queries: 100,
    features: ['1 website monitoring','100 AI queries/month','Hard cap – no overage fees','Auto or Manual scan mode','2 competitor tracking','3 AI models (Gemini Flash, GPT‑4o‑mini, Claude Haiku)','GitHub integration','Copy‑paste schema fixes','6 months history','Email alerts'],
    highlighted: false,
  },
  {
    name: 'Growth', price: '$99', variantId: '1796861', sites: 5, queries: 500,
    features: ['5 website monitoring','500 AI queries/month','$0.05/query overage','Auto or Manual per site','Unlimited competitors','3 AI models (Gemini Flash, GPT‑4o‑mini, Claude Haiku)','GitHub integration','Agency dashboard','White‑label client reports','Team members','Email alerts'],
    highlighted: true,
  },
  {
    name: 'Scale', price: '$199', variantId: '1796866', sites: 10, queries: 1000,
    features: ['10 website monitoring','1,000 AI queries/month','$0.05/query overage','Priority processing queue','Auto or Manual per site','Unlimited competitors','4 AI models (adds Perplexity Sonar)','GitHub integration','API access','White‑label reports','Advanced competitor intelligence','Email alerts'],
    highlighted: false,
  },
  {
    name: 'Agency Pro', price: '$379', variantId: '1796868', sites: 20, queries: 2000,
    features: ['20 website monitoring','2,000 AI queries/month','$0.05/query overage','Fastest processing queue','Auto or Manual per site','Unlimited competitors','4 AI models (adds Perplexity Sonar)','Multiple GitHub repos (one per site)','Team permissions & role‑based access','Premium support','Enterprise integrations','Email alerts'],
    highlighted: false,
  },
];

// ✅ Updated: 5 AI platforms for the hero animation
const llmModels = ['ChatGPT', 'Gemini', 'Claude', 'Perplexity', 'Google AI Overviews'];

function useCountUp(end: number, duration: number = 2000, start: boolean = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);
  return count;
}

function useInView(ref: React.RefObject<HTMLElement>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

export default function LandingPage() {
  const [modelIndex, setModelIndex] = useState(0);
  const [displayedModel, setDisplayedModel] = useState('');
  const [fadeState, setFadeState] = useState('fade-in'); // ✅ smooth animation
  const typedModel = useTypewriter(llmModels[modelIndex], 70, 0);
  const [user, setUser] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  const featuresRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  const featuresInView = useInView(featuresRef);
  const whyInView = useInView(whyRef);
  const pricingInView = useInView(pricingRef);

  // ✅ Smooth typewriter cycle with fade effect
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setFadeState('fade-out');
      setTimeout(() => {
        setModelIndex((prev) => (prev + 1) % llmModels.length);
        setFadeState('fade-in');
      }, 300);
    }, 4000);
    return () => clearInterval(cycleInterval);
  }, []);

  useEffect(() => { setDisplayedModel(typedModel); }, [typedModel]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleCheckout = async (variantId: string) => {
    if (!user) { router.push('/login?redirect=pricing'); return; }
    setLoadingPlan(variantId);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { alert('Session expired.'); router.push('/login?redirect=pricing'); return; }
      const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ variant_id: variantId }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Checkout failed.');
    } catch { alert('Something went wrong.'); }
    finally { setLoadingPlan(null); }
  };

  const count40 = useCountUp(40, 2000, featuresInView);
  const count89 = useCountUp(89, 2000, featuresInView);

  return (
    <div className="min-h-screen bg-white text-[#0f172a] selection:bg-emerald-100">

      {/* ==================== NAVBAR ==================== */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
          <span className="text-2xl font-bold tracking-tight text-emerald-600">AIMentioned</span>
          <div className="flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hidden md:block text-gray-500 hover:text-gray-900 transition-colors">{link.label}</a>
            ))}
            <Link href="/login" className="text-gray-500 hover:text-gray-900 transition-colors">Log in</Link>
            <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-full text-white transition-all shadow-lg shadow-emerald-200">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-4 overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-emerald-100/40 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-60 h-60 bg-teal-50/40 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8 animate-float">
            <Sparkles size={16} /> AI Search Visibility Platform
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight tracking-tight px-2">
            <span className="text-[#0f172a]">Get Ranked #1 in</span>{' '}
            <span className={`text-emerald-600 inline-block min-w-[180px] md:min-w-[280px] text-left transition-opacity duration-300 ${fadeState === 'fade-in' ? 'opacity-100' : 'opacity-0'}`}>
              {displayedModel}
              <span className="animate-pulse text-emerald-400">|</span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track how AI chatbots mention your brand. See why competitors rank above you. Get exact fixes deployed automatically through GitHub.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="group inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-8 py-4 rounded-full text-lg font-semibold text-white transition-all shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300">
              Start Free Trial <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 border-2 border-gray-200 hover:border-emerald-300 px-8 py-4 rounded-full text-lg font-medium text-gray-600 hover:text-emerald-600 transition-all">See How It Works</a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-12 text-sm text-gray-400">
            <div className="flex items-center gap-2"><Users size={16} />Trusted by 500+ businesses</div>
            <div className="flex items-center gap-2"><TrendingUp size={16} />98% visibility improvement</div>
            <div className="flex items-center gap-2"><Lock size={16} />Enterprise-grade security</div>
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section ref={testimonialsRef} id="testimonials" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">
            <span className="w-8 h-0.5 bg-emerald-400 rounded-full" /> Testimonials <span className="w-8 h-0.5 bg-emerald-400 rounded-full" />
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-[#0f172a] mt-2">What Our Customers Say</h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Join hundreds of businesses already dominating AI search results.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, star) => (
                  <Star key={star} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <Quote className="text-emerald-200 mb-3" size={32} />
              <p className="text-gray-600 mb-6 italic leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200" />
                <div>
                  <p className="font-semibold text-[#0f172a]">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== THE AI SEARCH BLIND SPOT ==================== */}
      <section ref={featuresRef} id="features" className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
        {/* ... keep existing features section ... */}
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="bg-white py-20 relative overflow-hidden">
        {/* ... keep existing how it works section ... */}
      </section>

      {/* ==================== WHY AIMentioned ==================== */}
      <section ref={whyRef} className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
        {/* ... keep existing comparison table ... */}
      </section>

      {/* ==================== PRICING ==================== */}
      <section ref={pricingRef} id="pricing" className="bg-white py-20">
        {/* ... keep existing pricing section ... */}
      </section>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="max-w-4xl mx-auto px-4 py-20">
        {/* ... keep existing FAQ section ... */}
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-gray-200 bg-white py-12">
        {/* ... keep existing footer ... */}
      </footer>
    </div>
  );
}

// Missing Search icon component
function Search(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}