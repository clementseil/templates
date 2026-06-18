/**
 * params.js — remplit les placeholders {{var}} avec les query params de l'URL
 *
 * À charger en PREMIER dans la liste des <script defer> (avant GSAP, main.js,
 * animations.js) pour que tous les scripts suivants travaillent sur un DOM
 * déjà rempli.
 *
 * Exemple d'URL :
 *   index.html?nom=Dupont%20Peinture&ville=Lyon&tel=0612345678
 *             &note=4.8&nb_avis=27&avis1=Super%20travail!&prenom1=Marc
 */
(function () {
  'use strict';

  /* ─── 1. Mapping param URL (ASCII) → nom du placeholder dans le HTML ─── */
  const MAPPING = {
    nom:      'nom_entreprise',
    ville:    'ville',
    adresse:  'adresse_complète',
    tel:      'numéro_de_téléphone',
    note:     'note_google',
    nb_avis:  'nombre_d_avis',
    avis1:    'avis_1',
    avis2:    'avis_2',
    avis3:    'avis_3',
    avis4:    'avis_4',
    prenom1:  'prénom_avis_1',
    prenom2:  'prénom_avis_2',
    prenom3:  'prénom_avis_3',
    prenom4:  'prénom_avis_4',
    url:      'url_site'
  };

  /* ─── 2. Lecture des query params + construction de la table de remplacements ─── */
  const urlParams = new URLSearchParams(window.location.search);
  const replacements = {};

  for (const paramName in MAPPING) {
    const value = urlParams.get(paramName);
    if (value !== null && value !== '') {
      replacements['{{' + MAPPING[paramName] + '}}'] = value;
    }
  }

  // Si aucun param n'est passé, on ne touche à rien (utile pour développer en local
  // et garder les {{...}} visibles).
  if (Object.keys(replacements).length === 0) return;

  /* ─── 3. Fonction de remplacement d'une chaîne ─── */
  function replaceInString(str) {
    if (!str || str.indexOf('{{') === -1) return str;
    let out = str;
    for (const needle in replacements) {
      if (out.indexOf(needle) !== -1) {
        out = out.split(needle).join(replacements[needle]);
      }
    }
    return out;
  }

  /* ─── 4. Application au document : text nodes + attributs ─── */
  function applyReplacements() {
    // a) <title>
    document.title = replaceInString(document.title);

    // b) Tous les text nodes du document (inclut le JSON-LD car c'est du texte
    //    dans un <script type="application/ld+json">)
    const walker = document.createTreeWalker(
      document.documentElement,
      NodeFilter.SHOW_TEXT,
      null
    );
    let node;
    while ((node = walker.nextNode())) {
      const newValue = replaceInString(node.nodeValue);
      if (newValue !== node.nodeValue) node.nodeValue = newValue;
    }

    // c) Attributs susceptibles de contenir des placeholders
    const ATTRS = [
      'content', 'href', 'src', 'alt', 'title', 'value',
      'placeholder', 'aria-label', 'aria-labelledby', 'data-text'
    ];
    const elements = document.querySelectorAll('*');
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      for (let j = 0; j < ATTRS.length; j++) {
        const attr = ATTRS[j];
        if (el.hasAttribute(attr)) {
          const oldVal = el.getAttribute(attr);
          const newVal = replaceInString(oldVal);
          if (newVal !== oldVal) el.setAttribute(attr, newVal);
        }
      }
    }
  }

  /* ─── 5. Lancement ─── */
  // Avec defer, le script s'exécute après la construction du DOM mais avant
  // DOMContentLoaded — on peut directement appliquer.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyReplacements);
  } else {
    applyReplacements();
  }
})();
