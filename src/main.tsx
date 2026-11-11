import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Enable instantaneous :active touch feedback on iOS Safari
if (typeof window !== 'undefined') {
  document.addEventListener('touchstart', () => {}, { passive: true });
}

const rootElement = document.getElementById('root');
const seoPrerender = document.getElementById('seo-prerender');

if (rootElement) {
  // Edge Pre-render Dismisser:
  // If Cloudflare Edge injected semantic HTML into #seo-prerender for Googlebot/AI,
  // gracefully fade it out once React's interactive client loads.
  if (seoPrerender && seoPrerender.hasChildNodes()) {
    const dismissSeoPrerender = () => {
      seoPrerender.style.transition = 'opacity 200ms ease-out';
      seoPrerender.style.opacity = '0';
      setTimeout(() => {
        seoPrerender.style.display = 'none';
      }, 200);
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(dismissSeoPrerender, { timeout: 1000 });
    } else {
      setTimeout(dismissSeoPrerender, 400);
    }
  }

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
    // 2. Full SSG pre-rendered complete component tree:
    // Determine whether server-rendered shell matches the client initial route
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const isPathDomain = host === 'path.vrindopnishad.in' || host.startsWith('path.');
    const qTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;

    // index.html is statically generated for bhav/smaran tab.
    // If the client loads on path.vrindopnishad.in without ?tab=smaran,
    // the client's initial tab will be granthas.
    // In that case, mount cleanly with createRoot to prevent React 19 hydration mismatch (#418).
    const isMismatchedShell = isPathDomain && qTab !== 'smaran';

    if (isMismatchedShell) {
      createRoot(rootElement).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    } else {
      hydrateRoot(
        rootElement,
        <StrictMode>
          <App />
        </StrictMode>
      );
    }
  } else {
    // 3. Clean client mount
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}
