import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';
import { usePosts } from '../context/posts/PostsContext';
import { commentsService } from '../services/commentsService';
import MainLayout from '../components/layout/MainLayout';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';
import { Post, Comment } from '../types';

const CommentsPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, likePost, refreshPost } = usePosts();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [commentStatus, setCommentStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const loadPostAndComments = async () => {
    if (!postId) return;
    try {
      setStatus('loading');

      try {
        const refreshedPost = await refreshPost(postId);
        setPost(refreshedPost);
      } catch (err) {
        const foundPost = posts.find(p => p.id === postId);
        if (foundPost) {
          setPost(foundPost);
        }
      }

      const loadedComments = await commentsService.getComments(postId);
      setComments(loadedComments);

      setStatus('success');
    } catch (err) {
      setStatus('error');
      console.error(err);
    }
  };

  useEffect(() => {
    loadPostAndComments();
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    const contextPost = posts.find(p => p.id === postId);
    if (contextPost && post) {
      setPost(contextPost);
    }
  }, [posts, postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !user || !postId) return;

    try {
      setCommentStatus('loading');

      const comment = await commentsService.addComment(postId, {
        content: newComment.trim(),
      } as any);

      setComments(prev => [...prev, comment]);
      setNewComment('');
      setCommentStatus('success');

      const refreshedPost = await refreshPost(postId);
      setPost(refreshedPost);
    } catch (err) {
      setCommentStatus('error');
      console.error(err);
    }
  };

  const handleLike = async () => {
    if (!post || !postId) return;

    const wasLiked = post.likedByMe;
    setPost(prev => {
      if (!prev) return null;
      return {
        ...prev,
        likedByMe: !wasLiked,
        likes: wasLiked ? prev.likes - 1 : prev.likes + 1
      };
    });

    try {
      await likePost(postId);
    } catch (err) {
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likedByMe: wasLiked,
          likes: wasLiked ? prev.likes + 1 : prev.likes - 1
        };
      });
      console.error(err);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setDeleteCommentId(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentId || !postId) return;

    try {
      await commentsService.deleteComment(postId, deleteCommentId);
      setComments(prev => prev.filter(c => c.id !== deleteCommentId));

      const refreshedPost = await refreshPost(postId);
      setPost(refreshedPost);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteCommentId(null);
    }
  };

  const cancelDeleteComment = () => {
    setDeleteCommentId(null);
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (status === 'loading') {
    return (
      <MainLayout>
        <LoadingSpinner fullPage text="Loading post..." />
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <EmptyState
          icon="exclamation-circle"
          title="Post not found"
          action={
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Back to Feed
            </button>
          }
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="position-relative">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            className="btn btn-link text-decoration-none p-0"
            onClick={() => navigate(-1)}
            type="button"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>
          <button
            className="btn btn-close"
            onClick={() => navigate(-1)}
            type="button"
            aria-label="Close"
          ></button>
        </div>

        <PostCard
          post={post}
          onLike={handleLike}
        />

        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-4">
              Comments ({comments.length})
            </h5>

            <form onSubmit={handleAddComment} className="mb-4">
              <div className="d-flex gap-2">
                <img
                  src={user?.avatar}
                  alt={user?.username}
                  className="avatar-sm"
                />
                <div className="flex-grow-1">
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={commentStatus === 'loading'}
                  />
                  <div className="d-flex justify-content-end mt-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={!newComment.trim() || commentStatus === 'loading'}
                    >
                      {commentStatus === 'loading' ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Posting...
                        </>
                      ) : (
                        'Post Comment'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {comments.length === 0 ? (
              <EmptyState
                icon="chat"
                title="No comments yet"
                description="Be the first to comment"
              />
            ) : (
              <div className="d-flex flex-column gap-3">
                {comments.map(comment => (
                  <div key={comment.id} className="d-flex gap-2">
                    <img
                      src={comment.author?.avatar}
                      alt={comment.author?.username}
                      className="avatar-sm"
                    />
                    <div className="flex-grow-1">
                      <div className="bg-light rounded p-3">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div className="fw-semibold">{comment.author?.username}</div>
                          {comment.userId === user?.id && (
                            <button
                              className="btn btn-link btn-sm text-danger p-0"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                        <p className="mb-0">{comment.content}</p>
                      </div>
                      <div className="text-muted small mt-1 ms-2">
                        {formatTimeAgo(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteCommentId !== null}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDeleteComment}
        onCancel={cancelDeleteComment}
      />
    </MainLayout>
  );
};

export default CommentsPage;
