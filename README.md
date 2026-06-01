# Tirage au sort — Roulette

Site statique hébergé sur **GitHub Pages** pour effectuer des tirages au sort avec une roulette animée.

## Fonctionnalités

### Mode 1 — Tirer une personne

Saisissez une liste de noms (un par ligne ou séparés par des virgules), puis lancez la roulette pour désigner **une seule personne** au hasard.

### Mode 2 — Personne + thème

Ajoutez autant de participants que nécessaire. Chaque personne dispose de **sa propre roulette** pour tirer un thème parmi la liste configurée. Les thèmes déjà attribués ne sont pas réutilisés tant qu'il reste des thèmes disponibles.

## Configuration des thèmes

Les thèmes sont définis dans [`data/themes.txt`](data/themes.txt) : **un thème par ligne**. Modifiez ce fichier pour adapter la liste (ajout, suppression, correction) sans toucher au code.

## Déploiement GitHub Pages

1. Dans le dépôt GitHub : **Settings → Pages**
2. Source : branche **main** (ou votre branche de production), dossier **/ (root)**
3. Le site sera accessible à `https://<utilisateur>.github.io/<nom-du-repo>/`

Aucune build n'est nécessaire : HTML, CSS et JavaScript modules suffisent.

## Développement local

Les modules ES (`import`) nécessitent un serveur HTTP local :

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Puis ouvrez `http://localhost:8080` (ou le port indiqué).

## Structure

```
index.html          Page principale
css/style.css       Styles
js/roulette.js      Composant roulette (canvas)
js/app.js           Logique des deux modes
data/themes.txt     Liste des thèmes (éditable)
```
