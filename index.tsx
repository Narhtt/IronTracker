import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, MemoryRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// In blob/sandboxed environments (like previews), HashRouter triggers
// "Location.assign: Access denied" errors. MemoryRouter avoids touching window.location.
const isSandboxed = window.location.protocol === 'blob:' || window.location.origin === 'null';
const Router = isSandboxed ? MemoryRouter : HashRouter;

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
