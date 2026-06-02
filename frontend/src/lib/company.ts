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
const companyInfoListeners = new Set<() => void>();
const companyInfoStorageKey = 'qiaofang_company_info_version';
const companyInfoBroadcastChannel = 'qiaofang_company_info';
let broadcastListenersBound = false;
let companyInfoChannel: BroadcastChannel | null = null;

export function getAssetUrl(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

export function fetchCompanyInfo(options?: { force?: boolean }) {
  if (!options?.force && cachedCompanyInfo) return Promise.resolve(cachedCompanyInfo);
  if (options?.force) pendingCompanyInfo = null;
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

function bindBroadcastListeners() {
  if (broadcastListenersBound || typeof window === 'undefined') return;
  broadcastListenersBound = true;

  window.addEventListener('storage', event => {
    if (event.key === companyInfoStorageKey) {
      clearCompanyInfoCache({ broadcast: false, notify: true });
    }
  });

  if ('BroadcastChannel' in window) {
    companyInfoChannel = new BroadcastChannel(companyInfoBroadcastChannel);
    companyInfoChannel.onmessage = () => {
      clearCompanyInfoCache({ broadcast: false, notify: true });
    };
  }
}

function notifyCompanyInfoListeners() {
  companyInfoListeners.forEach(listener => listener());
}

function broadcastCompanyInfoChange() {
  if (typeof window === 'undefined') return;

  const version = String(Date.now());
  try {
    localStorage.setItem(companyInfoStorageKey, version);
  } catch {}

  if ('BroadcastChannel' in window) {
    try {
      const channel = companyInfoChannel || new BroadcastChannel(companyInfoBroadcastChannel);
      channel.postMessage(version);
      if (!companyInfoChannel) channel.close();
    } catch {}
  }
}

export function updateCompanyInfoCache(info: CompanyInfo, options: { broadcast?: boolean; notify?: boolean } = {}) {
  cachedCompanyInfo = info;
  pendingCompanyInfo = null;
  if (options.notify !== false) notifyCompanyInfoListeners();
  if (options.broadcast !== false) broadcastCompanyInfoChange();
}

export function clearCompanyInfoCache(options: { broadcast?: boolean; notify?: boolean } = {}) {
  cachedCompanyInfo = null;
  pendingCompanyInfo = null;
  if (options.notify !== false) notifyCompanyInfoListeners();
  if (options.broadcast !== false) broadcastCompanyInfoChange();
}

function subscribeCompanyInfo(listener: () => void) {
  bindBroadcastListeners();
  companyInfoListeners.add(listener);
  return () => {
    companyInfoListeners.delete(listener);
  };
}

export function useCompanyInfo() {
  const [info, setInfo] = useState<CompanyInfo>(cachedCompanyInfo || {});
  const [loaded, setLoaded] = useState(!!cachedCompanyInfo);

  useEffect(() => {
    let mounted = true;
    const load = (force = false) => {
      fetchCompanyInfo({ force }).then(data => {
        if (mounted) {
          setInfo(data);
          setLoaded(true);
        }
      });
    };
    const unsubscribe = subscribeCompanyInfo(() => {
      if (mounted) {
        setLoaded(false);
        load();
      }
    });

    load();
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { info, loaded };
}
