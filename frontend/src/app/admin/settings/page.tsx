'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, CheckCircle, Mail, Send } from 'lucide-react';
import api from '@/lib/api';

type MailForm = {
  smtp_server: string;
  smtp_port: number;
  email_account: string;
  email_nickname: string;
  email_auth_code: string;
  clear_auth_code: boolean;
  admin_email: string;
  test_email: string;
};

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const emptyMailForm: MailForm = {
  smtp_server: '',
  smtp_port: 465,
  email_account: '',
  email_nickname: '',
  email_auth_code: '',
  clear_auth_code: false,
  admin_email: '',
  test_email: '',
};

function errorText(error: unknown) {
  const apiError = error as ApiError;
  return apiError.response?.data?.error || '';
}

export default function SettingsPage() {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '', new_username: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mailForm, setMailForm] = useState<MailForm>(emptyMailForm);
  const [mailLoading, setMailLoading] = useState(true);
  const [mailSaving, setMailSaving] = useState(false);
  const [mailTesting, setMailTesting] = useState(false);
  const [mailMessage, setMailMessage] = useState('');
  const [mailError, setMailError] = useState('');
  const [authCodeConfigured, setAuthCodeConfigured] = useState(false);
  const [authCodeMask, setAuthCodeMask] = useState('');
  const [usingEnvAuthCode, setUsingEnvAuthCode] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get('/admin/mail/config')
      .then(res => {
        if (!mounted) return;
        setMailForm({
          smtp_server: res.data.smtp_server || '',
          smtp_port: res.data.smtp_port || 465,
          email_account: res.data.email_account || '',
          email_nickname: res.data.email_nickname || '',
          email_auth_code: '',
          clear_auth_code: false,
          admin_email: res.data.admin_email || '',
          test_email: res.data.test_email || '',
        });
        setAuthCodeConfigured(!!res.data.email_auth_code_configured);
        setAuthCodeMask(res.data.email_auth_code_mask || '');
        setUsingEnvAuthCode(!!res.data.using_env_auth_code);
      })
      .catch(() => {
        if (mounted) setMailError('邮件配置读取失败');
      })
      .finally(() => {
        if (mounted) setMailLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

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
    } catch (err: unknown) {
      setError(errorText(err) === 'old password incorrect' ? '原密码错误' : '修改失败');
    } finally {
      setSaving(false);
    }
  };

  const setMailField = <K extends keyof MailForm>(field: K, value: MailForm[K]) => {
    setMailForm(prev => ({ ...prev, [field]: value }));
  };

  const saveMailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setMailSaving(true);
    setMailMessage('');
    setMailError('');

    try {
      const payload = {
        smtp_server: mailForm.smtp_server,
        smtp_port: mailForm.smtp_port || 465,
        email_account: mailForm.email_account,
        email_nickname: mailForm.email_nickname,
        email_auth_code: mailForm.email_auth_code,
        clear_auth_code: mailForm.clear_auth_code,
        admin_email: mailForm.admin_email,
        test_email: mailForm.test_email,
      };
      await api.put('/admin/mail/config', payload);
      setMailMessage('邮件配置已保存');
      setAuthCodeConfigured(!mailForm.clear_auth_code && (authCodeConfigured || !!mailForm.email_auth_code));
      setAuthCodeMask(mailForm.email_auth_code ? '****' : (mailForm.clear_auth_code ? '' : authCodeMask));
      setUsingEnvAuthCode(false);
      setMailForm(prev => ({ ...prev, email_auth_code: '', clear_auth_code: false }));
    } catch (err: unknown) {
      setMailError(errorText(err) || '邮件配置保存失败');
    } finally {
      setMailSaving(false);
    }
  };

  const sendTestMail = async () => {
    setMailTesting(true);
    setMailMessage('');
    setMailError('');
    try {
      await api.post('/admin/mail/test', { test_email: mailForm.test_email });
      setMailMessage('测试邮件已发送');
    } catch (err: unknown) {
      setMailError(errorText(err) || '测试邮件发送失败');
    } finally {
      setMailTesting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">账号设置</h1>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg mb-6">
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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-gray-200 p-6 max-w-4xl">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Mail size={20} />
              邮箱通知配置
            </h2>
            <p className="mt-1 text-sm text-gray-500">客户在“联系我们”提交留言后，系统会按此配置向管理员邮箱发送通知。</p>
          </div>
          {authCodeConfigured && (
            <span className="text-xs text-gray-500">
              授权码已配置{authCodeMask ? `：${authCodeMask}` : ''}{usingEnvAuthCode ? '（来自环境变量）' : ''}
            </span>
          )}
        </div>

        {mailLoading ? (
          <div className="py-10 text-center text-sm text-gray-400">正在读取邮件配置...</div>
        ) : (
          <form onSubmit={saveMailConfig} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SMTP服务器</label>
                <input value={mailForm.smtp_server} onChange={e => setMailField('smtp_server', e.target.value)}
                  placeholder="smtp.example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SMTP端口</label>
                <input type="number" min="1" value={mailForm.smtp_port || ''}
                  onChange={e => setMailField('smtp_port', Number(e.target.value) || 465)}
                  placeholder="465"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">邮箱账号</label>
                <input value={mailForm.email_account} onChange={e => setMailField('email_account', e.target.value)}
                  placeholder="notice@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">邮箱昵称</label>
                <input value={mailForm.email_nickname} onChange={e => setMailField('email_nickname', e.target.value)}
                  placeholder="乔方科技"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">邮箱授权码</label>
                <input type="password" value={mailForm.email_auth_code} onChange={e => setMailField('email_auth_code', e.target.value)}
                  placeholder={authCodeConfigured ? '留空则不修改授权码' : '请输入邮箱授权码'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                {authCodeConfigured && (
                  <label className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <input type="checkbox" checked={mailForm.clear_auth_code} onChange={e => setMailField('clear_auth_code', e.target.checked)} />
                    清除已保存的授权码
                  </label>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">管理员邮箱</label>
                <input value={mailForm.admin_email} onChange={e => setMailField('admin_email', e.target.value)}
                  placeholder="admin@example.com，多个可用逗号分隔"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">测试邮件地址</label>
                <input value={mailForm.test_email} onChange={e => setMailField('test_email', e.target.value)}
                  placeholder="test@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {mailError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{mailError}</div>}
            {mailMessage && <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"><CheckCircle size={16} /> {mailMessage}</div>}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={sendTestMail} disabled={mailTesting || mailSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <Send size={16} />
                {mailTesting ? '发送中...' : '发送测试邮件'}
              </button>
              <button type="submit" disabled={mailSaving || mailTesting}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {mailSaving ? '保存中...' : '保存邮件配置'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
