import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  // Seamless hydration support: if pre-rendered HTML exists from SSR/SSG, hydrate it; otherwise mount with createRoot
  if (rootElement.hasChildNodes()) {
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
