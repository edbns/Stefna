import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export class AppErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: { hasError: false, err: null }
        });
    }
    static getDerivedStateFromError(err) {
        return { hasError: true, err };
    }
    componentDidCatch(err, info) {
        console.error('💥 App crashed:', err, info);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { style: {
                    padding: 16,
                    fontFamily: 'system-ui, sans-serif',
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }, children: [_jsx("h2", { style: { color: '#d32f2f', marginBottom: 16 }, children: "Something went wrong." }), _jsxs("details", { style: {
                            backgroundColor: 'white',
                            padding: 16,
                            borderRadius: 8,
                            border: '1px solid #ddd',
                            maxWidth: '80vw',
                            overflow: 'auto'
                        }, children: [_jsx("summary", { style: { cursor: 'pointer', marginBottom: 8 }, children: "Error Details" }), _jsx("pre", { style: {
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '12px',
                                    color: '#666'
                                }, children: String(this.state.err?.message || this.state.err) }), this.state.err?.stack && (_jsx("pre", { style: {
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '10px',
                                    color: '#999',
                                    marginTop: 8
                                }, children: this.state.err.stack }))] }), _jsx("button", { onClick: () => window.location.reload(), style: {
                            marginTop: 16,
                            padding: '8px 16px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }, children: "Reload Page" })] }));
        }
        return this.props.children;
    }
}
