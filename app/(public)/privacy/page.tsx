export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white py-12 px-4 relative overflow-hidden">
      {/* Background ornaments – same as login/register */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-100/40 rounded-full blur-3xl opacity-50" />
      <div className="absolute top-40 right-10 w-48 h-48 bg-green-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-emerald-50/40 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">
            <span className="w-8 h-0.5 bg-emerald-400 rounded-full" /> Legal <span className="w-8 h-0.5 bg-emerald-400 rounded-full" />
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0f172a]">Privacy Policy</h1>
          <p className="text-gray-500 mt-2 text-sm">Last Updated: June 22, 2026</p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {[
            {
              title: '1. Information We Collect',
              content:
                'We collect only the minimum data required to provide our Service:',
              list: [
                'Email address (for account identification)',
                'Full name (provided during registration)',
                'Website domains and brand names (for monitoring)',
                'AI visibility metrics and audit results',
                'Payment information (processed securely by Paddle — we never store credit card details)',
              ],
            },
            {
              title: '2. How We Use Your Data',
              content:
                'Your data is used exclusively to provide and improve the Service:',
              list: [
                "Monitoring your website's AI visibility",
                'Generating audits and recommendations',
                'Managing your subscription and billing',
                'Sending service-related communications (reports, alerts)',
                'Improving our AI models and recommendation accuracy',
              ],
            },
            {
              title: '3. Data Storage & Security',
              content:
                'Your data is stored securely on Supabase infrastructure with encryption at rest and in transit:',
              list: [
                'All data is encrypted using AES-256 encryption',
                'GitHub tokens are encrypted before storage',
                'Row-Level Security (RLS) ensures complete data isolation between users',
                'Regular security audits and monitoring',
              ],
            },
            {
              title: '4. Data Sharing',
              content:
                'We do not sell, rent, or share your personal data with third parties. Your data is only processed by:',
              list: [
                'Supabase (database hosting)',
                'Paddle (payment processing)',
                'OpenRouter (AI model queries)',
                'Resend (email delivery)',
              ],
            },
            {
              title: '5. Cookies & Tracking',
              content:
                'We use essential cookies for authentication and session management. We do not use third-party tracking cookies or analytics that identify individual users.',
            },
            {
              title: '6. Your Rights',
              content: 'You have the right to:',
              list: [
                'Access all data we hold about you',
                'Request correction of inaccurate data',
                'Request deletion of your account and data',
                'Export your data in a portable format',
                'Withdraw consent at any time',
              ],
            },
            {
              title: '7. Data Retention',
              content:
                'We retain your data for as long as your account is active. Upon account deletion, your data is permanently removed within 30 days.',
            },
            {
              title: "8. Children's Privacy",
              content:
                'The Service is not intended for users under the age of 16. We do not knowingly collect data from children.',
            },
            {
              title: '9. Changes to This Policy',
              content:
                'We may update this Privacy Policy periodically. We will notify you of material changes via email or through the Service.',
            },
          ].map((section, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-emerald-200 transition-all duration-300 hover:shadow-md hover:shadow-emerald-50"
            >
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">
                {section.title}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                {section.content}
              </p>
              {section.list && (
                <ul className="list-disc list-inside text-gray-500 space-y-1">
                  {section.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Contact Card */}
        <div className="mt-8 bg-white border border-emerald-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-xl font-semibold text-[#0f172a] mb-2">
            Contact Us
          </h2>
          <p className="text-gray-600 text-sm">
            For privacy-related questions or data requests:
          </p>
          <a
            href="mailto:AK.Systems@gmail.com"
            className="text-emerald-600 font-semibold hover:text-emerald-700 transition"
          >
            AK.Systems@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}