'use client';

import { useEffect } from 'react';

/**
 * Puts `site-public` on <html> while a public page is open, so the public site's warm tokens
 * (light or dark, following the shared next-themes `.dark` class) also reach portals (menus,
 * sheets) and the page canvas. The shell wrapper carries the same class for the first server
 * render. Removed again when navigating into the product, which keeps its own tokens — the
 * visitor's theme choice itself is shared, never overridden.
 */
export function SitePalette() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('site-public');
    return () => root.classList.remove('site-public');
  }, []);
  return null;
}
