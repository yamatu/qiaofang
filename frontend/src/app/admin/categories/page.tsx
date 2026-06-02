'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '@/lib/api';
import { refreshAllSiteCache } from '@/lib/cache';

interface Category { id: number; name: string; sort_order: number; }

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sort_order: 0 });

  const fetch = async () => { const res = await api.get('/categories'); setItems(res.data || []); };
  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    if (editing) { await api.put(`/admin/categories/${editing.id}`, form); }
    else { await api.post('/admin/categories', form); }
    setOpen(false); setEditing(null); await fetch(); await refreshAllSiteCache();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await api.delete(`/admin/categories/${id}`); await fetch(); await refreshAllSiteCache();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
        <button onClick={() => { setEditing(null); setForm({ name: '', sort_order: 0 }); setOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> 新增分类
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无分类，请添加</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <GripVertical size={16} className="text-gray-300" />
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <span className="text-xs text-gray-400">排序: {item.sort_order}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(item); setForm({ name: item.name, sort_order: item.sort_order }); setOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-full max-w-sm z-50">
            <Dialog.Title className="text-xl font-bold mb-4">{editing ? '编辑分类' : '新增分类'}</Dialog.Title>
            <div className="space-y-4">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="分类名称" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
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
