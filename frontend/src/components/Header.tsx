'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Search, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

export default function Header() {
  const { locale, t, toggleLocale } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logo, setLogo] = useState('');
  const [companyLoaded, setCompanyLoaded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{type:string;id:number;title:string}[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    api.get('/company').then(res => {
      if (mounted && res.data?.logo_url) setLogo(res.data.logo_url);
    }).catch(() => {}).finally(() => {
      if (mounted) setCompanyLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const results: {type:string;id:number;title:string}[] = [];
      try {
        const [products, news] = await Promise.all([api.get('/products'), api.get('/news')]);
        (products.data || []).filter((p: {title:string}) => p.title.includes(searchQuery)).slice(0, 5).forEach((p: {id:number;title:string}) => results.push({type:'product', id:p.id, title:p.title}));
        (news.data || []).filter((n: {title:string}) => n.title.includes(searchQuery)).slice(0, 5).forEach((n: {id:number;title:string}) => results.push({type:'news', id:n.id, title:n.title}));
      } catch {}
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navLinks = [
    { name: t.nav.home, href: '/' },
    { name: t.nav.about, href: '/about' },
    { name: t.nav.products, href: '/products' },
    { name: t.nav.certificates, href: '/certificates' },
    { name: t.nav.news, href: '/news' },
    { name: t.nav.contact, href: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            {logo ? (
              <img src={`${API_BASE_URL}${logo}`} alt="乔方科技" className="h-10 object-contain" />
            ) : companyLoaded ? (
              <>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl transition-colors duration-500 ${isScrolled ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>Q</div>
                <div>
                  <h1 className={`text-2xl font-bold tracking-tight leading-none transition-colors duration-500 ${isScrolled ? 'text-blue-900' : 'text-white'}`}>乔方</h1>
                  <span className={`text-xs font-semibold tracking-widest uppercase transition-colors duration-500 ${isScrolled ? 'text-blue-600' : 'text-white/80'}`}>Qiao Fang</span>
                </div>
              </>
            ) : (
              <div className="h-10 w-32 rounded-lg bg-white/15" />
            )}
          </Link>
          <nav className="hidden md:flex space-x-8 lg:space-x-10">
            {navLinks.map((link, i) => (
              <Link key={i} href={link.href} className={`font-medium transition-colors relative group text-sm lg:text-base ${isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}`}>
                {link.name}
                <span className={`absolute -bottom-2 left-0 w-0 h-0.5 transition-all group-hover:w-full ${isScrolled ? 'bg-blue-600' : 'bg-white'}`}></span>
              </Link>
            ))}
          </nav>
          <div className={`hidden md:flex items-center space-x-6 transition-colors duration-500 ${isScrolled ? 'text-gray-600' : 'text-white'}`}>
            <button onClick={toggleLocale} className="flex items-center space-x-1 text-sm font-medium hover:opacity-70 transition-opacity">
              <Globe size={18} />
              <span>{locale === 'zh' ? 'EN' : '中文'}</span>
            </button>
            <button onClick={() => setSearchOpen(true)} className="hover:opacity-70 transition-opacity"><Search size={22} /></button>
          </div>
          <button className={`md:hidden ${isScrolled ? 'text-gray-900' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 py-4">
            <div className="flex flex-col px-6 space-y-4">
              {navLinks.map((link, i) => (
                <Link key={i} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-gray-700 font-medium pb-2 border-b border-gray-50">{link.name}</Link>
              ))}
              <button onClick={toggleLocale} className="text-left text-blue-600 font-medium">{locale === 'zh' ? 'Switch to English' : '切换到中文'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-24" onClick={() => setSearchOpen(false)}>
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Search size={20} className="text-gray-400" />
                <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索产品、新闻..." className="flex-1 outline-none text-gray-900 text-lg" />
                <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-80 overflow-y-auto py-2">
                  {searchResults.map((r, i) => (
                    <Link key={i} href={r.type === 'product' ? `/products/${r.id}` : `/news/${r.id}`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{r.type === 'product' ? '产品' : '新闻'}</span>
                      <span className="text-gray-900 text-sm">{r.title}</span>
                    </Link>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">未找到相关结果</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
