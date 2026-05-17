# Templates LeSiteArtisan

Templates one-page personnalisables pour automatiser la prospection auprès d'artisans, organisés par métier.

Chaque template est un sous-dossier statique déployable indépendamment (Vercel, Netlify, GitHub Pages…). La personnalisation se fait via query params dans l'URL, lus par un petit JS au chargement.

## Structure

```
templates/
├── peintres/
│   ├── template-0-avis/         # peintres sans avis Google
│   ├── template-1-avis/         # peintres avec 1 avis
│   ├── template-2-3-avis/       # peintres avec 2-3 avis
│   └── template-4-avis/         # peintres avec 4+ avis
├── plombiers/         (futur)
├── electriciens/      (futur)
└── …
```

## Personnalisation via URL (query params)

Chaque template lit les query params au chargement (via `js/params.js`) et remplace les placeholders `{{var}}` du HTML par les valeurs.

### Mapping URL → placeholder (commun à tous les templates peintres)

| Query param | Placeholder HTML |
|---|---|
| `?nom=` | `{{nom_entreprise}}` |
| `&ville=` | `{{ville}}` |
| `&adresse=` | `{{adresse_complète}}` |
| `&tel=` | `{{numéro_de_téléphone}}` |
| `&note=` | `{{note_google}}` |
| `&nb_avis=` | `{{nombre_d_avis}}` |
| `&avis1=` à `&avis4=` | `{{avis_1}}` à `{{avis_4}}` |
| `&prenom1=` à `&prenom4=` | `{{prénom_avis_1}}` à `{{prénom_avis_4}}` |
| `&url=` | `{{url_site}}` (canonical / OG) |

### Exemple

```
https://peintre-4avis.vercel.app/?nom=Dupont%20Peinture&ville=Lyon&tel=0612345678&note=4.8&nb_avis=27&avis1=Excellent%20travail&prenom1=Marc
```

Si **aucun query param** n'est passé, le script ne touche à rien : les `{{...}}` restent visibles, utile pour bosser le design en local.

## Lancer en local

```bash
cd peintres/template-4-avis/
python3 -m http.server 8000
# → http://localhost:8000/
# → http://localhost:8000/?nom=Test&ville=Paris&... pour tester avec données
```

## Déploiement

Chaque sous-dossier `peintres/template-X-avis/` (ou futur `plombiers/...`, etc.) est déployable tel quel. Aucun build, aucune dépendance npm.

### Sur Vercel (recommandé)

Pour chaque template, créer un projet Vercel qui pointe vers ce repo avec un **Root Directory** spécifique :

| Projet Vercel | Root Directory |
|---|---|
| `peintre-0avis` | `peintres/template-0-avis` |
| `peintre-1avis` | `peintres/template-1-avis` |
| `peintre-2-3avis` | `peintres/template-2-3-avis` |
| `peintre-4avis` | `peintres/template-4-avis` |

Tout `git push` sur `main` redéploie automatiquement les projets impactés.

## Ajouter un nouveau métier

1. Créer un nouveau sous-dossier à la racine (ex: `plombiers/`)
2. Y déposer les templates correspondants (`template-0-avis/`, etc.)
3. Créer les projets Vercel avec le bon Root Directory
4. Mettre à jour ce README

## Stack

HTML5 sémantique + CSS vanilla (custom properties) + Vanilla JS (IIFE) + GSAP via CDN. Aucun build, aucun npm, aucun framework.
