'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  GlobeMeshIcon, 
  NetworkNodeIcon, 
  PrecisionGearIcon, 
  CrystalPrismIcon,
  DataGridIcon,
  ArrowPathIcon
} from '@/components/icons';

interface LandingClientProps {
  locale: string;
  data: any;
}

export function LandingClient({ locale, data }: LandingClientProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1] as any
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1] as any
      }
    }
  };

  return (
    <main className="relative pt-24">
      {/* HERO SECTION */}
      <section className="relative py-32 overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full"
          style={{ background: 'var(--gradient-radial)' }}
        />
        
        <motion.div
          className="container-wide relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex justify-center mb-12"
            variants={itemVariants}
          >
            <GlobeMeshIcon 
              className="w-20 h-20 md:w-24 md:h-24 text-[var(--brand-primary)]"
            />
          </motion.div>

          <motion.h1 
            className="text-center mb-8"
            variants={itemVariants}
            style={{ color: 'var(--fg-primary)' }}
          >
            {data.hero.title}
          </motion.h1>

          <motion.p 
            className="text-large text-center max-w-3xl mx-auto mb-12"
            variants={itemVariants}
            style={{ color: 'var(--fg-secondary)' }}
          >
            {data.hero.subtitle}
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={itemVariants}
          >
            <Link href={`/${locale}/auth/sign-up`}>
              <motion.button
                className="surface px-8 py-4 rounded-lg flex items-center gap-3"
                style={{ 
                  background: 'var(--brand-primary)',
                  color: 'var(--fg-inverse)',
                  border: 'none'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="font-semibold">{data.hero.cta_primary}</span>
                <ArrowPathIcon className="w-5 h-5" />
              </motion.button>
            </Link>

            <Link href={`/${locale}/pricing`}>
              <motion.button
                className="surface px-8 py-4 rounded-lg"
                style={{ 
                  background: 'transparent',
                  color: 'var(--fg-primary)',
                  borderColor: 'var(--border-primary)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="font-semibold">{data.hero.cta_secondary}</span>
              </motion.button>
            </Link>
          </motion.div>

          <motion.div 
            className="text-center mt-8"
            variants={itemVariants}
          >
            <Link 
              href={`/${locale}/contact`}
              className="text-small hover:opacity-70 transition-opacity"
              style={{ color: 'var(--brand-secondary)' }}
            >
              {data.hero.cta_premium} →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* AUDIENCES SECTION */}
      <section className="py-32 relative">
        <div className="container-wide">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 style={{ color: 'var(--fg-primary)' }}>
              {data.audiences.title}
            </h2>
            <p className="text-large mt-4" style={{ color: 'var(--fg-secondary)' }}>
              {data.audiences.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { id: 'agency', icon: NetworkNodeIcon, color: 'var(--brand-primary)', data: data.audiences.agency },
              { id: 'media_buyer', icon: PrecisionGearIcon, color: 'var(--brand-secondary)', data: data.audiences.media_buyer },
              { id: 'sme', icon: CrystalPrismIcon, color: 'var(--brand-accent)', data: data.audiences.sme }
            ].map((audience) => {
              const Icon = audience.icon;
              
              return (
                <motion.div
                  key={audience.id}
                  className="surface p-8 text-center"
                  variants={cardVariants}
                  whileHover={{ 
                    y: -8,
                    transition: { type: "spring", stiffness: 400 }
                  }}
                >
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ 
                        background: `${audience.color}15`,
                        border: `1px solid ${audience.color}30`
                      }}
                    >
                      <Icon 
                        className="w-12 h-12"
                      />
                    </div>
                  </div>

                  <h3 className="mb-4" style={{ color: 'var(--fg-primary)' }}>
                    {audience.data.title}
                  </h3>

                  <p style={{ color: 'var(--fg-secondary)' }}>
                    {audience.data.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            className="text-center mt-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <h4 className="mb-6" style={{ color: 'var(--fg-primary)' }}>
              {data.audiences.common_goal.title}
            </h4>
            <div className="flex flex-wrap justify-center gap-4">
              {data.audiences.common_goal.items.map((item: string, index: number) => (
                <motion.span
                  key={index}
                  className="px-4 py-2 rounded-full text-small"
                  style={{ 
                    background: 'var(--bg-tertiary)',
                    color: 'var(--fg-secondary)',
                    border: '1px solid var(--border-primary)'
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="py-32 relative">
        <div className="container-wide">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 style={{ color: 'var(--fg-primary)' }}>
              {data.benefits.title}
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {data.benefits.items.map((benefit: any, index: number) => (
              <motion.div
                key={index}
                className="surface p-6"
                variants={cardVariants}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ background: 'var(--brand-primary)' }}
                  />
                  <div>
                    <h4 className="mb-2" style={{ color: 'var(--fg-primary)' }}>
                      {benefit.title}
                    </h4>
                    <p className="text-small" style={{ color: 'var(--fg-secondary)' }}>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 relative">
        <div className="container-narrow">
          <motion.div
            className="surface p-12 text-center glow-brand"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mb-6" style={{ color: 'var(--fg-primary)' }}>
              {data.cta_final.title}
            </h2>
            <p className="text-large mb-12" style={{ color: 'var(--fg-secondary)' }}>
              {data.cta_final.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/auth/sign-up`}>
                <motion.button
                  className="surface px-8 py-4 rounded-lg flex items-center gap-3"
                  style={{ 
                    background: 'var(--brand-primary)',
                    color: 'var(--fg-inverse)',
                    border: 'none'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-semibold">{data.cta_final.cta_primary}</span>
                  <ArrowPathIcon className="w-5 h-5" />
                </motion.button>
              </Link>

              <Link href={`/${locale}/pricing`}>
                <motion.button
                  className="surface px-8 py-4 rounded-lg"
                  style={{ 
                    background: 'transparent',
                    color: 'var(--fg-primary)'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-semibold">{data.cta_final.cta_secondary}</span>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
