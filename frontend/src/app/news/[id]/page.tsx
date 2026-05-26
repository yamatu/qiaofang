'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';
import { usePageMeta } from '@/lib/useMeta';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  image_url: string;
  created_at: string;
}

export default function NewsDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const [item, setItem] = useState<NewsItem | null>(null);
  usePageMeta(item ? `${item.title} - 乔方科技` : '新闻详情 - 乔方科技', item?.summary);

  useEffect(() => {
    if (params.id) {
      api.get(`/news/${params.id}`).then(res => setItem(res.data));
    }
  }, [params.id]);

  if (!item) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="h-[30vh] bg-gradient-to-b from-gray-900 to-gray-800"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 pt-28 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link href="/news" className="inline-flex items-center gap-2 text-blue-300 hover:text-white mb-6 font-medium transition-colors">
            <ArrowLeft size={18} /> {t.news.back}
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Calendar size={16} />
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{item.title}</h1>
          </motion.div>
        </div>
      </section>
      <div className="pb-20">
        <div className="container mx-auto px-6 max-w-4xl -mt-4">
          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            {item.image_url && (
              <div className="aspect-[16/9] rounded-xl overflow-hidden mb-8 -mt-2">
                <img src={`${API_BASE_URL}${item.image_url}`} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}

            {item.summary && (
              <p className="text-lg text-gray-600 font-medium mb-8 border-l-4 border-blue-600 pl-4">{item.summary}</p>
            )}

            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {item.content}
            </div>
          </motion.article>
        </div>
      </div>
      <Footer />
    </div>
  );
}
