# Tirage au sort — Roulette

Site statique hébergé sur **GitHub Pages** pour effectuer des tirages au sort avec une roulette animée.

## Modes

| Mode | Description |
|------|-------------|
| **Tirer une personne** | Liste de noms → une personne tirée au hasard |
| **Tirer un thème** | Une roulette sur la catégorie choisie → un thème |
| **Personne + thème** | Une roulette par participant ; relance individuelle ou pour tous |

### Personne + thème

- Bouton **Relancer** dans la liste des participants ou sur chaque carte
- **Tirer pour tous** : tire les participants restants ; si tout le monde a déjà un thème, relance un nouveau tirage pour tous
- Les thèmes déjà attribués ne sont pas réutilisés tant qu’il en reste dans la catégorie

## Catégories de thèmes

Structure :

```
data/
  categories.json          ← liste des catégories (manifeste)
  categories/
    securite-routiere.txt  ← un fichier par catégorie (un thème par ligne)
    autre-categorie.txt    ← ajoutez vos fichiers ici
```

### Ajouter une catégorie

1. Créez `data/categories/ma-categorie.txt` (un thème par ligne)
2. Ajoutez une entrée dans `data/categories.json` :

```json
{
  "id": "ma-categorie",
  "label": "Ma catégorie",
  "file": "ma-categorie.txt"
}
```

## Déploiement GitHub Pages

**Settings → Pages** → branche **main**, dossier **/ (root)**.

## Développement local

```bash
npx serve .
```

Les modules ES nécessitent un serveur HTTP.
