'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Award, Cpu, ChevronRight, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';
import { getAssetUrl, useCompanyInfo } from '@/lib/company';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  const { t } = useI18n();
  const { info: companyInfo } = useCompanyInfo();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dynamicSlides, setDynamicSlides] = useState<{title: string; subtitle: string; description: string; image_url: string}[]>([]);
  const [slidesLoaded, setSlidesLoaded] = useState(false);
  const [dynamicApps, setDynamicApps] = useState<{id:number;title:string;description:string;image_url:string}[]>([]);
  const [appsLoaded, setAppsLoaded] = useState(false);
  const [dynamicCerts, setDynamicCerts] = useState<{id:number;title:string;description:string;image_url:string}[]>([]);
  const [certsLoaded, setCertsLoaded] = useState(false);
  const certCarouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    api.get('/slides').then(res => {
      if (mounted && res.data && res.data.length > 0) {
        setDynamicSlides(res.data.filter((s: {active: boolean}) => s.active));
      }
    }).catch(() => {}).finally(() => {
      if (mounted) setSlidesLoaded(true);
    });
    api.get('/applications').then(res => {
      if (mounted && res.data && res.data.length > 0) setDynamicApps(res.data);
    }).catch(() => {}).finally(() => {
      if (mounted) setAppsLoaded(true);
    });
    api.get('/certificates').then(res => {
      if (mounted && res.data && res.data.length > 0) setDynamicCerts(res.data);
    }).catch(() => {}).finally(() => {
      if (mounted) setCertsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const heroSlides = dynamicSlides.length > 0
    ? dynamicSlides.map(s => ({ image: getAssetUrl(s.image_url), title: s.title, subtitle: s.subtitle, desc: s.description }))
    : [];

  const applications = dynamicApps.length > 0
    ? dynamicApps.map(a => ({ icon: <Cpu size={32} />, title: a.title, desc: a.description, image: a.image_url ? `${API_BASE_URL}${a.image_url}` : '' }))
    : [];

  const certificates = dynamicCerts.length > 0
    ? dynamicCerts.map(c => ({ title: c.title, desc: c.description, image: c.image_url }))
    : [];

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const safeCurrentSlide = heroSlides.length > 0 ? Math.min(currentSlide, heroSlides.length - 1) : 0;
  const heroFallbackImage = getAssetUrl(companyInfo.hero_image);
  const scrollCertificates = (direction: 'prev' | 'next') => {
    const carousel = certCarouselRef.current;
    if (!carousel) return;
    const distance = Math.max(carousel.clientWidth * 0.82, 320);
    carousel.scrollBy({
      left: direction === 'next' ? distance : -distance,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <Header />

      {/* Hero */}
      <section className="relative h-screen w-full overflow-hidden bg-black">
        {heroSlides.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div key={safeCurrentSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
            <div data-protected-image="true" className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${heroSlides[safeCurrentSlide].image})` }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-6 max-w-7xl">
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="max-w-3xl">
                  <div className="inline-block px-5 py-1.5 mb-6 border border-white/30 backdrop-blur-md text-white text-xs md:text-sm font-medium tracking-[0.2em] uppercase rounded-full">{heroSlides[safeCurrentSlide].subtitle}</div>
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight">{heroSlides[safeCurrentSlide].title}</h2>
                  <p className="text-xl md:text-2xl text-gray-200 font-light mb-10 max-w-2xl leading-relaxed">{heroSlides[safeCurrentSlide].desc}</p>
                  <div className="flex flex-wrap gap-6">
                    <Link href="/products" className="bg-blue-600 text-white px-10 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all flex items-center gap-3 group text-lg shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                      {t.hero.explore} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/contact" className="bg-transparent border border-white/50 text-white px-10 py-4 rounded-full font-semibold hover:bg-white hover:text-black transition-all text-lg backdrop-blur-sm">{t.hero.contactExpert}</Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        ) : (
          <div className="absolute inset-0">
            {heroFallbackImage ? (
              <div data-protected-image="true" className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${heroFallbackImage})` }} />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
            {slidesLoaded ? (
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-6 max-w-7xl">
                  <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-3xl">
                    <div className="inline-block px-5 py-1.5 mb-6 border border-white/30 backdrop-blur-md text-white text-xs md:text-sm font-medium tracking-[0.2em] uppercase rounded-full">{t.about.subtitle}</div>
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight">{t.footer.brand}</h2>
                    <p className="text-xl md:text-2xl text-gray-200 font-light mb-10 max-w-2xl leading-relaxed">{t.footer.brandDesc}</p>
                    <div className="flex flex-wrap gap-6">
                      <Link href="/products" className="bg-blue-600 text-white px-10 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all flex items-center gap-3 group text-lg shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                        {t.hero.explore} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link href="/contact" className="bg-transparent border border-white/50 text-white px-10 py-4 rounded-full font-semibold hover:bg-white hover:text-black transition-all text-lg backdrop-blur-sm">{t.hero.contactExpert}</Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-6 max-w-7xl">
                <div className="max-w-3xl space-y-6">
                  <div className="h-8 w-48 rounded-full bg-white/10 animate-pulse"></div>
                  <div className="h-16 w-full max-w-2xl rounded-xl bg-white/10 animate-pulse"></div>
                  <div className="h-8 w-2/3 rounded-lg bg-white/10 animate-pulse"></div>
                </div>
              </div>
            </div>
            )}
          </div>
        )}
        <div className="absolute bottom-10 left-0 w-full z-20">
          <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex gap-3">
              {heroSlides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 transition-all duration-500 rounded-full ${safeCurrentSlide === i ? 'w-12 bg-blue-500' : 'w-4 bg-white/50 hover:bg-white'}`}></button>
              ))}
            </div>
            {heroSlides.length > 0 && (
            <div className="hidden md:flex gap-4">
              <button onClick={() => setCurrentSlide((p) => (p === 0 ? heroSlides.length - 1 : p - 1))} className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center text-white backdrop-blur-md hover:bg-white hover:text-black transition-all"><ChevronLeft size={24} /></button>
              <button onClick={() => setCurrentSlide((p) => (p + 1) % heroSlides.length)} className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center text-white backdrop-blur-md hover:bg-white hover:text-black transition-all"><ChevronRight size={24} /></button>
            </div>
            )}
          </div>
        </div>
      </section>


      {/* Applications */}
      <section className="py-24 bg-zinc-950 text-white overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h3 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">{t.applications.title}</h3>
              <div className="w-24 h-1 bg-blue-600"></div>
            </div>
            <p className="text-zinc-400 max-w-lg text-lg font-light leading-relaxed">{t.applications.desc}</p>
          </motion.div>
          <div className="flex flex-col md:flex-row w-full h-[1000px] md:h-[600px] gap-3 md:gap-4">
            {!appsLoaded ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5 animate-pulse">
                  <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 mb-6"></div>
                    <div className="h-7 w-32 rounded bg-white/10 mb-4"></div>
                    <div className="h-4 w-44 rounded bg-white/10"></div>
                  </div>
                </div>
              ))
            ) : applications.map((app, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative flex-1 md:hover:flex-[2.5] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden rounded-2xl group cursor-pointer border border-white/10">
                <div data-protected-image="true" className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] group-hover:scale-110" style={{ backgroundImage: `url(${app.image})` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent"></div>
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/10 transition-colors duration-700"></div>
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col justify-end h-full">
                  <div className="transform transition-transform duration-700 md:translate-y-16 group-hover:translate-y-0">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-6 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-500">{app.icon}</div>
                    <h4 className="text-2xl font-bold text-white mb-3 whitespace-nowrap tracking-wide">{app.title}</h4>
                    <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                      <p className="text-zinc-300 text-base leading-relaxed mb-6 mt-2 max-w-sm font-light">{app.desc}</p>
                      <span className="inline-flex items-center text-blue-400 font-semibold">{t.applications.explore} <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Certifications - Carousel */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/80 to-transparent"></div>
        <div className="container mx-auto px-6 max-w-[90rem] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,0.26fr)_minmax(0,1fr)] items-start gap-10 xl:gap-14">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="w-full lg:sticky lg:top-32">
              <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-blue-600 font-semibold text-sm tracking-wider uppercase mb-3 block">Certifications</motion.span>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t.certs.title}</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">{t.certs.desc}</p>
              <Link href="/certificates" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                {t.certs.viewAll} <ArrowRight size={18} />
              </Link>
              {certificates.length > 1 && (
                <div className="flex gap-3 mt-8">
                  <button onClick={() => scrollCertificates('prev')} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors"><ChevronLeft size={18} /></button>
                  <button onClick={() => scrollCertificates('next')} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors"><ChevronRight size={18} /></button>
                </div>
              )}
            </motion.div>
            <div className="w-full min-w-0 overflow-hidden">
              {!certsLoaded ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[25rem] rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 animate-pulse">
                      <div className="w-full h-64 rounded-xl bg-gray-100 mb-6"></div>
                      <div className="h-5 w-2/3 rounded bg-gray-100 mx-auto mb-3"></div>
                      <div className="h-4 w-full rounded bg-gray-100"></div>
                    </div>
                  ))}
                </div>
              ) : certificates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 py-16 text-center text-gray-400">
                  暂无证书展示
                </div>
              ) : (
              <div ref={certCarouselRef} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 pr-2">
                {certificates.map((cert, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="snap-start flex-none w-[82vw] sm:w-[47%] lg:w-[32%]">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center hover:border-blue-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                      <div className="w-full h-64 md:h-72 xl:h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center mb-5 overflow-hidden">
                        {cert.image ? (
                          <img src={getAssetUrl(cert.image)} alt={cert.title} className="w-full h-full object-contain p-2" />
                        ) : (
                          <Award size={48} className="text-blue-400" />
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg mb-2">{cert.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{cert.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
