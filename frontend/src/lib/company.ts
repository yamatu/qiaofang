'use client';

import { useEffect, useState } from 'react';
import api from './api';
import { API_BASE_URL } from './constants';

export interface CompanyInfo {
  about_text?: string;
  phone?: string;
  email?: string;
  address?: string;
  wechat_qr?: string;
  logo_url?: string;
  logo_small_url?: string;
  about_image?: string;
  hero_image?: string;
  logo_width?: number;
  logo_height?: number;
  about_banner?: string;
  products_banner?: string;
  certificates_banner?: string;
  news_banner?: string;
  contact_banner?: string;
}

let cachedCompanyInfo: CompanyInfo | null = null;
let pendingCompanyInfo: Promise<CompanyInfo> | null = null;

export function getAssetUrl(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

export function fetchCompanyInfo() {
  if (cachedCompanyInfo) return Promise.resolve(cachedCompanyInfo);
  if (!pendingCompanyInfo) {
    pendingCompanyInfo = api.get('/company').then(res => {
      cachedCompanyInfo = (res.data || {}) as CompanyInfo;
      return cachedCompanyInfo;
    }).catch(() => ({})).finally(() => {
      pendingCompanyInfo = null;
    });
  }
  return pendingCompanyInfo;
}

export function updateCompanyInfoCache(info: CompanyInfo) {
  cachedCompanyInfo = info;
  pendingCompanyInfo = null;
}

export function clearCompanyInfoCache() {
  cachedCompanyInfo = null;
  pendingCompanyInfo = null;
}

export function useCompanyInfo() {
  const [info, setInfo] = useState<CompanyInfo>(cachedCompanyInfo || {});
  const [loaded, setLoaded] = useState(!!cachedCompanyInfo);

  useEffect(() => {
    let mounted = true;
    fetchCompanyInfo().then(data => {
      if (mounted) {
        setInfo(data);
        setLoaded(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { info, loaded };
}
