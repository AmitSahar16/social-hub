import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '../context/posts/PostsContext';
import { postsService } from '../services/postsService';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import MainLayout from '../components/layout/MainLayout';
import EditPostModal from '../components/posts/EditPostModal';
import { Link } from 'react-router-dom';
import { Post } from '../types';

const FeedPage: React.FC = () => {
  const { posts, status, loadFeed, deletePost, likePost } = usePosts();
  const [page, setPage] = useState(1);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMethod, setSearchMethod] = useState<string>('keyword');

  useEffect(() => {
    if (!searchQuery) {
      loadFeed(1);
    }
  }, [searchQuery]);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const { posts: results, searchMethod: method } = await postsService.searchPosts(searchQuery);

        const relevantResults = results.filter(post =>
          !post.searchScore || post.searchScore >= 0.5
        );

        setSearchResults(relevantResults);
        setSearchMethod(method || 'keyword');

        if (method) {
          setSearchParams({ q: searchQuery, method });
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    performSearch();
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchParams({});
    setSearchResults([]);
    loadFeed(1);
  }, [setSearchParams, loadFeed]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage);
  }, [page, loadFeed]);

  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
  }, []);

  const handleDelete = useCallback(async (postId: string) => {
    await deletePost(postId);
  }, [deletePost]);

  const isSearchMode = !!searchQuery;
  const displayPosts = isSearchMode ? searchResults : posts;
  const isLoading = isSearchMode ? searchLoading : (status === 'loading' && posts.length === 0);

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner fullPage text={isSearchMode ? "Searching posts..." : "Loading feed..."} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">{isSearchMode ? 'Search Results' : 'Feed'}</h4>
          <Link to="/create" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1"></i>
            New Post
          </Link>
        </div>

        {isSearchMode && (
          <div className="alert alert-light border d-flex justify-content-between align-items-center mb-4 shadow-sm">
            <div>
              <i className="bi bi-search me-2 text-primary"></i>
              <strong>Showing results for:</strong> "{searchQuery}"
              {searchMethod === 'vector' && (
                <span className="badge bg-success ms-2">
                  <i className="bi bi-cpu me-1"></i>
                  AI Search
                </span>
              )}
            </div>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={handleClearSearch}
            >
              <i className="bi bi-x-lg me-1"></i>
              Show All Posts
            </button>
          </div>
        )}

        {displayPosts.length === 0 ? (
          <EmptyState
            icon={isSearchMode ? "search" : "postcard"}
            title={isSearchMode ? "No relevant results found" : "No posts yet"}
            description={isSearchMode ? "Try different keywords or browse all posts." : "Be the first to share something!"}
            action={
              isSearchMode ? (
                <button className="btn btn-primary" onClick={handleClearSearch}>
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Feed
                </button>
              ) : (
                <Link to="/create" className="btn btn-primary">
                  Create Post
                </Link>
              )
            }
          />
        ) : (
          <>
            {displayPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={likePost}
                onEdit={() => handleEdit(post)}
                onDelete={() => handleDelete(post.id)}
              />
            ))}

            {!isSearchMode && posts.length >= 5 && (
              <div className="text-center mt-4">
                <button
                  className="btn btn-outline-primary"
                  onClick={handleLoadMore}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
        />
      )}
    </MainLayout>
  );
};

export default FeedPage;
