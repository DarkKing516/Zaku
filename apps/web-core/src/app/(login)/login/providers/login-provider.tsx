'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { UseFormLogin } from '../use-cases/use-form-login';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { SplashLoading } from '@/components/core/SplashLoading';

export default function LoginProvider() {
  const { email, password, handleEmailChange, handlePasswordChange, login, loading, isSuccess } = UseFormLogin();
  const router = useRouter();

  if (isSuccess) {
    return <SplashLoading />;
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#7c3aed',
          borderRadius: 12,
        },
      }}
    >
      <div className="relative z-10 w-full max-w-[400px] bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-premium border border-white/40 overflow-hidden group">
        {/* Organic Bubble Decor inside the card */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary-100 rounded-full opacity-60 group-hover:scale-110 transition-transform duration-700 ease-out" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-secondary-100 rounded-full opacity-40 group-hover:scale-125 transition-transform duration-1000 ease-in-out" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-600 flex items-center justify-center mb-6 shadow-sm border border-primary-100">
            <Icon icon="line-md:account" width="32" height="32" />
          </div>

          <h1 className="text-2xl font-extrabold text-zinc-800 mb-2 tracking-tight">Inicia sesión</h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8">Zaku Enterprise</p>

          <form onSubmit={login} className="w-full space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-[0.7rem] font-bold text-zinc-500 uppercase tracking-wider ml-1">Correo Electrónico</label>
              <div className="relative flex items-center bg-zinc-50 border border-zinc-100 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-primary-400/20 focus-within:border-primary-400 group/input">
                <div className="text-zinc-400 group-focus-within/input:text-primary-500 transition-colors mr-3">
                  <Icon icon="line-md:email" width="20" height="20" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full bg-transparent text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                  placeholder="tu@ejemplo.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[0.7rem] font-bold text-zinc-500 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative flex items-center bg-zinc-50 border border-zinc-100 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-primary-400/20 focus-within:border-primary-400 group/input">
                <div className="text-zinc-400 group-focus-within/input:text-primary-500 transition-colors mr-3">
                  <Icon icon="line-md:lock" width="20" height="20" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full bg-transparent text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-500/25 transition-all duration-300 disabled:opacity-70 flex items-center justify-center transform h-14"
              >
                {loading ? (
                  <Icon icon="line-md:loading-twotone-loop" width="24" height="24" />
                ) : (
                  <span className="flex items-center gap-2">
                    Ingresar <Icon icon="line-md:arrow-right" width="18" height="18" />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Back link */}
          <div className="mt-8 text-center w-full">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-xs font-bold text-zinc-400 hover:text-primary-600 transition-colors w-full text-center flex items-center justify-center gap-1 group/back cursor-pointer"
            >
              <Icon icon="line-md:chevron-left" className="group-hover/back:-translate-x-1 transition-transform" />
              Atrás
            </button>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
