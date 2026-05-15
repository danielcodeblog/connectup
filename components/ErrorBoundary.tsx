import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-zinc-100 p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Something went wrong</h1>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
              An unexpected error occurred. We've been notified and are looking into it.
            </p>

            <div className="space-y-3">
              <Button 
                onClick={this.handleReset}
                className="w-full h-12 rounded-2xl flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full h-12 rounded-2xl border-zinc-200 text-zinc-600 flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Go to Home
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-red-600 whitespace-pre-wrap">
                  {this.state.error?.stack}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
