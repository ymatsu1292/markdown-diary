'use client';
import { HeroUIProvider } from "@heroui/react";
import { SessionProvider } from 'next-auth/react';

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath={process.env.NEXT_PUBLIC_BASE_URL + "/api/auth"}>
      <HeroUIProvider>
	{children}
      </HeroUIProvider>
    </SessionProvider>
  );
}
