function scoreArticle(title, summary) {
  const text = ((title || '') + ' ' + (summary || '')).toLowerCase();
  let score = 0;

  const COMPANIES = [
    'apple', 'google', 'microsoft', 'meta', 'amazon', 'nvidia', 'openai',
    'anthropic', 'spacex', 'tesla', 'amd', 'intel', 'tsmc', 'samsung',
    'bytedance', 'palantir', 'salesforce', 'oracle', 'ibm', 'uber',
    'airbnb', 'netflix', 'reddit', 'stripe', 'coinbase', 'cloudflare',
    'datadog', 'snowflake', 'crowdstrike', 'spotify', 'discord',
    'twitter', 'x.com', 'd.o.g.e', 'neuralink', 'deepmind',
  ];

  const EVENTS = [
    'ipo', 'funding', 'acquisition', 'layoff', 'regulation', 'antitrust',
    'lawsuit', 'ban', 'breakthrough', 'earnings', 'launch(es|ed)?',
    'recall', 'restructuring', 'investigation', 'subpoena', 'hearing',
    'sanctions', 'settlement', 'merger', 'spin.?off', 'divestiture',
    'bankruptcy', 'shutdown', 'resignation', 'appoint',
  ];

  const AI_MODELS = [
    'gpt-4', 'gpt-5', 'claude 3', 'claude 4', 'gemini', 'llama',
    'sora', 'copilot', 'chatgpt', 'dall-e', 'stable diffusion',
    'mistral', 'deepmind', 'alphafold', 'groq', 'perplexity',
    'chatgpt', 'o1', 'o3',
  ];

  for (const c of COMPANIES) {
    if (text.includes(c)) { score += 10; break; }
  }

  for (const e of EVENTS) {
    if (new RegExp('\\b' + e + '\\b', 'i').test(text)) { score += 10; break; }
  }

  for (const m of AI_MODELS) {
    if (text.includes(m)) { score += 10; break; }
  }

  const EXCLUDE = [
    'best ', 'top 10', 'top 5', 'top 7', 'top 3', '10 best', '5 best',
    'deal', 'coupon', 'discount', 'promo code',
    'how to', ' guide', 'tips', 'tricks', 'tutorial', 'ways to',
    ' review', ' vs ', ' compared', 'alternative',
    'you need', 'you should', 'here\'s why',
  ];

  for (const x of EXCLUDE) {
    if (text.includes(x)) { score = -20; break; }
  }

  return score;
}

function filterRelevant(articles) {
  const scored = articles.map(a => ({
    ...a,
    score: scoreArticle(a.title, a.summary),
  }));

  const filtered = scored.filter(a => a.score >= 10);

  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  return filtered;
}

module.exports = { filterRelevant, scoreArticle };
