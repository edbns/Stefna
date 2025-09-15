import React from 'react';

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode }, 
  { hasError: boolean; err?: any }
> {
  state: { hasError: boolean; err?: any } = { hasError: false, err: null };
  
  static getDerivedStateFromError(err: any) { 
    return { hasError: true, err }; 
  }
  
  componentDidCatch(err: any, info: any) { 
    console.error('💥 App crashed:', err, info); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold mb-6">
              Something went wrong.
            </h1>
            
            <p className="text-lg mb-2">
              It's not you. It's us.
            </p>
            <p className="text-lg mb-8">
              Please try reloading — or come back later.
            </p>
            
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Try Again
            </button>
            
            <p className="text-sm text-gray-400 mt-8">
              Access may be limited during early beta.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
