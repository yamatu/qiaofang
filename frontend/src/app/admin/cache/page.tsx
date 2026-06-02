'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { refreshAllSiteCache } from '@/lib/cache';

export default function CacheSettingsPage() {
  const [form, setForm] = useState({ api_token: '', zone_name: 'yamatu.xyz', zone_id: '' });
  const [tokenMask, setTokenMask] = useState('');
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [usingEnvToken, setUsingEnvToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadConfig = async () => {
    const res = await api.get('/admin/cache/config');
    setForm({
      api_token: '',
      zone_name: res.data.zone_name || 'yamatu.xyz',
      zone_id: res.data.zone_id || '',
    });
    setTokenMask(res.data.token_mask || '');
    setTokenConfigured(!!res.data.token_configured);
    setUsingEnvToken(!!res.data.using_env_token);
  };

  useEffect(() => {
    loadConfig().catch(() => setError('读取缓存配置失败'));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.put('/admin/cache/config', {
        api_token: form.api_token.trim(),
        zone_name: form.zone_name.trim(),
        zone_id: form.zone_id.trim(),
      });
      await loadConfig();
      setMessage('Cloudflare 配置已保存');
    } catch (err: any) {
      setError(err.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePurge = async () => {
    setPurging(true);
    setMessage('');
    setError('');
    const cacheRefreshed = await refreshAllSiteCache();
    if (cacheRefreshed) {
      setMessage('缓存已刷新');
    } else {
      setError('前台缓存已刷新，CDN刷新失败，请检查 Token 权限');
    }
    setPurging(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">缓存设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置专用于 Cloudflare 缓存刷新的 API Token。</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
            <ShieldCheck size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Token 权限要求</div>
              <div className="mt-1 text-blue-700">Cloudflare API Token 至少需要 Zone:Read 和 Zone:Cache Purge 权限。</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cloudflare API Token</label>
            <input
              type="password"
              value={form.api_token}
              onChange={e => setForm({ ...form, api_token: e.target.value })}
              placeholder={tokenConfigured ? `已配置：${tokenMask}，留空则不修改` : '粘贴 Cloudflare API Token'}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            {usingEnvToken && <p className="text-xs text-gray-500 mt-1">当前使用服务器环境变量中的 Token；保存新 Token 后会优先使用后台配置。</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
            <input
              value={form.zone_name}
              onChange={e => setForm({ ...form, zone_name: e.target.value })}
              placeholder="yamatu.xyz"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone ID（可选，填了会更快）</label>
            <input
              value={form.zone_id}
              onChange={e => setForm({ ...form, zone_id: e.target.value })}
              placeholder="Cloudflare Zone ID"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
          {message && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{message}</div>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={saving}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              <Save size={18} />
              {saving ? '保存中...' : '保存配置'}
            </button>
            <button type="button" onClick={handlePurge} disabled={purging || !tokenConfigured}
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50">
              {purging ? <RefreshCw size={18} className="animate-spin" /> : <Cloud size={18} />}
              {purging ? '刷新中...' : '测试刷新缓存'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
