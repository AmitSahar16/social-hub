import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';
import LikeButton from './LikeButton';
import CommentsSection from './CommentsSection';
import ConfirmModal from '../common/ConfirmModal';
import { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: Post) => void;
}

const PostCard = React.memo<PostCardProps>(({ post, onLike, onDelete, onEdit }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user?.id === post.userId;
  const hasLiked = post.likedByMe;
  const likeCount = post.likes;
  const commentCount = post.comments;

  const timeAgo = useMemo(() => {
    const now = new Date();
    const past = new Date(post.createdAt);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }, [post.createdAt]);

  const isEdited = post.createdAt !== post.updatedAt;

  const handleLike = useCallback(() => {
    if (onLike) onLike(post.id);
  }, [onLike, post.id]);

  const handleToggleComments = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(prev => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit(post);
    setShowMenu(false);
  }, [onEdit, post]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
    setShowMenu(false);
  }, []);

  const confirmDelete = useCallback(() => {
    if (onDelete) onDelete(post.id);
    setShowDeleteConfirm(false);
  }, [onDelete, post.id]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setShowMenu(prev => !prev);
  }, []);

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-start mb-3">
          <Link to={`/profile/${post.userId}`} className="text-decoration-none">
            <img
              src={post.author?.avatar}
              alt={post.author?.username}
              className="avatar-sm me-3"
            />
          </Link>

          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Link
                  to={`/profile/${post.userId}`}
                  className="text-decoration-none text-dark fw-semibold"
                >
                  {post.author?.username}
                </Link>
                <div className="text-muted small">
                  {timeAgo}
                  {isEdited && ' (edited)'}
                </div>
              </div>

              {isOwner && (
                <div className="position-relative">
                  <button
                    className="btn btn-link text-muted p-0"
                    onClick={toggleMenu}
                    type="button"
                    aria-label="Post menu"
                  >
                    <i className="bi bi-three-dots"></i>
                  </button>

                  {showMenu && (
                    <div
                      className="dropdown-menu dropdown-menu-end show position-absolute"
                      style={{ top: '100%', right: 0 }}
                    >
                      <button className="dropdown-item" onClick={handleEdit} type="button">
                        <i className="bi bi-pencil me-2"></i>
                        Edit
                      </button>
                      <button className="dropdown-item text-danger" onClick={handleDelete} type="button">
                        <i className="bi bi-trash me-2"></i>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="card-text mb-3">{post.content}</p>

        {post.image && (
          <img
            src={post.image}
            alt="Post content"
            className="img-fluid rounded mb-3 w-100"
            style={{ maxHeight: '500px', objectFit: 'cover' }}
          />
        )}

        <div className="d-flex align-items-center gap-3">
          <LikeButton
            postId={post.id}
            isLiked={hasLiked}
            likeCount={likeCount}
            onLike={handleLike}
          />

          <button
            className="btn btn-link text-decoration-none text-secondary p-0"
            onClick={handleToggleComments}
            type="button"
            aria-label="Toggle comments"
          >
            <i className="bi bi-chat me-1"></i>
            <span className="small">{commentCount}</span>
          </button>
        </div>

        {showComments && (
          <CommentsSection
            postId={post.id}

          />
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
