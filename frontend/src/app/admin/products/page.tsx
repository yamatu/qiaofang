'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '@/lib/api';
import { refreshAllSiteCache } from '@/lib/cache';
import { getAssetUrl } from '@/lib/company';

interface Product {
  id: number;
  title: string;
  category: string;
  description: string;
  image_url: string;
  specs: string;
  active: boolean;
  created_at?: string;
}

interface Category {
  id: number;
  name: string;
}

type ProductForm = {
  title: string;
  category: string;
  description: string;
  image_url: string;
  specs: string;
  active: boolean;
};

type StatusFilter = 'all' | 'active' | 'inactive';
type SortKey = 'newest' | 'oldest' | 'title' | 'category' | 'status';

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const emptyForm: ProductForm = {
  title: '',
  category: '',
  description: '',
  image_url: '',
  specs: '',
  active: true,
};

const pageSizeOptions = [10, 20, 50];

function apiErrorText(error: unknown) {
  return (error as ApiError).response?.data?.error || '';
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const [productRes, categoryRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/categories'),
      ]);
      setItems(productRes.data || []);
      setCategories(categoryRes.data || []);
    } catch (err: unknown) {
      setError(apiErrorText(err) || '产品数据加载失败，请刷新后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/admin/products'),
      api.get('/categories'),
    ]).then(([productRes, categoryRes]) => {
      if (!mounted) return;
      setItems(productRes.data || []);
      setCategories(categoryRes.data || []);
    }).catch((err: unknown) => {
      if (mounted) setError(apiErrorText(err) || '产品数据加载失败，请刷新后重试');
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const names = [
      ...categories.map(item => item.name),
      ...items.map(item => item.category),
    ].map(item => item?.trim()).filter(Boolean);
    return Array.from(new Set(names));
  }, [categories, items]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const filtered = items.filter(item => {
      const statusMatched = statusFilter === 'all'
        || (statusFilter === 'active' && item.active)
        || (statusFilter === 'inactive' && !item.active);
      const categoryMatched = !categoryFilter || item.category === categoryFilter;
      const keywordMatched = !keyword || [
        item.title,
        item.category,
        item.description,
        item.specs,
      ].some(value => value?.toLowerCase().includes(keyword));

      return statusMatched && categoryMatched && keywordMatched;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'zh-Hans-CN');
      if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '', 'zh-Hans-CN');
      if (sortBy === 'status') return Number(b.active) - Number(a.active);
      return b.id - a.id;
    });
  }, [items, query, categoryFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const selectedItems = items.filter(item => selectedIds.includes(item.id));
  const allPageSelected = pageItems.length > 0 && pageItems.every(item => selectedIds.includes(item.id));
  const activeCount = items.filter(item => item.active).length;
  const inactiveCount = items.length - activeCount;
  const visibleStart = filteredItems.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const visibleEnd = Math.min(safeCurrentPage * pageSize, filteredItems.length);

  const resetPageSelection = () => {
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setMessage('');
    setOpen(true);
  };

  const openEdit = (item: Product) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      category: item.category || '',
      description: item.description || '',
      image_url: item.image_url || '',
      specs: item.specs || '',
      active: item.active,
    });
    setError('');
    setMessage('');
    setOpen(true);
  };

  const setField = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    setError('');

    try {
      const res = await api.post('/admin/upload', fd);
      setField('image_url', res.data.url || '');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      title: form.title.trim(),
      category: form.category.trim(),
    };
    if (!payload.title) {
      setError('请填写产品名称');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editing) {
        await api.put(`/admin/products/${editing.id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      await fetchItems();
      setOpen(false);
      setEditing(null);
      const cacheRefreshed = await refreshAllSiteCache();
      setMessage(cacheRefreshed ? '产品已保存，页面缓存已刷新' : '产品已保存，前台缓存已刷新，CDN刷新失败');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Product) => {
    if (!confirm(`确定删除产品「${item.title}」？`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/admin/products/${item.id}`);
      await fetchItems();
      const cacheRefreshed = await refreshAllSiteCache();
      setMessage(cacheRefreshed ? '产品已删除，页面缓存已刷新' : '产品已删除，前台缓存已刷新，CDN刷新失败');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '删除失败，请稍后重试');
    }
  };

  const toggleActive = async (item: Product) => {
    setError('');
    setMessage('');
    try {
      await api.put(`/admin/products/${item.id}`, { ...item, active: !item.active });
      await fetchItems();
      const cacheRefreshed = await refreshAllSiteCache();
      setMessage(cacheRefreshed ? '产品状态已更新，页面缓存已刷新' : '产品状态已更新，前台缓存已刷新，CDN刷新失败');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '状态更新失败');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectPage = () => {
    const pageIds = pageItems.map(item => item.id);
    setSelectedIds(prev => {
      if (pageIds.every(id => prev.includes(id))) {
        return prev.filter(id => !pageIds.includes(id));
      }
      return Array.from(new Set([...prev, ...pageIds]));
    });
  };

  const bulkUpdateStatus = async (active: boolean) => {
    if (selectedItems.length === 0) return;
    setBulkWorking(true);
    setError('');
    setMessage('');
    try {
      await Promise.all(selectedItems.map(item => api.put(`/admin/products/${item.id}`, { ...item, active })));
      await fetchItems();
      setSelectedIds([]);
      const cacheRefreshed = await refreshAllSiteCache();
      setMessage(cacheRefreshed ? '批量状态已更新，页面缓存已刷新' : '批量状态已更新，前台缓存已刷新，CDN刷新失败');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '批量状态更新失败');
    } finally {
      setBulkWorking(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`确定删除选中的 ${selectedItems.length} 个产品？`)) return;
    setBulkWorking(true);
    setError('');
    setMessage('');
    try {
      await Promise.all(selectedItems.map(item => api.delete(`/admin/products/${item.id}`)));
      await fetchItems();
      setSelectedIds([]);
      const cacheRefreshed = await refreshAllSiteCache();
      setMessage(cacheRefreshed ? '选中产品已删除，页面缓存已刷新' : '选中产品已删除，前台缓存已刷新，CDN刷新失败');
    } catch (err: unknown) {
      setError(apiErrorText(err) || '批量删除失败');
    } finally {
      setBulkWorking(false);
    }
  };

  const resetFilters = () => {
    setQuery('');
    setCategoryFilter('');
    setStatusFilter('all');
    setSortBy('newest');
    setPageSize(10);
    resetPageSelection();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理产品信息、图片、分类、规格参数和前台展示状态。</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus size={18} /> 新增产品
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">全部产品</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">已上架</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">已下架</p>
          <p className="mt-1 text-2xl font-bold text-gray-500">{inactiveCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">产品分类</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{categoryOptions.length}</p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_150px_150px_120px_auto]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); resetPageSelection(); }}
              placeholder="搜索名称、分类、描述、规格"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-9 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {query && (
              <button onClick={() => { setQuery(''); resetPageSelection(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); resetPageSelection(); }} className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">全部分类</option>
            {categoryOptions.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as StatusFilter); resetPageSelection(); }} className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">全部状态</option>
            <option value="active">仅上架</option>
            <option value="inactive">仅下架</option>
          </select>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value as SortKey); resetPageSelection(); }} className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="newest">最新优先</option>
            <option value="oldest">最早优先</option>
            <option value="title">名称排序</option>
            <option value="category">分类排序</option>
            <option value="status">状态排序</option>
          </select>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); resetPageSelection(); }} className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
            {pageSizeOptions.map(size => <option key={size} value={size}>{size} 条/页</option>)}
          </select>
          <button onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            <RotateCcw size={16} /> 重置
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          <span>筛选结果 {filteredItems.length} 条，当前显示 {visibleStart}-{visibleEnd}</span>
          <button onClick={fetchItems} disabled={loading} className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-600 disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />}
            刷新
          </button>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-gray-200 bg-blue-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-blue-700">已选择 {selectedIds.length} 个产品</span>
            <div className="flex flex-wrap gap-2">
              <button disabled={bulkWorking} onClick={() => bulkUpdateStatus(true)} className="rounded-lg bg-white px-3 py-1.5 text-green-700 hover:bg-green-50 disabled:opacity-50">批量上架</button>
              <button disabled={bulkWorking} onClick={() => bulkUpdateStatus(false)} className="rounded-lg bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50">批量下架</button>
              <button disabled={bulkWorking} onClick={bulkDelete} className="rounded-lg bg-white px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50">批量删除</button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
              <tr>
                <th className="w-10 px-4 py-3 font-medium">
                  <input type="checkbox" checked={allPageSelected} onChange={toggleSelectPage} aria-label="选择当前页" />
                </th>
                <th className="px-4 py-3 font-medium">产品</th>
                <th className="px-4 py-3 font-medium">分类</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">规格摘要</th>
                <th className="px-4 py-3 font-medium">创建时间</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4" colSpan={7}>
                      <div className="h-10 rounded bg-gray-100 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">没有找到符合条件的产品</td>
                </tr>
              ) : pageItems.map((item, i) => (
                <motion.tr key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} aria-label={`选择${item.title}`} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {item.image_url ? (
                          <img src={getAssetUrl(item.image_url)} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={22} className="text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                        <p className="mt-1 max-w-md text-xs text-gray-500 line-clamp-2">{item.description || '暂无描述'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{item.category || '-'}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${item.active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      {item.active ? '已上架' : '已下架'}
                    </button>
                  </td>
                  <td className="px-4 py-4 max-w-[220px] text-xs text-gray-500">
                    <span className="line-clamp-2 whitespace-pre-line">{item.specs || '-'}</span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">{formatDate(item.created_at)}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={17} /></button>
                      <button onClick={() => handleDelete(item)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-500">第 {safeCurrentPage} / {totalPages} 页</span>
            <div className="flex items-center gap-1">
              <button disabled={safeCurrentPage === 1} onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:text-gray-300">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                if (totalPages > 7 && page !== 1 && page !== totalPages && Math.abs(page - safeCurrentPage) > 1) {
                  if (page === 2 || page === totalPages - 1) return <span key={page} className="px-2 text-gray-400">...</span>;
                  return null;
                }
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`h-9 min-w-9 rounded-lg border px-3 text-sm ${safeCurrentPage === page ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {page}
                  </button>
                );
              })}
              <button disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:text-gray-300">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <Dialog.Title className="mb-5 text-xl font-bold text-gray-900">{editing ? '编辑产品' : '新增产品'}</Dialog.Title>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">产品图片</label>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {form.image_url ? (
                    <img src={getAssetUrl(form.image_url)} alt={form.title || '产品图片'} className="h-full w-full object-contain p-3" />
                  ) : (
                    <ImageIcon size={38} className="text-gray-300" />
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {uploading ? '上传中' : '上传'}
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                  {form.image_url && (
                    <button onClick={() => setField('image_url', '')} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">清除</button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">产品名称 <span className="text-red-500">*</span></label>
                  <input value={form.title} onChange={e => setField('title', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">分类</label>
                  <input list="product-category-options" value={form.category} onChange={e => setField('category', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                  <datalist id="product-category-options">
                    {categoryOptions.map(category => <option key={category} value={category} />)}
                  </datalist>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">产品描述</label>
                  <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={4} className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">规格参数</label>
                  <textarea value={form.specs} onChange={e => setField('specs', e.target.value)} placeholder="建议每行一条，如：型号: ABC-001" rows={5} className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <label className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-gray-700">前台展示</span>
                    <span className="text-xs text-gray-400">关闭后产品不会出现在前台列表和详情页。</span>
                  </span>
                  <input type="checkbox" checked={form.active} onChange={e => setField('active', e.target.checked)} className="h-5 w-5" />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100">取消</Dialog.Close>
              <button onClick={handleSave} disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
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
