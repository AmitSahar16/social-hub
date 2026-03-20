import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../context/posts/PostsContext';
import { useAuth } from '../context/auth/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import InlineAlert from '../components/common/InlineAlert';

import { ApiError } from '../types';

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { createPost, status } = usePosts();
  const { user } = useAuth();

  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Please write something');
      return;
    }

    try {
      await createPost({
        content: content.trim(),
        image: imageFile || undefined,
      });

      navigate('/');
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || 'Failed to create post');
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const isLoading = status === 'loading';

  return (
    <MainLayout>
      <div>
        <h4 className="mb-4">Create Post</h4>

        <div className="card">
          <div className="card-body">
            {error && (
              <InlineAlert
                type="danger"
                message={error}
                onDismiss={() => setError(null)}
              />
            )}

            <form onSubmit={handleSubmit}>
              <div className="d-flex align-items-start mb-3">
                <img
                  src={user?.avatar}
                  alt={user?.username}
                  className="avatar-sm me-3"
                />
                <div className="flex-grow-1">
                  <div className="fw-semibold">{user?.username}</div>
                </div>
              </div>

              <div className="mb-3">
                <textarea
                  className="form-control border-0"
                  rows={4}
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isLoading}
                  style={{ resize: 'none' }}
                />
              </div>

              {imagePreview && (
                <div className="mb-3 position-relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="img-fluid rounded"
                    style={{ maxHeight: '400px', objectFit: 'cover', width: '100%' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                    onClick={handleRemoveImage}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}

              {!imagePreview && (
                <div className="mb-3">
                  <label className="form-label">Add Image (optional)</label>
                  <div
                    className="border rounded p-4 text-center"
                    style={{ borderStyle: 'dashed !important', cursor: 'pointer' }}
                    onClick={() => document.getElementById('imageInput')?.click()}
                  >
                    <i className="bi bi-image text-muted d-block mb-2" style={{ fontSize: '2rem' }}></i>
                    <div className="text-muted small">Click to upload an image</div>
                    <div className="text-muted small">(Max 5MB, JPG/PNG)</div>
                  </div>
                  <input
                    id="imageInput"
                    type="file"
                    className="d-none"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !content.trim()}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Posting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-1"></i>
                      Post
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreatePostPage;
