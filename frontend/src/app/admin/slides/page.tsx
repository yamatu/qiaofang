'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  sort_order: number;
  active: boolean;
}

export default function SlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', description: '', image_url: '', sort_order: 0, active: true });

  const fetchSlides = async () => {
    const res = await api.get('/slides');
    setSlides(res.data || []);
  };

  useEffect(() => { fetchSlides(); }, []);

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
      await api.put(`/admin/slides/${editing.id}`, form);
    } else {
      await api.post('/admin/slides', form);
    }
    setOpen(false);
    setEditing(null);
    setForm({ title: '', subtitle: '', description: '', image_url: '', sort_order: 0, active: true });
    fetchSlides();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await api.delete(`/admin/slides/${id}`);
    fetchSlides();
  };

  const openEdit = (slide: Slide) => {
    setEditing(slide);
    setForm({ title: slide.title, subtitle: slide.subtitle, description: slide.description, image_url: slide.image_url, sort_order: slide.sort_order, active: slide.active });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', subtitle: '', description: '', image_url: '', sort_order: 0, active: true });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">轮播图管理</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} /> 新增轮播
        </button>
      </div>

      <div className="grid gap-4">
        {slides.map((slide, i) => (
          <motion.div key={slide.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {slide.image_url && <img src={`${API_BASE_URL}${slide.image_url}`} alt={slide.title} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{slide.title}</h3>
              <p className="text-sm text-gray-500 truncate">{slide.subtitle}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${slide.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {slide.active ? '启用' : '禁用'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(slide)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(slide.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold mb-4">{editing ? '编辑轮播' : '新增轮播'}</Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">副标题</label>
                <input value={form.subtitle} onChange={(e) => setForm({...form, subtitle: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    <Upload size={16} /> 上传图片
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                  {form.image_url && <span className="text-sm text-green-600">已上传</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({...form, sort_order: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">启用</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</Dialog.Close>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">保存</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

