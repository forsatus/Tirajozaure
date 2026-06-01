import { Roulette } from "./roulette.js";
import {
  initCategories,
  selectCategory,
  getCategories,
  getThemes,
  getCurrentCategoryId,
} from "./themes.js";

let usedThemeIndices = new Set();
let mode2Participants = [];
let nextParticipantId = 1;

const modeTabs = document.querySelectorAll(".mode-tab");
const panels = document.querySelectorAll(".panel");
const categorySelects = document.querySelectorAll(".category-select");

const mode1Textarea = document.getElementById("mode1-names");
const mode1SpinBtn = document.getElementById("mode1-spin");
const mode1ResetBtn = document.getElementById("mode1-reset");
const mode1Canvas = document.getElementById("mode1-canvas");
const mode1Result = document.getElementById("mode1-result");
const mode1Hint = document.getElementById("mode1-hint");

const mode2Input = document.getElementById("mode2-name-input");
const mode2AddBtn = document.getElementById("mode2-add");
const mode2List = document.getElementById("mode2-participant-list");
const mode2SpinAllBtn = document.getElementById("mode2-spin-all");
const mode2ResetBtn = document.getElementById("mode2-reset");
const mode2Cards = document.getElementById("mode2-cards");
const mode2Empty = document.getElementById("mode2-empty");
const mode2CategoryHint = document.getElementById("mode2-category-hint");

const mode3Canvas = document.getElementById("mode3-canvas");
const mode3SpinBtn = document.getElementById("mode3-spin");
const mode3ResetBtn = document.getElementById("mode3-reset");
const mode3Result = document.getElementById("mode3-result");
const mode3Hint = document.getElementById("mode3-hint");

const rouletteMode1 = new Roulette(mode1Canvas, { size: 400 });
const rouletteMode3 = new Roulette(mode3Canvas, { size: 400 });

/** @type {Map<string, object>} */
const participantCards = new Map();

function parseNamesFromText(text) {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function switchMode(mode) {
  modeTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
    tab.setAttribute("aria-selected", tab.dataset.mode === mode ? "true" : "false");
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${mode}`);
  });
  document.body.classList.toggle("layout-wide", mode === "theme");
}

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchMode(tab.dataset.mode));
});

function populateCategorySelects() {
  const cats = getCategories();
  categorySelects.forEach((select) => {
    const prev = select.value || getCurrentCategoryId();
    select.innerHTML = "";
    cats.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.label;
      select.appendChild(opt);
    });
    if (prev && cats.some((c) => c.id === prev)) {
      select.value = prev;
    }
  });
  updateCategoryHints();
}

function updateCategoryHints() {
  const themes = getThemes();
  const count = themes.length;
  const label =
    getCategories().find((c) => c.id === getCurrentCategoryId())?.label ?? "";
  document.querySelectorAll("[data-category-count]").forEach((el) => {
    el.textContent = count
      ? `${count} thème${count > 1 ? "s" : ""} — ${label}`
      : "Aucun thème chargé";
  });
  if (mode2CategoryHint) {
    mode2CategoryHint.textContent = count
      ? `${count} thèmes disponibles dans « ${label} »`
      : "";
  }
}

async function onCategoryChange(categoryId) {
  const hadParticipants = mode2Participants.length > 0;
  await selectCategory(categoryId);
  categorySelects.forEach((s) => {
    s.value = categoryId;
  });
  usedThemeIndices.clear();
  updateCategoryHints();
  updateMode3Wheel();
  if (hadParticipants) {
    renderMode2Cards();
  }
  mode3SpinBtn.disabled = getThemes().length === 0;
}

categorySelects.forEach((select) => {
  select.addEventListener("change", () => onCategoryChange(select.value));
});

function getAvailableThemeIndices() {
  const themes = getThemes();
  return themes.map((_, i) => i).filter((i) => !usedThemeIndices.has(i));
}

function pickRandomThemeIndex(excludeIndex = null) {
  const themes = getThemes();
  if (themes.length === 0) return null;

  let available = getAvailableThemeIndices();
  if (excludeIndex !== null) {
    available = available.filter((i) => i !== excludeIndex);
  }
  if (available.length === 0) {
    usedThemeIndices.clear();
    if (excludeIndex !== null) {
      usedThemeIndices.add(excludeIndex);
    }
    available = themes.map((_, i) => i).filter((i) => i !== excludeIndex);
  }
  if (available.length === 0) {
    return Math.floor(Math.random() * themes.length);
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  usedThemeIndices.add(idx);
  return idx;
}

function releaseThemeForCard(card) {
  if (card._assignedThemeIndex !== undefined && card._assignedThemeIndex !== null) {
    usedThemeIndices.delete(card._assignedThemeIndex);
    card._assignedThemeIndex = null;
  }
}

function prepareCardForSpin(card) {
  releaseThemeForCard(card);
  card.classList.remove("done");
  card._spinBtn.disabled = false;
  card._spinBtn.textContent = "Tirer un thème";
  card._respinBtn.disabled = false;
  card._status.textContent = "Prêt pour le tirage";
  card._result.classList.remove("visible");
  card._hint.textContent = "";
}

function buildThemeWheel(roulette) {
  const themeLabels = getThemes();
  if (themeLabels.length === 0) {
    roulette.setItems(["Aucun thème"]);
    return;
  }
  const numberedLabels = themeLabels.map((_, i) => String(i + 1));
  roulette.setItems(themeLabels, numberedLabels);
}

async function spinCard(card, { isRespin = false } = {}) {
  const roulette = card._roulette;
  const themes = getThemes();
  if (!roulette || roulette.isSpinning() || themes.length === 0) return false;

  if (isRespin) {
    prepareCardForSpin(card);
  }

  card._spinBtn.disabled = true;
  card._respinBtn.disabled = true;
  mode2SpinAllBtn.disabled = true;
  card._hint.textContent = "La roulette tourne…";
  card._result.classList.remove("visible");
  card.classList.remove("done");

  const themeIndex = pickRandomThemeIndex();
  if (themeIndex === null) return false;

  const { winner } = await roulette.spin(themeIndex);

  card._assignedThemeIndex = themeIndex;
  card._hint.textContent = "";
  card._result.classList.add("visible");
  card._result.querySelector(".value").textContent = winner;
  card._status.textContent = "Thème tiré";
  card.classList.add("done");
  card._spinBtn.disabled = true;
  card._spinBtn.textContent = "Thème tiré";
  card._respinBtn.disabled = false;
  mode2SpinAllBtn.disabled = mode2Participants.length === 0;

  return true;
}

function respinParticipant(participantId) {
  const card = participantCards.get(participantId);
  if (!card) return;
  spinCard(card, { isRespin: true });
}

function updateMode1Wheel() {
  const names = parseNamesFromText(mode1Textarea.value);
  rouletteMode1.setItems(names);
  mode1SpinBtn.disabled = names.length < 2;
}

mode1Textarea.addEventListener("input", () => {
  mode1Result.classList.remove("visible");
  updateMode1Wheel();
});

mode1SpinBtn.addEventListener("click", async () => {
  const names = parseNamesFromText(mode1Textarea.value);
  if (names.length < 2 || rouletteMode1.isSpinning()) return;

  mode1SpinBtn.disabled = true;
  mode1Hint.textContent = "La roulette tourne…";
  mode1Result.classList.remove("visible");

  const { winner } = await rouletteMode1.spin();
  mode1Hint.textContent = "";
  mode1Result.classList.add("visible");
  mode1Result.querySelector(".value").textContent = winner;
  mode1SpinBtn.disabled = names.length < 2;
});

mode1ResetBtn.addEventListener("click", () => {
  mode1Textarea.value = "";
  mode1Result.classList.remove("visible");
  mode1Hint.textContent = "";
  updateMode1Wheel();
});

function renderMode2List() {
  mode2List.innerHTML = "";
  mode2Participants.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="participant-name">${escapeHtml(p.name)}</span>`;

    const actions = document.createElement("div");
    actions.className = "list-actions";

    const relancerBtn = document.createElement("button");
    relancerBtn.type = "button";
    relancerBtn.className = "btn btn-small btn-secondary relancer-btn";
    relancerBtn.textContent = "Relancer";
    relancerBtn.disabled = !participantCards.has(p.id);
    relancerBtn.addEventListener("click", () => respinParticipant(p.id));

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Retirer";
    removeBtn.addEventListener("click", () => {
      const card = participantCards.get(p.id);
      if (card) releaseThemeForCard(card);
      mode2Participants = mode2Participants.filter((x) => x.id !== p.id);
      participantCards.delete(p.id);
      renderMode2List();
      renderMode2Cards();
    });

    actions.appendChild(relancerBtn);
    actions.appendChild(removeBtn);
    li.appendChild(actions);
    mode2List.appendChild(li);

    li._relancerBtn = relancerBtn;
  });

  mode2SpinAllBtn.disabled = mode2Participants.length === 0;
  mode2Empty.style.display =
    mode2Participants.length === 0 ? "block" : "none";
}

function renderMode2Cards() {
  mode2Cards.innerHTML = "";
  participantCards.clear();

  if (mode2Participants.length === 0) return;

  mode2Participants.forEach((p) => {
    const card = document.createElement("article");
    card.className = "theme-card";
    card.dataset.participantId = p.id;

    const title = document.createElement("h3");
    title.textContent = p.name;

    const status = document.createElement("p");
    status.className = "status";
    status.textContent = "Prêt pour le tirage";

    const zone = document.createElement("div");
    zone.className = "roulette-zone";

    const wrapper = document.createElement("div");
    wrapper.className = "roulette-wrapper";

    const pointer = document.createElement("div");
    pointer.className = "roulette-pointer";

    const canvas = document.createElement("canvas");
    wrapper.appendChild(pointer);
    wrapper.appendChild(canvas);

    const btnRow = document.createElement("div");
    btnRow.className = "card-actions";

    const spinBtn = document.createElement("button");
    spinBtn.type = "button";
    spinBtn.className = "btn btn-primary";
    spinBtn.textContent = "Tirer un thème";

    const respinBtn = document.createElement("button");
    respinBtn.type = "button";
    respinBtn.className = "btn btn-secondary";
    respinBtn.textContent = "Relancer";
    respinBtn.disabled = true;

    const hint = document.createElement("p");
    hint.className = "spinning-hint";

    const result = document.createElement("div");
    result.className = "result-box";
    result.innerHTML =
      '<div class="label">Thème attribué</div><div class="value"></div>';

    const roulette = new Roulette(canvas, { size: 280 });
    buildThemeWheel(roulette);

    spinBtn.addEventListener("click", () => spinCard(card));
    respinBtn.addEventListener("click", () => spinCard(card, { isRespin: true }));

    btnRow.appendChild(spinBtn);
    btnRow.appendChild(respinBtn);

    zone.appendChild(wrapper);
    zone.appendChild(btnRow);
    zone.appendChild(hint);
    zone.appendChild(result);

    card.appendChild(title);
    card.appendChild(status);
    card.appendChild(zone);
    mode2Cards.appendChild(card);

    card._roulette = roulette;
    card._spinBtn = spinBtn;
    card._respinBtn = respinBtn;
    card._hint = hint;
    card._result = result;
    card._status = status;
    card._assignedThemeIndex = null;

    participantCards.set(p.id, card);
  });

  renderMode2List();
}

mode2AddBtn.addEventListener("click", () => {
  const name = mode2Input.value.trim();
  if (!name) return;
  if (
    mode2Participants.some((p) => p.name.toLowerCase() === name.toLowerCase())
  ) {
    mode2Input.value = "";
    return;
  }
  mode2Participants.push({
    id: `p-${nextParticipantId++}`,
    name,
  });
  mode2Input.value = "";
  renderMode2List();
  renderMode2Cards();
  mode2Input.focus();
});

mode2Input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    mode2AddBtn.click();
  }
});

mode2SpinAllBtn.addEventListener("click", async () => {
  const cards = [...mode2Cards.querySelectorAll(".theme-card")];
  if (cards.length === 0) return;

  const pending = cards.filter((c) => !c.classList.contains("done"));
  const targets = pending.length > 0 ? pending : cards;

  if (pending.length === 0) {
    for (const card of cards) {
      prepareCardForSpin(card);
    }
  }

  mode2SpinAllBtn.disabled = true;
  const globalHint = document.getElementById("mode2-spin-all-hint");
  if (globalHint) {
    globalHint.textContent =
      pending.length === 0
        ? "Nouveau tirage pour tous les participants…"
        : "Tirage en cours…";
  }

  for (const card of targets) {
    await spinCard(card);
    while (card._roulette?.isSpinning()) {
      await new Promise((r) => setTimeout(r, 80));
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  if (globalHint) globalHint.textContent = "";
  mode2SpinAllBtn.disabled = mode2Participants.length === 0;
});

mode2ResetBtn.addEventListener("click", () => {
  mode2Participants = [];
  usedThemeIndices.clear();
  participantCards.clear();
  mode2Input.value = "";
  const hint = document.getElementById("mode2-spin-all-hint");
  if (hint) hint.textContent = "";
  renderMode2List();
  renderMode2Cards();
});

function updateMode3Wheel() {
  buildThemeWheel(rouletteMode3);
  mode3SpinBtn.disabled = getThemes().length === 0;
}

mode3SpinBtn.addEventListener("click", async () => {
  const themes = getThemes();
  if (themes.length === 0 || rouletteMode3.isSpinning()) return;

  mode3SpinBtn.disabled = true;
  mode3Hint.textContent = "La roulette tourne…";
  mode3Result.classList.remove("visible");

  const themeIndex = Math.floor(Math.random() * themes.length);
  const { winner } = await rouletteMode3.spin(themeIndex);

  mode3Hint.textContent = "";
  mode3Result.classList.add("visible");
  mode3Result.querySelector(".value").textContent = winner;
  mode3SpinBtn.disabled = false;
});

mode3ResetBtn.addEventListener("click", () => {
  mode3Result.classList.remove("visible");
  mode3Hint.textContent = "";
  updateMode3Wheel();
});

initCategories().then(() => {
  populateCategorySelects();
  updateMode1Wheel();
  updateMode3Wheel();
  renderMode2List();
});
