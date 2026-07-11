import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sightura – AI Search Visibility Platform',
  description: 'Track how ChatGPT, Gemini, Claude, and Perplexity mention your brand.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}

        {/* 1. Load the Paddle.js library */}
        <Script 
          src="https://cdn.paddle.com/paddle/v2/paddle.js" 
          strategy="afterInteractive"
        />

        {/* 2. Initialize Paddle and detect checkout completion */}
        <Script id="paddle-setup" strategy="afterInteractive">
          {`
            window.onload = function() {
              if (window.Paddle) {
                Paddle.Initialize({ 
                  token: "${process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN}",
                  eventCallback: function(data) {
                    if (data.name === 'checkout.completed') {
                      // Redirect to trigger the dynamic loading screen
                      window.location.href = '/dashboard?upgrading=true';
                    }
                  }
                });
              }
            };
          `}
        </Script>
      </body>
    </html>
  );
}