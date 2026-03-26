import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/auth/AuthContext';
import InlineAlert from '../common/InlineAlert';
import { tokenStorage } from '../../utils/tokenStorage';
import { User, ApiError } from '../../types';
import apiClient from '../../api/apiClient';

interface EditProfileModalProps {
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    avatar: user?.avatar || ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only image files are allowed (JPEG, PNG, GIF, WebP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) return;

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    try {
      setStatus('loading');

      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username.trim());

      if (selectedFile) {
        formDataToSend.append('profileImage', selectedFile);
      } else if (formData.avatar.trim()) {
        formDataToSend.append('avatar', formData.avatar.trim());
      }

      const response: any = await apiClient.put('/users', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const avatarUrl = response.profileImage
        ? (response.profileImage.startsWith('http')
          ? response.profileImage
          : `${baseURL}${response.profileImage}`)
        : user.avatar;

      const updatedUser: User = {
        ...user,
        username: response.username,
        avatar: avatarUrl
      };

      updateUser(updatedUser);
      tokenStorage.setUser(updatedUser);

      setStatus('success');
      onClose();
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || 'Failed to update profile');
      setStatus('error');
    }
  };

  const isLoading = status === 'loading';

  if (!user) return null;

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex={-1}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Profile</h5>
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

                <div className="text-center mb-4">
                  <img
                    src={previewUrl || formData.avatar || user.avatar}
                    alt="Preview"
                    className="avatar-lg mb-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = user.avatar || '';
                    }}
                  />

                  <div className="d-flex justify-content-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={handleFileButtonClick}
                      disabled={isLoading}
                    >
                      <i className="bi bi-upload me-1"></i>
                      Choose Photo
                    </button>

                    {(selectedFile || previewUrl) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleRemoveImage}
                        disabled={isLoading}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    id="profileImageFile"
                    name="profileImageFile"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  {selectedFile && (
                    <small className="text-muted d-block mt-2">
                      Selected: {selectedFile.name}
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="avatar" className="form-label">
                    Avatar URL <span className="text-muted">(optional alternative)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                    disabled={isLoading || !!selectedFile}
                    autoComplete="url"
                  />
                  <small className="text-muted">
                    Or use the "Choose Photo" button above to upload from your device
                  </small>
                </div>
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

export default EditProfileModal;
