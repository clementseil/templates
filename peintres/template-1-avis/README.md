# Site one-page — Peintre artisan (template "4 avis")

Site one-page conçu pour être rempli automatiquement par une automatisation Make.com à partir d'une base Notion de prospects (peintres en bâtiment ayant ≥ 4 avis Google rédigés).

---

## 🚀 Lancer en local

### Option simple (statique)
Double-cliquez sur `index.html`. Le site s'ouvrira dans votre navigateur par défaut.

### Option recommandée (serveur local — obligatoire pour les `type="module"` du JS)
Depuis le dossier du projet :

```bash
# Python 3
python3 -m http.server 8000

# ou Node si vous avez serve installé
npx serve .
```

Puis ouvrir http://localhost:8000 dans le navigateur.

---

## 📁 Structure des fichiers

```
site_4avis/
├── index.html            # HTML sémantique avec toutes les variables {{…}}
├── css/
│   ├── reset.css         # Reset moderne (Andy Bell / Josh Comeau)
│   └── style.css         # Design system + tous les styles de sections
├── js/
│   ├── main.js           # Interactions UI vanilla
│   └── animations.js     # GSAP : SplitText H1, ScrollTrigger sections, stagger
└── assets/
    ├── img/              # (vide) — futur emplacement des images du prospect
    └── fonts/            # (vide) — fonts chargées via Google Fonts
```

---

## 🔧 Variables à remplacer par l'automatisation Make

Toutes les variables sont au format `{{nom_variable}}` dans `index.html`. L'automatisation doit faire un simple find-and-replace texte avant de servir/héberger le fichier.

| Variable | Description | Source Notion suggérée |
|---|---|---|
| `{{nom_entreprise}}` | Nom commercial du peintre | Nom de l'entreprise |
| `{{ville}}` | Ville principale d'intervention | Ville |
| `{{rayon_intervention}}` | Rayon en km (sans l'unité) | À déduire de l'adresse |
| `{{numéro_de_téléphone}}` | Tel format E164 ou national | Téléphone |
| `{{email}}` | Email de contact | Email |
| `{{adresse_complète}}` | Adresse postale complète | Adresse |
| `{{note_google}}` | Note moyenne, ex `4.9` | Note Google |
| `{{nombre_d_avis}}` | Nombre d'avis | Nombre avis |
| `{{avis_1}}` à `{{avis_3}}` | 3 premiers avis rédigés | Avis 1 / 2 / 3 |
| `{{prénom_avis_1}}` à `{{prénom_avis_3}}` | Prénoms des auteurs des avis | Prénom avis 1 / 2 / 3 |
| `{{commune_1}}` à `{{commune_7}}` | Communes alentour | Géolocalisation autour de la ville |
| `{{url_site}}` | URL finale d'hébergement (pour OG/canonical) | Champ généré côté Make |

> **À noter** : la variable `{{nom_entreprise}}` apparaît dans le `<title>`, le `.brand` (header + footer), le H1 indirectement, le JSON-LD, et plusieurs sections. Un simple find-and-replace global suffit.

---

## 🎨 Personnaliser le design (sans toucher au HTML)

Tout le design system est dans **`css/style.css` lignes 1-90** sous `:root { … }`.

### Changer la couleur d'accent (CTA, soulignements)
```css
--color-accent:      #1A1A1A;    /* noir — actuel */
--color-accent-dark: #000000;    /* hover */
```
La DA ne se sert plus de la couleur pour décorer, seulement pour agir : l'accent
est noir. La seule couleur conservée est le jaune des étoiles Google
(`--color-star: #FBBC04`), justement parce qu'il est reconnaissable.

### Changer la couleur primary (titres, footer, brand)
```css
--color-primary:      #1A1A1A;    /* noir — actuel */
--color-primary-dark: #0D0D0D;
```

### Changer les fonts
1. Modifier `<link href="…">` dans `index.html` (ligne ~36)
2. Modifier les variables CSS :
```css
--font-serif: 'DM Serif Display', Georgia, serif;
--font-sans:  'Inter', system-ui, sans-serif;
```

### Changer les espacements globaux des sections
```css
--section-pad-y: clamp(4rem, 8vw, 6rem);
```

---

## ✏️ Éléments éditoriaux à ajuster (par section)

| Section | Fichier / sélecteur | Notes |
|---|---|---|
| Header — items du menu | `index.html` ligne ~80 (`.primary-nav ul`) | Cinq ancres internes |
| Hero — H1 | `index.html` ligne ~120 (`.hero-title`) | Deux lignes, la 2ème colorée |
| Hero — sous-titre | `index.html` ligne ~125 (`.hero-sub`) | Mentionne rayon + délais |
| Trust bar — 4 garanties | `index.html` lignes ~155-200 | Titre + sous-titre par item |
| Services — 4 cards | `index.html` lignes ~225-310 | Texte + 3 sous-services par card |
| Réalisations — galerie | `index.html` lignes ~325-360 | Images Unsplash à remplacer par les vraies photos du peintre |
| Avis — variables `{{avis_X}}` | `index.html` lignes ~445-490 | Reçus depuis Notion |
| Zone — liste de communes | `index.html` lignes ~510-530 | 7 communes + ville principale = 8 |
| Zone — carte | `index.html` ligne ~540 | Iframe Google Maps, URL générée à partir de `{{ville}}` |
| Encart maquette | `index.html` — section `#maquette` | Bloc LeSiteArtisan, à retirer sur un site livré |
| Contact — coordonnées | `index.html` lignes ~640-680 | Tél, email, adresse, horaires |
| Footer — copyright | `index.html` ligne ~745 | Année auto-mise-à-jour par JS |

---

## 📬 Brancher un backend de formulaire

Le formulaire (`section#contact form`) n'a pas de backend. Le JS simule un envoi.

### Formspree (recommandé, gratuit jusqu'à 50 envois/mois)

1. Créer un compte sur [formspree.io](https://formspree.io)
2. Créer un nouveau formulaire, récupérer l'endpoint (format `https://formspree.io/f/xxxxxxx`)
3. Dans `index.html`, modifier la balise `<form>` ligne ~690 :
   ```html
   <form class="contact-form" action="https://formspree.io/f/xxxxxxx" method="POST" novalidate>
   ```
4. Dans `js/main.js`, retirer le bloc `if (!form.action || …) { e.preventDefault(); … }` pour laisser le navigateur poster nativement, **OU** transformer en `fetch()` pour un envoi AJAX silencieux.

### Alternatives
- **Web3Forms** : gratuit illimité, même approche
- **Getform**, **Basin**, **Netlify Forms** (si déploiement Netlify)
- Backend custom : créer un endpoint qui accepte les champs `nom`, `telephone`, `email`, `type_projet`, `message`, `rgpd`

---

## 🌐 Déployer

### Option 1 — Netlify (drag & drop, le plus simple)
1. Compresser le dossier `site_4avis/` en `.zip` (Clic droit → Compresser)
2. Aller sur [app.netlify.com/drop](https://app.netlify.com/drop)
3. Glisser le `.zip` → URL générée en quelques secondes

### Option 2 — Vercel
```bash
npx vercel --prod
```
Depuis le dossier du projet (Vercel détecte un site statique).

### Option 3 — FTP / serveur classique
Copier le contenu du dossier dans la racine du serveur. Aucune dépendance, aucun build, ça fonctionne tel quel.

### Option 4 — Automatisation Make.com
1. Make génère un sous-dossier unique par prospect (`/prospect-marc-dupont/`)
2. Copie les fichiers du template
3. Effectue le find-and-replace des `{{variables}}` dans `index.html`
4. Upload via FTP/S3/Netlify API
5. Retourne l'URL finale au prospect (ou à toi via Notion)

---

## ⚡ Performance & SEO

### Lighthouse — objectifs visés
- Performance > 90
- Accessibility > 95
- Best Practices > 95
- SEO > 95

### Optimisations déjà incluses
- `<link rel="preload">` sur l'image hero (LCP)
- `loading="lazy"` sur toutes les autres images
- `font-display: swap` (via paramètre Google Fonts)
- Polices preconnect
- JSON-LD `schema.org/Painter` complet
- Open Graph + Twitter Card
- Hiérarchie de titres propre (un seul H1)
- `aria-label` sur icônes décoratives et boutons
- Focus visible avec contraste WCAG AA
- `prefers-reduced-motion` respecté

### Pour améliorer le LCP plus loin
- Remplacer l'image hero Unsplash par un `<picture>` avec WebP + AVIF
- Self-host les fonts (`/assets/fonts/`) au lieu de Google Fonts
- Inline le CSS critique du hero dans `<head>`

---

## 🔄 Variantes 1 / 2 / 3 avis et 0 avis

Ce template est la version "4 avis +". Les trois autres templates (à créer) :

| Template | Différences principales |
|---|---|
| `site_3avis/` (2-3 avis) | Section avis affiche 2 cards seulement, layout adapté |
| `site_1avis/` (1 avis) | Avis transformé en pull-quote unique grande dimension |
| `site_0avis/` (0 avis) | Section avis retirée, remplacée par "Engagements" ou "Pourquoi nous choisir" |

Le reste de la structure (header, hero, services, réalisations, zone, contact, encart maquette, footer) reste identique : seule la section témoignages varie. Cela facilite la maintenance.

---

## 🛠️ Stack technique

- **HTML5** sémantique (un seul `<h1>`, landmarks `<header>`/`<main>`/`<footer>`/`<section>`/`<nav>`)
- **CSS3 vanilla** avec custom properties (`:root { --var: … }`), aucun framework
- **Vanilla JS** en IIFE (pas de modules pour éviter les soucis de CORS sur `file://`)
- **GSAP 3.12.5** + ScrollTrigger + SplitText via CDN jsDelivr
- Aucun build tool, aucun npm, aucun bundler

---

## 📝 License

Code propriétaire — usage interne LeSiteArtisan. Les polices DM Serif Display et Inter sont sous licence SIL Open Font License (utilisation commerciale OK). Les images Unsplash sont sous licence Unsplash (libre, gratuite, sans attribution requise mais appréciée).
