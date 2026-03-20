import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string | null;
  action?: ReactNode | null;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title = 'No items found',
  description = null,
  action = null
}) => {
  return (
    <div className="text-center py-5">
      <div className={`bi bi-${icon} text-muted`} style={{ fontSize: '4rem' }}></div>
      <h5 className="mt-3 text-muted">{title}</h5>
      {description && <p className="text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};


export default EmptyState;
