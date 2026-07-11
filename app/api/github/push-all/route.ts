import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/github/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { website_id } = await req.json();
  if (!website_id) return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });

  const service = createServiceClient();
  const { data: website } = await service.from('websites').select('*').eq('id', website_id).single();
  if (!website?.github_token_encrypted) return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
  if (!website.github_repo) return NextResponse.json({ error: 'No repo selected' }, { status: 400 });

  const { data: recs } = await service.from('recommendations').select('*').eq('website_id', website_id).eq('status', 'pending');
  if (!recs || recs.length === 0) return NextResponse.json({ error: 'No pending fixes' }, { status: 400 });

  const token = decryptToken(website.github_token_encrypted);
  const [owner, repo] = website.github_repo.split('/');
  const branch = website.github_branch || 'main';

  // Combine all fix codes into one file
  const combinedCode = recs.map((r: any) => `<!-- ${r.title} -->\n${r.fix_code || ''}`).join('\n\n');
  const fileName = `Sightura-fixes-${Date.now()}.html`;

  try {
    // Get base SHA
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
      headers: { Authorization: `token ${token}` },
    });
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // Create blob
    const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: Buffer.from(combinedCode).toString('base64'), encoding: 'base64' }),
    });
    const blobData = await blobRes.json();

    // Create tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_tree: baseSha, tree: [{ path: fileName, mode: '100644', type: 'blob', sha: blobData.sha }] }),
    });
    const treeData = await treeRes.json();

    // Create commit
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'feat: Sightura AI visibility fixes', tree: treeData.sha, parents: [baseSha] }),
    });
    const commitData = await commitRes.json();

    // Create branch
    const branchName = `Sightura-fixes-${Date.now()}`;
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: commitData.sha }),
    });

    // Create PR
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Sightura: AI Visibility Fixes',
        head: branchName,
        base: branch,
        body: `## AI Visibility Fixes\n\n${recs.map((r: any) => `- ${r.title}`).join('\n')}\n\n[View on Sightura](${process.env.NEXT_PUBLIC_APP_URL}/sites/${website_id})`,
      }),
    });
    const prData = await prRes.json();

    // Mark all as in_progress
    await service.from('recommendations').update({ status: 'in_progress' }).eq('website_id', website_id).eq('status', 'pending');
    await service.from('pull_requests').insert({ website_id, user_id: user.id, github_pr_url: prData.html_url, github_branch: branchName });

    return NextResponse.json({ pr_url: prData.html_url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}