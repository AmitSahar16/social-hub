import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="card shadow-sm" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="card-body text-center p-5">
              <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
              <h3 className="mt-4 mb-3">Oops! Something went wrong</h3>
              <p className="text-muted mb-4">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              {this.state.error && (
                <div className="alert alert-light text-start mb-4">
                  <small className="text-muted font-monospace">
                    {this.state.error.toString()}
                  </small>
                </div>
              )}
              <button
                className="btn btn-primary"
                onClick={this.handleReset}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
