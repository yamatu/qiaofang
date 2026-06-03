'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Eye,
  EyeOff,
  FileJson,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '@/lib/api';
import { refreshAllSiteCache } from '@/lib/cache';

type ContentSection = {
  id: number;
  page_key: string;
  section_key: string;
  title: string;
  subtitle: string;
  body: string;
  items: string[];
  sort_order: number;
  active: boolean;
  updated_at?: string;
};

type ContentForm = {
  page_key: string;
  section_key: string;
  title: string;
  subtitle: string;
  body: string;
  itemsText: string;
  sort_order: number;
  active: boolean;
};

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const emptyForm: ContentForm = {
  page_key: 'about',
  section_key: '',
  title: '',
  subtitle: '',
  body: '',
  itemsText: '',
  sort_order: 0,
  active: true,
};

const pageOptions = [
  { key: '', label: '全部页面' },
  { key: 'about', label: '关于我们' },
  { key: 'products', label: '产品中心' },
  { key: 'quality', label: '品质与认证' },
];

function apiErrorText(error: unknown) {
  return (error as ApiError).response?.data?.error || '';
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function toForm(section: ContentSection): ContentForm {
  return {
    page_key: section.page_key || 'about',
    section_key: section.section_key || '',
    title: section.title || '',
    subtitle: section.subtitle || '',
    body: section.body || '',
    itemsText: (section.items || []).join('\n'),
    sort_order: section.sort_order || 0,
    active: section.active,
  };
}

function toPayload(form: ContentForm) {
  return {
    page_key: form.page_key.trim(),
    section_key: form.section_key.trim(),
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    body: form.body.trim(),
    items: form.itemsText.split('\n').map(item => item.trim()).filter(Boolean),
    sort_order: Number(form.sort_order) || 0,
    active: form.active,
  };
}

export default function ContentPage() {
  const [items, setItems] = useState<ContentSection[]>([]);
  const [pageFilter, setPageFilter] = useState('');
  const [editing, setEditing] = useState<ContentSection | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/content-sections', {
        params: pageFilter ? { page: pageFilter } : undefined,
      });
      setItems(res.data || []);
    } catch (err: unknown) {
      setError(apiErrorText(err) || '内容加载失败，请刷新后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchItems();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageFilter]);

  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, ContentSection[]>>((acc, item) => {
      if (!acc[item.page_key]) acc[item.page_key] = [];
      acc[item.page_key].push(item);
      return acc;
    }, {});
  }, [items]);

  const setField = <K extends keyof ContentForm>(field: K, value: ContentForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, page_key: pageFilter || 'about' });
    setError('');
    setMessage('');
    setOpen(true);
  };

  const openEdit = (section: ContentSection) => {
    setEditing(section);
    setForm(toForm(section));
    setError('');
    setMessage('');
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = toPayload(form);
    if (!payload.page_key || !payload.section_key || !payload.title) {
      setError('请填写页面标识、区块标识和标题');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editing) {
        await api.put(`/admin/content-sections/${editing.id}`, payload);
      } else {
        await api.post('/admin/content-sections', payload);
      }
      await fetchItems();
      setOpen(false);
      setEditing(null);
      const cacheRefreshed = await refreshAllSiteCache();
      setMessage(cacheRefreshed ? '网页内容已保存，前台缓存已刷新' : '网页内容已保存，前台缓存已刷新，CDN刷新失败');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '保存失败，请检查区块标识是否重复');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (section: ContentSection) => {
    if (!confirm(`确定删除「${section.title}」吗？`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/admin/content-sections/${section.id}`);
      await fetchItems();
      const cacheRefreshed = await refreshAllSiteCache();
      setMessage(cacheRefreshed ? '网页内容已删除，前台缓存已刷新' : '网页内容已删除，前台缓存已刷新，CDN刷新失败');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '删除失败，请稍后重试');
    }
  };

  const toggleActive = async (section: ContentSection) => {
    setError('');
    setMessage('');
    try {
      await api.put(`/admin/content-sections/${section.id}`, {
        ...section,
        active: !section.active,
      });
      await fetchItems();
      const cacheRefreshed = await refreshAllSiteCache();
      setMessage(cacheRefreshed ? '显示状态已更新，前台缓存已刷新' : '显示状态已更新，前台缓存已刷新，CDN刷新失败');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '状态更新失败');
    }
  };

  const handleExport = async () => {
    setSyncing(true);
    setError('');
    setMessage('');
    try {
      const res = await api.get('/admin/content-sync/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qiaofang-content-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage('内容同步包已导出，可在生产环境后台导入');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '导出失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm('导入会替换当前所有网页补充内容，但不会影响产品、新闻、证书、图片和留言。确定继续？')) return;

    setSyncing(true);
    setError('');
    setMessage('');
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await api.post('/admin/content-sync/import', payload);
      await fetchItems();
      const cacheRefreshed = await refreshAllSiteCache();
      setMessage(cacheRefreshed ? '内容同步包已导入，前台缓存已刷新' : '内容同步包已导入，前台缓存已刷新，CDN刷新失败');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '导入失败，请确认文件是网页内容同步包 JSON');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">网页内容</h1>
          <p className="mt-1 text-sm text-gray-500">管理从公司 PPT 提炼出来的专业内容，并支持测试环境导出、生产环境导入。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download size={17} />
            导出同步包
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
            导入同步包
          </button>
          <input ref={importInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            新增内容
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <div className="flex items-start gap-3">
          <FileJson size={20} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">同步说明</p>
            <p className="mt-1">测试环境改好内容后点“导出同步包”，再到生产环境后台打开本页点“导入同步包”。导入只替换网页补充内容，不覆盖整站数据库。</p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {pageOptions.map(option => (
            <button
              key={option.key || 'all'}
              onClick={() => setPageFilter(option.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${pageFilter === option.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button onClick={fetchItems} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

      <div className="space-y-5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-gray-400">暂无网页补充内容</div>
        ) : (
          Object.entries(groupedItems).map(([pageKey, sections]) => (
            <div key={pageKey} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{pageKey}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                    className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">{section.section_key}</span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">排序 {section.sort_order}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${section.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {section.active ? '前台显示' : '已隐藏'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      {section.subtitle && <p className="mt-1 text-sm text-gray-500">{section.subtitle}</p>}
                      {section.body && <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">{section.body}</p>}
                      {section.items?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {section.items.slice(0, 6).map(item => (
                            <span key={item} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600">{item}</span>
                          ))}
                          {section.items.length > 6 && <span className="text-xs text-gray-400">+{section.items.length - 6}</span>}
                        </div>
                      )}
                      <p className="mt-3 text-xs text-gray-400">更新：{formatDate(section.updated_at)}</p>
                    </div>
                    <div className="flex items-start justify-end gap-1">
                      <button onClick={() => toggleActive(section)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                        {section.active ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button onClick={() => openEdit(section)} className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(section)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <Dialog.Title className="mb-5 text-xl font-bold text-gray-900">{editing ? '编辑网页内容' : '新增网页内容'}</Dialog.Title>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">页面标识</label>
                <input value={form.page_key} onChange={e => setField('page_key', e.target.value)} placeholder="about / products / quality" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">区块标识</label>
                <input value={form.section_key} onChange={e => setField('section_key', e.target.value)} placeholder="company_profile" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">标题</label>
                <input value={form.title} onChange={e => setField('title', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">副标题</label>
                <input value={form.subtitle} onChange={e => setField('subtitle', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">正文</label>
              <textarea value={form.body} onChange={e => setField('body', e.target.value)} rows={5} className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">要点列表</label>
              <textarea value={form.itemsText} onChange={e => setField('itemsText', e.target.value)} rows={6} placeholder="每行一条，例如：&#10;ISO9001:2015质量管理体系认证&#10;IATF 16949:2016汽车工业体系认证" className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="mt-1 text-xs text-gray-400">每行一条，前台会根据页面样式自动展示。</p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">排序</label>
                <input type="number" value={form.sort_order} onChange={e => setField('sort_order', Number(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <label className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-gray-700">前台显示</span>
                  <span className="text-xs text-gray-400">关闭后不会显示在公开页面。</span>
                </span>
                <input type="checkbox" checked={form.active} onChange={e => setField('active', e.target.checked)} className="h-5 w-5" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100">取消</Dialog.Close>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
