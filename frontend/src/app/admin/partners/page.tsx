'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

interface Partner { id: number; name: string; logo_url: string; website: string; sort_order: number; }

export default function PartnersPage() {
  const [items, setItems] = useState<Partner[]>([]);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', logo_url: '', website: '', sort_order: 0 });

  const fetchItems = async () => { const res = await api.get('/partners'); setItems(res.data || []); };
  useEffect(() => { fetchItems(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await api.post('/admin/upload', fd);
    setForm({ ...form, logo_url: res.data.url });
  };

  const handleSave = async () => {
    if (editing) { await api.put(`/admin/partners/${editing.id}`, form); }
    else { await api.post('/admin/partners', form); }
    setOpen(false); setEditing(null); fetchItems();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await api.delete(`/admin/partners/${id}`); fetchItems();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">合作伙伴</h1>
        <button onClick={() => { setEditing(null); setForm({ name: '', logo_url: '', website: '', sort_order: 0 }); setOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> 新增
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center relative group">
            <div className="w-full h-16 flex items-center justify-center mb-2">
              {item.logo_url ? <img src={`${API_BASE_URL}${item.logo_url}`} alt={item.name} className="max-h-full max-w-full object-contain" /> : <span className="text-gray-400 text-xs">{item.name}</span>}
            </div>
            <p className="text-xs text-gray-600 truncate">{item.name}</p>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
              <button onClick={() => { setEditing(item); setForm({ name: item.name, logo_url: item.logo_url, website: item.website, sort_order: item.sort_order }); setOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          </motion.div>
        ))}
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-full max-w-sm z-50">
            <Dialog.Title className="text-xl font-bold mb-4">{editing ? '编辑' : '新增'}合作伙伴</Dialog.Title>
            <div className="space-y-4">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="名称" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="网站 (可选)" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                  <Upload size={16} /> Logo
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
                {form.logo_url && <span className="text-sm text-green-600">已上传</span>}
              </div>
              <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})} placeholder="排序" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
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
