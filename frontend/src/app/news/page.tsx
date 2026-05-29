'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageBanner from '@/components/PageBanner';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';
import { getAssetUrl, useCompanyInfo } from '@/lib/company';
import { usePageMeta } from '@/lib/useMeta';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  image_url: string;
  published: boolean;
  created_at: string;
}

export default function NewsPage() {
  const { t } = useI18n();
  usePageMeta(`${t.nav.news} - 乔方科技`, '乔方科技新闻资讯 - 最新动态与行业资讯');
  const [news, setNews] = useState<NewsItem[]>([]);
  const { info: companyInfo } = useCompanyInfo();

  useEffect(() => {
    api.get('/news').then(res => {
      const data = (res.data || []).filter((n: NewsItem) => n.published);
      setNews(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageBanner title={t.news.title} subtitle={t.news.subtitle} image={companyInfo.news_banner} />

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          {news.length === 0 ? (
            <div className="text-center py-20 text-gray-400">{t.news.noNews}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/news/${item.id}`} className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="aspect-[16/9] bg-gray-50 overflow-hidden">
                      {item.image_url ? (
                        <img src={getAssetUrl(item.image_url)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50 text-gray-300">News</div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <Calendar size={14} />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-3">{item.summary}</p>
                      <span className="inline-flex items-center text-blue-600 text-sm font-medium mt-4">
                        {t.news.readMore} <ArrowRight size={16} className="ml-1" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
