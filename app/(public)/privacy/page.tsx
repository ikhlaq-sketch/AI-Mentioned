export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-[#94a3b8] mb-8">Last Updated: June 22, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            We collect only the minimum data required to provide our Service:
          </p>
          <ul className="list-disc list-inside text-[#94a3b8] mt-2 space-y-1">
            <li>Email address (for account identification)</li>
            <li>Full name (provided during registration)</li>
            <li>Website domains and brand names (for monitoring)</li>
            <li>AI visibility metrics and audit results</li>
            <li>Payment information (processed securely by Paddle — we never store credit card details)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Data</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            Your data is used exclusively to provide and improve the Service:
          </p>
          <ul className="list-disc list-inside text-[#94a3b8] mt-2 space-y-1">
            <li>Monitoring your website's AI visibility</li>
            <li>Generating audits and recommendations</li>
            <li>Managing your subscription and billing</li>
            <li>Sending service-related communications (reports, alerts)</li>
            <li>Improving our AI models and recommendation accuracy</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Data Storage & Security</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            Your data is stored securely on Supabase infrastructure with encryption at rest and in transit. We implement industry-standard security measures to protect your information:
          </p>
          <ul className="list-disc list-inside text-[#94a3b8] mt-2 space-y-1">
            <li>All data is encrypted using AES-256 encryption</li>
            <li>GitHub tokens are encrypted before storage</li>
            <li>Row-Level Security (RLS) ensures complete data isolation between users</li>
            <li>Regular security audits and monitoring</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Data Sharing</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            We do not sell, rent, or share your personal data with third parties. Your data is only processed by:
          </p>
          <ul className="list-disc list-inside text-[#94a3b8] mt-2 space-y-1">
            <li>Supabase (database hosting)</li>
            <li>Paddle (payment processing)</li>
            <li>OpenRouter (AI model queries)</li>
            <li>Resend (email delivery)</li>
          </ul>
          <p className="text-[#94a3b8] leading-relaxed mt-2">
            These providers process data solely to enable the Service and are bound by their own privacy policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Cookies & Tracking</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            We use essential cookies for authentication and session management. We do not use third-party tracking cookies or analytics that identify individual users. You can disable cookies in your browser, but this may affect Service functionality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-[#94a3b8] mt-2 space-y-1">
            <li>Access all data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="text-[#94a3b8] leading-relaxed mt-2">
            To exercise these rights, contact us at AK.Systems@gmail.com. We respond to all requests within 30 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            We retain your data for as long as your account is active. Upon account deletion, your data is permanently removed within 30 days. Audit history and recommendations are retained for 6 months for free plans and up to 2 years for paid plans, after which they are anonymized or deleted.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            The Service is not intended for users under the age of 16. We do not knowingly collect data from children. If we learn that we have collected data from a child under 16, we will delete it immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            We may update this Privacy Policy periodically. We will notify you of material changes via email or through the Service. Continued use after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <div className="border-t border-[#334155] pt-6 mt-8">
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            For privacy-related questions or data requests, contact us at:
          </p>
          <p className="text-indigo-400 mt-2">AK.Systems@gmail.com</p>
        </div>
      </div>
    </div>
  );
}