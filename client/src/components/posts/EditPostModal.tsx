import React, { useState } from 'react';
import { usePosts } from '../../context/posts/PostsContext';
import InlineAlert from '../common/InlineAlert';
import { Post, ApiError } from '../../types';

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose }) => {
  const { updatePost } = usePosts();
  const [content, setContent] = useState(post.content);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.image || null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<ApiError | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;

    if (file) {

      if (!file.type.startsWith('image/')) {
        setError({ code: 'INVALID_FILE', message: 'Please select an image file' });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError({ code: 'FILE_TOO_LARGE', message: 'Image size should be less than 5MB' });
        return;
      }

      setImageFile(file);
      setRemoveExistingImage(false);

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
    setRemoveExistingImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError({ code: 'VALIDATION_ERROR', message: 'Please write something' });
      return;
    }

    try {
      setStatus('loading');

      const updates: any = {
        content: content.trim(),
      };

      if (imageFile) {
        updates.image = imageFile;
      }

      else if (removeExistingImage) {
        updates.image = undefined;

      }

      if (removeExistingImage) {
        updates.image = null;
      }

      await updatePost(post.id, updates);
      setStatus('success');
      onClose();
    } catch (err: any) {
      setError(err);
      setStatus('error');
    }
  };

  const isLoading = status === 'loading';

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex={-1}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Post</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={isLoading}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <InlineAlert
                    type="danger"
                    message={error}
                    onDismiss={() => setError(null)}
                  />
                )}

                <div className="mb-3">
                  <label className="form-label">Content</label>
                  <textarea
                    className="form-control"
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
                    <label className="form-label">Image</label>
                    <div className="position-relative">
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
                        disabled={isLoading}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                )}

                {!imagePreview && (
                  <div className="mb-3">
                    <label className="form-label">Add Image (optional)</label>
                    <div
                      className="border rounded p-4 text-center"
                      style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                      onClick={() => !isLoading && document.getElementById('editImageInput')?.click()}
                    >
                      <i className="bi bi-image text-muted d-block mb-2" style={{ fontSize: '2rem' }}></i>
                      <div className="text-muted small">Click to upload an image</div>
                      <div className="text-muted small">(Max 5MB, JPG/PNG)</div>
                    </div>
                    <input
                      id="editImageInput"
                      name="editImageInput"
                      type="file"
                      className="d-none"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditPostModal;
