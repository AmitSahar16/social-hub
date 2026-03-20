import React from 'react';

interface LikeButtonProps {
  postId: string;
  isLiked: boolean;
  likeCount: number;
  onLike: (postId: string) => void;
}

const LikeButton = React.memo<LikeButtonProps>(({
  postId,
  isLiked,
  likeCount,
  onLike
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onLike(postId);
  };

  return (
    <button
      className={`btn btn-link text-decoration-none p-0 ${isLiked ? 'text-danger' : 'text-secondary'}`}
      onClick={handleClick}
      type="button"
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>
      <span className="small">{likeCount}</span>
    </button>
  );
});

LikeButton.displayName = 'LikeButton';

export default LikeButton;
