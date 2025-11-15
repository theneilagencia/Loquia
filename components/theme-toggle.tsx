'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (!mounted) {
    return (
      <div className="w-14 h-7 rounded-full" style={{ background: 'var(--bg-tertiary)' }} />
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full flex items-center px-1"
      style={{ 
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)'
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400 }}
      aria-label="Toggle theme"
    >
      {/* Toggle Circle */}
      <motion.div
        className="w-5 h-5 rounded-full"
        style={{ background: 'var(--brand-primary)' }}
        animate={{
          x: theme === 'dark' ? 24 : 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      
      {/* Sun Icon (Light Mode) */}
      <svg
        className="absolute left-1.5 w-4 h-4"
        style={{ 
          color: theme === 'light' ? 'var(--fg-inverse)' : 'var(--fg-tertiary)',
          opacity: theme === 'light' ? 1 : 0.5
        }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="4" strokeWidth="2" />
        <path strokeWidth="2" strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
      </svg>
      
      {/* Moon Icon (Dark Mode) */}
      <svg
        className="absolute right-1.5 w-4 h-4"
        style={{ 
          color: theme === 'dark' ? 'var(--fg-inverse)' : 'var(--fg-tertiary)',
          opacity: theme === 'dark' ? 1 : 0.5
        }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </motion.button>
  );
}
