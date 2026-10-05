export function BackgroundBubbles() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-32 -top-32 size-96 animate-float rounded-full bg-primary-100/60 blur-3xl" />
      <div className="absolute right-0 top-1/4 size-80 animate-float-reverse rounded-full bg-secondary-100/40 blur-[100px]" />
      <div className="absolute bottom-0 left-1/3 size-72 animate-float rounded-full bg-tertiary-100/30 blur-[80px]" />
      <div className="absolute left-0 top-1/2 size-40 animate-float-reverse rounded-full bg-primary-200/20 blur-2xl" />
    </div>
  );
}
