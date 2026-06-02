'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { subscribeSiteRefresh } from '@/lib/cache';

export default function SiteRefreshListener() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    const unsubscribe = subscribeSiteRefresh(() => {
      window.location.reload();
    });

    return unsubscribe;
  }, [pathname]);

  return null;
}
