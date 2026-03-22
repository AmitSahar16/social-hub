import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/auth/AuthContext';
import { commentsService } from '../../services/commentsService';
import { usePosts } from '../../context/posts/PostsContext';
import ConfirmModal from '../common/ConfirmModal';
import { Comment } from '../../types';

interface CommentsSectionProps {
  postId: string;
}

const CommentsSection = React.memo<CommentsSectionProps>(({ postId }) => {
  const { user } = useAuth();
  const { refreshPost } = usePosts();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = useCallback(async () => {
    if (loaded) return;

    try {
      setLoading(true);
      const loadedComments = await commentsService.getComments(postId);
      setComments(loadedComments);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [postId, loaded]);

  const handleAddComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting || !user) return;

    try {
      setSubmitting(true);
      const comment = await commentsService.addComment(postId, {
        content: newComment.trim()
      });

      setComments(prev => [...prev, comment]);
      setNewComment('');

      await refreshPost(postId);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newComment, postId, user, submitting, refreshPost]);

  const handleDeleteComment = useCallback((commentId: string) => {
    setDeleteCommentId(commentId);
  }, []);

  const confirmDeleteComment = useCallback(async () => {
    if (!deleteCommentId) return;

    try {
      await commentsService.deleteComment(postId, deleteCommentId);
      setComments(prev => prev.filter(c => c.id !== deleteCommentId));
      await refreshPost(postId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setDeleteCommentId(null);
    }
  }, [postId, deleteCommentId, refreshPost]);

  const cancelDeleteComment = useCallback(() => {
    setDeleteCommentId(null);
  }, []);

  const formatTimeAgo = useCallback((date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  if (loading) {
    return (
      <div className="border-top pt-3 mt-3">
        <div className="text-center py-3">
          <span className="spinner-border spinner-border-sm me-2"></span>
          Loading comments...
        </div>
      </div>
    );
  }

  return (
    <div className="border-top pt-3 mt-3">
      <h6 className="mb-3">Comments ({comments.length})</h6>

      <form onSubmit={handleAddComment} className="mb-3">
        <div className="d-flex gap-2">
          <img
            src={user?.avatar}
            alt={user?.username}
            className="avatar-sm rounded-circle"
            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
          />
          <div className="flex-grow-1">
            <textarea
              className="form-control form-control-sm"
              rows={2}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
            />
            <div className="d-flex justify-content-end mt-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="text-muted text-center small py-3">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {comments.map(comment => (
            <div key={comment.id} className="d-flex gap-2">
              <img
                src={comment.author?.avatar}
                alt={comment.author?.username}
                className="avatar-sm rounded-circle"
                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
              />
              <div className="flex-grow-1">
                <div className="bg-light rounded p-2">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="fw-semibold small">{comment.author?.username}</div>
                    {comment.userId === user?.id && (
                      <button
                        className="btn btn-link btn-sm text-danger p-0"
                        onClick={() => handleDeleteComment(comment.id)}
                        type="button"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                  <p className="mb-0 small">{comment.content}</p>
                </div>
                <div className="text-muted small mt-1 ms-2">
                  {formatTimeAgo(comment.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
});

CommentsSection.displayName = 'CommentsSection';

export default CommentsSection;
