import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handlers for debugging
window.addEventListener('error', (event) => {
  console.error('[inmem-memo global error]', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[inmem-memo unhandled rejection]', event.reason);
});

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[inmem-memo React Crash]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="global-error-screen">
          <div className="global-error-card">
            <h2 className="global-error-title">⚠️ アプリケーションエラーが発生しました</h2>
            <p className="global-error-desc">
              レンダリング中にエラーが発生しました。以下のログを確認してください。
            </p>
            <div className="global-error-details">
              <pre className="global-error-stack">
                {this.state.error?.stack || this.state.error?.toString() || 'Unknown error'}
                {this.state.errorInfo?.componentStack ? `\n\nComponent Stack:${this.state.errorInfo.componentStack}` : ''}
              </pre>
            </div>
            <button className="btn btn-primary" onClick={this.handleReload} style={{ alignSelf: 'flex-start' }}>
              アプリを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
