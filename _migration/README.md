# Migration vers WordPress — dossier de reprise

Ce dossier n'est pas servi par le site. Il existe pour la personne qui installera
le thème WordPress sur l'hébergement OVH.

## content.json

Un instantané de tout le contenu du site, extrait de `data.js` et remis à plat avec
des champs **nommés** plutôt que des positions dans un tableau. 128 fiches :

| collection     | fiches | champs                                                                                  |
|----------------|--------|-----------------------------------------------------------------------------------------|
| `companies`    | 16     | key, name, sector, logo, description, founders, locations, founded, partnered, website, founders_photo |
| `institutions` | 5      | name, logo                                                                              |
| `community`    | 27     | name, org, photo, sector                                                                |
| `news`         | 63     | date, source, title, url, image                                                         |
| `faq`          | 11     | question, answer                                                                        |
| `team`         | 6      | name, role, photo, paragraphs (liste), about, linkedin                                  |

Champs vides connus, et voulus : `website` (Recupere Metals n'en a pas), `founders`
(Suna), `partnered` (5 sociétés pas encore datées). Le site les gère déjà — un champ
absent ne laisse pas de trou, il retire simplement sa ligne.

Les noms de fichiers image renvoient aux dossiers du dépôt : `img/logos/`,
`img/founders/`, `img/community/`, `img/news/`, `img/team/`, `img/institutions/`.

**Ce fichier est un instantané, pas une source.** Tant que le site tourne en statique,
la source reste `data.js`. À regénérer si `data.js` bouge avant la reprise.

## Pourquoi la conversion est courte

Tout le contenu du site passe par sept objets JavaScript (`window.COMPANIES`,
`window.LPS`, `window.TEAM`, `window.NEWS`, `window.NEWS_IMG`, `window.FAQ`,
`window.INSTITUTIONS`) définis dans le seul `data.js`. Rien d'autre ne lit le contenu.

Le thème WordPress n'a donc qu'à **réémettre ces sept objets** depuis la base, et
l'intégralité du reste — CSS, animations, moteurs d'apparition, filtres, fiches
société, champ de nuages — continue de fonctionner sans être modifiée.
