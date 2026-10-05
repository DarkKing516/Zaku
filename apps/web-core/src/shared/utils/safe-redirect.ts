import { DEFAULT_ROUTE } from '../constants';

export function safeRedirectPath(target: string | null | undefined, fallback = DEFAULT_ROUTE): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
    return fallback;
  }
  return target;
}
