# SISTAFUND — guide du site

Site statique (HTML/CSS/JS, sans build). `git push` sur `main` → Vercel déploie en ~30 s :
https://sistafund-test.vercel.app/

## Où se trouve quoi

| Fichier | Rôle |
|---|---|
| `data.js` | **Tout le contenu qui bouge** : sociétés, communauté (LPs), actualités, FAQ, bios équipe |
| `index.html` | Le défilement d'accueil (hero → photo → secteurs → chiffres → portfolio → équipe → communauté → news → FAQ → contact) |
| `manifesto.html` `portfolio.html` `team.html` `community.html` `news.html` | Les pages dédiées |
| `script.js` | Animations de l'accueil uniquement |
| `reveal.js` | Scroll inertiel + apparitions au scroll, chargé sur **toutes** les pages |
| `style.css` | Toute la mise en forme |

**Après toute modification de `style.css`, `script.js`, `data.js` ou `reveal.js` : incrémenter le `?v=`
correspondant dans les six `.html`**, sinon les visiteurs gardent l'ancienne version en cache.

## Règles de marque (ne jamais enfreindre)

- Couleurs : **jaune `#FFF868`**, noir `#101010`, crème `#FAF8F0`. **Aucun bleu.**
- Polices : **Right Grotesk Narrow** (display, capitales) et **Portrait** (serif). Aucune autre.
- **Portrait ne s'emploie jamais en capitales** — uniquement en bas de casse.
- Pas d'italique, pas de numérotation de sections, pas de motif étoile.
- Pas de tiret cadratin « — » au milieu d'une phrase, pas de puce « • » entre des mots.
- Portraits individuels en noir et blanc (exception assumée : la mosaïque de `team.html`
  passe en couleur à l'apparition).
- Ne jamais afficher le nombre total de membres de la communauté.
- **Le jaune sur fond jaune ne se lit pas** : dans le hero, les mots accentués restent en noir.

## Partis pris obtenus après itérations (ne pas défaire sans raison)

- **Hero** : chaque phrase suit la même grammaire — amorce Portrait bas de casse (45 px),
  ancrage display massif, liaison Portrait bas de casse. L'animation se fait **mot par mot**.
- **Étoiles européennes** (`img/eu-stars.svg`) : n'apparaissent qu'à partir de 62 % du scroll du hero,
  avec la phrase « gender-lens fund ». Jamais de bleu.
- **Photo de groupe** : séquence épinglée (`.grow-pin`) — le cadre s'ouvre du petit rectangle au plein
  écran, puis s'assombrit et laisse place au texte + bouton manifeste.
- **Équipe (accueil)** : six tirages éparpillés sur une table, 3 + 3. L'ordre de lecture est porté par
  la superposition et la taille (Tatiana devant, Gabriel derrière), **pas** par la position.
  Légendes alignées **à droite** (les tirages sont recouverts sur leur bord gauche).
- **Équipe (page)** : pile de cartes sticky de **hauteur fixe** — une hauteur `min-` laisse une photo
  très verticale étirer sa propre carte. Se termine par la mosaïque.
- **Textes** : FAQ, bios et fiches sociétés sont **repris mot pour mot de sistafund.com**.
  Ne pas les réécrire. Libellés officiels : `Founder(s)` / `Location(s)` / `Founded` / `Partnered`.

## Ajouter du contenu

Tout se passe dans `data.js`, puis déposer l'image dans le bon dossier :

```js
// une société — img/logos/
cle: ['Nom', 'Secteur', 'logo.png', 'Description.', 'Fondateurs', 'Ville', 'Fondée', 'Partenariat'],
// Secteur ∈ HealthTech · Frontier Tech · Sustainability · Fintech

// une actualité (la plus récente en haut) — img/news/
["JJ/MM/AAAA", "Source", "Titre", "https://lien"],
// + le fichier image au même rang dans window.NEWS_IMG

// une personne — img/team/
["Nom", "Poste", "photo.jpg", ["paragraphe 1", "paragraphe 2"], "ligne About"],

// un membre de la communauté — img/community/
['Nom', 'Entreprise', 'photo.jpg', 'secteur'],
// secteur ∈ consumer · fintech · frontier · health · saas
```

Penser à mettre à jour les compteurs `(15)` et `(6)` du menu (chercher `nav-count` dans les `.html`).

## Pièges rencontrés

- **Un onglet inactif gèle les transitions CSS** : un élément masqué en attendant une animation y reste
  invisible. `reveal.js` ne s'arme donc que si la page est visible et se désarme sinon. Ne jamais laisser
  un `opacity: 0` sans filet.
- **Spécificité CSS** : une règle placée avant une autre de même poids perd. Vérifier la valeur calculée
  plutôt que supposer que la règle s'applique.
- **Lire une valeur pendant une transition** renvoie l'état courant, pas la cible : couper la transition
  avant de mesurer.
- Pages sur fond noir : `portfolio.html`, `community.html` (classe `subpage-dark`).
  Les autres sont sur fond clair.
