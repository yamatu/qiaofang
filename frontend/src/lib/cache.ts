'use client';

import api from './api';
import { clearCompanyInfoCache } from './company';

export async function purgeSiteCache(paths?: string[]) {
  clearCompanyInfoCache();
  return api.post('/admin/cache/purge', {
    purge_everything: !paths || paths.length === 0,
    paths,
  });
}
