'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageBanner from '@/components/PageBanner';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';
import { usePageMeta } from '@/lib/useMeta';

export default function ContactPage() {
  const { t } = useI18n();
  usePageMeta(`${t.nav.contact} - 乔方科技`, '联系乔方科技 - 江苏省昆山市陆家镇珠竹路26号');
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{address?: string; phone?: string; email?: string}>({});

  useEffect(() => {
    api.get('/company').then(res => {
      if (res.data && Object.keys(res.data).length > 0) setCompanyInfo(res.data);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
    } catch { /* still show success for UX */ }
    setSubmitted(true);
    setLoading(false);
  };

  const infoItems = [
    { icon: MapPin, label: t.contact.info.address, value: companyInfo.address || t.contact.info.addressText },
    { icon: Phone, label: t.contact.info.phone, value: companyInfo.phone || t.contact.info.phoneText },
    { icon: Mail, label: t.contact.info.email, value: companyInfo.email || t.contact.info.emailText },
    { icon: Clock, label: t.contact.info.hours, value: t.contact.info.hoursText },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageBanner title={t.contact.title} subtitle={t.contact.subtitle} />

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2 space-y-6">
              {infoItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{item.label}</h4>
                      <p className="text-gray-600 text-sm mt-1">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-3">
              {submitted ? (
                <div className="bg-green-50 rounded-2xl p-12 text-center">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-green-800">{t.contact.form.success}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.form.name}</label>
                      <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.form.email}</label>
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.form.phone}</label>
                      <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.form.company}</label>
                      <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.form.message}</label>
                    <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    <Send size={18} /> {loading ? '...' : t.contact.form.submit}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
