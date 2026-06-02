'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Loader2, Save, Trash2, Upload } from 'lucide-react';
import api from '@/lib/api';
import { refreshAllSiteCache } from '@/lib/cache';
import { getAssetUrl, updateCompanyInfoCache } from '@/lib/company';

type CompanyForm = {
  about_text: string;
  phone: string;
  email: string;
  address: string;
  wechat_qr: string;
  logo_url: string;
  logo_small_url: string;
  about_image: string;
  hero_image: string;
  logo_width: number;
  logo_height: number;
  about_banner: string;
  products_banner: string;
  certificates_banner: string;
  news_banner: string;
  contact_banner: string;
};

type ImageField =
  | 'wechat_qr'
  | 'logo_url'
  | 'logo_small_url'
  | 'about_image'
  | 'hero_image'
  | 'about_banner'
  | 'products_banner'
  | 'certificates_banner'
  | 'news_banner'
  | 'contact_banner';

const emptyForm: CompanyForm = {
  about_text: '',
  phone: '',
  email: '',
  address: '',
  wechat_qr: '',
  logo_url: '',
  logo_small_url: '',
  about_image: '',
  hero_image: '',
  logo_width: 0,
  logo_height: 0,
  about_banner: '',
  products_banner: '',
  certificates_banner: '',
  news_banner: '',
  contact_banner: '',
};

const bannerFields: { field: ImageField; label: string }[] = [
  { field: 'about_banner', label: '关于我们顶部图' },
  { field: 'products_banner', label: '产品中心顶部图' },
  { field: 'certificates_banner', label: '证书资质顶部图' },
  { field: 'news_banner', label: '新闻资讯顶部图' },
  { field: 'contact_banner', label: '联系我们顶部图' },
];

export default function CompanyPage() {
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploadingField, setUploadingField] = useState<ImageField | ''>('');

  useEffect(() => {
    let mounted = true;
    api.get('/company')
      .then(res => {
        if (!mounted) return;
        setForm(prev => ({ ...prev, ...(res.data || {}) }));
      })
      .catch(() => {
        if (mounted) setError('公司信息加载失败，请刷新后重试。');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setField = <K extends keyof CompanyForm>(field: K, value: CompanyForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const uploadFile = async (field: ImageField, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    setUploadingField(field);
    setError('');

    try {
      const res = await api.post('/admin/upload', fd);
      setForm(prev => ({ ...prev, [field]: res.data.url || '' }));
    } catch {
      setError('图片上传失败，请检查图片格式或稍后重试。');
    } finally {
      setUploadingField('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      await api.put('/admin/company', form);
      updateCompanyInfoCache(form);
      await refreshAllSiteCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('保存失败，请检查登录状态或网络连接。');
    } finally {
      setSaving(false);
    }
  };

  const numberValue = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const ImageUploadCard = ({
    field,
    label,
    hint,
    aspect = 'banner',
  }: {
    field: ImageField;
    label: string;
    hint: string;
    aspect?: 'banner' | 'square' | 'logo';
  }) => {
    const value = form[field];
    const isUploading = uploadingField === field;
    const imageClass = aspect === 'square'
      ? 'h-20 w-20 object-contain'
      : aspect === 'logo'
        ? 'h-20 max-w-full object-contain'
        : 'h-28 w-full object-cover';

    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-4 text-center">
          {value ? (
            <div className="mb-3 flex min-h-28 items-center justify-center rounded-lg bg-gray-50 p-2">
              <img src={getAssetUrl(value)} alt={label} className={`${imageClass} rounded-lg`} />
            </div>
          ) : (
            <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-gray-50 text-gray-300">
              <ImageIcon size={32} />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isUploading ? '上传中...' : '上传图片'}
              <input type="file" accept="image/*" onChange={(e) => uploadFile(field, e)} className="hidden" />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => setField(field, '')}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
              >
                <Trash2 size={15} />
                清除
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400">{hint}</p>
          {value && <p className="mt-1 break-all text-xs text-gray-400">{value}</p>}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <Loader2 className="mr-2 animate-spin" size={20} />
        正在加载公司信息...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">公司信息</h1>
          <p className="mt-1 text-sm text-gray-500">统一管理前台 Logo、栏目顶部图和联系信息。</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !!uploadingField}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? '保存中...' : saved ? '已保存' : '保存'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ImageIcon size={20} />
          Logo 管理
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <ImageUploadCard field="logo_url" label="主 Logo（导航栏 / 页脚 / 首页）" hint="建议尺寸：200x60px，透明背景 PNG。" aspect="logo" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Logo 宽度(px)</label>
                <input
                  type="number"
                  min="0"
                  value={form.logo_width || ''}
                  onChange={(e) => setField('logo_width', numberValue(e.target.value))}
                  placeholder="自动"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Logo 高度(px)</label>
                <input
                  type="number"
                  min="0"
                  value={form.logo_height || ''}
                  onChange={(e) => setField('logo_height', numberValue(e.target.value))}
                  placeholder="默认40"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">宽度或高度填 0 时使用前台默认尺寸；填写后 Header、Footer 和首页按后台设置渲染。</p>
          </div>
          <ImageUploadCard field="logo_small_url" label="小 Logo / 图标" hint="建议尺寸：64x64px，适合作为正方形图标。" aspect="square" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">页面图片</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ImageUploadCard field="about_image" label="关于我们内容图片" hint="展示在关于我们正文区域。" />
          <ImageUploadCard field="hero_image" label="首页横幅备用图片" hint="首页没有启用轮播图时，使用这张图片作为首屏背景。" />
        </div>

        <h3 className="mb-3 mt-8 text-sm font-semibold text-gray-800">栏目顶部横幅图</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {bannerFields.map(item => (
            <ImageUploadCard key={item.field} field={item.field} label={item.label} hint="建议尺寸：1920x420px。" />
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">基础信息</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">公司简介</label>
          <textarea
            value={form.about_text}
            onChange={(e) => setField('about_text', e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">电话</label>
            <input
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">邮箱</label>
            <input
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">地址</label>
          <textarea
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <ImageUploadCard field="wechat_qr" label="微信二维码" hint="展示在前台页脚微信区域。" aspect="square" />
      </motion.div>
    </div>
  );
}
