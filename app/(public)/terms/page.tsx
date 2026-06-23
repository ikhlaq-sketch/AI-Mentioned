export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">
            <span className="w-8 h-0.5 bg-emerald-400 rounded-full" /> Legal <span className="w-8 h-0.5 bg-emerald-400 rounded-full" />
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0f172a]">Terms of Service</h1>
          <p className="text-gray-500 mt-2">Effective Date: June 22, 2026</p>
        </div>

        <div className="space-y-8">
          {[
            { title: '1. Acceptance of Terms', content: 'By accessing or using AIMentioned ("the Service"), you agree to be bound by these Terms of Service. AIMentioned is owned and operated by AK Systems.' },
            { title: '2. Description of Service', content: 'AIMentioned is an AI Search Visibility platform that monitors how AI chatbots (ChatGPT, Gemini, Claude, Perplexity) mention your brand, analyzes competitor visibility, and generates optimization recommendations.' },
            { title: '3. User Accounts', content: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration.' },
            { title: '4. Subscription & Payments', content: 'Our services are billed on a monthly subscription basis. All fees are in US Dollars (USD).' },
            { title: '5. Refund Policy', content: 'We offer a 14-day money-back guarantee on all new paid subscriptions. Refund requests after 14 days are evaluated on a case-by-case basis. Refunds are processed within 5-10 business days. Refunds do not apply to renewal payments.' },
            { title: '6. Acceptable Use', content: 'You agree not to misuse the Service, including unauthorized access, interfering with operations, or violating applicable laws.' },
            { title: '7. Intellectual Property', content: 'You retain all rights to your content. The AIMentioned platform is owned by AK Systems and protected by copyright laws.' },
            { title: '8. Limitation of Liability', content: 'The Service is provided "as is" without warranties. AK Systems shall not be liable for damages arising from use of the Service.' },
            { title: '9. Termination', content: 'We reserve the right to terminate accounts for violations. You may terminate your account by contacting us. Data is retained for 30 days post-termination.' },
            { title: '10. Changes to Terms', content: 'We may update these terms. Continued use after changes constitutes acceptance.' },
          ].map((section, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-emerald-200 transition-all">
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">{section.title}</h2>
              <p className="text-gray-600 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mt-8 text-center">
          <h2 className="text-xl font-semibold text-[#0f172a] mb-2">Contact Us</h2>
          <p className="text-gray-600">For questions about these Terms:</p>
          <a href="mailto:AK.Systems@gmail.com" className="text-emerald-600 font-semibold hover:text-emerald-700 transition">AK.Systems@gmail.com</a>
        </div>
      </div>
    </div>
  );
}