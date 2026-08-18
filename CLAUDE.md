# Site SISTAFUND — guide de modification

Ce fichier explique comment mettre à jour le site. Il est lu automatiquement par Claude :
toute personne de l'équipe peut donc demander une modification en langage courant
(« ajoute Untel à l'équipe », « voici une nouvelle actu ») et obtenir un résultat correct.

## Comment ça marche

Site statique, sans base de données ni build. Tout le contenu qui bouge vit dans **`data.js`**.
À chaque `git push` sur `main`, Vercel redéploie tout seul en ~30 secondes :
https://sistafund-test.vercel.app/

## Règles de marque à ne jamais enfreindre

- Couleurs : **jaune `#FFF868`**, noir `#101010`, crème `#FAF8F0`. **Aucun bleu, jamais.**
- Polices : **Right Grotesk Narrow** (titres, en capitales) et **Portrait** (textes). Aucune autre.
- Pas d'italique, pas de numérotation de sections, pas de motif étoile/astérisque.
- Les portraits individuels sont en **noir et blanc** ; la photo de groupe reste en couleur.
- Pas de tiret cadratin « — » au milieu d'une phrase, pas de puce « • » entre des mots.

## Ajouter une société au portfolio

1. Déposer le logo dans **`img/logos/`** (PNG ou SVG, fond transparent de préférence).
2. Dans `data.js`, ajouter une ligne à `window.COMPANIES`, sur le modèle des autres :

```js
cle: ['Nom', 'Secteur', 'fichier-logo.png', 'Une phrase de description.', 'Prénom Nom des fondateurs', 'Ville, année'],
```

- `Secteur` doit être exactement l'un de : `HealthTech`, `Frontier Tech`, `Sustainability`, `Fintech`.
- Elle apparaît alors sur la page portfolio (avec les filtres) et dans les rangées du home.
- **Penser à mettre à jour le compteur** `(15)` dans le menu : chercher `nav-count` dans les fichiers `.html`.
- Pour l'afficher aussi dans les rangées défilantes du home, ajouter une carte dans `index.html` (section `pf-rows`).

## Ajouter une actualité

1. Déposer l'image dans **`img/news/`**.
2. Dans `data.js`, ajouter une entrée **en haut** de `window.NEWS` (la plus récente d'abord) :

```js
["JJ/MM/AAAA", "Source", "Titre de l'article", "https://lien-vers-l-article"],
```

3. Ajouter le nom du fichier image **au même rang** dans `window.NEWS_IMG` (les deux listes sont
   alignées : la 1re image correspond à la 1re actu).
4. Pour la mettre aussi en avant sur le home, remplacer une des trois cartes de la section
   `news` dans `index.html`.

## Ajouter une personne à l'équipe

1. Déposer le portrait dans **`img/team/`** (cadrage sur le visage, il sera passé en N&B).
2. Ajouter la personne à **trois endroits** :
   - `team.html` : une carte `<article class="tcard" style="--i:N">` dans `.team-stack`
     (incrémenter `--i`, et mettre à jour les compteurs `N / 6` de toutes les cartes) ;
   - `team.html` : une carte `<article class="member">` dans `.team-gallery` ;
   - `index.html` : une `<figure class="team-slide">` dans le jeu de portraits `#teamDeck`.
3. Mettre à jour le compteur `(6)` du menu (chercher `nav-count`) et le total `/ 6`.

## Ajouter un membre de la communauté

1. Déposer le portrait dans **`img/community/`**.
2. Ajouter une ligne à `window.LPS` dans `data.js` :

```js
['Prénom Nom', 'Entreprise', 'fichier.jpg', 'secteur'],
```

- `secteur` doit être l'un de : `consumer`, `fintech`, `frontier`, `health`, `saas`.
- Ne jamais afficher le nombre total de membres de la communauté (règle de l'équipe).

## Après toute modification

1. Vérifier la page concernée en local (`python3 serve.py`, puis http://localhost:8090).
2. Si un fichier `style.css`, `script.js`, `data.js` ou `reveal.js` a été modifié,
   **incrémenter le `?v=` correspondant** dans tous les `.html` — sinon les visiteurs
   garderont l'ancienne version en cache.
3. `git add -A && git commit -m "..." && git push` → Vercel déploie automatiquement.

## Pièges connus

- Les animations d'apparition sont armées par `reveal.js` uniquement si l'onglet est visible :
  ne jamais laisser un élément à `opacity: 0` sans mécanisme de secours.
- Les pages `portfolio.html`, `community.html` sont sur fond noir (`subpage-dark`) ;
  `index.html`, `team.html`, `manifesto.html`, `news.html` sont sur fond clair.
- Les compteurs `(15)` et `(6)` du menu sont écrits en dur : les mettre à jour à la main.
