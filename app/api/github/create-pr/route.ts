import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/github/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { recommendation_id, website_id } = await req.json();
  if (!recommendation_id || !website_id) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: website, error: siteErr } = await service
    .from('websites')
    .select('*')
    .eq('id', website_id)
    .eq('user_id', session.user.id)
    .single();

  if (siteErr || !website || !website.github_token_encrypted) {
    return NextResponse.json(
      { error: 'GitHub not connected for this site' },
      { status: 400 }
    );
  }

  const { data: rec, error: recErr } = await service
    .from('recommendations')
    .select('*')
    .eq('id', recommendation_id)
    .eq('website_id', website_id)
    .single();

  if (recErr || !rec) {
    return NextResponse.json(
      { error: 'Recommendation not found' },
      { status: 404 }
    );
  }

  if (!rec.fix_code) {
    return NextResponse.json(
      { error: 'No fix code generated for this recommendation' },
      { status: 400 }
    );
  }

  const token = decryptToken(website.github_token_encrypted);
  const repoFull = website.github_repo;
  if (!repoFull) {
    return NextResponse.json(
      { error: 'GitHub repo not configured' },
      { status: 400 }
    );
  }

  const [owner, repo] = repoFull.split('/');
  const branch = website.github_branch || 'main';

  try {
    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      { headers: { Authorization: `token ${token}` } }
    );
    if (!refRes.ok) throw new Error('Failed to get branch ref');
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    const blobRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: Buffer.from(rec.fix_code).toString('base64'),
          encoding: 'base64',
        }),
      }
    );
    const blobData = await blobRes.json();

    const filePath = getTargetFilePath(website.domain);
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_tree: baseSha,
          tree: [
            {
              path: filePath,
              mode: '100644',
              type: 'blob',
              sha: blobData.sha,
            },
          ],
        }),
      }
    );
    const treeData = await treeRes.json();

    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `feat: ${rec.title} - Added by Sightura`,
          tree: treeData.sha,
          parents: [baseSha],
        }),
      }
    );
    const commitData = await commitRes.json();

    const branchName = `Sightura/fix-${slugify(rec.title)}-${Date.now()}`;
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: commitData.sha,
      }),
    });

    const prRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Sightura: ${rec.title}`,
          head: branchName,
          base: branch,
          body: `## What changed\n${rec.description}\n\n## Why it improves AI visibility\nThis fix adds structured data that helps AI models understand your content better.\n\n## How to verify\nCheck your AI visibility score after merging.\n\n[View on Sightura](${process.env.NEXT_PUBLIC_APP_URL}/sites/${website_id})`,
        }),
      }
    );
    const prData = await prRes.json();

    await service.from('pull_requests').insert({
      website_id,
      user_id: session.user.id,
      recommendation_id: rec.id,
      github_pr_url: prData.html_url,
      github_branch: branchName,
    });

    await service
      .from('recommendations')
      .update({ status: 'in_progress' })
      .eq('id', rec.id);

    return NextResponse.json({ pr_url: prData.html_url });
  } catch (err: any) {
    console.error('GitHub PR creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getTargetFilePath(domain: string): string {
  if (domain.includes('shopify')) return 'layout/theme.liquid';
  if (domain.includes('wordpress')) return 'functions.php';
  return 'index.html';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 60);
}
