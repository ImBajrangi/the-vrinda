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
  // cleanly remove it on the next animation frame once React mounts into #root.
  if (seoPrerender) {
    const removeSeoPrerender = () => {
      if (seoPrerender.parentNode) {
        seoPrerender.remove();
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(removeSeoPrerender));
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

    let dismissed = false;
    const dismissPreview = () => {
      if (dismissed) return;
      dismissed = true;
      previewWrapper.style.transition = 'opacity 240ms ease-out';
      previewWrapper.style.opacity = '0';
      setTimeout(() => {
        if (previewWrapper.parentNode) {
          previewWrapper.remove();
        }
      }, 250);
    };

    if ((window as any).__VRINDOPNISAD_HYDRATED__) {
      requestAnimationFrame(dismissPreview);
    } else {
      window.addEventListener(
        'vrindopnisad:hydrated',
        () => requestAnimationFrame(dismissPreview),
        { once: true }
      );
      setTimeout(dismissPreview, 4000);
    }
  } else if (rootElement.hasChildNodes()) {
    // 2. Full SSG pre-rendered complete component tree:
    // Determine whether server-rendered shell matches the client initial route
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : '';
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isPathDomain = host === 'path.vrindopnishad.in' || host.startsWith('path.');
    const qTab = params ? params.get('tab') : null;

    const hasNonHomeQuery = Boolean(
      params &&
        ((qTab && qTab !== 'smaran') ||
          params.get('pad') ||
          params.get('author') ||
          params.get('grantha') ||
          params.get('chapter') ||
          params.get('ritual') ||
          params.get('place') ||
          params.get('story') ||
          params.get('bio'))
    );

    const isStaticSmaranRoute =
      !isPathDomain &&
      !hasNonHomeQuery &&
      (pathname === '' || pathname === '/smaran' || pathname === '/vrindavan-ashtayama-seva-darshan-timings');

    // Static index.html is pre-rendered for the synchronous Home Sanctuary (smaran) shell.
    // On any other domain, query-routed tab, or lazy-loaded deep route, mount cleanly with createRoot
    // to prevent React 19 hydration mismatches (#418).
    if (!isStaticSmaranRoute) {
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
