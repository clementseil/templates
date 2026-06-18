# Boutique — Atelier Camille Véran

Boutique statique pour une artiste peintre vendant des œuvres originales (pièces uniques).
Tout est inventé (artiste, œuvres, prix) — prototype de test.

Le site est en HTML/CSS/JS pur. **Snipcart** (service tiers) gère par-dessus :
**panier · paiement · adresse de livraison · emails automatiques · gestion du stock.**
Aucun backend à coder.

```
boutique-peintre/
├── index.html        # la boutique (les 10 cartes sont en HTML statique)
├── css/
│   ├── style.css     # styles + 10 « toiles » abstraites générées
│   └── tokens.css    # design tokens portables (thème Atelier)
├── js/
│   └── shop.js       # filtre + vue rapide (c'est tout — Snipcart fait le reste)
├── server.js         # mini-serveur local pour prévisualiser (optionnel)
└── README.md
```

---

## 1. Tester l'apparence tout de suite (sans compte)

```bash
cd boutique-peintre
python3 -m http.server 8000     # → http://localhost:8000
```
Galerie, filtres et vue rapide fonctionnent. Le **panier Snipcart ne s'activera
qu'une fois ta clé renseignée et le site en ligne** (Snipcart vérifie les produits en
visitant l'URL publique de la page — voir §3).

---

## 2. Comment Snipcart répond à tes 4 besoins

| Besoin | Réglage Snipcart |
|---|---|
| **Stock** | Pièces uniques : `data-item-max-quantity="1"` sur chaque bouton + **Inventory management** activé dans le dashboard (stock = 1). Une fois l'œuvre payée, Snipcart la passe en rupture → elle ne peut plus être achetée. |
| **Paiement** | Dashboard Snipcart → **Payment gateway** → connecter **Stripe** (ou PayPal). Carte, Apple/Google Pay. |
| **Adresse de livraison** | Collectée automatiquement au checkout. Frais de port : dashboard → **Shipping** (forfait, par poids — j'ai mis `data-item-weight` en grammes — ou par région). |
| **Emails automatiques** | Dashboard → **Email templates** : confirmation de commande au client + notification à Camille, automatiques. Personnalisables. |

---

## 3. Mettre en ligne et activer la vente (≈ 20 min)

1. **Créer un compte Snipcart** : [snipcart.com](https://snipcart.com) (gratuit en mode test).
2. **Récupérer la clé publique** : Dashboard → *Account → API Keys → Public API Key*.
   Colle-la dans `index.html`, à la place de `VOTRE_CLE_PUBLIQUE_SNIPCART`
   (dans `<div hidden id="snipcart" data-api-key="...">`).
3. **Connecter Stripe** : Dashboard Snipcart → *Payment gateway* → Stripe → suivre l'assistant.
4. **Activer la gestion de stock** : Dashboard → *Products* → activer *Inventory management*,
   mettre **stock = 1** pour chaque œuvre (et 0 pour « Garrigue », déjà vendue).
5. **Régler la livraison** : Dashboard → *Shipping* (ex. forfait France 25 €, international sur devis).
6. **Déployer** le dossier sur un hébergeur statique :
   - **Vercel / Netlify / GitHub Pages** — glisser-déposer ou `git push`.
   - ⚠️ **Important** : les boutons ont `data-item-url="/"`. Snipcart visite cette URL
     pour valider chaque produit. Si la boutique est servie à la racine du domaine
     (`https://camilleveran.fr/`), laisse `/`. Si elle est dans un sous-dossier
     (`.../boutique-peintre/`), remplace les `data-item-url="/"` par
     `data-item-url="/boutique-peintre/"`.
7. **Tester** en mode test (cartes de test Stripe), puis **passer en live** :
   remplace la clé publique *test* par la clé *live* dans `index.html`.

C'est tout. Pas de base de données, pas de serveur à maintenir.

> Tarif Snipcart : **gratuit en test**, puis **2 % par transaction** (min. ~10 €/mois)
> une fois en live. Stripe prend ~1,5 % + 0,25 € en plus.

---

## Modifier le catalogue

Tout est dans `index.html`, une `<article class="card">` par œuvre. Pour chaque œuvre,
garde le **prix affiché** (`.card__price`) et le **prix Snipcart** (`data-item-price`,
sans symbole, point décimal) **identiques** — c'est le prix `data-item-price` qui fait foi
au paiement (et Snipcart refuse si la page et le panier divergent).

## Remplacer les toiles générées par de vraies photos

Les 10 visuels sont des **toiles abstraites générées en CSS** (placeholders honnêtes).
Pour mettre tes photos : dans chaque carte, remplace
`<div class="canvas" data-art="N">` par `<img class="art" src="assets/img/xxx.jpg" alt="…">`
(ajoute `.art{width:100%;aspect-ratio:4/5;object-fit:cover}` au CSS), et ajoute
`data-item-image="assets/img/xxx.jpg"` au bouton pour la miniature dans le panier.

---

*Design : Hallmark · macrostructure Portfolio Grid · thème Atelier (terracotta).
Fonts DM Serif Display + Inter · couleurs OKLCH · commerce : Snipcart + Stripe.*
