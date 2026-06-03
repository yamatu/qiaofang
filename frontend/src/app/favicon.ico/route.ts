import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type CompanyInfo = {
  logo_small_url?: string;
  logo_url?: string;
};

const faviconHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

function iconMimeType(url: string) {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.svg')) return 'image/svg+xml';
  if (cleanUrl.endsWith('.png')) return 'image/png';
  if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) return 'image/jpeg';
  if (cleanUrl.endsWith('.webp')) return 'image/webp';
  if (cleanUrl.endsWith('.ico')) return 'image/x-icon';
  return 'image/png';
}

function fallbackIcon() {
  return new NextResponse(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#2563eb"/>
      <text x="32" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#fff">Q</text>
    </svg>`,
    {
      headers: {
        ...faviconHeaders,
        'Content-Type': 'image/svg+xml',
      },
    },
  );
}

function companyApiCandidates(request: NextRequest) {
  const configuredApi = process.env.NEXT_PUBLIC_API_URL || '/api';
  const candidates: string[] = [];

  if (/^https?:\/\//.test(configuredApi)) {
    candidates.push(new URL('/api/company', configuredApi.replace(/\/api\/?$/, '')).toString());
  } else {
    candidates.push(new URL('/api/company', request.url).toString());
  }

  candidates.push('http://backend:9580/api/company');
  candidates.push('http://localhost:9580/api/company');
  candidates.push('http://localhost:8080/api/company');

  return Array.from(new Set(candidates));
}

function assetUrl(path: string, companyApiUrl: string) {
  if (/^https?:\/\//.test(path)) return path;
  const apiUrl = new URL(companyApiUrl);
  return `${apiUrl.origin}${path.startsWith('/') ? path : `/${path}`}`;
}

async function getCompanyIcon(request: NextRequest) {
  for (const candidate of companyApiCandidates(request)) {
    try {
      const response = await fetch(candidate, { cache: 'no-store' });
      if (!response.ok) continue;
      const info = (await response.json()) as CompanyInfo;
      const iconPath = info.logo_small_url || info.logo_url;
      if (iconPath) return assetUrl(iconPath, candidate);
    } catch {}
  }

  return '';
}

export async function GET(request: NextRequest) {
  const iconUrl = await getCompanyIcon(request);
  if (!iconUrl) return fallbackIcon();

  try {
    const response = await fetch(iconUrl, { cache: 'no-store' });
    if (!response.ok) return fallbackIcon();

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        ...faviconHeaders,
        'Content-Type': response.headers.get('content-type') || iconMimeType(iconUrl),
      },
    });
  } catch {
    return fallbackIcon();
  }
}
