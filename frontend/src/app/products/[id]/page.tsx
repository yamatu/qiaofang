'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Package, Layers } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
  specs: string;
}

export default function ProductDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  usePageMeta(product ? `${product.title} - 乔方科技` : '产品详情 - 乔方科技', product?.description);

  useEffect(() => {
    if (params.id) {
      api.get(`/products/${params.id}`).then(res => setProduct(res.data));
      api.get('/products').then(res => {
        const all = res.data || [];
        setRelated(all.filter((p: Product) => String(p.id) !== String(params.id)).slice(0, 3));
      });
    }
  }, [params.id]);

  const handleProductsBack = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const currentParams = new URLSearchParams(window.location.search);
    const backParams = new URLSearchParams();
    const category = currentParams.get('category');
    const page = currentParams.get('page');
    if (category) backParams.set('category', category);
    if (page) backParams.set('page', page);
    event.preventDefault();
    window.location.href = backParams.toString() ? `/products?${backParams.toString()}` : '/products';
  };

  if (!product) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="h-[40vh] bg-gradient-to-b from-blue-900 to-blue-800"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 pt-28 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <Link href="/products" onClick={handleProductsBack} className="inline-flex items-center gap-2 text-blue-300 hover:text-white mb-6 font-medium transition-colors">
            <ArrowLeft size={18} /> {t.nav.products}
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {product.category && (
              <span className="inline-flex items-center gap-1.5 text-sm text-blue-300 font-medium bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-4">
                <Layers size={14} /> {product.category}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">{product.title}</h1>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-6 max-w-7xl -mt-16 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-6">
                {product.image_url ? (
                  <img src={`${API_BASE_URL}${product.image_url}`} alt={product.title} className="max-h-full max-w-full object-contain" />
                ) : (
                  <Package size={64} className="text-gray-200" />
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t.products.viewDetail}</h2>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
            {product.specs && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.products.specs}</h2>
                <div className="space-y-3">
                  {product.specs.split('\n').map((line, i) => {
                    const parts = line.split(':');
                    const label = parts[0]?.trim();
                    const value = parts.slice(1).join(':').trim();
                    return value ? (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="text-sm font-medium text-gray-900">{value}</span>
                      </div>
                    ) : (
                      <p key={i} className="text-sm text-gray-600">{line}</p>
                    );
                  })}
                </div>
              </div>
            )}
            <Link href="/contact" className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
              {t.hero.contactExpert} <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.products.related}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(p => (
                <Link key={p.id} href={`/products/${p.id}`} className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center p-4">
                    {p.image_url ? <img src={`${API_BASE_URL}${p.image_url}`} alt={p.title} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" /> : <Package size={32} className="text-gray-200" />}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{p.title}</h4>
                    {p.category && <span className="text-xs text-gray-400">{p.category}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
