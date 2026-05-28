import api from './api';

export async function purgeSiteCache(paths?: string[]) {
  return api.post('/admin/cache/purge', {
    purge_everything: !paths || paths.length === 0,
    paths,
  });
}
