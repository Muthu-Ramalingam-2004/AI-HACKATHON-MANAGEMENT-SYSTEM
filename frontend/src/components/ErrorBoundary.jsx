import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div class="min-h-[400px] flex flex-col items-center justify-center p-6 bg-slate-900/30 border border-slate-800 rounded-3xl text-center space-y-4">
          <div class="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle class="h-6 w-6" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Something went wrong</h3>
            <p class="text-xs text-slate-400 mt-1 max-w-md">
              An unexpected error occurred while rendering this component.
            </p>
            {this.state.error?.message && (
              <pre class="mt-3 p-3 bg-slate-950/60 rounded-xl text-[10px] font-mono text-rose-300 max-w-lg overflow-x-auto text-left">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            class="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer"
          >
            <RotateCcw class="h-3.5 w-3.5 mr-1.5" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
