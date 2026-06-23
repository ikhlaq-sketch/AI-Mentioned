export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-[#94a3b8] mb-8">Effective Date: June 22, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            By accessing or using AIMentioned ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. AIMentioned is owned and operated by AK Systems.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            AIMentioned is an AI Search Visibility platform that monitors how AI chatbots (including ChatGPT, Gemini, Claude, and Perplexity) mention your brand, analyzes competitor visibility, and generates optimization recommendations. The Service is provided on a subscription basis with multiple plan tiers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information during registration. You may not share your account with others or use another user's account without permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Subscription & Payments</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            Our services are billed on a monthly subscription basis. By selecting a paid plan, you agree to pay the fees associated with that plan. All fees are in US Dollars (USD) and are non-refundable except as stated in our Refund Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Refund Policy</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            We offer a 14-day money-back guarantee on all new paid subscriptions. If you are not satisfied with the Service within 14 days of your initial purchase, contact us for a full refund. Refund requests after 14 days will be evaluated on a case-by-case basis. Refunds are processed within 5-10 business days.
          </p>
          <p className="text-[#94a3b8] leading-relaxed mt-2">
            Refunds do not apply to renewal payments. You may cancel your subscription at any time, and you will retain access until the end of your current billing period.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Acceptable Use</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            You agree not to misuse the Service, including but not limited to: attempting to gain unauthorized access, interfering with the Service's operation, using automated scraping tools, or violating any applicable laws. We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            You retain all rights to your content and data. The AIMentioned platform, including its code, design, and algorithms, is owned by AK Systems and protected by copyright laws. You may not copy, modify, or redistribute the Service without permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            The Service is provided "as is" without warranties of any kind. AK Systems shall not be liable for any damages arising from the use or inability to use the Service. We do not guarantee specific improvements in AI visibility or search rankings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            We reserve the right to terminate or suspend your account at any time for violations of these terms. You may terminate your account by contacting us. Upon termination, your data will be retained for 30 days before permanent deletion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            We may update these terms from time to time. We will notify you of significant changes via email. Continued use of the Service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <div className="border-t border-[#334155] pt-6 mt-8">
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            For questions about these Terms, please contact us at:
          </p>
          <p className="text-indigo-400 mt-2">AK.Systems@gmail.com</p>
        </div>
      </div>
    </div>
  );
}