'use client';

import { useEffect } from 'react';
import { getAssetUrl, useCompanyInfo } from '@/lib/company';

const defaultFavicon = '/favicon.ico';

function iconMimeType(url: string) {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.svg')) return 'image/svg+xml';
  if (cleanUrl.endsWith('.png')) return 'image/png';
  if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) return 'image/jpeg';
  if (cleanUrl.endsWith('.webp')) return 'image/webp';
  if (cleanUrl.endsWith('.ico')) return 'image/x-icon';
  return 'image/png';
}

function withVersion(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

function ensureIconLink(rel: string, href: string, type: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[data-dynamic-favicon="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('data-dynamic-favicon', rel);
    document.head.appendChild(link);
  }

  link.rel = rel;
  link.href = href;
  link.type = type;
}

export default function FaviconSync() {
  const { info } = useCompanyInfo();

  useEffect(() => {
    const iconUrl = info.logo_small_url ? getAssetUrl(info.logo_small_url) : defaultFavicon;
    const href = info.logo_small_url ? withVersion(iconUrl) : iconUrl;
    const type = iconMimeType(iconUrl);

    document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]').forEach(link => {
      link.href = href;
      link.type = type;
    });

    ensureIconLink('icon', href, type);
    ensureIconLink('shortcut icon', href, type);
    ensureIconLink('apple-touch-icon', href, type);
  }, [info]);

  return null;
}
