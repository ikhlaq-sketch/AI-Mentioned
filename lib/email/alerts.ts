import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWeeklyReport(website: any, score: number, userEmail: string) {
  const scoreChange = score - (website.previous_score || 0);
  const trend = scoreChange >= 0 ? '↑' : '↓';
  const color = scoreChange >= 0 ? '#10b981' : '#ef4444';

  await resend.emails.send({
    from: 'AIMentioned <alerts@aimentioned.com>',
    to: userEmail,
    subject: `Your AI Visibility Report for ${website.brand_name}`,
    html: `
      <div style="background:#1e293b; padding:24px; border-radius:12px; color:#f1f5f9; font-family:system-ui;">
        <h1 style="color:#6366f1; margin:0 0 24px;">AIMentioned</h1>
        <div style="background:#0f172a; padding:20px; border-radius:8px; text-align:center; margin-bottom:24px;">
          <p style="font-size:14px; color:#94a3b8; margin:0 0 8px;">AI Visibility Score</p>
          <p style="font-size:48px; font-weight:bold; margin:0; color:#f1f5f9;">${score} <span style="font-size:24px; color:${color};">${trend}${Math.abs(scoreChange)}</span></p>
        </div>
        <p style="margin:0 0 24px; color:#94a3b8;">Last week's score: ${website.previous_score || 0}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block; padding:12px 24px; background:#6366f1; color:white; text-decoration:none; border-radius:8px;">View Dashboard</a>
      </div>
    `,
  });
}

export async function sendScoreDropAlert(
  website: any,
  prevScore: number,
  newScore: number,
  affectedLLMs: string[],
  userEmail: string
) {
  await resend.emails.send({
    from: 'AIMentioned <alerts@aimentioned.com>',
    to: userEmail,
    subject: `⚠️ AI Visibility Drop Detected for ${website.brand_name}`,
    html: `
      <div style="background:#1e293b; padding:24px; border-radius:12px; color:#f1f5f9; font-family:system-ui;">
        <h1 style="color:#ef4444; margin:0 0 24px;">⚠️ Score Drop Alert</h1>
        <p>Your visibility score for <strong>${website.brand_name}</strong> dropped from ${prevScore} to ${newScore}.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block; padding:12px 24px; background:#6366f1; color:white; text-decoration:none; border-radius:8px;">View Dashboard</a>
      </div>
    `,
  });
}
