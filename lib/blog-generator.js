import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export async function generateBlogPost(category, angle, keywords) {
  const keywordList = keywords.join(', ');

  const prompt = `Write a blog article for ExpansionLens, a dental location intelligence platform that helps dentists and DSOs evaluate expansion locations using Census demographics, competitor data, NPI Registry records, and walkability metrics. Reports cost $149 and are delivered in 15 seconds.

CATEGORY: ${category}
TOPIC ANGLE: ${angle}
TARGET KEYWORDS: ${keywordList}

REQUIREMENTS:
- 1,200-1,500 words
- Direct, authoritative, data-driven tone — like a business analyst writing for dental entrepreneurs
- Use specific numerical benchmarks throughout (ratios like 1:1,600, dollar figures like $55,000, percentages like 64%)
- Use em-dashes (—) for emphasis, not hyphens
- Structure:
  - 1 intro paragraph (2-3 sentences setting the stakes)
  - 2-3 H2 sections providing context/why this matters
  - 1 H2 section with 4-7 numbered H3 sub-items (the core framework/list)
  - 1 H2 section with an actionable takeaway or framework
  - 1 closing H2 ("The bottom line") with 1-2 paragraphs
- Include 1-2 natural mentions of ExpansionLens as a tool that helps with this — not salesy, just factual
- Do NOT include internal links — the article layout handles CTAs separately
- Each section should be 2 paragraphs or 1 paragraph + a list
- Use <ul> for mistake patterns or features, <ol> for step-by-step frameworks

ALSO GENERATE:
- A concise excerpt (1-2 sentences, under 200 characters) for the blog index card
- 3 FAQ entries as question/answer pairs targeting long-tail search queries related to the topic
- An estimated read time based on word count (format: "X min read")

RESPOND WITH VALID JSON ONLY (no markdown wrapping):
{
  "title": "The article title — compelling, under 70 characters",
  "slug": "url-friendly-slug",
  "excerpt": "1-2 sentence excerpt for the blog index",
  "content": "<p>Full article HTML content...</p><h2>...</h2>...",
  "faqEntries": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ],
  "readTime": "7 min read"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;

  // Parse the JSON response — handle potential markdown wrapping
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const result = JSON.parse(cleaned);

  // Ensure slug is URL-safe
  result.slug = slugify(result.slug || result.title);

  return result;
}
