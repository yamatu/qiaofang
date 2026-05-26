'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Image, Package, Newspaper, Award,
  Building2, Database, LogOut, Menu, X, MessageSquare, Tags, Handshake, AppWindow, Settings
} from 'lucide-react';

const sidebarLinks = [
  { name: '轮播管理', href: '/admin/slides', icon: Image },
  { name: '应用领域', href: '/admin/applications', icon: AppWindow },
  { name: '分类管理', href: '/admin/categories', icon: Tags },
  { name: '产品管理', href: '/admin/products', icon: Package },
  { name: '新闻管理', href: '/admin/news', icon: Newspaper },
  { name: '证书管理', href: '/admin/certificates', icon: Award },
  { name: '合作伙伴', href: '/admin/partners', icon: Handshake },
  { name: '留言管理', href: '/admin/messages', icon: MessageSquare },
  { name: '公司信息', href: '/admin/company', icon: Building2 },
  { name: '数据备份', href: '/admin/backups', icon: Database },
  { name: '账号设置', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }
    setUsername(localStorage.getItem('username') || 'Admin');
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">Q</div>
            <span className="font-bold text-gray-900">后台管理</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon size={18} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{username}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 lg:px-8">
          <button className="lg:hidden mr-4" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <h2 className="text-lg font-semibold text-gray-800">
            {sidebarLinks.find(l => l.href === pathname)?.name || '控制面板'}
          </h2>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
