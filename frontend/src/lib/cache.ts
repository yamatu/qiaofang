'use client';

import api from './api';
import { clearCompanyInfoCache } from './company';

const siteRefreshListeners = new Set<() => void>();
const siteRefreshStorageKey = 'qiaofang_site_refresh_version';
const siteRefreshBroadcastChannel = 'qiaofang_site_refresh';
let siteRefreshListenersBound = false;
let siteRefreshChannel: BroadcastChannel | null = null;

function bindSiteRefreshListeners() {
  if (siteRefreshListenersBound || typeof window === 'undefined') return;
  siteRefreshListenersBound = true;

  window.addEventListener('storage', (event) => {
    if (event.key === siteRefreshStorageKey) {
      siteRefreshListeners.forEach(listener => listener());
    }
  });

  if ('BroadcastChannel' in window) {
    siteRefreshChannel = new BroadcastChannel(siteRefreshBroadcastChannel);
    siteRefreshChannel.onmessage = () => {
      siteRefreshListeners.forEach(listener => listener());
    };
  }
}

function broadcastSiteRefresh() {
  if (typeof window === 'undefined') return;
  const version = String(Date.now());
  try {
    localStorage.setItem(siteRefreshStorageKey, version);
  } catch {}

  if ('BroadcastChannel' in window) {
    try {
      const channel = siteRefreshChannel || new BroadcastChannel(siteRefreshBroadcastChannel);
      channel.postMessage(version);
      if (!siteRefreshChannel) channel.close();
    } catch {}
  }
}

export function subscribeSiteRefresh(listener: () => void) {
  bindSiteRefreshListeners();
  siteRefreshListeners.add(listener);
  return () => {
    siteRefreshListeners.delete(listener);
  };
}

export async function purgeSiteCache(paths?: string[]) {
  clearCompanyInfoCache();
  return api.post('/admin/cache/purge', {
    purge_everything: !paths || paths.length === 0,
    paths,
  });
}

export async function refreshAllSiteCache() {
  let refreshed = false;
  try {
    await purgeSiteCache();
    refreshed = true;
  } catch {
    refreshed = false;
  } finally {
    broadcastSiteRefresh();
  }
  return refreshed;
}
