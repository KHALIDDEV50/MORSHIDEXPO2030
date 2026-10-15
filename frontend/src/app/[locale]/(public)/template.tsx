import type { ReactNode } from 'react';

/**
 * Re-mounted on every public navigation, so each page enters with a short fade
 * (globals `animate-fade-in`; reduced motion makes it instant).
 */
export default function PublicTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
