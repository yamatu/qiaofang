'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Package } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageBanner from '@/components/PageBanner';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';
import { getAssetUrl, useCompanyInfo } from '@/lib/company';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const { info: companyInfo } = useCompanyInfo();

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/products'),
      api.get('/categories'),
    ]).then(([productsRes, categoriesRes]) => {
      if (!mounted) return;
      const productData = (productsRes.data || []) as Product[];
      setProducts(productData);
      const managedCategories = (categoriesRes.data || []).map((c: {name: string}) => c.name).filter(Boolean);
      const productCategories = productData.map(p => p.category).filter(Boolean);
      setCategories(Array.from(new Set([...managedCategories, ...productCategories])));
    }).catch(() => {}).finally(() => {
      if (mounted) setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const filtered = activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedProducts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const categoryCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = products.filter(p => p.category === cat).length;
    return acc;
  }, {});
  const visiblePageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const visiblePageEnd = Math.min(currentPage * pageSize, filtered.length);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageBanner title={t.products.title} subtitle={t.products.subtitle} image={companyInfo.products_banner} />

      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-7 items-start">
            <aside className="bg-white border border-gray-100 shadow-sm lg:sticky lg:top-28">
              <div className="bg-blue-600 text-white px-5 py-4 font-semibold text-lg relative overflow-hidden">
                <span>Products/ 产品中心</span>
                <span className="absolute right-0 top-0 h-full w-10 bg-blue-500/40 skew-x-[-35deg] translate-x-4" />
              </div>
              <div className="px-4 py-4">
                <button onClick={() => handleCategoryChange('')} className={`w-full flex items-center justify-between border-b border-gray-200 px-3 py-3 text-left text-sm transition-colors ${!activeCategory ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'}`}>
                  <span>{t.products.allCategories}</span>
                  <span className="inline-flex items-center gap-2 text-xs text-gray-400">
                    <span>{products.length}</span>
                    <ChevronRight size={16} className="text-blue-400" />
                  </span>
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => handleCategoryChange(cat)} className={`w-full flex items-center justify-between border-b border-gray-200 px-3 py-3 text-left text-sm transition-colors ${activeCategory === cat ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'}`}>
                    <span>{cat}</span>
                    <span className="inline-flex items-center gap-2 text-xs text-gray-400">
                      {categoryCounts[cat] > 0 && <span>{categoryCounts[cat]}</span>}
                      <ChevronRight size={16} className="text-blue-400" />
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <main className="bg-white border border-gray-100 px-5 md:px-7 py-7 shadow-sm">
              <div className="flex items-center justify-center border-b border-gray-200 pb-3 mb-8">
                <h2 className="text-xl font-bold text-blue-600">产品中心</h2>
              </div>

              {!loaded ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-gray-200 bg-white p-4 animate-pulse">
                      <div className="h-44 bg-gray-100 mb-4" />
                      <div className="h-5 w-1/2 bg-gray-100 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">{t.products.noProducts}</div>
              ) : (
                <>
                  <div className="mb-5 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>{activeCategory || t.products.allCategories}</span>
                    <span>共 {filtered.length} 个产品，当前显示 {visiblePageStart}-{visiblePageEnd}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {pagedProducts.map((product, i) => (
                      <motion.div key={product.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}>
                        <Link href={`/products/${product.id}`} className="group block border border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all">
                          <div className="h-52 bg-white overflow-hidden flex items-center justify-center p-4">
                            {product.image_url ? (
                              <img src={getAssetUrl(product.image_url)} alt={product.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <Package size={42} className="text-gray-200" />
                            )}
                          </div>
                          <div className="px-4 pb-4 text-center">
                            <h3 className="text-base text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">{product.title}</h3>
                            {product.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.description}</p>}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-8 text-sm">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="min-w-7 h-7 border border-gray-300 disabled:text-gray-300 disabled:border-gray-200 hover:border-blue-500">&lt;</button>
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <button key={page} onClick={() => setCurrentPage(page)} className={`min-w-7 h-7 border ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:border-blue-500'}`}>
                            {page}
                          </button>
                        );
                      })}
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="min-w-7 h-7 border border-gray-300 disabled:text-gray-300 disabled:border-gray-200 hover:border-blue-500">&gt;</button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
