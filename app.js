(function () {
  const C = window.SPONSOR_CONFIG;
  const K = window.KIT;
  const STORE = "sponsorme.v1";
  const $ = (s, el = document) => el.querySelector(s);
  const money = new Intl.NumberFormat(undefined, { style: "currency", currency: C.currency, maximumFractionDigits: 0 });
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    garment: K.garments[0].id,
    view: K.garments[0].views[0],
    term: "season",
    race: 0,
    hover: null,
    cart: [],   // { id, term, race }
    claims: {}, // demo purchases: { [spotId]: { company, url, logo, term, race } }
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved) {
      state.cart = saved.cart || [];
      state.claims = saved.claims || {};
    }
  } catch (e) {}

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ cart: state.cart, claims: state.claims }));
    } catch (e) {}
  }

  // ── Lookups ────────────────────────────────────────────────
  const zone = (id) => K.zones.find((z) => z.id === id);
  const garmentOf = (id) => K.garments.find((g) => g.id === id);
  const zonesFor = (g) => K.zones.filter((z) => z.garment === g);
  const code = (z) => String.fromCharCode(65 + zonesFor(z.garment).indexOf(z));
  const info = (id) => C.spots[id] || {};
  const price = (id, term) => info(id)[term] ?? 0;
  const inCart = (id) => state.cart.find((i) => i.id === id);

  function takenBy(id) {
    const claim = state.claims[id];
    if (claim) return { sponsor: claim.company, url: claim.url, logo: claim.logo, demo: true };
    return info(id).sold || null;
  }

  const termLabel = (item) =>
    item.term === "season" ? `${C.season} season` : `${C.races[item.race].name}, ${C.races[item.race].date}`;

  // ── Static content ─────────────────────────────────────────
  function fillStatic() {
    document.querySelectorAll('[data-bind="name"]').forEach((el) => (el.textContent = C.athlete.name));
    document.querySelectorAll('[data-bind="intro"]').forEach((el) => (el.textContent = C.athlete.intro));
    document.querySelectorAll('[data-bind="season"]').forEach((el) => (el.textContent = C.season));
    document.title = `Sponsor ${C.athlete.name}`;

    $("#race-select").innerHTML = C.races
      .map((r, i) => `<option value="${i}">${esc(r.name)}, ${esc(r.date)}</option>`)
      .join("");

    $("#bio").innerHTML = C.athlete.bio.map((p) => `<p>${esc(p)}</p>`).join("");
    $("#facts").innerHTML = C.athlete.facts
      .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join("");
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

  // ── Tabs and view toggle ──────────────────────────────────
  function renderTabs() {
    $("#garment-tabs").innerHTML = K.garments
      .map((g) => {
        const open = zonesFor(g.id).filter((z) => !takenBy(z.id)).length;
        const sel = g.id === state.garment;
        return `<button type="button" role="tab" aria-selected="${sel}" data-garment="${g.id}" tabindex="${sel ? 0 : -1}">
          ${esc(g.name)}<span class="tab-count">${open} open</span></button>`;
      })
      .join("");

    const g = garmentOf(state.garment);
    $("#view-toggle").innerHTML =
      g.views.length > 1
        ? g.views
            .map(
              (v) =>
                `<button type="button" data-view="${v}" aria-pressed="${v === state.view}">${v === "front" ? "Front" : "Back"}</button>`
            )
            .join("")
        : "";
  }

  // ── Drawing ───────────────────────────────────────────────
  function rotatePoint(x, y, cx, cy, deg) {
    const a = (deg * Math.PI) / 180;
    const dx = x - cx, dy = y - cy;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
  }

  function zoneMarkup(z) {
    const [x, y, w, h] = z.r;
    const cx = x + w / 2, cy = y + h / 2, rot = z.rot || 0;
    const taken = takenBy(z.id);
    const picked = inCart(z.id);
    const status = taken ? "is-sold" : picked ? "is-picked" : "is-open";
    const hover = state.hover === z.id ? " is-hover" : "";

    let inner = "";
    if (taken) {
      if (taken.logo) {
        inner = `<image href="${esc(taken.logo)}" x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" preserveAspectRatio="xMidYMid meet"/>`;
      } else {
        const fs = Math.max(6, Math.min(h * 0.38, (w - 8) / (taken.sponsor.length * 0.8)));
        inner = `<text class="zone-name" x="${cx}" y="${cy}" font-size="${fs.toFixed(1)}">${esc(taken.sponsor)}</text>`;
      }
    }

    const [tx, ty] = rotatePoint(x, y, cx, cy, rot);
    const label = taken
      ? `${z.name}, taken by ${taken.sponsor}`
      : `${z.name}, ${money.format(price(z.id, state.term))}${picked ? ", in cart" : ""}`;

    return `<g class="zone ${status}${hover}" data-id="${z.id}" ${taken ? 'aria-disabled="true"' : 'tabindex="0" role="button"'} aria-pressed="${!!picked}" aria-label="${esc(label)}">
      <g transform="rotate(${rot} ${cx} ${cy})">
        <rect class="zone-area" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>${inner}
      </g>
      <g class="zone-tag"><circle cx="${tx}" cy="${ty}" r="9"/><text x="${tx}" y="${ty}">${code(z)}</text></g>
    </g>`;
  }

  function renderKit(animate) {
    const g = garmentOf(state.garment);
    const key = `${g.id}-${state.view}`;
    const svg = $("#kit-svg");
    svg.innerHTML =
      `<g class="garment${animate && !reduceMotion ? " draw-in" : ""}">${K.drawings[key]}</g>` +
      zonesFor(g.id).filter((z) => z.view === state.view).map(zoneMarkup).join("");
    if (animate && !reduceMotion) {
      svg.querySelectorAll(".draw-in .g-body, .draw-in .g-frame, .draw-in .g-wheel").forEach((p) => {
        const len = p.getTotalLength ? p.getTotalLength() : 1200;
        p.style.setProperty("--len", Math.ceil(len));
      });
    }
  }

  // ── Spot list ─────────────────────────────────────────────
  function renderList() {
    const g = garmentOf(state.garment);
    $("#spot-list").innerHTML = zonesFor(g.id)
      .map((z) => {
        const taken = takenBy(z.id);
        const picked = inCart(z.id);
        const where = g.views.length > 1 ? `${z.view === "front" ? "Front" : "Back"}, ` : "";
        let action;
        if (taken) {
          action = `<span class="taken">Taken by ${esc(taken.sponsor)}</span>`;
        } else {
          action = `<button type="button" class="add${picked ? " added" : ""}" data-add="${z.id}" aria-pressed="${!!picked}">
            ${picked ? "Remove" : "Add"}<span class="sr-only"> ${esc(z.name)}</span></button>`;
        }
        return `<li class="spot${taken ? " is-sold" : picked ? " is-picked" : ""}${state.hover === z.id ? " is-hover" : ""}" data-id="${z.id}">
          <button type="button" class="spot-main" data-select="${z.id}">
            <span class="tag">${code(z)}</span>
            <span class="spot-name">${esc(z.name)}<small>${where}${esc(z.size)}${z.note ? `. ${esc(z.note)}` : ""}</small></span>
          </button>
          ${taken ? "" : `<span class="spot-price">${money.format(price(z.id, state.term))}</span>`}
          ${action}
        </li>`;
      })
      .join("");
  }

  // ── Cart ──────────────────────────────────────────────────
  const itemPrice = (item) => price(item.id, item.term);
  const cartTotal = () => state.cart.reduce((s, i) => s + itemPrice(i), 0);

  function raceOptions(item) {
    const opts = [`<option value="season"${item.term === "season" ? " selected" : ""}>${esc(C.season)} season</option>`];
    C.races.forEach((r, i) =>
      opts.push(
        `<option value="race:${i}"${item.term === "race" && item.race === i ? " selected" : ""}>${esc(r.name)}, ${esc(r.date)}</option>`
      )
    );
    return opts.join("");
  }

  function renderCart() {
    $("#cart-count").textContent = state.cart.length;
    const body = $("#cart-body");
    if (!state.cart.length) {
      body.innerHTML = `<div class="empty">
        <p>Your cart is empty. Pick a spot on the kit to get started.</p>
        <button type="button" class="secondary" data-close>Browse spots</button></div>`;
      return;
    }
    body.innerHTML = `<ul class="cart-items">${state.cart
      .map((item) => {
        const z = zone(item.id);
        return `<li>
          <div class="ci-main"><b>${esc(z.name)}</b><span>${esc(garmentOf(z.garment).name)}, ${esc(z.size)}</span>
            <label><span class="sr-only">Duration for ${esc(z.name)}</span>
            <select data-term="${item.id}">${raceOptions(item)}</select></label></div>
          <div class="ci-side"><span class="ci-price">${money.format(itemPrice(item))}</span>
            <button type="button" class="linkish" data-remove="${item.id}">Remove</button></div>
        </li>`;
      })
      .join("")}</ul>
      <div class="cart-total"><span>Total</span><b>${money.format(cartTotal())}</b></div>
      <button type="button" class="primary" id="to-checkout">Check out</button>`;
  }

  function toggleCart(id) {
    if (takenBy(id)) return;
    if (inCart(id)) state.cart = state.cart.filter((i) => i.id !== id);
    else state.cart.push({ id, term: state.term, race: state.race });
    save();
    renderAll();
    const btn = $("#open-cart");
    btn.classList.remove("bump");
    void btn.offsetWidth;
    btn.classList.add("bump");
  }

  // ── Sponsors wall ─────────────────────────────────────────
  function renderWall() {
    const entries = K.zones
      .map((z) => ({ z, t: takenBy(z.id) }))
      .filter((e) => e.t);
    const wall = $("#sponsor-wall");
    if (!entries.length) {
      wall.innerHTML = `<li class="wall-empty">No sponsors yet. <a href="#kit">Claim the first spot.</a></li>`;
      return;
    }
    wall.innerHTML = entries
      .map(({ z, t }) => {
        const mark = t.logo
          ? `<img src="${esc(t.logo)}" alt="${esc(t.sponsor)}">`
          : `<span class="wordmark">${esc(t.sponsor)}</span>`;
        const inner = `${mark}<span class="wall-spot">${esc(garmentOf(z.garment).name)}, ${esc(z.name.toLowerCase())}${t.demo ? " (demo)" : ""}</span>`;
        return `<li>${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${inner}</a>` : `<div>${inner}</div>`}</li>`;
      })
      .join("");
  }

  function renderAll(animate) {
    renderTabs();
    renderKit(animate);
    renderList();
    renderCart();
    renderWall();
  }

  // ── Hover sync between drawing and list ───────────────────
  function setHover(id) {
    if (state.hover === id) return;
    state.hover = id;
    document.querySelectorAll(".zone, .spot").forEach((el) => el.classList.toggle("is-hover", el.dataset.id === id));
  }

  // ── Events ────────────────────────────────────────────────
  $("#garment-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-garment]");
    if (!b || b.dataset.garment === state.garment) return;
    state.garment = b.dataset.garment;
    state.view = garmentOf(state.garment).views[0];
    renderAll(true);
    $(`[data-garment="${state.garment}"]`).focus();
  });
  $("#garment-tabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const ids = K.garments.map((g) => g.id);
    const i = ids.indexOf(state.garment) + (e.key === "ArrowRight" ? 1 : -1);
    $(`[data-garment="${ids[(i + ids.length) % ids.length]}"]`).click();
  });

  $("#view-toggle").addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (!b || b.dataset.view === state.view) return;
    state.view = b.dataset.view;
    renderTabs();
    renderKit(true);
  });

  const svg = $("#kit-svg");
  svg.addEventListener("click", (e) => {
    const g = e.target.closest(".zone");
    if (g) toggleCart(g.dataset.id);
  });
  svg.addEventListener("keydown", (e) => {
    const g = e.target.closest(".zone");
    if (g && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      const id = g.dataset.id;
      toggleCart(id);
      const again = svg.querySelector(`[data-id="${id}"]`);
      if (again) again.focus();
    }
  });
  ["mouseover", "focusin"].forEach((t) =>
    svg.addEventListener(t, (e) => {
      const g = e.target.closest(".zone");
      setHover(g ? g.dataset.id : null);
    })
  );
  svg.addEventListener("mouseleave", () => setHover(null));

  const list = $("#spot-list");
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
    if (sel) {
      const z = zone(sel.dataset.select);
      if (z.view !== state.view) {
        state.view = z.view;
        renderTabs();
        renderKit(true);
      }
      state.hover = null;
      setHover(z.id);
    }
  });
  ["mouseover", "focusin"].forEach((t) =>
    list.addEventListener(t, (e) => {
      const li = e.target.closest(".spot");
      if (!li) return;
      const z = zone(li.dataset.id);
      if (z.view === state.view) setHover(z.id);
    })
  );
  list.addEventListener("mouseleave", () => setHover(null));

  document.querySelectorAll('input[name="term"]').forEach((r) =>
    r.addEventListener("change", () => {
      state.term = r.value;
      $("#race-pick").hidden = state.term !== "race";
      renderKit();
      renderList();
    })
  );
  $("#race-select").addEventListener("change", (e) => (state.race = Number(e.target.value)));

  // Dialogs
  const cartDlg = $("#cart");
  const checkoutDlg = $("#checkout");
  $("#open-cart").addEventListener("click", () => cartDlg.showModal());
  [cartDlg, checkoutDlg].forEach((d) => {
    d.addEventListener("click", (e) => {
      if (e.target === d || e.target.closest("[data-close]")) d.close();
    });
  });

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
      state.cart = state.cart.filter((i) => i.id !== rm.dataset.remove);
      save();
      renderAll();
      return;
    }
    if (e.target.closest("#to-checkout")) {
      cartDlg.close();
      openCheckout();
    }
  });

  // Checkout
  let logoData = "";
  function openCheckout() {
    $("#checkout-form").hidden = false;
    $("#confirm").hidden = true;
    $("#form-error").textContent = "";
    $("#checkout-summary").innerHTML =
      `<ul>${state.cart
        .map((i) => `<li><span>${esc(zone(i.id).name)}, ${esc(termLabel(i))}</span><span>${money.format(itemPrice(i))}</span></li>`)
        .join("")}</ul><div class="cart-total"><span>Total</span><b>${money.format(cartTotal())}</b></div>`;
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
          const max = 360;
          const s = Math.min(1, max / Math.max(img.width, img.height));
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
    renderAll();

    $("#confirm-text").textContent = `Thanks, ${f.name.value.trim()}. ${company} is now on ${bought.length} ${
      bought.length === 1 ? "spot" : "spots"
    }. In a real store you'd get a receipt by email.`;
    $("#confirm-list").innerHTML = bought
      .map((i) => `<li>${esc(garmentOf(zone(i.id).garment).name)}, ${esc(zone(i.id).name)}: ${esc(termLabel(i))}</li>`)
      .join("");
    f.hidden = true;
    $("#confirm").hidden = false;
    f.reset();
    logoData = "";
    $("#logo-preview").hidden = true;
    $("#logo-text").textContent = "Upload a PNG, JPG or SVG. Transparent backgrounds look best.";
    state.lastGarment = zone(bought[0].id);
  });

  $("#see-kit").addEventListener("click", () => {
    const z = state.lastGarment;
    checkoutDlg.close();
    if (z) {
      state.garment = z.garment;
      state.view = z.view;
      renderAll(true);
    }
    $("#kit").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  $("#reset-demo").addEventListener("click", () => {
    state.claims = {};
    state.cart = [];
    save();
    renderAll(true);
  });

  fillStatic();
  renderAll(true);
})();
