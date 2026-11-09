import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  // Seamless hydration architecture:
  // 1. If edge-injected dynamic fallback content is detected, mount with createRoot to avoid hydration mismatches
  // 2. If full static SSR markup is present, hydrate cleanly with hydrateRoot
  // 3. Otherwise mount with createRoot
  if (rootElement.querySelector('.sanctuary-ssr-content')) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } else if (rootElement.hasChildNodes()) {
    hydrateRoot(
      rootElement,
      <StrictMode>
        <App />
      </StrictMode>
    );
  } else {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}
