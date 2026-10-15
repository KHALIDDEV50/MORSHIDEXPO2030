export { cn } from './cn';
// Client-only hooks are imported from their own modules (e.g. '@/shared/lib/use-media-query')
// so server components that use `cn` never pull in client code.
