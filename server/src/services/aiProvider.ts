import {
  AIProvider,
  SearchFilters,
  IPost,
  SemanticSearchResult,
  PostCandidate
} from '../types';

const AI_API_KEY = process.env.AI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const MAX_RETRIES = 3;
const MAX_RESULTS = 10;
const INITIAL_RETRY_DELAY = 1000;
const MAX_CONTENT_LENGTH = 500;
const STOP_WORDS = ['about', 'by', 'from', 'the', 'a', 'an', 'in', 'on', 'at'];

const KEYWORD_SCORE_INCREMENT = 0.1;
const MIN_SCORE = 0.5;
const MAX_SCORE = 0.99;
const MATCH_THRESHOLD = 0.3;

class MockAIProvider implements AIProvider {
  async parseSearchQuery(query: string): Promise<SearchFilters> {
    const words = query
      .split(' ')
      .filter(word => !STOP_WORDS.includes(word.toLowerCase()));

    const filters: SearchFilters = {
      explanation: `Parsed query: "${query}" with keywords: [${words.join(', ')}]`,
    };

    if (words.length > 0) {
      filters.keywords = words;
    }

    return filters;
  }

  async rankPosts(query: string, posts: IPost[]): Promise<SemanticSearchResult[]> {
    const keywords = query.toLowerCase().split(' ');

    return posts
      .map(post => {
        const content = (post.message || '').toLowerCase();
        let score = 0;

        keywords.forEach(word => {
          if (content.includes(word)) {
            score += KEYWORD_SCORE_INCREMENT;
          }
        });

        return {
          postId: post._id,
          score: Math.max(MIN_SCORE, Math.min(score, MAX_SCORE)),
          reason: score > MATCH_THRESHOLD ? 'Contains relevant keywords' : 'Low relevance match'
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);
  }
}

class GeminiProvider implements AIProvider {
  private readonly mockProvider = new MockAIProvider();

  async parseSearchQuery(query: string): Promise<SearchFilters> {
    return this.mockProvider.parseSearchQuery(query);
  }

  async rankPosts(query: string, posts: IPost[]): Promise<SemanticSearchResult[]> {
    if (!AI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const candidates = this.createCandidates(posts);
      return await this.rankWithRetry(query, candidates, posts);
    } catch (error) {
      console.error('Gemini Rank Error:', error);
      return this.mockProvider.rankPosts(query, posts);
    }
  }

  private createCandidates(posts: IPost[]): PostCandidate[] {
    return posts.map((post, index) => ({
      id: post._id,
      index,
      content: post.message.substring(0, MAX_CONTENT_LENGTH),
      author: typeof post.user === 'object' ? (post.user as any).username : 'unknown',
      likes: post.likeCount || 0,
      comments: post.commentCount || 0,
      createdAt: post.createdAt
    }));
  }

  private async rankWithRetry(
    query: string,
    candidates: PostCandidate[],
    posts: IPost[]
  ): Promise<SemanticSearchResult[]> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.callGeminiAPI(query, candidates, attempt);
      } catch (error) {
        console.error(`Fetch error (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
        if (attempt < MAX_RETRIES - 1) {
          const waitTime = this.calculateRetryDelay(attempt);
          await this.delay(waitTime);
        }
      }
    }

    console.error('All Gemini API attempts failed - falling back to mock ranking');
    return this.mockProvider.rankPosts(query, posts);
  }

  private async callGeminiAPI(
    query: string,
    candidates: PostCandidate[],
    attempt: number
  ): Promise<SemanticSearchResult[] | null> {
    const prompt = this.buildPrompt(query, candidates);
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        })
      }
    );

    return this.handleResponse(response, attempt);
  }

  private async handleResponse(
    response: Response,
    attempt: number
  ): Promise<SemanticSearchResult[] | null> {
    if (response.status === 429) {
      console.log('Rate limit hit (429) - returning empty results');
      return [];
    }

    if (response.status === 503) {
      const errorText = await response.text().catch(() => 'Service unavailable');
      console.warn(`Gemini API 503 (attempt ${attempt + 1}/${MAX_RETRIES}):`, errorText);

      if (attempt < MAX_RETRIES - 1) {
        const waitTime = this.calculateRetryDelay(attempt);
        console.log(`Retrying in ${waitTime}ms...`);
        await this.delay(waitTime);
      }

      return null;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      console.error(`Gemini API Error ${response.status}:`, errorText);
      return [];
    }

    return this.parseGeminiResponse(response);
  }

  private async parseGeminiResponse(response: Response): Promise<SemanticSearchResult[]> {
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return [];
    }

    try {
      const cleanedText = this.cleanJsonResponse(text);
      const result = JSON.parse(cleanedText);
      return result.results || [];
    } catch (error) {
      console.error('Failed to parse Gemini response:', text);
      return [];
    }
  }

  private cleanJsonResponse(text: string): string {
    const cleanedText = text.trim();

    return cleanedText.startsWith('```') ?
      cleanedText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '') :
      cleanedText;
  }

  private buildPrompt(query: string, candidates: PostCandidate[]): string {
    return `You are a semantic search engine for a social media platform.

USER QUERY: "${query}"

TASK: Analyze the following posts and rank them by relevance to the user's search intent.

ANALYZE FOR:
- Semantic meaning and context
- Topic relevance
- User intent matching
- Content quality signals (engagement)

CANDIDATES (${candidates.length} posts):
${JSON.stringify(candidates, null, 2)}

INSTRUCTIONS:
1. Return ONLY valid JSON, no markdown
2. Score each post from 0.0 to 1.0 based on relevance
3. Provide a brief reason (max 50 chars)
4. Return top ${Math.min(MAX_RESULTS, candidates.length)} most relevant posts
5. If no posts are relevant, return empty results array

REQUIRED JSON FORMAT:
{
  "results": [
    {
      "postId": "string",
      "score": 0.95,
      "reason": "direct topic match"
    }
  ]
}`;
  }

  private calculateRetryDelay(attempt: number): number {
    return Math.pow(2, attempt) * INITIAL_RETRY_DELAY;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const createAIProvider = (): AIProvider => {
  const provider = process.env.AI_PROVIDER || 'mock';

  if (provider === 'gemini') {
    if (!AI_API_KEY) {
      console.warn('Gemini API key not configured. Falling back to Mock AI Provider.');
      return new MockAIProvider();
    }
    return new GeminiProvider();
  }

  if (provider !== 'mock') {
    console.warn(`Unknown AI provider: ${provider}. Using mock provider.`);
  } else {
    console.info('Using Mock AI Provider');
  }

  return new MockAIProvider();
};
