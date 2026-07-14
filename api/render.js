/**
 * api/render.js — Fonction serverless Vercel
 *
 * Reçoit une URL du type /tr-peinture (réécrite par vercel.json en
 * /api/render?slug=tr-peinture), va chercher les données du prospect
 * dans Notion, choisit le bon template selon le nombre d'avis, et
 * renvoie la page HTML personnalisée.
 *
 * Variables d'env nécessaires (à configurer dans Vercel Project Settings) :
 *   - NOTION_TOKEN          : token d'intégration interne Notion (secret_... ou ntn_...)
 *                             ⚠️ Pour le tracking des visites, l'intégration doit avoir
 *                             la capacité « Mettre à jour le contenu » (Notion →
 *                             Paramètres → Connexions → gérer l'intégration).
 *   - NOTION_DB_ID          : ID de la base "peintres SANS site" (interrogée en priorité)
 *   - NOTION_DB_ID_AVEC_SITE : (optionnel) ID de la base "peintres AVEC site"
 *                              Si défini, render.js cherche aussi dans cette DB
 *                              quand le slug n'est pas trouvé dans la première.
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_DB_ID;
const DB_ID_AVEC_SITE = process.env.NOTION_DB_ID_AVEC_SITE; // optionnel
const HOST = 'https://apercu.lesiteartisan.fr';

// Slugs réservés qu'on n'essaie même pas de chercher dans Notion
const RESERVED_SLUGS = new Set(['api', 'peintres', '404', 'favicon.ico', 'robots.txt', 'sitemap.xml']);

// User-agents de bots et d'aperçus de liens (WhatsApp, Facebook, etc.) : on les
// laisse voir la page, mais on ne compte PAS leur passage comme une visite du
// prospect — sinon chaque envoi de message créerait une fausse visite.
const BOT_UA = /bot|crawl|spider|preview|whatsapp|facebookexternalhit|telegram|slack|twitter|linkedin|discord|skype|pinterest|embed|curl|wget|python-requests|headless/i;

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
 * 5.bis. Helper : interroge une DB Notion par slug (utilisé pour les 2 DBs)
 * ────────────────────────────────────────────────────────────────────────── */
async function queryDbBySlug(databaseId, slug) {
  return notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'slug',
      rich_text: { equals: slug }
    },
    page_size: 1
  });
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
    // 6.a. Query Notion : cherche d'abord dans la DB SANS SITE, puis
    //      dans la DB AVEC SITE si rien trouvé (et si la 2e DB est configurée).
    let result = await queryDbBySlug(DB_ID, slug);
    let matchedDb = 'sans_site';

    if (result.results.length === 0 && DB_ID_AVEC_SITE) {
      result = await queryDbBySlug(DB_ID_AVEC_SITE, slug);
      matchedDb = 'avec_site';
    }

    if (result.results.length === 0) {
      return res.status(404).send(notFoundPage(slug));
    }

    // 6.b. Extraction des données
    const data = buildDataFromNotionPage(result.results[0], slug);

    // 6.b.bis. Tracking de visite → écrit dans la ligne Notion du prospect :
    //   - "Template vu le"   : date/heure de la dernière visite
    //   - "Visites maquette" : compteur incrémenté à chaque visite
    // Ignoré si : bot/aperçu de lien (BOT_UA), ?notrack=1 (tes propres
    // vérifications) ou ?debug=1. N'empêche jamais le rendu en cas d'échec.
    const ua = String(req.headers['user-agent'] || '');
    if (ua && !BOT_UA.test(ua) && req.query.notrack !== '1' && req.query.debug !== '1') {
      const page = result.results[0];
      const trackProps = {};
      if (page.properties['Template vu le']) {
        trackProps['Template vu le'] = { date: { start: new Date().toISOString() } };
      }
      if (page.properties['Visites maquette']) {
        trackProps['Visites maquette'] = { number: (page.properties['Visites maquette'].number || 0) + 1 };
      }
      if (Object.keys(trackProps).length > 0) {
        try {
          await notion.pages.update({ page_id: page.id, properties: trackProps });
        } catch (trackErr) {
          console.error('[render.js] Tracking visite échoué (non bloquant) :', trackErr.message);
        }
      }
    }

    // 6.b.ter. Mode debug : ?debug=1 → renvoie le JSON des données extraites
    // au lieu du HTML. Très utile pour vérifier ce que Notion renvoie.
    if (req.query.debug === '1') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(JSON.stringify({
        slug,
        matchedDb,
        templateDir: pickTemplateDir(data._nbAvis),
        data,
        rawNotionProperties: Object.keys(result.results[0].properties)
      }, null, 2));
    }

    // 6.c. Choix du template selon nbAvis
    const templateDir = pickTemplateDir(data._nbAvis);
    const templatePath = path.join(process.cwd(), 'peintres', templateDir, 'index.html');

    // og_image : URL absolue vers le hero du template (pour les previews DM/Insta/etc.)
    // Doit être absolu car les balises og:image / twitter:image ne supportent pas le relatif.
    data.og_image = `${HOST}/peintres/${templateDir}/assets/img/hero-painter.jpg`;

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

    // 6.f. Headers : type + PAS de cache edge — chaque visite doit atteindre la
    // fonction pour être comptée par le tracking. Le trafic prospection est très
    // faible, et bonus : les modifs Notion apparaissent immédiatement sur la maquette.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    // 6.g. Header debug (visible dans devtools Network) pour vérifier ce qui s'est passé
    res.setHeader('X-Render-Template', templateDir);
    res.setHeader('X-Render-Slug', slug);
    res.setHeader('X-Render-Db', matchedDb);

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
