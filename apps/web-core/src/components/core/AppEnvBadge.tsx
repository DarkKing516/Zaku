'use client';

import React from 'react';

/**
 * Muestra una insignia flotante con el entorno actual (dev/staging/prod)
 * para que los desarrolladores sepan en qué ambiente están trabajando.
 * Solo se muestra si NEXT_PUBLIC_APP_ENV es diferente de 'production'.
 */
export function AppEnvBadge() {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'development';

  if (env === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] px-3 py-1.5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold uppercase tracking-wider shadow-lg">
      {env}
    </div>
  );
}
