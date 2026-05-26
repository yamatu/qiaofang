'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

export default function CompanyPage() {
  const [form, setForm] = useState({
    about_text: '', phone: '', email: '', address: '',
    wechat_qr: '', logo_url: '', logo_small_url: '',
    about_image: '', hero_image: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/company').then(res => {
      if (res.data && Object.keys(res.data).length > 0) {
        setForm(prev => ({ ...prev, ...res.data }));
      }
    });
  }, []);

  const uploadFile = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/admin/upload', fd);
    setForm({ ...form, [field]: res.data.url });
  };

  const handleSave = async () => {
    setSaving(true);
    await api.put('/admin/company', form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">公司信息</h1>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Save size={18} /> {saving ? '保存中...' : saved ? '已保存' : '保存'}
        </button>
      </div>

      {/* Logo Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><ImageIcon size={20} /> Logo 管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">主 Logo（导航栏 / 页脚）</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              {form.logo_url ? (
                <img src={`${API_BASE_URL}${form.logo_url}`} alt="Logo" className="h-16 mx-auto object-contain mb-3" />
              ) : (
                <div className="h-16 flex items-center justify-center text-gray-300 mb-3"><ImageIcon size={32} /></div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 text-sm font-medium">
                <Upload size={16} /> 上传主Logo
                <input type="file" accept="image/*" onChange={(e) => uploadFile('logo_url', e)} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 mt-2">建议尺寸: 200x60px，透明背景 PNG</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">小 Logo / 图标（浏览器标签）</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              {form.logo_small_url ? (
                <img src={`${API_BASE_URL}${form.logo_small_url}`} alt="Icon" className="h-16 w-16 mx-auto object-contain mb-3" />
              ) : (
                <div className="h-16 w-16 mx-auto flex items-center justify-center text-gray-300 mb-3 bg-gray-50 rounded-full"><ImageIcon size={24} /></div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 text-sm font-medium">
                <Upload size={16} /> 上传小Logo
                <input type="file" accept="image/*" onChange={(e) => uploadFile('logo_small_url', e)} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 mt-2">建议尺寸: 64x64px，正方形</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Page Images */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">页面图片</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">关于我们页面图片</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              {form.about_image ? (
                <img src={`${API_BASE_URL}${form.about_image}`} alt="About" className="h-24 mx-auto object-cover rounded-lg mb-3" />
              ) : (
                <div className="h-24 flex items-center justify-center text-gray-300 mb-3"><ImageIcon size={32} /></div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 text-sm font-medium">
                <Upload size={16} /> 上传图片
                <input type="file" accept="image/*" onChange={(e) => uploadFile('about_image', e)} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 mt-2">展示在关于我们页面</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">首页横幅图片</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              {form.hero_image ? (
                <img src={`${API_BASE_URL}${form.hero_image}`} alt="Hero" className="h-24 mx-auto object-cover rounded-lg mb-3" />
              ) : (
                <div className="h-24 flex items-center justify-center text-gray-300 mb-3"><ImageIcon size={32} /></div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 text-sm font-medium">
                <Upload size={16} /> 上传图片
                <input type="file" accept="image/*" onChange={(e) => uploadFile('hero_image', e)} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 mt-2">展示在首页背景区域</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Company Info Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">公司简介</label>
          <textarea value={form.about_text} onChange={(e) => setForm({...form, about_text: e.target.value})} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
            <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
          <textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">微信二维码</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
              <Upload size={16} /> 上传二维码
              <input type="file" accept="image/*" onChange={(e) => uploadFile('wechat_qr', e)} className="hidden" />
            </label>
            {form.wechat_qr && <img src={`${API_BASE_URL}${form.wechat_qr}`} alt="QR" className="w-20 h-20 object-contain border rounded" />}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
