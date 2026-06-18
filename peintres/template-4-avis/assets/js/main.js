/**
 * main.js — interactions UI vanilla
 *
 * - Toggle de la navigation mobile (hamburger)
 * - Header qui se "scotche" quand on scrolle
 * - Année courante dans le footer
 * - Validation visuelle légère du formulaire
 * - Active la classe .js-enabled pour conditionner les états CSS d'animation
 */

(function () {
  'use strict';

  /* ─── 1. Marque le DOM comme "JS actif" ─── */
  document.documentElement.classList.add('js-enabled');
  document.body.classList.add('js-enabled');


  /* ─── 2. Toggle nav mobile ─── */
  const navToggle = document.querySelector('.nav-toggle');
  const primaryNav = document.querySelector('.primary-nav');

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu');
      primaryNav.classList.toggle('is-open');
      // Empêche le scroll du body quand le menu mobile est ouvert
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Les liens du menu représentent de futures pages (site multi-page).
    // On bloque volontairement la navigation pour ne pas révéler un site
    // mono-page : le survol garde son feedback visuel, mais le clic ne
    // déclenche aucun saut d'ancre. On ferme juste le menu mobile.
    primaryNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (primaryNav.classList.contains('is-open')) {
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.setAttribute('aria-label', 'Ouvrir le menu');
          primaryNav.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      });
    });
  }


  /* ─── 3. Header qui change de style au scroll ─── */
  const header = document.getElementById('site-header');
  if (header) {
    const SCROLL_THRESHOLD = 24;
    let ticking = false;

    const updateHeader = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(updateHeader);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateHeader();
  }


  /* ─── 4. Année dynamique dans le footer ─── */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }


  /* ─── 5. Formulaire : feedback visuel léger ─── */
  /*
   * Pas de backend ici. La validation HTML5 (required, type, pattern, minlength)
   * fait l'essentiel. On ajoute juste un retour visuel + un message après "envoi".
   *
   * Pour brancher Formspree :
   *   1. Créer un endpoint sur formspree.io
   *   2. Mettre l'URL dans <form action="...">
   *   3. Retirer le e.preventDefault() ci-dessous (ou le garder + utiliser fetch())
   */
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      // Pas de backend en local — on simule un envoi réussi
      if (!form.action || form.action === window.location.href) {
        e.preventDefault();

        // Vérifie la validité native
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const button = form.querySelector('button[type="submit"]');
        const note = form.querySelector('.form-note');

        if (button) {
          button.textContent = 'Demande envoyée ✓';
          button.style.background = 'var(--color-success)';
          button.disabled = true;
        }
        if (note) {
          note.textContent = 'Merci ! Nous revenons vers vous sous 24h ouvrées.';
          note.style.color = 'var(--color-success)';
        }

        form.reset();
      }
    });
  }


  /* ─── 5b. Hauteurs égales des descriptions de services ─── */
  /*
   * Les 4 cartes "Services" ont des textes de longueurs différentes.
   * Sans intervention, la carte au texte le plus court se retrouve
   * "surélevée" (séparateur + liste désalignés). On force toutes les
   * descriptions <p> à la même hauteur (la plus grande), recalculée
   * au resize et une fois les polices chargées.
   */
  const serviceParas = document.querySelectorAll('.services-grid .service-card > p');
  if (serviceParas.length) {
    const equalizeServiceText = () => {
      serviceParas.forEach((p) => { p.style.minHeight = ''; });
      let max = 0;
      serviceParas.forEach((p) => { max = Math.max(max, p.offsetHeight); });
      if (max > 0) {
        serviceParas.forEach((p) => { p.style.minHeight = max + 'px'; });
      }
    };

    // Robustesse maximale : on n'attend PAS uniquement requestAnimationFrame
    // (throttlé dans les onglets non visibles / certains contextes). On joue
    // la fonction tout de suite, puis via plusieurs filets de sécurité
    // indépendants. equalizeServiceText est idempotent : rejouable sans risque.
    equalizeServiceText();
    requestAnimationFrame(equalizeServiceText);
    setTimeout(equalizeServiceText, 100);
    setTimeout(equalizeServiceText, 500);
    window.addEventListener('load', equalizeServiceText);
    window.addEventListener('resize', equalizeServiceText);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(equalizeServiceText).catch(() => {});
    }
  }


  /* ─── 6. Slider Avant / Après ─── */
  /*
   * Drag souris + tactile + clavier. Listeners pointermove/up sur window
   * pour suivre le pointeur même quand il sort du slider.
   */
  document.querySelectorAll('.ba-slider').forEach((slider) => {
    const handle = slider.querySelector('.ba-handle');
    if (!handle) return;

    let isDragging = false;

    const setPosition = (pct) => {
      const clamped = Math.max(0, Math.min(100, pct));
      slider.style.setProperty('--ba-position', clamped + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(clamped)));
    };

    const positionFromEvent = (clientX) => {
      const rect = slider.getBoundingClientRect();
      const x = clientX - rect.left;
      return (x / rect.width) * 100;
    };

    const onMove = (e) => {
      if (!isDragging) return;
      setPosition(positionFromEvent(e.clientX));
    };

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      slider.classList.remove('is-dragging');
    };

    slider.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      isDragging = true;
      slider.classList.add('is-dragging');
      setPosition(positionFromEvent(e.clientX));
      try { handle.focus({ preventScroll: true }); } catch (_) {}
    });

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    handle.addEventListener('keydown', (e) => {
      const current = parseFloat(handle.getAttribute('aria-valuenow') || '50');
      const step = e.shiftKey ? 10 : 2;
      let next = current;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          next = current - step;
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          next = current + step;
          break;
        case 'Home': next = 0; break;
        case 'End':  next = 100; break;
        default: return;
      }
      e.preventDefault();
      setPosition(next);
    });

    slider.addEventListener('dragstart', (e) => e.preventDefault());
  });
  /* ─── 7. Badge Avis Google flottant + panneau latéral ─── */
  const reviewsBadge = document.querySelector('.reviews-badge');
  const reviewsPanel = document.getElementById('reviews-panel');
  if (reviewsBadge && reviewsPanel) {
    const openPanel = () => {
      reviewsPanel.classList.add('is-open');
      reviewsPanel.setAttribute('aria-hidden', 'false');
      reviewsBadge.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const closePanel = () => {
      reviewsPanel.classList.remove('is-open');
      reviewsPanel.setAttribute('aria-hidden', 'true');
      reviewsBadge.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      try { reviewsBadge.focus({ preventScroll: true }); } catch (_) {}
    };
    reviewsBadge.addEventListener('click', openPanel);
    reviewsPanel.querySelectorAll('[data-rp-close]').forEach((el) => {
      el.addEventListener('click', closePanel);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && reviewsPanel.classList.contains('is-open')) {
        closePanel();
      }
    });
  }
})();
