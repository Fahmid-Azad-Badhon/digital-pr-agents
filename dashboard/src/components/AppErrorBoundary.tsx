'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Unexpected application error.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#111827] p-6">
          <div className="max-w-xl w-full rounded-xl border border-[#334155] bg-[#1E293B] p-6">
            <h1 className="text-xl font-semibold text-white mb-3">Dashboard Error</h1>
            <p className="text-sm text-[#94A3B8] mb-4">
              The UI hit an unexpected state. Your files are safe. Reload to recover.
            </p>
            <p className="text-xs text-[#64748B] mb-6 break-all">{this.state.message}</p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
