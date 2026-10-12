import { createStage } from "./stage.js?v=202610120952";

const C = window.SPONSOR_CONFIG;
const K = window.KIT;
const STORE = "sponsorme.v2";
const $ = (s, el = document) => el.querySelector(s);
const num = new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 });
const money = (n) => `${C.currencySymbol}${num.format(n)}`;
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  tab: K.tabs[0].id,
  term: "season",
  race: 0,
  hover: null,
  cart: [],   // { id, term, race }
  claims: {}, // demo purchases: { [spotId]: { company, url, logo, term, race } }
};

try {
  const saved = JSON.parse(localStorage.getItem(STORE) || "null");
  if (saved) {
    state.cart = (saved.cart || []).filter((i) => K.spots.some((s) => s.id === i.id));
    state.claims = saved.claims || {};
  }
} catch (e) {}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ cart: state.cart, claims: state.claims }));
  } catch (e) {}
}

// ── Lookups ──────────────────────────────────────────────────
const spot = (id) => K.spots.find((s) => s.id === id);
const tabOf = (id) => K.tabs.find((t) => t.id === id);
const spotsFor = (tab) => K.spots.filter((s) => s.tab === tab);
const code = (s) => String.fromCharCode(65 + spotsFor(s.tab).indexOf(s));
const info = (id) => C.spots[id] || {};
const price = (id, term) => info(id)[term] ?? 0;
const inCart = (id) => state.cart.find((i) => i.id === id);
const sizeText = (s) => `${Math.round(s.w * 100)} × ${Math.round(s.h * 100)} cm`;
const where = (s) => s.tab === "bike" ? "Drive side" : (s.dir[1] < -0.5 ? "Top" : s.dir[2] < -0.5 ? "Front" : s.dir[2] > 0.5 ? "Back" : "Side");

function takenBy(id) {
  const claim = state.claims[id];
  if (claim) return { sponsor: claim.company, url: claim.url, logo: claim.logo, demo: true };
  return info(id).sold || null;
}

const termLabel = (item) =>
  item.term === "season" ? `${C.season} season` : `${C.races[item.race].name}, ${C.races[item.race].date}`;

// ── 3D stage ─────────────────────────────────────────────────
const stage = createStage($("#stage-canvas"), {
  getSpotState(id) {
    const t = takenBy(id);
    if (t) return { status: "sold", sponsor: t.sponsor, logo: t.logo };
    return { status: inCart(id) ? "picked" : "open", hover: state.hover === id, code: code(spot(id)) };
  },
  onHover(id) {
    setHover(id);
  },
  onPick(id) {
    toggleCart(id);
  },
  onAngle(deg) {
    $("#hud-angle").textContent = String(Math.round(deg) % 360).padStart(3, "0");
  },
});
if (!stage) {
  $("#stage-fallback").hidden = false;
  $("#stage").classList.add("no-3d");
}

// ── Static content ───────────────────────────────────────────
function fillStatic() {
  document.querySelectorAll('[data-bind="name"]').forEach((el) => (el.textContent = C.athlete.name));
  document.querySelectorAll('[data-bind="intro"]').forEach((el) => (el.textContent = C.athlete.intro));
  document.querySelectorAll('[data-bind="season"]').forEach((el) => (el.textContent = C.season));
  document.title = `Sponsor ${C.athlete.name}`;

  $("#race-select").innerHTML = C.races
    .map((r, i) => `<option value="${i}">${esc(r.name)}, ${esc(r.date)}</option>`)
    .join("");
  $("#bio").innerHTML = C.athlete.bio.map((p) => `<p>${esc(p)}</p>`).join("");
  $("#facts").innerHTML = C.athlete.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
  $("#portrait").innerHTML = C.athlete.photo
    ? `<img src="${esc(C.athlete.photo)}" alt="${esc(C.athlete.name)}">`
    : `<div class="portrait-empty"><span>Add your photo in config.js</span></div>`;
  const mail = $("#email-link");
  mail.href = `mailto:${C.email}`;
  mail.textContent = C.email;
  $("#socials").innerHTML = C.socials
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`)
    .join("");
}

// ── Rendering ────────────────────────────────────────────────
function renderTabs() {
  $("#tabs").innerHTML = K.tabs
    .map((t) => {
      const open = spotsFor(t.id).filter((s) => !takenBy(s.id)).length;
      const sel = t.id === state.tab;
      return `<button type="button" role="tab" aria-selected="${sel}" data-tab="${t.id}" tabindex="${sel ? 0 : -1}">
        ${esc(t.name)}<span class="tab-count" aria-label="${open} open">${open}</span></button>`;
    })
    .join("");
  const all = spotsFor(state.tab);
  $("#hud-title").textContent = tabOf(state.tab).name;
  $("#hud-open").textContent = all.filter((s) => !takenBy(s.id)).length;
  $("#hud-total").textContent = all.length;
}

function renderList() {
  $("#spots").innerHTML = spotsFor(state.tab)
    .map((s) => {
      const taken = takenBy(s.id);
      const picked = inCart(s.id);
      const action = taken
        ? `<span class="taken">Taken by ${esc(taken.sponsor)}</span>`
        : `<button type="button" class="add${picked ? " added" : ""}" data-add="${s.id}" aria-pressed="${!!picked}">
            ${picked ? "Remove" : "Add"}<span class="sr-only"> ${esc(s.name)}</span></button>`;
      return `<li class="spot${taken ? " is-sold" : picked ? " is-picked" : ""}${state.hover === s.id ? " is-hover" : ""}" data-id="${s.id}">
        <button type="button" class="spot-main" data-select="${s.id}" title="Show on the 3D kit">
          <span class="tag">${code(s)}</span>
          <span class="spot-name">${esc(s.name)}<small>${where(s)}, ${sizeText(s)}${s.note ? `. ${esc(s.note)}` : ""}</small></span>
        </button>
        ${taken ? "" : `<span class="spot-price">${money(price(s.id, state.term))}</span>`}
        ${action}
      </li>`;
    })
    .join("");
}

const itemPrice = (item) => price(item.id, item.term);
const cartTotal = () => state.cart.reduce((sum, i) => sum + itemPrice(i), 0);

function raceOptions(item) {
  const opts = [`<option value="season"${item.term === "season" ? " selected" : ""}>${esc(C.season)} season</option>`];
  C.races.forEach((r, i) =>
    opts.push(`<option value="race:${i}"${item.term === "race" && item.race === i ? " selected" : ""}>${esc(r.name)}, ${esc(r.date)}</option>`)
  );
  return opts.join("");
}

function renderCart() {
  $("#cart-count").textContent = state.cart.length;
  const body = $("#cart-body");
  if (!state.cart.length) {
    body.innerHTML = `<div class="empty"><p>Your cart is empty. Pick a glowing spot on the kit to get started.</p>
      <button type="button" class="secondary" data-close>Browse spots</button></div>`;
    return;
  }
  body.innerHTML = `<ul class="cart-items">${state.cart
    .map((item) => {
      const s = spot(item.id);
      return `<li>
        <div class="ci-main"><b>${esc(s.name)}</b><span>${esc(tabOf(s.tab).name)}, ${sizeText(s)}</span>
          <label><span class="sr-only">Duration for ${esc(s.name)}</span>
          <select data-term="${item.id}">${raceOptions(item)}</select></label></div>
        <div class="ci-side"><span class="ci-price">${money(itemPrice(item))}</span>
          <button type="button" class="linkish" data-remove="${item.id}">Remove</button></div>
      </li>`;
    })
    .join("")}</ul>
    <div class="cart-total"><span>Total</span><b>${money(cartTotal())}</b></div>
    <button type="button" class="primary" id="to-checkout">Check out</button>`;
}

function renderWall() {
  const entries = K.spots.map((s) => ({ s, t: takenBy(s.id) })).filter((e) => e.t);
  const wall = $("#sponsor-wall");
  if (!entries.length) {
    wall.innerHTML = `<li class="wall-empty">No sponsors yet. <a href="#top">Claim the first spot.</a></li>`;
    return;
  }
  wall.innerHTML = entries
    .map(({ s, t }) => {
      const mark = t.logo ? `<img src="${esc(t.logo)}" alt="${esc(t.sponsor)}">` : `<span class="wordmark">${esc(t.sponsor)}</span>`;
      const inner = `${mark}<span class="wall-spot">${esc(tabOf(s.tab).name)}, ${esc(s.name.toLowerCase())}${t.demo ? " (demo)" : ""}</span>`;
      return `<li>${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${inner}</a>` : `<div>${inner}</div>`}</li>`;
    })
    .join("");
}

function renderUI() {
  renderTabs();
  renderList();
  renderCart();
  renderWall();
}

function setHover(id) {
  if (state.hover === id) return;
  const prev = state.hover;
  state.hover = id;
  document.querySelectorAll(".spot").forEach((el) => el.classList.toggle("is-hover", el.dataset.id === id));
  if (stage) {
    if (prev) stage.refresh(prev);
    if (id) stage.refresh(id);
  }
}

function toggleCart(id) {
  if (takenBy(id)) return;
  if (inCart(id)) state.cart = state.cart.filter((i) => i.id !== id);
  else state.cart.push({ id, term: state.term, race: state.race });
  save();
  renderUI();
  if (stage) stage.refresh(id);
  const btn = $("#open-cart");
  btn.classList.remove("bump");
  void btn.offsetWidth;
  btn.classList.add("bump");
}

function showTab(id, opts) {
  state.tab = id;
  state.hover = null;
  renderUI();
  if (stage) stage.setTab(tabOf(id), spotsFor(id), opts);
}

// ── Events ───────────────────────────────────────────────────
$("#tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (!b || b.dataset.tab === state.tab) return;
  showTab(b.dataset.tab);
  $(`[data-tab="${state.tab}"]`).focus();
});
$("#tabs").addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const ids = K.tabs.map((t) => t.id);
  const i = ids.indexOf(state.tab) + (e.key === "ArrowRight" ? 1 : -1);
  $(`[data-tab="${ids[(i + ids.length) % ids.length]}"]`).click();
});

document.querySelectorAll("[data-view]").forEach((b) =>
  b.addEventListener("click", () => stage && stage.setView(b.dataset.view))
);

const list = $("#spots");
list.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) {
    const id = add.dataset.add;
    toggleCart(id);
    const again = list.querySelector(`[data-add="${id}"]`);
    if (again) again.focus();
    return;
  }
  const sel = e.target.closest("[data-select]");
  if (sel && stage) {
    stage.focusSpot(sel.dataset.select);
    setHover(sel.dataset.select);
  }
});
list.addEventListener("mouseover", (e) => {
  const li = e.target.closest(".spot");
  if (li) setHover(li.dataset.id);
});
list.addEventListener("mouseleave", () => setHover(null));

document.querySelectorAll('input[name="term"]').forEach((r) =>
  r.addEventListener("change", () => {
    state.term = r.value;
    $("#race-pick").hidden = state.term !== "race";
    renderList();
  })
);
$("#race-select").addEventListener("change", (e) => (state.race = Number(e.target.value)));

// Scrolling gives the turntable a spin.
let lastY = window.scrollY;
window.addEventListener("scroll", () => {
  const dy = window.scrollY - lastY;
  lastY = window.scrollY;
  if (stage && !reduceMotion) stage.nudge(dy * 0.0035);
}, { passive: true });

// Sections wipe in as they arrive. (Checked by position: a fully clipped element
// never reports as intersecting, so IntersectionObserver can't be used here.)
const pending = [...document.querySelectorAll(".reveal")];
function revealCheck() {
  for (let i = pending.length - 1; i >= 0; i--) {
    if (pending[i].getBoundingClientRect().top < window.innerHeight * 0.88) {
      pending[i].classList.add("in");
      pending.splice(i, 1);
    }
  }
}
window.addEventListener("scroll", revealCheck, { passive: true });
window.addEventListener("resize", revealCheck);
revealCheck();

// Dialogs
const cartDlg = $("#cart");
const checkoutDlg = $("#checkout");
$("#open-cart").addEventListener("click", () => cartDlg.showModal());
[cartDlg, checkoutDlg].forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d || e.target.closest("[data-close]")) d.close();
  })
);

cartDlg.addEventListener("change", (e) => {
  const s = e.target.closest("[data-term]");
  if (!s) return;
  const item = inCart(s.dataset.term);
  if (s.value === "season") item.term = "season";
  else {
    item.term = "race";
    item.race = Number(s.value.split(":")[1]);
  }
  save();
  renderCart();
});
cartDlg.addEventListener("click", (e) => {
  const rm = e.target.closest("[data-remove]");
  if (rm) {
    const id = rm.dataset.remove;
    state.cart = state.cart.filter((i) => i.id !== id);
    save();
    renderUI();
    if (stage) stage.refresh(id);
    return;
  }
  if (e.target.closest("#to-checkout")) {
    cartDlg.close();
    openCheckout();
  }
});

// Checkout
let logoData = "";
let lastBought = null;
const LOGO_HINT = "Upload a PNG, JPG or SVG. Transparent backgrounds look best.";

function openCheckout() {
  $("#checkout-form").hidden = false;
  $("#confirm").hidden = true;
  $("#form-error").textContent = "";
  $("#checkout-summary").innerHTML =
    `<ul>${state.cart
      .map((i) => `<li><span>${esc(spot(i.id).name)}, ${esc(termLabel(i))}</span><span>${money(itemPrice(i))}</span></li>`)
      .join("")}</ul><div class="cart-total"><span>Total</span><b>${money(cartTotal())}</b></div>`;
  checkoutDlg.showModal();
}

// Shrink logos so they fit in browser storage.
function readLogo(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      if (file.type === "image/svg+xml") return resolve(fr.result);
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(1, 360 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/png"));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

$("#logo-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const prev = $("#logo-preview");
  if (!file) return;
  try {
    logoData = await readLogo(file);
    prev.src = logoData;
    prev.hidden = false;
    $("#logo-text").textContent = file.name;
  } catch (err) {
    logoData = "";
    prev.hidden = true;
    $("#logo-text").textContent = "That file couldn't be read as an image. Try a PNG or JPG.";
  }
});

$("#checkout-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const missing = ["name", "company", "email"].filter((n) => !f[n].value.trim());
  if (missing.length) {
    $("#form-error").textContent = `Fill in your ${missing.join(", ")} to place the order.`;
    f[missing[0]].focus();
    return;
  }
  if (!f.email.checkValidity()) {
    $("#form-error").textContent = "Enter an email address like name@company.com.";
    f.email.focus();
    return;
  }
  const company = f.company.value.trim();
  const bought = state.cart.slice();
  bought.forEach((i) => {
    state.claims[i.id] = { company, url: f.url.value.trim(), logo: logoData, term: i.term, race: i.race };
  });
  state.cart = [];
  save();
  renderUI();
  if (stage) stage.refresh();

  $("#confirm-text").textContent = `Thanks, ${f.name.value.trim()}. ${company} is now on ${bought.length} ${
    bought.length === 1 ? "spot" : "spots"
  }. In a real store you'd get a receipt by email.`;
  $("#confirm-list").innerHTML = bought
    .map((i) => `<li>${esc(tabOf(spot(i.id).tab).name)}, ${esc(spot(i.id).name)}: ${esc(termLabel(i))}</li>`)
    .join("");
  f.hidden = true;
  $("#confirm").hidden = false;
  f.reset();
  logoData = "";
  $("#logo-preview").hidden = true;
  $("#logo-text").textContent = LOGO_HINT;
  lastBought = bought[0].id;
});

$("#see-kit").addEventListener("click", () => {
  checkoutDlg.close();
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  if (!lastBought) return;
  const s = spot(lastBought);
  if (s.tab !== state.tab) showTab(s.tab);
  if (stage) setTimeout(() => stage.focusSpot(s.id), 750);
});

$("#reset-demo").addEventListener("click", () => {
  state.claims = {};
  state.cart = [];
  save();
  renderUI();
  if (stage) stage.refresh();
});

fillStatic();
showTab(state.tab, { intro: true });
// Canvas text uses the web fonts once they've arrived.
if (document.fonts) document.fonts.ready.then(() => stage && stage.refresh());
