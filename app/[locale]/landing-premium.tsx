'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import { GlobeMeshIcon, PrecisionGearIcon, CrystalPrismIcon, DataGridIcon, NetworkNodeIcon } from '@/components/icons';

interface LandingPremiumProps {
  content: {
    hero: any;
    problem: any;
    solution: any;
    features: any;
    target_audience: any;
    how_it_works: any;
    social_proof: any;
    cta_final: any;
  };
  locale: string;
}

const springConfig: any = {
  type: "spring",
  stiffness: 400,
  damping: 40
};

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

export function LandingPremium({ content, locale }: LandingPremiumProps) {
  const { hero, problem, solution, features, target_audience, how_it_works, social_proof, cta_final } = content;
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <>
      {/* SEÇÃO 1 - HERO */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center bg-hero overflow-hidden">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center px-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-12"
          >
            <div className="w-24 h-24 animate-float">
              <GlobeMeshIcon />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.05] text-balance max-w-6xl mx-auto"
          >
            {hero.title}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl lg:text-3xl text-[var(--fg-secondary)] mb-12 max-w-4xl mx-auto leading-relaxed text-balance"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Link 
              href={`/${locale}/pricing`}
              className="btn-primary"
            >
              {hero.cta_primary}
            </Link>
            <Link 
              href={`/${locale}/pricing`}
              className="btn-secondary"
            >
              {hero.cta_secondary}
            </Link>
            <Link 
              href={`/${locale}/roi-calculator`}
              className="btn-secondary"
            >
              {hero.cta_tertiary}
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-sm text-[var(--fg-tertiary)]"
          >
            {hero.available_in}
          </motion.p>
        </motion.div>
        
        {/* Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-brand-primary)] rounded-full blur-[120px] opacity-20"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--color-brand-accent)] rounded-full blur-[120px] opacity-20"
          />
        </div>
      </section>

      {/* SEÇÃO 2 - O PROBLEMA */}
      <section className="py-32 bg-premium relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
                {problem.title}
              </h2>
              <p className="text-xl md:text-2xl text-[var(--fg-secondary)] text-balance max-w-3xl mx-auto">
                {problem.subtitle}
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {problem.issues.map((issue: any, index: number) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={springConfig}
                  className="surface p-10 rounded-2xl group cursor-pointer"
                >
                  <h3 className="text-2xl font-semibold mb-4 group-hover:gradient-text transition-all">
                    {issue.title}
                  </h3>
                  <p className="text-[var(--fg-secondary)] text-lg leading-relaxed">
                    {issue.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={fadeInUp}
              className="text-center"
            >
              <p className="text-2xl md:text-3xl font-semibold text-[var(--color-error)] text-balance">
                {problem.conclusion}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 3 - APRESENTAÇÃO DO LOQUIA */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-20">
              <div className="flex justify-center mb-10">
                <motion.div 
                  className="w-20 h-20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <PrecisionGearIcon />
                </motion.div>
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-balance">
                {solution.title}
              </h2>
              <p className="text-xl md:text-2xl text-[var(--fg-secondary)] mb-10 text-balance max-w-3xl mx-auto">
                {solution.subtitle}
              </p>
              <p className="text-lg md:text-xl text-[var(--fg-primary)] leading-relaxed max-w-4xl mx-auto text-balance">
                {solution.intro}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {solution.benefits.map((benefit: any, index: number) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -6 }}
                  transition={springConfig}
                  className="glow-card p-10 rounded-2xl cursor-pointer"
                >
                  <h3 className="text-2xl font-semibold mb-4 gradient-text">
                    {benefit.title}
                  </h3>
                  <p className="text-[var(--fg-secondary)] text-lg leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-brand-primary)] rounded-full blur-[200px] opacity-10 pointer-events-none" />
      </section>

      {/* O LOQUIA AJUDA VOCÊ A */}
      <section className="py-32 bg-premium relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-7xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-24 text-balance"
            >
              {features.title}
            </motion.h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {features.items.map((item: any, index: number) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                  transition={springConfig}
                  className="surface p-10 rounded-2xl group cursor-pointer"
                >
                  <motion.div 
                    className="mb-8 w-12 h-12"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={springConfig}
                  >
                    {index === 0 && <div className="w-12 h-12"><DataGridIcon /></div>}
                    {index === 1 && <div className="w-12 h-12"><NetworkNodeIcon /></div>}
                    {index === 2 && <div className="w-12 h-12"><CrystalPrismIcon /></div>}
                    {index === 3 && <div className="w-12 h-12"><GlobeMeshIcon /></div>}
                    {index === 4 && <div className="w-12 h-12"><PrecisionGearIcon /></div>}
                  </motion.div>
                  <h3 className="text-2xl font-semibold mb-5 group-hover:gradient-text transition-all">
                    {item.title}
                  </h3>
                  <p className="text-[var(--fg-secondary)] text-lg leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PARA QUEM É O LOQUIA */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-7xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
                {target_audience.title}
              </h2>
              <p className="text-xl md:text-2xl text-[var(--fg-secondary)] text-balance">
                {target_audience.subtitle}
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {target_audience.profiles.map((profile: any, index: number) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -6 }}
                  transition={springConfig}
                  className="glow-card p-10 rounded-2xl cursor-pointer"
                >
                  <h3 className="text-3xl font-bold mb-6 gradient-text">
                    {profile.name}
                  </h3>
                  <p className="text-[var(--fg-secondary)] text-lg leading-relaxed">
                    {profile.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-32 bg-premium relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
                {how_it_works.title}
              </h2>
              <p className="text-xl md:text-2xl text-[var(--fg-secondary)] text-balance">
                {how_it_works.subtitle}
              </p>
            </motion.div>
            
            <div className="space-y-8">
              {how_it_works.steps.map((step: any, index: number) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ x: 8 }}
                  transition={springConfig}
                  className="flex gap-8 items-start surface p-10 rounded-2xl group cursor-pointer"
                >
                  <motion.div 
                    className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)] rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-[var(--shadow-glow)]"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={springConfig}
                  >
                    {step.number}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4 group-hover:gradient-text transition-all">
                      {step.title}
                    </h3>
                    <p className="text-[var(--fg-secondary)] text-xl leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* RESULTADOS REAIS */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-7xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
                {social_proof.title}
              </h2>
              <p className="text-xl md:text-2xl text-[var(--fg-secondary)] text-balance">
                {social_proof.subtitle}
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {social_proof.stats.map((stat: any, index: number) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -8 }}
                  transition={springConfig}
                  className="glow-card-success p-16 rounded-2xl text-center cursor-pointer"
                >
                  <motion.div 
                    className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 gradient-text"
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-[var(--fg-secondary)] text-xl font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Success Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-success)] rounded-full blur-[180px] opacity-10 pointer-events-none" />
      </section>

      {/* CTA FINAL */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto"
          >
            <div className="glow-card p-16 md:p-20 rounded-3xl text-center">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-balance">
                {cta_final.title}
              </h2>
              <p className="text-xl md:text-2xl text-[var(--fg-secondary)] mb-12 leading-relaxed text-balance">
                {cta_final.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link 
                  href={`/${locale}/pricing`}
                  className="btn-primary text-xl"
                >
                  {cta_final.cta_primary}
                </Link>
                <Link 
                  href={`/${locale}/contact`}
                  className="btn-secondary text-xl"
                >
                  {cta_final.cta_secondary}
                </Link>
              </div>
              <p className="text-sm text-[var(--fg-tertiary)]">
                {cta_final.guarantee}
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
