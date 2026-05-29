'use client';

import { motion } from 'framer-motion';
import { getAssetUrl } from '@/lib/company';

interface PageBannerProps {
  title: string;
  subtitle?: string;
  image?: string;
}

export default function PageBanner({ title, subtitle, image }: PageBannerProps) {
  const imageUrl = getAssetUrl(image);

  return (
    <section className="relative h-[34vh] min-h-[260px] flex items-center justify-center overflow-hidden bg-blue-900 pt-20">
      {imageUrl ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.55),transparent_34%),linear-gradient(135deg,#0f172a,#1d4ed8)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-blue-950/55 to-slate-900/70" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />
      <div className="relative z-10 text-center px-6">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35 }} className="text-lg text-gray-200 font-light max-w-2xl mx-auto">
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
