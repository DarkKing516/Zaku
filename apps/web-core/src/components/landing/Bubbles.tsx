'use client';

import React from 'react';

export function BackgroundBubbles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-100/60 rounded-full blur-3xl animate-float" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-secondary-100/40 rounded-full blur-[100px] animate-float-rev" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-tertiary-100/30 rounded-full blur-[80px] animate-float" />
      <div className="absolute top-1/2 left-0 w-40 h-40 bg-primary-200/20 rounded-full blur-2xl animate-float-rev" />
    </div>
  );
}
