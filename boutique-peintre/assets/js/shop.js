/* ============================================================
   Atelier Camille Véran — interactions de la galerie
   ------------------------------------------------------------
   Snipcart gère : panier, paiement, adresse de livraison, emails,
   et stock. Ce fichier ne fait QUE deux choses :
     1. filtrer la galerie
     2. la vue rapide (modale) d'une œuvre
   Les boutons d'achat sont en HTML statique (lus par Snipcart).
   ============================================================ */
(function () {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- 1. Filtre ---------- */
  function applyFilter(value) {
    let shown = 0;
    $$('#gallery .card').forEach((card) => {
      const ok =
        value === 'all' ? true :
        value === 'available' ? card.dataset.dispo === 'available' :
        card.dataset.serie === value;
      card.hidden = !ok;
      if (ok) shown++;
    });
    $('#gallery-count').textContent = `${shown} œuvre${shown > 1 ? 's' : ''}`;
  }

  /* ---------- 2. Vue rapide ---------- */
  function openView(card) {
    const art   = $('.canvas', card)?.dataset.art || '1';
    const title = $('.card__title', card)?.textContent || '';
    const meta  = $('.card__meta', card)?.textContent || '';
    const note  = $('.card__note', card)?.textContent || '';
    const sold  = card.dataset.dispo === 'sold';
    const buyBtn = $('.snipcart-add-item', card);

    // toile
    $('#qv-canvas').outerHTML =
      `<div id="qv-canvas" class="canvas canvas--lg" data-art="${art}" role="img"
            aria-label="Reproduction de l’œuvre « ${title} »"></div>`;
    $('#qv-title').textContent = title;
    $('#qv-meta').textContent  = meta + (card.dataset.serie ? ` · Série ${card.dataset.serie}` : '');
    $('#qv-note').textContent  = note;

    const foot = $('#qv-foot');
    if (sold || !buyBtn) {
      foot.innerHTML = `<span class="card__price card__price--muted">Pièce unique — vendue</span>`;
    } else {
      const price = $('.card__price', card)?.textContent || '';
      // on clone le vrai bouton Snipcart (garde tous les data-item-*)
      const clone = buyBtn.cloneNode(true);
      clone.classList.remove('btn--add');
      clone.classList.add('btn--primary');
      clone.textContent = 'Ajouter au panier';
      foot.innerHTML = `<span class="qv__price">${price}</span>`;
      foot.appendChild(clone);
    }

    const modal = $('#quickview');
    modal.classList.add('is-open');
    modal.removeAttribute('hidden');
    document.body.classList.add('no-scroll');
    $('#qv-close').focus();
  }
  function closeView() {
    const modal = $('#quickview');
    modal.classList.remove('is-open');
    modal.setAttribute('hidden', '');
    document.body.classList.remove('no-scroll');
  }

  /* ---------- 3. Câblage ---------- */
  function init() {
    document.addEventListener('click', (e) => {
      const filter = e.target.closest('[data-filter]');
      const view   = e.target.closest('[data-view]');
      if (filter) {
        $$('[data-filter]').forEach((x) => x.classList.toggle('is-active', x === filter));
        applyFilter(filter.dataset.filter);
        return;
      }
      // ne pas ouvrir la vue rapide si on a cliqué un bouton d'achat
      if (view && !e.target.closest('.snipcart-add-item')) {
        openView(view.closest('.card'));
      }
    });

    $('#qv-close').addEventListener('click', closeView);
    $('#quickview').addEventListener('click', (e) => { if (e.target.id === 'quickview') closeView(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeView(); });

    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
