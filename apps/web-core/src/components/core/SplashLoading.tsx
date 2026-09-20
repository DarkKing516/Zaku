'use client';

import React from 'react';
import { Icon } from '@iconify/react';

export function SplashLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Background Bubbles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-100/60 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-secondary-100/40 rounded-full blur-[100px] animate-float-rev" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Spinning logo container */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center text-white glow-shadow">
            <Icon icon="line-md:loading-twotone-loop" width="40" height="40" />
          </div>
          {/* Outer ring */}
          <div className="absolute -inset-3 border-2 border-primary-200 rounded-[2rem] animate-spin-slow" />
          <div className="absolute -inset-6 border border-primary-100 rounded-[2.5rem] animate-reverse-spin-slow" />
        </div>

        <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em] mt-4">
          Cargando...
        </p>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full w-1/2 gradient-primary rounded-full animate-progress-loading" />
        </div>
      </div>
    </div>
  );
}
