import { Response } from 'express';
import { IAuthRequest, SearchFilters } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { TTLCache } from '../utils/cache';
import { UserRateLimiter } from '../utils/rateLimiter';
import { createAIProvider } from '../services/aiProvider';
import { embeddingService } from '../services/embeddingService';
import Post from '../models/post';
import User from '../models/user';

const aiSearchCache = new TTLCache<SearchFilters>();
const aiRateLimiter = new UserRateLimiter(10, 60 * 60 * 1000);

setInterval(() => {
  aiSearchCache.cleanup();
  aiRateLimiter.cleanup();
}, 5 * 60 * 1000);

class AIController {
  search = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { query } = req.body;
    const userId = req.user._id;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new AppError(400, 'Query is required', 'MISSING_QUERY');
    }

    if (!aiRateLimiter.canMakeRequest(userId)) {
      const resetTime = aiRateLimiter.getResetTime(userId);
      throw new AppError(
        429,
        `AI search rate limit exceeded. Try again in ${resetTime} seconds.`,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
    const cacheKey = `search:${normalizedQuery}`;

    let filters = aiSearchCache.get(cacheKey);
    let fromCache = false;

    if (!filters) {
      const aiProvider = createAIProvider();
      filters = await aiProvider.parseSearchQuery(query);
      aiSearchCache.set(cacheKey, filters, 15 * 60 * 1000);
    } else {
      fromCache = true;
    }

    let posts: any[] = [];
    let searchMethod = 'keyword';
    let similarityScores = new Map<string, number>();

    try {
      console.log('Attempting vector search...');
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const postsWithEmbeddings = await Post.find({
        embedding: { $exists: true, $ne: null }
      })
        .select('+embedding')
        .populate('user', 'username email profileImage')
        .limit(100);

      if (postsWithEmbeddings.length > 0) {
        const validPosts = postsWithEmbeddings.filter(post =>
          post.embedding && post.embedding.length === 3072
        );

        if (validPosts.length === 0) {
          console.log('No posts with valid 3072-dimension embeddings found');
          throw new Error('No valid embeddings available');
        }

        const similarities = validPosts.map(post => ({
          post,
          similarity: embeddingService.cosineSimilarity(queryEmbedding, post.embedding || [])
        }));

        similarities.sort((a, b) => b.similarity - a.similarity);

        posts = similarities
          .filter(item => item.similarity > 0.5)
          .slice(0, 30)
          .map(item => {
            similarityScores.set(item.post._id.toString(), item.similarity);
            return item.post;
          });

        searchMethod = 'vector';
        console.log(`Vector search found ${posts.length} candidates (similarity > 0.5)`);
      }
    } catch (vectorError) {
      console.warn('Vector search failed, falling back to keyword search:', vectorError);
    }

    if (posts.length === 0) {
      console.log('Falling back to keyword search');
      const dbQuery: any = {};
      let candidateLimit = 50;

      if (filters.keywords && filters.keywords.length > 0) {
        dbQuery.message = {
          $regex: filters.keywords.join('|'),
          $options: 'i',
        };
        candidateLimit = 30;
      } else {
        console.log('No keywords found in query, returning empty results');
        return res.json({
          query,
          filters,
          results: [],
          count: 0,
          cached: fromCache,
          searchMethod: 'keyword',
          explanation: 'No relevant posts found for your search.',
          rateLimitRemaining: aiRateLimiter.getRemainingRequests(userId),
        });
      }

      if (filters.author) {
        const users = await User.find({
          username: { $regex: filters.author, $options: 'i' },
        }).select('_id');

        if (users.length > 0) {
          dbQuery.user = { $in: users.map(u => u._id) };
        } else {
          return res.json({
            query,
            filters,
            results: [],
            count: 0,
            cached: fromCache,
            explanation: `${filters.explanation}. No users found matching "${filters.author}".`,
          });
        }
      }

      if (filters.dateFrom) {
        dbQuery.createdAt = { $gte: filters.dateFrom };
      }

      if (filters.dateTo) {
        dbQuery.createdAt = { ...dbQuery.createdAt, $lte: filters.dateTo };
      }

      posts = await Post.find(dbQuery)
        .sort({ createdAt: -1, likeCount: -1 })
        .limit(candidateLimit)
        .populate('user', 'username email profileImage');
    }

    if (posts.length === 0) {
      return res.json({
        query,
        filters,
        results: [],
        count: 0,
        cached: fromCache,
        explanation: 'No posts found matching the search criteria.',
        rateLimitRemaining: aiRateLimiter.getRemainingRequests(userId),
      });
    }

    const aiProvider = createAIProvider();
    let rankedCandidates: any[];

    console.log(`Attempting AI ranking for ${posts.length} posts, similarity scores cached: ${similarityScores.size}`);

    try {
      rankedCandidates = await aiProvider.rankPosts(query, posts);
      console.log('AI ranking succeeded');
    } catch (aiError) {
      console.error('AI ranking failed, using fallback. Error:', aiError);
      console.log(`Similarity scores available: ${similarityScores.size}`);

      if (similarityScores.size > 0) {
        console.log('✓ Using vector similarity scores as fallback');
        rankedCandidates = posts.map(post => ({
          postId: post._id,
          score: similarityScores.get(post._id.toString()) || 0.5,
          reason: 'Vector similarity match'
        })).sort((a, b) => b.score - a.score);
      } else {
        console.log('✓ Using position-based scoring as fallback');
        rankedCandidates = posts.slice(0, 10).map((post, index) => ({
          postId: post._id,
          score: Math.max(0.5, 1 - (index * 0.05)),
          reason: 'Keyword match'
        }));
      }
    }

    console.log(`Ranked candidates: ${rankedCandidates.length}`);

    const results = rankedCandidates
      .map(candidate => {
        const post = posts.find(p => p._id.toString() === candidate.postId.toString());
        if (!post) return null;
        return {
          ...post.toObject(),
          searchScore: candidate.score,
          searchReason: candidate.reason
        };
      })
      .filter(item => item !== null && item.searchScore >= 0.5)
      .sort((a, b) => {
        if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    console.log(`Final results after filtering (>=0.5): ${results.length}`);

    res.json({
      query,
      filters,
      results,
      count: results.length,
      totalCandidates: posts.length,
      searchMethod,
      cached: fromCache,
      explanation: filters.explanation,
      rateLimitRemaining: aiRateLimiter.getRemainingRequests(userId),
      processingTime: Date.now() - Date.now(),
    });
  });
}

export { aiRateLimiter };
export default new AIController();
