'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageBanner from '@/components/PageBanner';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';
import { getAssetUrl, useCompanyInfo } from '@/lib/company';
import { usePageMeta } from '@/lib/useMeta';

interface Certificate {
  id: number;
  title: string;
  description: string;
  image_url: string;
}

export default function CertificatesPage() {
  const { t } = useI18n();
  usePageMeta(`${t.nav.certificates} - 乔方科技`, '乔方科技荣誉资质 - ISO9001、UL认证、QC080000');
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [selected, setSelected] = useState<Certificate | null>(null);
  const { info: companyInfo } = useCompanyInfo();

  useEffect(() => {
    api.get('/certificates').then(res => setCerts(res.data || []));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageBanner title={t.certs.title} subtitle={t.certs.desc} image={companyInfo.certificates_banner} />

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-10">
            <p className="text-sm text-gray-500">{certs.length} 项认证</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {certs.map((cert, i) => (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(cert)}
                className="bg-white rounded-2xl border border-gray-100 p-6 text-center cursor-pointer hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all group">
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">{i + 1}</div>
                <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
                  {cert.image_url ? (
                    <img src={getAssetUrl(cert.image_url)} alt={cert.title} className="w-full h-full object-contain p-4" />
                  ) : (
                    <Award size={48} className="text-blue-200" />
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{cert.title}</h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Dialog.Root open={!!selected} onOpenChange={() => setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
            {selected && (
              <>
                <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">{selected.title}</Dialog.Title>
                {selected.image_url && (
                  <div className="w-full bg-gray-50 rounded-xl overflow-hidden mb-4">
                    <img src={getAssetUrl(selected.image_url)} alt={selected.title} className="w-full object-contain max-h-[60vh]" />
                  </div>
                )}
                <p className="text-gray-600">{selected.description}</p>
                <Dialog.Close className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">关闭</Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Footer />
    </div>
  );
}
