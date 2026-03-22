import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { postsService } from '../services/postsService';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Post } from '../types';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [searchMethod, setSearchMethod] = useState<string>('keyword');

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;

      setLoading(true);
      try {
        const { posts, explanation, searchMethod } = await postsService.searchPosts(query);
        setResults(posts);
        setExplanation(explanation || null);
        setSearchMethod(searchMethod || 'keyword');
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h2 className="mb-4">Search Results</h2>

          <div className="card mb-4 shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="flex-grow-1">
                  <h5 className="card-title text-primary mb-2">
                    <i className="bi bi-search me-2"></i>
                    "{query}"
                  </h5>
                  {explanation && (
                    <p className="card-text text-muted small border-start border-3 border-info ps-3 mb-2">
                      <strong>Analysis:</strong> {explanation}
                    </p>
                  )}
                </div>
                <div className="text-end">
                  <span className="badge bg-light text-dark">
                    {results.length} results
                  </span>
                  {searchMethod && (
                    <span className={`badge ms-2 ${searchMethod === 'vector' ? 'bg-success' : 'bg-secondary'}`}>
                      {searchMethod === 'vector' ? (
                        <>
                          <i className="bi bi-cpu me-1"></i>
                          Vector Search
                        </>
                      ) : (
                        <>
                          <i className="bi bi-search me-1"></i>
                          Keyword Search
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <LoadingSpinner />
              <p className="mt-2 text-muted">Analyzing posts...</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {results.length > 0 ? (
                results.map((post) => (
                  <div key={post.id} className="position-relative">
                    {post.searchScore !== undefined && (
                      <div className="position-absolute end-0 top-0 m-3 z-1 d-flex flex-column align-items-end gap-1">
                        <div
                          className={`badge ${post.searchScore > 0.7 ? 'bg-success' : post.searchScore > 0.4 ? 'bg-warning' : 'bg-secondary'} bg-opacity-75`}
                          title={`AI Relevance Score`}
                          style={{ fontSize: '0.9rem' }}
                        >
                          <i className="bi bi-stars me-1"></i>
                          {Math.round(post.searchScore * 100)}%
                        </div>
                        {post.searchReason && (
                          <small
                            className="badge bg-dark bg-opacity-50 text-white text-wrap"
                            style={{ maxWidth: '200px', fontSize: '0.7rem' }}
                          >
                            {post.searchReason}
                          </small>
                        )}
                      </div>
                    )}
                    <PostCard post={post} />
                  </div>
                ))
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-search display-4 mb-3 d-block"></i>
                  <p>No results found specifically matching your query.</p>
                  <p className="small">Try different keywords or browse the feed.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
