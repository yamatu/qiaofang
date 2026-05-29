'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lightbulb, Truck, Heart, Headphones, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageBanner from '@/components/PageBanner';
import { useI18n } from '@/lib/i18n';
import { usePageMeta } from '@/lib/useMeta';
import api from '@/lib/api';
import { getAssetUrl, useCompanyInfo } from '@/lib/company';

const timeline = [
  { year: '2008', text: '公司成立' },
  { year: '2011', text: '正式成为联想移动合格供应商' },
  { year: '2012', text: '成为Molex供应商，开始承接A客户产品及成品天线生产' },
  { year: '2013', text: '为日本著名连接器品牌生产射频线缆组件' },
  { year: '2015', text: '连接器事业部被上市公司收购' },
  { year: '2016', text: '完成ISO9001&14001质量体系认证，更换公司抬头为昆山乔方电子' },
  { year: '2017', text: '开始量产声学高精度异形连接组件，获得IATF16949车用产品体系认证' },
  { year: '2018', text: '开始量产电动滑板车防水连接组件，荣获国家级高新技术企业认证' },
  { year: '2019', text: '通过UL工厂认证' },
];

const coreValues = [
  { icon: Shield, title: 'Quality', subtitle: '品质稳定', color: 'blue' },
  { icon: Lightbulb, title: 'Innovation', subtitle: '技术创新', color: 'purple' },
  { icon: Truck, title: 'Delivery', subtitle: '交货及时', color: 'green' },
  { icon: Heart, title: 'Sincerity', subtitle: '诚信', color: 'red' },
  { icon: Headphones, title: 'Service', subtitle: '服务高效', color: 'orange' },
  { icon: DollarSign, title: 'Cost', subtitle: '成本竞争力', color: 'teal' },
];

const highlights = [
  '成立于2008年12月，位于昆山开发区吴淞江南路',
  '拥有进出口经营权和海关手册免税核销资质',
  '2018年被评为国家级高新技术企业',
  '以多名10年以上技术型人才为核心的管理团队',
  '熟练应用APQP配合客户前期开发',
  '严格按照IPC/WHMA-A-620B国际行业标准执行',
  '拥有高频高速线信号完整性测试能力',
  '使用先进完善的SAP ERP管理系统',
  '通过ISO9001&14001&IATF16949质量体系以及UL认证',
  '具备ROHS等环保标准实验室自检能力',
  '可自主设计非标自动化生产设备',
  '高度重视环境保护和生产安全',
];

export default function AboutPage() {
  const { t } = useI18n();
  usePageMeta(`${t.nav.about} - 乔方科技`, '昆山乔方电子科技有限公司 - 国家级高新技术企业');
  const [partners, setPartners] = useState<{id:number;name:string;logo_url:string}[]>([]);
  const { info: companyInfo, loaded: companyLoaded } = useCompanyInfo();
  useEffect(() => {
    let mounted = true;
    api.get('/partners').then(r => {
      if (mounted) setPartners(r.data || []);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageBanner title="关于乔方科技" subtitle="精密智造，连接未来" image={companyInfo.about_banner} />

      {/* Company intro */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">企业简介</h2>
              <p className="text-gray-600 leading-relaxed text-lg mb-6">
                昆山乔方电子科技有限公司成立于2008年12月，位于昆山开发区，是一家专业从事电子元器件、精密连接器及配套线缆研发与制造的国家级高新技术企业。
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                公司遵循"诚信为本，质量第一，客户至上，永续经营"的管理理念，以多名10年以上技术型人才为核心的管理团队，严格按照IPC/WHMA-A-620B国际行业标准执行生产。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl overflow-hidden">
                {companyInfo.about_image ? (
                  <img src={getAssetUrl(companyInfo.about_image)} alt="乔方科技" className="w-full h-full object-cover" />
                ) : companyLoaded ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-blue-600 mb-2">17+</div>
                      <div className="text-gray-600">年行业经验</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-blue-100 animate-pulse" />
                )}
              </div>
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, type: 'spring' }}
                className="absolute -bottom-6 -left-6 bg-blue-600 text-white rounded-2xl p-5 shadow-xl">
                <div className="text-3xl font-bold">17+</div>
                <div className="text-sm text-blue-100">年行业经验</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-3xl font-bold text-gray-900 text-center mb-4">核心价值观</motion.h2>
          <p className="text-center text-gray-500 mb-12">关注客户，共同成长，为客户创造价值</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {coreValues.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Icon size={22} className="text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{v.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{v.subtitle}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">发展历程</h2>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-blue-100 -translate-x-1/2"></div>
            {timeline.slice().reverse().map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className={`relative flex items-center mb-8 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-blue-600 border-4 border-blue-100 -translate-x-1/2 z-10"></div>
                <div className={`ml-12 md:ml-0 md:w-[45%] ${i % 2 === 0 ? 'md:mr-auto md:pr-12 md:text-right' : 'md:ml-auto md:pl-12'}`}>
                  <span className="text-blue-600 font-bold text-lg">{item.year}</span>
                  <p className="text-gray-600 mt-1">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      {partners.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 max-w-7xl">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">合作伙伴</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {partners.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-4 h-20 flex items-center justify-center border border-gray-100 hover:shadow-md transition-shadow">
                  {p.logo_url ? <img src={getAssetUrl(p.logo_url)} alt={p.name} className="max-h-full max-w-full object-contain" /> : <span className="text-sm text-gray-500 font-medium">{p.name}</span>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
