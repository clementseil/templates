/**
 * api/render.js — Fonction serverless Vercel
 *
 * Reçoit une URL du type /tr-peinture (réécrite par vercel.json en
 * /api/render?slug=tr-peinture), va chercher les données du prospect
 * dans Notion, choisit le bon template selon le nombre d'avis, et
 * renvoie la page HTML personnalisée.
 *
 * Variables d'env nécessaires (à configurer dans Vercel Project Settings) :
 *   - NOTION_TOKEN   : token d'intégration interne Notion (secret_... ou ntn_...)
 *   - NOTION_DB_ID   : ID de la base "peintres sans site"
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_DB_ID;
const HOST = 'https://apercu.lesiteartisan.fr';

// Slugs réservés qu'on n'essaie même pas de chercher dans Notion
const RESERVED_SLUGS = new Set(['api', 'peintres', '404', 'favicon.ico', 'robots.txt', 'sitemap.xml']);

/* ──────────────────────────────────────────────────────────────────────────
 * 1. Choix du template selon le nombre d'avis
 * ────────────────────────────────────────────────────────────────────────── */
function pickTemplateDir(nbAvis) {
  const n = Number(nbAvis) || 0;
  if (n === 0) return 'template-0-avis';
  if (n === 1) return 'template-1-avis';
  if (n <= 3) return 'template-2-3-avis';
  return 'template-4-avis';
}

/* ──────────────────────────────────────────────────────────────────────────
 * 2. Extraction d'une valeur depuis une propriété Notion (tous types)
 * ────────────────────────────────────────────────────────────────────────── */
function getPropValue(prop) {
  if (!prop) return '';
  switch (prop.type) {
    case 'title':         return prop.title.map(t => t.plain_text).join('');
    case 'rich_text':     return prop.rich_text.map(t => t.plain_text).join('');
    case 'number':        return prop.number ?? '';
    case 'phone_number':  return prop.phone_number || '';
    case 'url':           return prop.url || '';
    case 'email':         return prop.email || '';
    case 'select':        return prop.select?.name || '';
    case 'multi_select':  return prop.multi_select.map(s => s.name).join(', ');
    case 'checkbox':      return prop.checkbox ? 'true' : 'false';
    case 'date':          return prop.date?.start || '';
    case 'formula':       return prop.formula?.string ?? prop.formula?.number ?? '';
    default:              return '';
  }
}

/**
 * Cherche une propriété dans l'objet `properties` Notion en testant plusieurs
 * variantes de noms (snake_case, Capitalized, avec accents, etc.).
 */
function findProp(properties, ...names) {
  for (const name of names) {
    if (properties[name]) return getPropValue(properties[name]);
  }
  return '';
}

/* ──────────────────────────────────────────────────────────────────────────
 * 3. Mapping Notion → placeholders HTML
 *
 * Les noms à gauche sont les placeholders {{...}} dans les templates.
 * Les noms à droite sont les variantes possibles de colonnes Notion testées
 * dans l'ordre — le premier trouvé est utilisé.
 * ────────────────────────────────────────────────────────────────────────── */
function buildDataFromNotionPage(page, slug) {
  const p = page.properties;
  const nbAvis = findProp(p, "Nombres d'avis", 'nombre_avis', 'nombre_d_avis', "Nombre d'avis", 'nb_avis');

  return {
    nom_entreprise:        findProp(p, "Nom de l'entreprise", 'nom_entreprise', 'Nom'),
    ville:                 findProp(p, 'Ville', 'ville'),
    'adresse_complète':    findProp(p, 'Adresse complète', 'adresse_complete', 'adresse_complète', 'Adresse'),
    'numéro_de_téléphone': findProp(p, 'Téléphone', 'telephone', 'téléphone', 'Numéro de téléphone'),
    note_google:           findProp(p, 'Note google', 'Note Google', 'note_google', 'Note'),
    nombre_d_avis:         nbAvis,
    avis_1:                findProp(p, 'Avis 1', 'avis_1'),
    avis_2:                findProp(p, 'Avis 2', 'avis_2'),
    avis_3:                findProp(p, 'Avis 3', 'avis_3'),
    avis_4:                findProp(p, 'Avis 4', 'avis_4'),
    'prénom_avis_1':       findProp(p, 'Prénom avis 1', 'prenom_avis_1', 'prénom_avis_1'),
    'prénom_avis_2':       findProp(p, 'Prénom avis 2', 'prenom_avis_2', 'prénom_avis_2'),
    'prénom_avis_3':       findProp(p, 'Prénom avis 3', 'prenom_avis_3', 'prénom_avis_3'),
    'prénom_avis_4':       findProp(p, 'Prénom avis 4', 'prenom_avis_4', 'prénom_avis_4'),
    url_site:              `${HOST}/${slug}`,
    _nbAvis:               Number(nbAvis) || 0  // utilisé pour pickTemplateDir, pas un placeholder
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * 4. Échappement HTML basique (évite les injections XSS via les données)
 * ────────────────────────────────────────────────────────────────────────── */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ──────────────────────────────────────────────────────────────────────────
 * 5. Réécriture des chemins relatifs (assets, CSS, JS) en chemins absolus
 *    vers le dossier du template, pour que les ressources se chargent
 *    correctement quand la page est servie depuis /:slug.
 * ────────────────────────────────────────────────────────────────────────── */
function rewriteAssetPaths(html, templateDir) {
  const base = `/peintres/${templateDir}/`;
  // Réécrit href="..." et src="..." MAIS pas les URL absolues, anchors,
  // mailto:, tel:, javascript:.
  return html.replace(
    /(href|src)="(?!https?:\/\/|\/\/|\/|#|mailto:|tel:|javascript:|data:)([^"]+)"/g,
    (match, attr, url) => `${attr}="${base}${url}"`
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 6. Handler principal
 * ────────────────────────────────────────────────────────────────────────── */
module.exports = async (req, res) => {
  const slug = String(req.query.slug || '').toLowerCase().trim();

  if (!slug || RESERVED_SLUGS.has(slug)) {
    return res.status(404).send(notFoundPage(slug));
  }

  try {
    // 6.a. Query Notion : trouve la ligne dont la colonne "slug" = slug demandé
    const result = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: 'slug',
        rich_text: { equals: slug }
      },
      page_size: 1
    });

    if (result.results.length === 0) {
      return res.status(404).send(notFoundPage(slug));
    }

    // 6.b. Extraction des données
    const data = buildDataFromNotionPage(result.results[0], slug);

    // 6.b.bis. Mode debug : ?debug=1 → renvoie le JSON des données extraites
    // au lieu du HTML. Très utile pour vérifier ce que Notion renvoie.
    if (req.query.debug === '1') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(JSON.stringify({
        slug,
        templateDir: pickTemplateDir(data._nbAvis),
        data,
        rawNotionProperties: Object.keys(result.results[0].properties)
      }, null, 2));
    }

    // 6.c. Choix du template selon nbAvis
    const templateDir = pickTemplateDir(data._nbAvis);
    const templatePath = path.join(process.cwd(), 'peintres', templateDir, 'index.html');

    if (!fs.existsSync(templatePath)) {
      console.error(`Template introuvable : ${templatePath}`);
      return res.status(500).send(`Template introuvable : ${templateDir}`);
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    // 6.d. Remplacement des placeholders {{...}} par les valeurs (échappées)
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('_')) continue; // ignore les clés internes
      const placeholder = '{{' + key + '}}';
      html = html.split(placeholder).join(escapeHtml(value));
    }

    // 6.e. Réécriture des chemins d'assets vers /peintres/template-X-avis/...
    html = rewriteAssetPaths(html, templateDir);

    // 6.f. Headers : type + cache edge (1h, revalidate 24h en arrière-plan)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

    // 6.g. Header debug (visible dans devtools Network) pour vérifier ce qui s'est passé
    res.setHeader('X-Render-Template', templateDir);
    res.setHeader('X-Render-Slug', slug);

    return res.status(200).send(html);

  } catch (err) {
    console.error('[render.js] Erreur :', err);
    return res.status(500).send(errorPage(err.message));
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * Pages d'erreur sobres
 * ────────────────────────────────────────────────────────────────────────── */
function notFoundPage(slug) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Page introuvable</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f6f6f6;color:#333}main{text-align:center;padding:2rem}h1{font-size:4rem;margin:0;color:#888}p{margin-top:1rem;color:#666}</style>
</head><body><main><h1>404</h1><p>Page introuvable${slug ? ` pour "${escapeHtml(slug)}"` : ''}.</p></main></body></html>`;
}

function errorPage(msg) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Erreur</title>
<style>body{font-family:system-ui,sans-serif;padding:2rem;background:#fee;color:#700}pre{background:#fff;padding:1rem;border-radius:4px;overflow:auto}</style>
</head><body><h1>Erreur 500</h1><pre>${escapeHtml(msg)}</pre></body></html>`;
}
