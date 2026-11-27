/**
 * Resets window and root element scroll offsets immediately and on the next
 * animation frame so async view height reductions never strand Safari/WebKit
 * partway down newly opened detail or directory pages.
 */
export function resetScrollToTop(): void {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}
