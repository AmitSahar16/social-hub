import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';
import { usePosts } from '../context/posts/PostsContext';
import MainLayout from '../components/layout/MainLayout';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import EditProfileModal from '../components/profile/EditProfileModal';
import EditPostModal from '../components/posts/EditPostModal';
import { Post } from '../types';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { posts, loadUserPosts, deletePost, likePost, status } = usePosts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const profileUserId = userId || currentUser?.id;
  const isOwnProfile = profileUserId === currentUser?.id;

  const profileUser = currentUser;

  useEffect(() => {
    if (profileUserId) {
      loadUserPosts(profileUserId);
    }
  }, [profileUserId]);

  const handleDelete = useCallback(async (postId: string) => {
    await deletePost(postId);
  }, [deletePost]);

  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const searchQuery = searchParams.get('q');

  let userPosts = posts;
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    userPosts = posts.filter(post =>
      post.content.toLowerCase().includes(lowerQuery)
    );
  }

  if (status === 'loading' && posts.length === 0) {
    return (
      <MainLayout>
        <LoadingSpinner fullPage text="Loading profile..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <div className="card mb-4 overflow-hidden">
          <div className="gradient-bg" style={{ height: '150px' }}></div>

          <div className="card-body position-relative" style={{ paddingTop: '0' }}>
            <div className="d-flex justify-content-between" style={{ marginTop: '-60px', marginBottom: '1rem' }}>
              <img
                src={profileUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser?.username || 'User')}&background=random`}
                alt={profileUser?.username}
                className="avatar-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser?.username || 'User')}&background=random`;
                }}
              />

              {isOwnProfile && (
                <button
                  className="btn btn-primary d-inline-flex align-items-center mt-3"
                  onClick={() => setShowEditModal(true)}
                >
                  <i className="bi bi-pencil-fill me-2"></i>
                  Edit Profile
                </button>
              )}
            </div>

            <div className="mb-3">
              <h3 className="mb-0 fw-bold">{profileUser?.username}</h3>
              <div className="text-muted mb-3">@{profileUser?.username?.toLowerCase()}</div>
              <div className="d-flex gap-4 flex-wrap">
                <div>
                  <span className="fw-bold me-1">{userPosts.length}</span>
                  <span className="text-muted">Posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 fw-bold">Posts</h5>
            {searchQuery && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleClearSearch}
              >
                <i className="bi bi-x-circle me-1"></i>
                Clear Search
              </button>
            )}
          </div>

          {searchQuery && userPosts.length > 0 && (
            <div className="alert alert-info mb-3">
              <i className="bi bi-search me-2"></i>
              Showing {userPosts.length} result{userPosts.length !== 1 ? 's' : ''} for "<strong>{searchQuery}</strong>" in this profile
            </div>
          )}

          {userPosts.length === 0 && !searchQuery ? (
            <EmptyState
              icon="postcard"
              title="No posts yet"
              description={isOwnProfile ? "Share your first post!" : "This user hasn't posted yet"}
              action={undefined}
            />
          ) : userPosts.length === 0 && searchQuery ? (
            <EmptyState
              icon="search"
              title="No posts found"
              description={`No posts matching "${searchQuery}" in this profile`}
              action={undefined}
            />
          ) : (
            userPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={likePost}
                onEdit={isOwnProfile ? handleEdit : undefined}
                onDelete={isOwnProfile ? (() => handleDelete(post.id)) : undefined}
              />
            ))
          )}
        </div>

        {showEditModal && (
          <EditProfileModal
            onClose={() => setShowEditModal(false)}
          />
        )}

        {editingPost && (
          <EditPostModal
            post={editingPost}
            onClose={() => setEditingPost(null)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
