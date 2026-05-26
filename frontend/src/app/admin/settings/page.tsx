'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function SettingsPage() {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '', new_username: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');

    if (form.new_password !== form.confirm_password) {
      setError('两次输入的新密码不一致');
      return;
    }
    if (form.new_password.length < 6) {
      setError('新密码至少6位');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/admin/change-password', {
        old_password: form.old_password,
        new_password: form.new_password,
        new_username: form.new_username || undefined,
      });
      setMessage('修改成功！' + (form.new_username ? ` 新用户名: ${res.data.username}` : ''));
      setForm({ old_password: '', new_password: '', confirm_password: '', new_username: '' });
    } catch (err: any) {
      setError(err.response?.data?.error === 'old password incorrect' ? '原密码错误' : '修改失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">账号设置</h1>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新用户名（不填则保持不变）</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.new_username} onChange={e => setForm({...form, new_username: e.target.value})}
                placeholder="留空保持当前用户名"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">原密码 <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showOld ? 'text' : 'password'} value={form.old_password} onChange={e => setForm({...form, old_password: e.target.value})}
                required className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码 <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showNew ? 'text' : 'password'} value={form.new_password} onChange={e => setForm({...form, new_password: e.target.value})}
                required minLength={6} className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码 <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" value={form.confirm_password} onChange={e => setForm({...form, confirm_password: e.target.value})}
                required minLength={6} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
          {message && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2"><CheckCircle size={16} /> {message}</div>}

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? '保存中...' : '保存修改'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
