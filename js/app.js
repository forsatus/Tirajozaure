import { Roulette } from "./roulette.js";

const THEMES_URL = "data/themes.txt";

let themes = [];
let usedThemeIndices = new Set();
let mode2Participants = [];

const modeTabs = document.querySelectorAll(".mode-tab");
const panels = document.querySelectorAll(".panel");

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

const rouletteMode1 = new Roulette(mode1Canvas, { size: 400 });

async function loadThemes() {
  try {
    const res = await fetch(THEMES_URL);
    if (!res.ok) throw new Error("fetch failed");
    const text = await res.text();
    themes = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } catch {
    themes = [];
    console.warn("Impossible de charger data/themes.txt");
  }
}

function parseNamesFromText(text) {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function switchMode(mode) {
  modeTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${mode}`);
  });
}

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchMode(tab.dataset.mode));
});

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
  mode2Participants.forEach((name, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${escapeHtml(name)}</span>`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "remove-btn";
    btn.textContent = "Retirer";
    btn.addEventListener("click", () => {
      mode2Participants.splice(i, 1);
      renderMode2List();
      renderMode2Cards();
    });
    li.appendChild(btn);
    mode2List.appendChild(li);
  });
  mode2SpinAllBtn.disabled = mode2Participants.length === 0;
  mode2Empty.style.display =
    mode2Participants.length === 0 ? "block" : "none";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getAvailableThemeIndices() {
  const all = themes.map((_, i) => i);
  return all.filter((i) => !usedThemeIndices.has(i));
}

function pickRandomThemeIndex() {
  const available = getAvailableThemeIndices();
  if (available.length === 0) {
    usedThemeIndices.clear();
    return Math.floor(Math.random() * themes.length);
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  usedThemeIndices.add(idx);
  return idx;
}

function renderMode2Cards() {
  mode2Cards.innerHTML = "";
  if (mode2Participants.length === 0) return;

  const themeLabels = themes.length
    ? themes
    : ["Chargement des thèmes…"];

  mode2Participants.forEach((name, personIndex) => {
    const card = document.createElement("article");
    card.className = "theme-card";
    card.dataset.personIndex = String(personIndex);

    const title = document.createElement("h3");
    title.textContent = name;

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

    const spinBtn = document.createElement("button");
    spinBtn.type = "button";
    spinBtn.className = "btn btn-primary";
    spinBtn.textContent = "Tirer un thème";
    spinBtn.style.marginTop = "1rem";

    const hint = document.createElement("p");
    hint.className = "spinning-hint";

    const result = document.createElement("div");
    result.className = "result-box";
    result.innerHTML =
      '<div class="label">Thème attribué</div><div class="value"></div>';

    const roulette = new Roulette(canvas, { size: 320 });
    const numberedLabels = themeLabels.map((_, i) => String(i + 1));
    roulette.setItems(themeLabels, numberedLabels);

    spinBtn.addEventListener("click", async () => {
      if (roulette.isSpinning() || themes.length === 0) return;
      spinBtn.disabled = true;
      mode2SpinAllBtn.disabled = true;
      hint.textContent = "La roulette tourne…";
      result.classList.remove("visible");
      card.classList.remove("done");

      const themeIndex = pickRandomThemeIndex();
      const { winner } = await roulette.spin(themeIndex);

      hint.textContent = "";
      result.classList.add("visible");
      result.querySelector(".value").textContent = winner;
      status.textContent = "Thème tiré";
      card.classList.add("done");
      spinBtn.disabled = true;
      mode2SpinAllBtn.disabled = false;
    });

    zone.appendChild(wrapper);
    zone.appendChild(spinBtn);
    zone.appendChild(hint);
    zone.appendChild(result);

    card.appendChild(title);
    card.appendChild(status);
    card.appendChild(zone);
    mode2Cards.appendChild(card);

    card._roulette = roulette;
    card._spinBtn = spinBtn;
    card._hint = hint;
    card._result = result;
    card._status = status;
  });
}

mode2AddBtn.addEventListener("click", () => {
  const name = mode2Input.value.trim();
  if (!name) return;
  if (mode2Participants.some((p) => p.toLowerCase() === name.toLowerCase())) {
    mode2Input.value = "";
    return;
  }
  mode2Participants.push(name);
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
  for (const card of cards) {
    const btn = card._spinBtn;
    if (!btn.disabled) {
      btn.click();
      while (card._roulette?.isSpinning()) {
        await new Promise((r) => setTimeout(r, 100));
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }
});

mode2ResetBtn.addEventListener("click", () => {
  mode2Participants = [];
  usedThemeIndices.clear();
  mode2Input.value = "";
  renderMode2List();
  renderMode2Cards();
});

loadThemes().then(() => {
  updateMode1Wheel();
  renderMode2List();
});
