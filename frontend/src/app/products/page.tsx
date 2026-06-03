'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Package } from 'lucide-react';
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

type ContentSection = {
  page_key: string;
  section_key: string;
  title: string;
  subtitle: string;
  body: string;
  items: string[];
  active: boolean;
};

export default function ProductsPage() {
  const { t } = useI18n();
  usePageMeta(`${t.nav.products} - 乔方科技`, '乔方科技产品中心 - RF连接器、线束、数据线等精密电子元器件');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const { info: companyInfo } = useCompanyInfo();

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      api.get('/products'),
      api.get('/categories'),
      api.get('/content-sections', { params: { page: 'products' } }),
    ]).then(([productsRes, categoriesRes, contentRes]) => {
      if (!mounted) return;
      const productData = (productsRes.status === 'fulfilled' ? productsRes.value.data || [] : []) as Product[];
      setProducts(productData);
      if (contentRes.status === 'fulfilled') setContentSections(contentRes.value.data || []);
      const managedCategories = (categoriesRes.status === 'fulfilled' ? categoriesRes.value.data || [] : []).map((c: {name: string}) => c.name).filter(Boolean);
      const productCategories = productData.map(p => p.category).filter(Boolean);
      setCategories(Array.from(new Set([...managedCategories, ...productCategories])));
      const params = new URLSearchParams(window.location.search);
      const category = params.get('category') || '';
      const page = Number(params.get('page') || '1');
      setActiveCategory(category);
      setCurrentPage(Number.isFinite(page) && page > 0 ? page : 1);
    }).finally(() => {
      if (mounted) setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateListUrl = (category: string, page: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    window.history.replaceState(null, '', query ? `/products?${query}` : '/products');
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
    updateListUrl(category, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateListUrl(activeCategory, page);
  };

  const filtered = activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedProducts = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const categoryCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = products.filter(p => p.category === cat).length;
    return acc;
  }, {});
  const visiblePageStart = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const visiblePageEnd = Math.min(safeCurrentPage * pageSize, filtered.length);
  const productHref = (id: number) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (safeCurrentPage > 1) params.set('page', String(safeCurrentPage));
    const query = params.toString();
    return query ? `/products/${id}?${query}` : `/products/${id}`;
  };
  const visibleContentSections = contentSections.filter(section => section.active !== false);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageBanner title={t.products.title} subtitle={t.products.subtitle} image={companyInfo.products_banner} />

      {visibleContentSections.length > 0 && (
        <section className="bg-white py-16">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">专业能力概览</h2>
                <p className="mt-3 max-w-2xl text-gray-500">来自公司简介资料的应用领域、产品系列和高速互连能力。</p>
              </div>
              <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                获取定制方案 <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {visibleContentSections.map((section, index) => (
                <motion.div
                  key={section.section_key}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-2xl border border-gray-100 bg-slate-50 p-6"
                >
                  <span className="text-sm font-semibold text-blue-600">{section.subtitle}</span>
                  <h3 className="mt-3 text-xl font-bold text-gray-900">{section.title}</h3>
                  <p className="mt-4 line-clamp-4 text-sm leading-6 text-gray-600">{section.body}</p>
                  {section.items.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {section.items.map(item => (
                        <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-100">
                          <CheckCircle2 size={13} className="text-blue-500" />
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-14 bg-slate-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-7 items-start">
            <aside className="overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm lg:sticky lg:top-28">
              <div className="bg-blue-600 text-white px-5 py-4 font-semibold text-lg relative overflow-hidden">
                <span>Products/ 产品中心</span>
                <span className="absolute right-0 top-0 h-full w-10 bg-blue-500/40 skew-x-[-35deg] translate-x-4" />
              </div>
              <div className="px-4 py-4 space-y-2">
                <button onClick={() => handleCategoryChange('')} className={`w-full flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors ${!activeCategory ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'}`}>
                  <span>{t.products.allCategories}</span>
                  <span className="inline-flex items-center gap-2 text-xs text-gray-400">
                    <span>{products.length}</span>
                    <ChevronRight size={16} className="text-blue-400" />
                  </span>
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => handleCategoryChange(cat)} className={`w-full flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors ${activeCategory === cat ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'}`}>
                    <span>{cat}</span>
                    <span className="inline-flex items-center gap-2 text-xs text-gray-400">
                      {categoryCounts[cat] > 0 && <span>{categoryCounts[cat]}</span>}
                      <ChevronRight size={16} className="text-blue-400" />
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <main className="rounded-2xl bg-white border border-gray-100 px-5 md:px-7 py-7 shadow-sm">
              <div className="flex items-center justify-center border-b border-gray-200 pb-3 mb-8">
                <h2 className="text-xl font-bold text-blue-600">产品中心</h2>
              </div>

              {!loaded ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
                      <div className="h-44 rounded-xl bg-gray-100 mb-4" />
                      <div className="h-5 w-1/2 rounded bg-gray-100 mx-auto" />
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
                        <Link href={productHref(product.id)} className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl transition-all">
                          <div className="m-3 h-52 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-4">
                            {product.image_url ? (
                              <img src={getAssetUrl(product.image_url)} alt={product.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <Package size={42} className="text-gray-200" />
                            )}
                          </div>
                          <div className="px-4 pb-5 text-center">
                            <h3 className="text-base text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">{product.title}</h3>
                            {product.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.description}</p>}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-8 text-sm">
                      <button disabled={safeCurrentPage === 1} onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))} className="min-w-8 h-8 rounded-lg border border-gray-300 disabled:text-gray-300 disabled:border-gray-200 hover:border-blue-500">&lt;</button>
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <button key={page} onClick={() => handlePageChange(page)} className={`min-w-8 h-8 rounded-lg border ${safeCurrentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:border-blue-500'}`}>
                            {page}
                          </button>
                        );
                      })}
                      <button disabled={safeCurrentPage === totalPages} onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))} className="min-w-8 h-8 rounded-lg border border-gray-300 disabled:text-gray-300 disabled:border-gray-200 hover:border-blue-500">&gt;</button>
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
