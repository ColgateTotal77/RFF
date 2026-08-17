import React, { PropsWithChildren } from 'react';

interface State {
  hasError: boolean;
}

interface Props {
  fallback: React.ReactNode;
}

export class ErrorBoundary extends React.Component<PropsWithChildren<Props>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
