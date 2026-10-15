/**
 * Sign-in gate (PRD §4.7 guest mode): any action that needs an account calls `requestSignIn()`
 * and continues only when it resolves `true`. The auth feature registers the handler (it opens
 * the sign-in sheet), so gated features never import the auth feature directly (FSD).
 * Demo/mock auth only — the real backend must enforce access server-side.
 */
type Handler = () => Promise<boolean>;
let handler: Handler | null = null;

export function registerSignInHandler(next: Handler): () => void {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
}

/** Opens the sign-in sheet; true once the visitor signed in, false if they closed it. */
export function requestSignIn(): Promise<boolean> {
  return handler ? handler() : Promise.resolve(false);
}
