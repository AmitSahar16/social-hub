import React from 'react';

interface InlineAlertProps {
  type?: 'success' | 'danger' | 'warning' | 'info';
  message?: string | { message?: string } | null;
  onDismiss?: (() => void) | null;
  isVisible?: boolean; 
}

const InlineAlert: React.FC<InlineAlertProps> = ({ type = 'danger', message, onDismiss = null, isVisible }) => {
  if (isVisible === false) return null; 
  if (!message) return null;

  const messageText = typeof message === 'string' ? message : message.message || 'An error occurred';
  const alertClass = `alert alert-${type} ${onDismiss ? 'alert-dismissible' : ''} fade show`;

  return (
    <div className={alertClass} role="alert">
      {messageText}
      {onDismiss && (
        <button
          type="button"
          className="btn-close"
          onClick={onDismiss}
          aria-label="Close"
        ></button>
      )}
    </div>
  );
};

export default InlineAlert;
