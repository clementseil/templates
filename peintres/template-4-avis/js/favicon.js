/**
 * favicon.js — favicon dynamique avec la 1ère lettre du nom d'entreprise.
 *
 * À charger APRÈS params.js (defer maintient l'ordre) pour que la
 * substitution {{nom_entreprise}} soit déjà appliquée au DOM.
 *
 * Fallback : si le nom n'est pas trouvé / non substitué → lettre "L"
 * (par défaut LeSiteArtisan). Sur iOS Home Screen, c'est apple-touch-icon.png
 * statique qui prend le relais (les navigateurs iOS ne lisent pas les favicons
 * dynamiques pour le Home Screen).
 */
(function () {
  'use strict';

  // 1. Récupère le nom d'entreprise depuis l'élément .brand-name
  //    (déjà substitué par params.js ou côté serveur par Make)
  const brandEl = document.querySelector('.brand-name, .brand');
  let name = brandEl ? brandEl.textContent.trim() : '';

  // 2. Fallback : si vide ou encore un placeholder {{...}} → "LeSiteArtisan"
  if (!name || name.startsWith('{{')) name = 'LeSiteArtisan';

  // 3. Première lettre, en majuscule (gère bien les caractères accentués)
  const initial = name.charAt(0).toLocaleUpperCase('fr-FR');

  // 4. Construit le SVG du favicon (anthracite + champagne, serif italique)
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" rx="6" fill="#1F1F23"/>' +
      '<text x="16" y="23.5" ' +
            'font-family="\'DM Serif Display\',\'Times New Roman\',serif" ' +
            'font-size="22" font-style="italic" font-weight="400" ' +
            'fill="#B89968" text-anchor="middle">' +
        initial +
      '</text>' +
    '</svg>';

  const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  // 5. Remplace (ou crée) le <link rel="icon"> dans le <head>
  //    On enlève les anciens icons SVG pour éviter les conflits.
  const oldIcons = document.querySelectorAll('link[rel="icon"][type="image/svg+xml"]');
  oldIcons.forEach(function (el) { el.parentNode.removeChild(el); });

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = dataUri;
  document.head.appendChild(link);
})();
