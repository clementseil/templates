/**
 * animations.js — animations GSAP du site
 *
 * Effets en place (sobre, jamais clinquant) :
 *   1. SplitText sur le H1 hero (lettres avec stagger)
 *   2. Fade-up séquentiel des éléments du hero (eyebrow → signals)
 *   3. ScrollTrigger reveal pour chaque section et leurs sous-éléments
 *   4. Stagger sur services, galerie, étapes, avis, FAQ, pictos confiance
 *   5. Pulse subtil sur le CTA principal du hero
 *   6. Parallax léger sur l'image hero au scroll
 *   7. Compteurs animés (note Google + nombre d'avis) qui comptent à l'arrivée dans le viewport
 *   8. Étoiles des cartes d'avis qui apparaissent une par une (stagger)
 *   9. Scroll-spy nav : l'item de menu correspondant à la section visible est mis en évidence
 *
 * GSAP + ScrollTrigger + SplitText sont chargés via CDN dans index.html.
 */

(function () {
  'use strict';

  /* ─── Garde-fous ─── */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  if (typeof window.gsap === 'undefined') {
    console.warn('[animations] GSAP non chargé. Animations désactivées.');
    return;
  }

  const { gsap } = window;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText)     gsap.registerPlugin(window.SplitText);


  /* ═══════════════════════════════════════════
     1. HERO — SplitText H1
     ═══════════════════════════════════════════ */
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle && window.SplitText) {
    const split = new SplitText(heroTitle, { type: 'lines,chars' });
    gsap.from(split.chars, {
      yPercent: 100,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.03,
      delay: 0.1,
    });
  } else if (heroTitle) {
    gsap.from(heroTitle, { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out' });
  }


  /* ═══════════════════════════════════════════
     2. HERO — fade-up séquentiel des autres éléments
     ═══════════════════════════════════════════ */
  const heroSequence = [
    '.hero .eyebrow',
    '.hero-sub',
    '.hero-actions',
    '.hero-signals',
    '.hero-visual',
  ];
  heroSequence.forEach((selector, idx) => {
    const el = document.querySelector(selector);
    if (!el) return;
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 0.7,
      ease: 'power2.out',
      delay: 0.4 + idx * 0.12,
    });
  });


  /* ═══════════════════════════════════════════
     3. HERO — parallax léger sur l'image au scroll
     ═══════════════════════════════════════════ */
  const heroVisualImg = document.querySelector('.hero-visual img');
  if (heroVisualImg && window.ScrollTrigger) {
    gsap.to(heroVisualImg, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }


  /* ═══════════════════════════════════════════
     4. ScrollTrigger — reveal des sections et sous-éléments
     ═══════════════════════════════════════════ */
  if (window.ScrollTrigger) {
    const sectionsToReveal = [
      '.trust-bar',
      '#services .section-head',
      '#realisations .section-head',
      '#process .section-head',
      '#avis .section-head',
      '#zone .zone-content',
      '#zone .zone-map',
      '#faq .section-head',
      '#contact .contact-intro',
      '#contact .contact-form',
      '.site-footer',
    ];

    sectionsToReveal.forEach((selector) => {
      const el = document.querySelector(selector);
      if (!el) return;
      gsap.from(el, {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none none' },
      });
    });


    /* ─── Stagger sur les cards services ─── */
    const serviceCards = gsap.utils.toArray('.service-card');
    if (serviceCards.length) {
      gsap.from(serviceCards, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.services-grid', start: 'top 80%' },
      });
    }


    /* ─── Stagger sur la galerie ─── */
    const galleryItems = gsap.utils.toArray('.gallery-item');
    if (galleryItems.length) {
      gsap.from(galleryItems, {
        opacity: 0,
        y: 40,
        scale: 0.96,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.gallery', start: 'top 80%' },
      });
    }


    /* ─── Stagger sur les étapes du process ─── */
    const steps = gsap.utils.toArray('.step');
    if (steps.length) {
      gsap.from(steps, {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.steps', start: 'top 80%' },
      });
    }
    // Pour les step-number, animation distincte plus marquée
    const stepNumbers = gsap.utils.toArray('.step-number');
    if (stepNumbers.length) {
      gsap.from(stepNumbers, {
        opacity: 0,
        scale: 0.4,
        duration: 0.9,
        ease: 'back.out(1.7)',
        stagger: 0.12,
        scrollTrigger: { trigger: '.steps', start: 'top 75%' },
      });
    }


    /* ─── Stagger sur les cards avis ─── */
    const reviews = gsap.utils.toArray('.review');
    if (reviews.length) {
      gsap.from(reviews, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.reviews-grid', start: 'top 80%' },
      });
    }


    /* ─── Étoiles des avis : on splitte le bloc "★★★★★" et chaque étoile pop-in ─── */
    document.querySelectorAll('.review .review-stars').forEach((starsBlock) => {
      const text = starsBlock.textContent;
      if (!text.trim()) return;
      // Reconstruit le contenu en spans individuels (1 par caractère étoile)
      starsBlock.innerHTML = '';
      [...text].forEach((char) => {
        if (char.trim() === '') return;
        const span = document.createElement('span');
        span.textContent = char;
        span.style.display = 'inline-block';
        starsBlock.appendChild(span);
      });
      const stars = starsBlock.querySelectorAll('span');

      gsap.from(stars, {
        opacity: 0,
        scale: 0.5,
        y: -8,
        duration: 0.5,
        ease: 'back.out(2)',
        stagger: 0.08,
        scrollTrigger: { trigger: starsBlock.closest('.review'), start: 'top 85%' },
      });
    });


    /* ─── Stagger sur les items FAQ ─── */
    const faqItems = gsap.utils.toArray('.faq-item');
    if (faqItems.length) {
      gsap.from(faqItems, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.06,
        scrollTrigger: { trigger: '.faq-list', start: 'top 85%' },
      });
    }


    /* ─── Stagger sur les pictos du bandeau confiance ─── */
    const trustItems = gsap.utils.toArray('.trust-item');
    if (trustItems.length) {
      gsap.from(trustItems, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.trust-grid', start: 'top 85%' },
      });
    }


    /* ═══════════════════════════════════════════
       5. COMPTEURS — note Google + nombre d'avis qui s'incrémentent
       ═══════════════════════════════════════════ */
    document.querySelectorAll('.count-up').forEach((el) => {
      // Tente de parser. Si le placeholder {{xxx}} n'est pas remplacé, on skip silencieusement.
      const targetStr = el.dataset.target || el.textContent;
      const target = parseFloat(targetStr);
      if (Number.isNaN(target)) return;

      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const counter = { val: 0 };

      // Place le 0 initial pour éviter le flash du nombre final
      el.textContent = (0).toFixed(decimals);

      gsap.to(counter, {
        val: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate() {
          el.textContent = counter.val.toFixed(decimals);
        },
        onComplete() {
          // Affichage final propre (au cas où virgule à la française demandée)
          el.textContent = target.toFixed(decimals);
        },
      });
    });


    /* ═══════════════════════════════════════════
       6. SCROLL-SPY — désactivé volontairement
       ═══════════════════════════════════════════
       Le scroll-spy (item de menu surligné selon la section visible)
       est un marqueur typique des sites mono-page. On le retire pour
       préserver l'illusion d'un site multi-page : le menu ne réagit
       plus au scroll, seul le survol fournit un feedback visuel. */
  }


  /* ═══════════════════════════════════════════
     7. CTA HERO — pulse subtil en boucle
     ═══════════════════════════════════════════ */
  const primaryCta = document.querySelector('.hero-actions .btn-primary');
  if (primaryCta) {
    gsap.to(primaryCta, {
      scale: 1.03,
      duration: 1.4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 1.6,
    });
  }
})();
