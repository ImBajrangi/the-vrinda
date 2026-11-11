import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Enable instantaneous :active touch feedback on iOS Safari
if (typeof window !== 'undefined') {
  document.addEventListener('touchstart', () => {}, { passive: true });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  // Phase 2.2 Seamless Hydration & Zero-Flicker Architecture:
  // 1. If edge-injected dynamic fallback content is detected:
  //    React 19's createRoot() inherently clears rootElement.innerHTML upon first render.
  //    To prevent content flicker or a sudden flash while lazy chunks load,
  //    detach the SSR article into a graceful preview wrapper outside #root.
  //    Mount React cleanly with createRoot (zero hydration mismatch errors),
  //    and smoothly dismiss the preview once React renders.
  const ssrEl = rootElement.querySelector<HTMLElement>('.sanctuary-ssr-content');
  if (ssrEl) {
    const previewWrapper = document.createElement('div');
    previewWrapper.id = 'sanctuary-ssr-preview';
    previewWrapper.style.cssText = 'position: relative; width: 100%; z-index: 10;';
    previewWrapper.appendChild(ssrEl);
    rootElement.parentNode?.insertBefore(previewWrapper, rootElement);

    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    const dismissPreview = () => {
      previewWrapper.style.transition = 'opacity 240ms ease-out';
      previewWrapper.style.opacity = '0';
      setTimeout(() => {
        if (previewWrapper.parentNode) {
          previewWrapper.remove();
        }
      }, 250);
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(dismissPreview, { timeout: 1200 });
    } else {
      setTimeout(dismissPreview, 500);
    }
  } else if (rootElement.hasChildNodes()) {
    // 2. Full SSG pre-rendered complete component tree: hydrate cleanly with hydrateRoot
    hydrateRoot(
      rootElement,
      <StrictMode>
        <App />
      </StrictMode>
    );
  } else {
    // 3. Clean client mount
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}
