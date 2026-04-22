import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress harmless play() interruption errors from react-player/video elements
// This is a known browser quirk where a pause() call interrupts a pending play() promise.
const originalError = console.error;
console.error = (...args) => {
  const isPlaybackError = args.some(arg => {
    if (typeof arg === 'string' && (
      arg.includes('play() request was interrupted') || 
      arg.includes('play() failed') ||
      arg.includes('pause() interrupted')
    )) return true;
    if (arg instanceof Error && (
      arg.message?.includes('play() request was interrupted') ||
      arg.name === 'AbortError'
    )) return true;
    return false;
  });

  if (isPlaybackError) return;
  originalError.apply(console, args);
};

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
