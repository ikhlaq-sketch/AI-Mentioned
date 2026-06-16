import { decryptToken } from './encryption';

interface WebsiteForGitHub {
  github_token_encrypted: string;
  github_repo: string;
  github_branch: string;
  domain: string;
}

interface RecommendationForPR {
  id: string;
  title: string;
  description: string;
  fix_code: string;
}

/**
 * Creates a GitHub Pull Request for a recommendation.
 * Returns the PR URL.
 */
export async function createPullRequest(
  website: WebsiteForGitHub,
  recommendation: RecommendationForPR
): Promise<string> {
  const token = decryptToken(website.github_token_encrypted);
  const [owner, repo] = website.github_repo.split('/');
  const branch = website.github_branch || 'main';
  const filePath = getTargetFilePath(website.domain);
  const branchName = `aimentioned/fix-${slugify(recommendation.title)}-${Date.now()}`;

  // 1. Get base ref SHA
  const refRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { headers: { Authorization: `token ${token}` } }
  );
  if (!refRes.ok) throw new Error('Failed to get branch ref');
  const refData = await refRes.json();
  const baseSha = refData.object.sha;

  // 2. Create blob
  const blobRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: Buffer.from(recommendation.fix_code).toString('base64'),
        encoding: 'base64',
      }),
    }
  );
  const blobData = await blobRes.json();

  // 3. Create tree
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

  // 4. Create commit
  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `feat: ${recommendation.title} - Added by AIMentioned`,
        tree: treeData.sha,
        parents: [baseSha],
      }),
    }
  );
  const commitData = await commitRes.json();

  // 5. Create branch
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

  // 6. Create PR
  const prRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `AIMentioned: ${recommendation.title}`,
        head: branchName,
        base: branch,
        body: `## What changed\n${recommendation.description}\n\n## Why it improves AI visibility\nThis fix adds structured data that helps AI models understand your content better.\n\n## How to verify\nCheck your AI visibility score after merging.\n\n[View on AIMentioned](${process.env.NEXT_PUBLIC_APP_URL}/sites/${website.domain})`,
      }),
    }
  );
  const prData = await prRes.json();

  if (!prData.html_url) {
    throw new Error(`GitHub API error: ${JSON.stringify(prData)}`);
  }

  return prData.html_url;
}

export function getGitHubOAuthUrl(websiteId: string, userId: string) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`;
  const state = encodeURIComponent(JSON.stringify({ websiteId, userId }));
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo&state=${state}`;
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