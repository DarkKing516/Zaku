'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { BackgroundBubbles } from '@/components/landing/Bubbles';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      <BackgroundBubbles />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center text-white glow-shadow mb-8">
          <Icon icon="line-md:star-pulsating-twotone-loop" width="40" height="40" />
        </div>

        <h1 className="text-5xl font-extrabold text-zinc-800 tracking-tight mb-4">
          Zaku <span className="gradient-text">Enterprise</span>
        </h1>

        <p className="text-lg text-zinc-500 mb-10 max-w-md leading-relaxed">
          Plataforma empresarial multi-tenant. Gestiona tu negocio con herramientas modernas y seguras.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/login')}
            className="cursor-pointer px-8 py-4 gradient-primary text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            Comenzar <Icon icon="line-md:arrow-right" width="18" height="18" />
          </button>
        </div>
      </div>

      {/* Footer badge */}
      <div className="absolute bottom-6 text-xs text-zinc-400 tracking-widest uppercase font-bold">
        Powered by Zaku
      </div>
    </div>
  );
}
