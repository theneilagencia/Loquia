// Modern Animations Script
// Loquia - Premium Animations System

(function() {
  'use strict';

  // ============================================
  // SCROLL REVEAL ANIMATIONS
  // ============================================
  
  function initScrollReveal() {
    const revealElements = document.querySelectorAll(
      '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale'
    );

    if (revealElements.length === 0) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            // Optionally unobserve after revealing
            // revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    revealElements.forEach((el) => {
      revealObserver.observe(el);
    });
  }

  // ============================================
  // PARALLAX EFFECTS
  // ============================================
  
  function initParallax() {
    const parallaxElements = {
      slow: document.querySelectorAll('.parallax-slow'),
      medium: document.querySelectorAll('.parallax-medium'),
      fast: document.querySelectorAll('.parallax-fast')
    };

    if (
      parallaxElements.slow.length === 0 &&
      parallaxElements.medium.length === 0 &&
      parallaxElements.fast.length === 0
    ) {
      return;
    }

    let ticking = false;

    function updateParallax() {
      const scrollY = window.pageYOffset;

      parallaxElements.slow.forEach((el) => {
        el.style.transform = `translateY(${scrollY * 0.1}px)`;
      });

      parallaxElements.medium.forEach((el) => {
        el.style.transform = `translateY(${scrollY * 0.2}px)`;
      });

      parallaxElements.fast.forEach((el) => {
        el.style.transform = `translateY(${scrollY * 0.3}px)`;
      });

      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
  }

  // ============================================
  // MAGNETIC BUTTON EFFECT
  // ============================================
  
  function initMagneticButtons() {
    const magneticButtons = document.querySelectorAll('.magnetic-button');

    magneticButtons.forEach((button) => {
      button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.05)`;
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translate(0, 0) scale(1)';
      });
    });
  }

  // ============================================
  // STAGGER ANIMATIONS
  // ============================================
  
  function initStaggerAnimations() {
    const staggerContainers = document.querySelectorAll('.stagger-children');

    if (staggerContainers.length === 0) return;

    const staggerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('stagger-active');
            staggerObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1
      }
    );

    staggerContainers.forEach((container) => {
      staggerObserver.observe(container);
    });
  }

  // ============================================
  // SMOOTH SCROLL TO ANCHOR
  // ============================================
  
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ============================================
  // INITIALIZE ALL ANIMATIONS
  // ============================================
  
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Initialize all animation systems
    initScrollReveal();
    initParallax();
    initMagneticButtons();
    initStaggerAnimations();
    initSmoothScroll();

    console.log('✨ Loquia Modern Animations initialized');
  }

  // Start initialization
  init();

  // Re-initialize on page navigation (for SPAs)
  if (typeof window !== 'undefined') {
    window.addEventListener('load', init);
  }
})();
