'use client';
import { NextUIProvider } from '@nextui-org/react';
import { SessionProvider } from 'next-auth/react';

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath={process.env.NEXT_PUBLIC_BASE_URL + "/api/auth"}>
      <NextUIProvider>
	{children}
      </NextUIProvider>
    </SessionProvider>
  );
}
