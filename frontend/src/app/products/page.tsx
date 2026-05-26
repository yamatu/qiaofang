'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageBanner from '@/components/PageBanner';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';
import { usePageMeta } from '@/lib/useMeta';

interface Product {
  id: number;
  title: string;
  category: string;
  description: string;
  image_url: string;
}

export default function ProductsPage() {
  const { t } = useI18n();
  usePageMeta(`${t.nav.products} - 乔方科技`, '乔方科技产品中心 - RF连接器、线束、数据线等精密电子元器件');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data || []));
    api.get('/categories').then(res => {
      const cats = (res.data || []).map((c: {name: string}) => c.name);
      setCategories(cats);
    });
  }, []);

  const filtered = activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageBanner title={t.products.title} subtitle={t.products.subtitle} />

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-wrap gap-3 mb-10">
            <button onClick={() => setActiveCategory('')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${!activeCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.products.allCategories}
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">{t.products.noProducts}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/products/${product.id}`} className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                      {product.image_url ? (
                        <img src={`${API_BASE_URL}${product.image_url}`} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No Image</div>
                      )}
                    </div>
                    <div className="p-6">
                      {product.category && <span className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">{product.category}</span>}
                      <h3 className="text-lg font-bold text-gray-900 mt-3 group-hover:text-blue-600 transition-colors">{product.title}</h3>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                      <span className="inline-flex items-center text-blue-600 text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                        {t.products.viewDetail} <ArrowRight size={16} className="ml-1" />
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
