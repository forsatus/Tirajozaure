const CATEGORIES_MANIFEST = "data/categories.json";
const CATEGORIES_BASE = "data/categories/";

let categories = [];
let currentCategoryId = null;
let themes = [];

export function getCategories() {
  return [...categories];
}

export function getThemes() {
  return [...themes];
}

export function getCurrentCategoryId() {
  return currentCategoryId;
}

export function getCurrentCategory() {
  return categories.find((c) => c.id === currentCategoryId) ?? null;
}

export async function initCategories(preferredId = null) {
  try {
    const res = await fetch(CATEGORIES_MANIFEST);
    if (!res.ok) throw new Error("manifest");
    const data = await res.json();
    categories = data.categories ?? [];
  } catch {
    categories = [];
    themes = [];
    console.warn("Impossible de charger data/categories.json");
    return categories;
  }

  if (categories.length === 0) {
    themes = [];
    return categories;
  }

  const id =
    preferredId && categories.some((c) => c.id === preferredId)
      ? preferredId
      : categories[0].id;
  await selectCategory(id);
  return categories;
}

export async function selectCategory(categoryId) {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return false;

  try {
    const res = await fetch(`${CATEGORIES_BASE}${cat.file}`);
    if (!res.ok) throw new Error("themes file");
    const text = await res.text();
    themes = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    currentCategoryId = categoryId;
    return true;
  } catch {
    themes = [];
    console.warn(`Impossible de charger ${CATEGORIES_BASE}${cat.file}`);
    return false;
  }
}
