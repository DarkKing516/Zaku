import { cn } from '@/shared/utils/cn';

describe('cn', () => {
  it('joins conditional classes and lets the last conflicting Tailwind class win', () => {
    const isActive = true;

    expect(cn('px-4 text-sm', isActive && 'font-bold', undefined, 'px-6')).toBe('text-sm font-bold px-6');
  });
});
