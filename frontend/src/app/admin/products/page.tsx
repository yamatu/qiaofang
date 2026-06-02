'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '@/lib/api';
import { refreshAllSiteCache } from '@/lib/cache';
import { API_BASE_URL } from '@/lib/constants';

interface Product {
  id: number;
  title: string;
  category: string;
  description: string;
  image_url: string;
  specs: string;
  active: boolean;
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', description: '', image_url: '', specs: '', active: true });

  const fetchItems = async () => {
    const res = await api.get('/products');
    setItems(res.data || []);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/admin/upload', fd);
    setForm({ ...form, image_url: res.data.url });
  };

  const handleSave = async () => {
    if (editing) {
      await api.put(`/admin/products/${editing.id}`, form);
    } else {
      await api.post('/admin/products', form);
    }
    setOpen(false);
    setEditing(null);
    await fetchItems();
    await refreshAllSiteCache();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await api.delete(`/admin/products/${id}`);
    await fetchItems();
    await refreshAllSiteCache();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
        <button onClick={() => { setEditing(null); setForm({ title: '', category: '', description: '', image_url: '', specs: '', active: true }); setOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} /> 新增产品
        </button>
      </div>
      <div className="grid gap-4">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {item.image_url && <img src={`${API_BASE_URL}${item.image_url}`} alt={item.title} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.category}</p>
              <p className="text-xs text-gray-400 truncate">{item.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(item); setForm({ title: item.title, category: item.category, description: item.description, image_url: item.image_url, specs: item.specs, active: item.active }); setOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
            </div>
          </motion.div>
        ))}
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold mb-4">{editing ? '编辑产品' : '新增产品'}</Dialog.Title>
            <div className="space-y-4">
              <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="产品名称" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="分类" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="描述" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={form.specs} onChange={(e) => setForm({...form, specs: e.target.value})} placeholder="规格参数" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                  <Upload size={16} /> 上传图片
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
                {form.image_url && <span className="text-sm text-green-600">已上传</span>}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</Dialog.Close>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
