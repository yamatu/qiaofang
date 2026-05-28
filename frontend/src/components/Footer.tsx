'use client';

import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

interface CompanyInfo {
  logo_url?: string;
  wechat_qr?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export default function Footer() {
  const { t } = useI18n();
  const [info, setInfo] = useState<CompanyInfo>({});
  const [companyLoaded, setCompanyLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get('/company').then(res => {
      if (mounted && res.data && Object.keys(res.data).length > 0) setInfo(res.data);
    }).catch(() => {}).finally(() => {
      if (mounted) setCompanyLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 pt-20 pb-10 border-t-4 border-blue-600">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              {info.logo_url ? (
                <img src={`${API_BASE_URL}${info.logo_url}`} alt="乔方科技" className="h-12 object-contain" />
              ) : companyLoaded ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">Q</div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{t.footer.brand}</h2>
                </>
              ) : (
                <div className="h-12 w-36 rounded-lg bg-white/10 animate-pulse" />
              )}
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{t.footer.brandDesc}</p>
          </div>
          <div>
            <h4 className="text-white font-bold text-lg mb-6">{t.footer.quickLinks}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-blue-400 transition-colors">{t.nav.about}</Link></li>
              <li><Link href="/products" className="hover:text-blue-400 transition-colors">{t.nav.products}</Link></li>
              <li><Link href="/certificates" className="hover:text-blue-400 transition-colors">{t.nav.certificates}</Link></li>
              <li><Link href="/news" className="hover:text-blue-400 transition-colors">{t.nav.news}</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition-colors">{t.nav.contact}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-lg mb-6">{t.footer.contactUs}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3"><MapPin size={18} className="text-blue-500 flex-shrink-0 mt-0.5" /><span>{info.address || (companyLoaded ? '江苏省昆山市陆家镇珠竹路26号精伦智创园A栋' : '')}</span></li>
              <li className="flex items-center gap-3"><Phone size={18} className="text-blue-500 flex-shrink-0" /><span>{info.phone || (companyLoaded ? '13951186495' : '')}</span></li>
              <li className="flex items-center gap-3"><Mail size={18} className="text-blue-500 flex-shrink-0" /><span>{info.email || (companyLoaded ? 'davey@qiaofangcn.com' : '')}</span></li>
              <li className="text-xs text-gray-500 pt-2">供应商自荐邮箱:<br/>andy.ding@qiaofangcn.com<br/>hedy.zhang@qiaofangcn.com</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-lg mb-6">{t.footer.wechat}</h4>
            {info.wechat_qr ? (
              <div className="bg-white p-2 rounded-lg inline-block">
                <img src={`${API_BASE_URL}${info.wechat_qr}`} alt="微信二维码" className="w-24 h-24 object-contain" />
              </div>
            ) : companyLoaded ? (
              <div className="bg-white p-2 rounded-lg inline-block">
                <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded">QR Code</div>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-lg bg-white/10 animate-pulse" />
            )}
            <p className="text-xs text-gray-400 mt-3">{t.footer.wechatScan}</p>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>{t.footer.copyright}</p>
          <p>{t.footer.icp}</p>
        </div>
      </div>
    </footer>
  );
}
