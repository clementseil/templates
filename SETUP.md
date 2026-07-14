# Setup complet — Prospection peintres Hérault

Document de référence pour comprendre comment tout est branché. À relire dans 6 mois quand tu auras oublié.

---

## Vision

Système automatisé pour prospecter les peintres **sans site web** dans l'Hérault.

Pour chaque peintre identifié, tu lui envoies un lien court vers une **démo de site à son nom** (avec ses vrais avis Google, sa ville, son téléphone). S'il accroche, tu lui vends le service.

L'URL ressemble à : `https://apercu.lesiteartisan.fr/tr-peinture`

---

## Stack

| Outil | Rôle |
|---|---|
| **Apify** | Scrape Google Maps pour trouver les peintres locaux |
| **Make** | Orchestration : filtre Apify → Notion, génère slug |
| **Notion** | Base de données des prospects |
| **Vercel** | Héberge les 4 templates HTML + la fonction `render.js` |
| **Cloudflare** | DNS pour le sous-domaine `apercu.lesiteartisan.fr` |
| **GitHub** | Source du code (déclenche les déploiements Vercel) |

---

## Le parcours d'un prospect (de A à Z)

1. **Apify** scrape Google Maps avec le filtre "peintre" sur 20 villes de l'Hérault
2. **Make (scénario A — Insertion Apify → Notion)** :
   - Reçoit les résultats Apify
   - Filtre (vraie catégorie peintre, qualité des avis, etc.)
   - Insère le prospect dans Notion SANS SITE
3. **Make (scénario B — Envoi template prospects SANS SITE)** :
   - Détecte les nouveaux prospects dans Notion (toutes les 15 min)
   - Génère un slug propre depuis le nom de l'entreprise
   - Écrit le slug + l'URL complète dans Notion
4. **Toi** :
   - Copies l'URL `apercu.lesiteartisan.fr/{slug}` depuis la colonne `URL template` de Notion
   - Envoies en DM Insta / email avec un message de prospection
5. **Le peintre clique** :
   - Cloudflare reçoit la requête sur `apercu.lesiteartisan.fr/tr-peinture`
   - La transmet à Vercel
   - `vercel.json` réécrit l'URL en `/api/render?slug=tr-peinture`
   - `render.js` s'exécute :
     - Cherche dans Notion la ligne où `slug = "tr-peinture"`
     - Choisit le bon template selon le nombre d'avis (0, 1, 2-3, 4+)
     - Remplace les placeholders `{{nom_entreprise}}`, `{{avis_1}}`, etc. par les vraies valeurs
     - Renvoie la page HTML finie
6. **Le peintre voit son site perso** en ~1 seconde

---

## Composants en détail

### Notion

Deux databases :

- **Peintres SANS SITE** — les vrais prospects (cible principale)
- **Peintres AVEC SITE** — déjà clients ou non-prioritaires

**Colonnes importantes de la DB SANS SITE :**

| Colonne | Type | Source | Usage |
|---|---|---|---|
| `Nom de l'entreprise` | Title | Apify | Affiché dans le template |
| `Ville` | Text | Apify | Affiché dans le template |
| `Adresse complète` | Text | Apify | Affiché dans le template |
| `Téléphone` | Text | Apify | Affiché + bouton "Appeler" |
| `Note google` | Number | Apify | Affichée |
| `Nombres d'avis` | Number | Apify | Détermine le template choisi par render.js |
| `Avis 1` à `Avis 6` | Text | Apify | Affichés dans le template |
| `Prénom avis 1` à `Prénom avis 6` | Text | Apify | Affichés sous chaque avis |
| `slug` | Text (rich_text) | Make | Clé utilisée par render.js |
| `URL template` | URL | Make | URL prête à copier-coller |
| `Statut prospection` | Select | Toi | À contacter / Contacté / Répondu / Vendu |
| `Date de contact` | Date | Toi | Quand tu as envoyé le DM |

**Intégration Notion "Vercel apercu"** : a accès aux 2 DBs. C'est elle qui permet à `render.js` de lire Notion.

### Apify

- Acteur : Google Maps Scraper
- Input : catégorie "peintre" + 20 villes de l'Hérault
- Output : JSON avec les peintres trouvés, avec leurs avis Google, téléphone, etc.

### Make

**Scénario A — Insertion Apify → Notion** *(à construire)*
- Trigger : sortie Apify
- Filtre : catégorie réelle, nombre d'avis minimum, etc.
- Action : crée une ligne dans Notion SANS SITE

**Scénario B — Envoi template prospects SANS SITE** *(fait, 3 modules)*
- Trigger : Notion Search Objects (toutes les 15 min, sur prospects sans slug)
- Tools (Set variable) : génère le slug avec cette formule de slugification
  ```
  replace(replace(replace(...lower(Nom de l'entreprise)...)))
  ```
  Étapes : minuscules → virer accents → virer caractères spéciaux → espaces en tirets
- Notion (Update Data Source Item) : écrit dans 2 colonnes :
  - `slug` = le slug généré
  - `URL template` = `https://apercu.lesiteartisan.fr/{slug}`

### Vercel

- **Projet** : templates-lesiteartisan
- **Domaine principal** : `apercu.lesiteartisan.fr`
- **Source** : GitHub (push sur main = déploiement auto)

**Variables d'environnement** (Settings → Environment Variables) :
- `NOTION_TOKEN` : token de l'intégration "Vercel apercu" (commence par `secret_` ou `ntn_`)
  ⚠️ L'intégration doit avoir la capacité **« Mettre à jour le contenu »** (Notion →
  Paramètres → Connexions) pour que le tracking des visites fonctionne.
- `NOTION_DB_ID` : ID 32 caractères de la DB Notion SANS SITE

⚠️ **Changement d'env var = redéploiement obligatoire** (Deployments → "..." → Redeploy)

**Structure du repo :**
```
/api/render.js              ← fonction serverless principale
/vercel.json                ← réécriture URL : /:slug → /api/render?slug=:slug
/package.json               ← dépendance @notionhq/client
/peintres/template-0-avis/  ← template pour peintres sans avis Google
/peintres/template-1-avis/
/peintres/template-2-3-avis/
/peintres/template-4-avis/  ← template pour peintres avec 4+ avis
```

Chaque template = un `index.html` + son `css/` + son `assets/` + son `js/`.

**Mode debug** : ajouter `?debug=1` à n'importe quelle URL renvoie le JSON des données extraites de Notion (utile pour vérifier ce que `render.js` voit).
Exemple : `apercu.lesiteartisan.fr/tr-peinture?debug=1`

**Tracking des visites** : à chaque visite d'une maquette, `render.js` écrit dans la
ligne Notion du prospect : `Template vu le` (date/heure de la dernière visite) et
`Visites maquette` (compteur). Prospect qui a vu sa maquette = prospect chaud → rappel prioritaire.
- Les bots et aperçus de liens (WhatsApp, Facebook…) sont filtrés par user-agent : l'envoi d'un message ne crée pas de fausse visite.
- `?notrack=1` = visite non comptée (pour tes propres vérifications).
- `?debug=1` ne compte pas non plus.
- Nécessite : colonnes `Template vu le` (date) et `Visites maquette` (nombre) dans la DB + capacité d'écriture sur l'intégration (voir env vars). Si les colonnes n'existent pas, le tracking est ignoré sans casser le rendu.
- Le cache edge a été désactivé (`Cache-Control: no-store`) pour que chaque visite atteigne la fonction.

### Cloudflare

- Nameservers actifs sur `lesiteartisan.fr` (migration OVH → Cloudflare faite)
- Enregistrement DNS : `CNAME apercu → ...vercel-dns-017.com` (proxy DÉSACTIVÉ — sinon ça casse Vercel)
- SSL : Let's Encrypt auto-issued par Vercel

---

## État actuel

**Fait :**
- Domaine `apercu.lesiteartisan.fr` opérationnel (DNS + SSL)
- `render.js` déployé et fonctionnel : lit Notion, choisit le template, remplit les placeholders
- Scénario Make "Envoi template" simplifié à 3 modules
- Slug auto-généré et écrit dans Notion
- Page rendue en ~1 seconde

**À faire :**
- Finir le run Apify sur les 20 villes de l'Hérault
- Construire le scénario Make A (filtre Apify → insertion Notion)
- Optionnel : étendre `render.js` pour gérer aussi la DB AVEC SITE
- Optionnel : vraie homepage sur `apercu.lesiteartisan.fr/`
- Optionnel : ajouter des balises `og:image` aux templates pour avoir une jolie preview quand on partage l'URL en DM
- Lancer la première vague de prospection

---

## Debug courant

| Symptôme | Cause probable | Solution |
|---|---|---|
| Page 404 "Page introuvable pour 'xyz'" | Le slug `xyz` n'existe pas dans la DB pointée par `NOTION_DB_ID` | Vérifier que Make a bien écrit le slug ; vérifier que `NOTION_DB_ID` pointe vers la bonne DB |
| Page 500 "Invalid request URL" | `NOTION_DB_ID` mal formaté (URL complète au lieu de l'ID, espaces, etc.) | Mettre uniquement les 32 caractères de l'ID, redéployer |
| Page 500 "Could not find database" | L'intégration "Vercel apercu" n'a pas accès à la DB | Dans Notion, ouvrir la DB → ... → Connections → ajouter "Vercel apercu" |
| Page 200 mais placeholders affichés en clair (`{{nom_entreprise}}`) | Le nom du placeholder dans le HTML ne matche pas avec une clé dans `render.js` | Vérifier l'orthographe / les accents du placeholder |
| Make ne génère plus le slug après renommage d'une colonne Notion | Make cache le schéma de Notion | Recréer le module Notion, ou bouton "Refresh" + re-mapper les champs |
| Changement d'env var Vercel sans effet | Vercel n'utilise les nouvelles valeurs qu'après un déploiement | Deployments → "..." du dernier → Redeploy |

---

## Sécurité

- `NOTION_TOKEN` : **jamais** dans le repo Git, **jamais** en chat, **jamais** dans un screenshot. Uniquement dans les env vars Vercel.
- `NOTION_DB_ID` : moins sensible mais à garder discret aussi.
- Le repo GitHub peut être public — il n'y a aucun secret dedans.
