const CATEGORY_KEYWORDS = {
  ai: [
    'artificial intelligence', 'ai', 'gpt', 'llm', 'neural network',
    'deep learning', 'transformer', 'openai', 'anthropic', 'claude',
    'gemini', 'machine learning model', 'nlp', 'large language model',
    'diffusion', 'generative', 'copilot', 'llama', 'mistral', 'chatbot',
    'chatgpt', 'sora', 'midjourney', 'stability ai', 'hugging face',
  ],
  ml: [
    'machine learning', 'deep learning', 'neural', 'dataset', 'training',
    'inference', 'pytorch', 'tensorflow', 'regression', 'classification',
    'reinforcement', 'fine-tuning', 'backbone', 'attention', 'embedding',
    'model weight', 'open source model', 'vector database', 'rag',
  ],
  cs: [
    'computer science', 'algorithm', 'programming', 'software', 'code',
    'developer', 'engineering', 'linux', 'open source', 'github', 'api',
    'cloud', 'docker', 'kubernetes', 'database', 'compiler', 'python',
    'javascript', 'rust', 'security', 'encryption', 'startup',
  ],
  startups: [
    'startup', 'funding', 'venture', 'vc', 'series a', 'seed', 'founder',
    'valuation', 'ipo', 'saas', 'raise', 'accelerator', 'y combinator',
    'angel', 'unicorn', 'exit', 'acquisition', 'revenue', 'arr',
    'public offering', 'private equity', 'pre-seed',
  ],
};

function categorize(title, summary) {
  const cats = new Set();
  const text = ((title || '') + ' ' + (summary || '')).toLowerCase();

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const word of keywords) {
      if (text.includes(word)) { cats.add(cat); break; }
    }
  }

  return cats.size > 0 ? Array.from(cats) : ['cs'];
}

module.exports = { categorize };
