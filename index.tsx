import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress harmless play() interruption errors from react-player/video elements
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason.message === 'string') {
    const msg = event.reason.message;
    if (msg.includes('The play() request was interrupted') || msg.includes('play() failed')) {
      event.preventDefault();
    }
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
