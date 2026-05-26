'use client';

import { motion } from 'framer-motion';

interface PageBannerProps {
  title: string;
  subtitle?: string;
  image?: string;
}

export default function PageBanner({ title, subtitle, image }: PageBannerProps) {
  return (
    <section className="relative h-[40vh] min-h-[320px] flex items-center justify-center overflow-hidden bg-blue-900">
      {image && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${image})` }}></div>}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-blue-900/80"></div>
      <div className="relative z-10 text-center px-6">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-gray-200 font-light max-w-2xl mx-auto">
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
