'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  image_url: string;
  published: boolean;
  created_at: string;
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', content: '', image_url: '', published: false });

  const fetchItems = async () => {
    const res = await api.get('/news');
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
      await api.put(`/admin/news/${editing.id}`, form);
    } else {
      await api.post('/admin/news', form);
    }
    setOpen(false);
    setEditing(null);
    fetchItems();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await api.delete(`/admin/news/${id}`);
    fetchItems();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新闻管理</h1>
        <button onClick={() => { setEditing(null); setForm({ title: '', summary: '', content: '', image_url: '', published: false }); setOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> 新增新闻
        </button>
      </div>
      <div className="grid gap-4">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {item.image_url && <img src={`${API_BASE_URL}${item.image_url}`} alt={item.title} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
              <p className="text-sm text-gray-500 truncate">{item.summary}</p>
              <div className="flex items-center gap-2 mt-1">
                {item.published ? <Eye size={14} className="text-green-500" /> : <EyeOff size={14} className="text-gray-400" />}
                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(item); setForm({ title: item.title, summary: item.summary, content: item.content, image_url: item.image_url, published: item.published }); setOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
            </div>
          </motion.div>
        ))}
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold mb-4">{editing ? '编辑新闻' : '新增新闻'}</Dialog.Title>
            <div className="space-y-4">
              <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="标题" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={form.summary} onChange={(e) => setForm({...form, summary: e.target.value})} placeholder="摘要" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} placeholder="正文内容" rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                  <Upload size={16} /> 封面图
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({...form, published: e.target.checked})} className="w-4 h-4" />
                  <span className="text-sm">发布</span>
                </label>
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
