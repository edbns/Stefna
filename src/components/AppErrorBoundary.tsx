import React from 'react';

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode }, 
  { hasError: boolean; err?: any }
> {
  state = { hasError: false, err: undefined as any };
  
  static getDerivedStateFromError(err: any) { 
    return { hasError: true, err }; 
  }
  
  componentDidCatch(err: any, info: any) { 
    console.error('💥 App crashed:', err, info); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: 16, 
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ color: '#d32f2f', marginBottom: 16 }}>Something went wrong.</h2>
          <details style={{ 
            backgroundColor: 'white', 
            padding: 16, 
            borderRadius: 8, 
            border: '1px solid #ddd',
            maxWidth: '80vw',
            overflow: 'auto'
          }}>
            <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Error Details</summary>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '12px',
              color: '#666'
            }}>
              {String(this.state.err?.message || this.state.err)}
            </pre>
            {this.state.err?.stack && (
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontSize: '10px',
                color: '#999',
                marginTop: 8
              }}>
                {this.state.err.stack}
              </pre>
            )}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: 16,
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
