export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan: 'free' | 'starter' | 'growth' | 'scale' | 'agency_pro';
  sites_limit: number;
  queries_limit: number;
  queries_used: number;
  queries_reset_at: string;
  lemon_squeezy_customer_id: string | null;
  lemon_squeezy_subscription_id: string | null;
  subscription_status: 'inactive' | 'active' | 'cancelled' | string;
  created_at: string;
}

export interface Website {
  id: string;
  user_id: string;
  domain: string;
  brand_name: string;
  category: string;
  scan_mode: 'auto' | 'manual';
  status: 'pending' | 'active' | 'error' | 'paused';
  visibility_score: number;
  previous_score: number;
  last_crawled_at: string | null;
  last_audit_at: string | null;
  next_audit_at: string | null;
  github_repo: string | null;
  github_branch: string;
  github_token_encrypted: string | null;
  created_at: string;
}

export interface Competitor {
  id: string;
  website_id: string;
  user_id: string;
  domain: string;
  brand_name: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  website_id: string;
  user_id: string;
  prompt_text: string;
  is_active: boolean;
  created_at: string;
}

export interface Audit {
  id: string;
  website_id: string;
  user_id: string;
  audit_type: 'baseline' | 'weekly' | 'daily' | 'manual';
  visibility_score: number;
  queries_consumed: number;
  status: 'running' | 'completed' | 'failed';
  raw_results: any;
  created_at: string;
}

export interface Mention {
  id: string;
  audit_id: string;
  website_id: string;
  user_id: string;
  llm_name: string;
  prompt_text: string;
  entity_name: string;
  entity_type: 'brand' | 'competitor';
  was_mentioned: boolean;
  mention_position: number | null;
  full_response: string | null;
  created_at: string;
}

export interface Recommendation {
  id: string;
  website_id: string;
  user_id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact_score: number;
  effort_score: number;
  estimated_gain: number | null;
  fix_type: 'schema' | 'content' | 'link' | 'other';
  fix_code: string | null;
  fix_instructions: string | null;
  status: 'pending' | 'in_progress' | 'deployed' | 'dismissed';
  created_at: string;
}

export interface PullRequest {
  id: string;
  website_id: string;
  user_id: string;
  recommendation_id: string | null;
  github_pr_url: string | null;
  github_branch: string | null;
  status: 'open' | 'merged' | 'closed';
  created_at: string;
}

export interface CrawlData {
  id: string;
  website_id: string;
  user_id: string;
  page_title: string | null;
  meta_description: string | null;
  h1_headings: string[] | null;
  h2_headings: string[] | null;
  schema_markup: any | null;
  faqs: any | null;
  internal_links: any | null;
  organization_name: string | null;
  products_services: any | null;
  crawl_method: 'standard' | 'deep_search';
  crawled_at: string;
}
