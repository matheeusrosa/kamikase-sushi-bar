/* ==========================================================================
   KAMIKASE SUSHI BAR — interactions
   ========================================================================== */

const CONFIG = {
  whatsapp: "5593992096142",
  timeZone: "America/Belem",
  // 0 = Sunday … 6 = Saturday · [open, close] in decimal hours
  hours: {
    0: [[11.5, 14], [18.75, 22.75]],
    1: [[11.5, 14], [19, 22.75]],
    2: [[11, 14], [19, 22.75]],
    3: [[11.5, 14], [19, 22.75]],
    4: [[11.5, 14], [19, 22.75]],
    5: [[11.5, 14], [19, 22.75]],
    6: [[11.5, 14], [19, 22.75]]
  }
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const waLink = (t) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ───────── Menu (demo items — the house fills in the real menu) ───────── */
const MENU = [
  {
    id: "combinados", label: "Combinados", items: [
      { n: "Combinado da casa", d: "Seleção de nigiris, uramakis, hossomakis e sashimis.", t: "Mais pedido" },
      { n: "Barca Kamikase", d: "Barca para dividir com o melhor de cada seção.", t: "Para 2 ou mais" },
      { n: "Combo hot", d: "Hot roll, hot filadélfia e harumaki crocantes.", t: "Crocante" },
      { n: "Combo salmão", d: "Tudo de salmão: sashimi, nigiri, uramaki e joe.", t: "100% salmão" }
    ]
  },
  {
    id: "sushi", label: "Sushi & Sashimi", items: [
      { n: "Sashimi de salmão", d: "Fatias generosas, cortadas na hora.", t: "Fresco" },
      { n: "Nigiri maçaricado", d: "Salmão flambado no maçarico com teriyaki.", t: "Na brasa" },
      { n: "Uramaki filadélfia", d: "Salmão, cream cheese e gergelim.", t: "Clássico" },
      { n: "Joe de salmão", d: "Bolinho de arroz envolto em salmão com cobertura.", t: "Favorito" },
      { n: "Hossomaki de pepino", d: "Leve e refrescante.", t: "Vegetariano" },
      { n: "Uramaki skin", d: "Pele de salmão crocante com cebolinha.", t: "Crocante" }
    ]
  },
  {
    id: "hot", label: "Hot & Temaki", items: [
      { n: "Hot roll", d: "Empanado e frito, com cream cheese e teriyaki.", t: "Mais pedido" },
      { n: "Temaki de salmão", d: "Cone de alga com salmão, arroz e cebolinha.", t: "Clássico" },
      { n: "Temaki hot", d: "Temaki empanado e crocante por fora.", t: "Crocante" },
      { n: "Harumaki", d: "Rolinho primavera crocante.", t: "Entrada" }
    ]
  },
  {
    id: "quentes", label: "Pratos quentes", items: [
      { n: "Yakisoba tradicional", d: "Macarrão, carne, frango e legumes no molho da casa.", t: "Quentinho" },
      { n: "Yakisoba de frutos do mar", d: "Com camarão e legumes salteados.", t: "Especial" },
      { n: "Guioza", d: "Pastel japonês grelhado com molho.", t: "Entrada" },
      { n: "Teppan de salmão", d: "Salmão grelhado com legumes na chapa.", t: "Grelhado" }
    ]
  },
  {
    id: "bar", label: "Bar", items: [
      { n: "Drink de lichia", d: "Refrescante, levemente doce.", t: "Drink" },
      { n: "Caipirinha de maracujá", d: "Com fruta fresca.", t: "Drink" },
      { n: "Saquê", d: "Para brindar à moda japonesa.", t: "Saquê" },
      { n: "Cerveja gelada", d: "Long neck e garrafa.", t: "Cerveja" },
      { n: "Refrigerante e suco", d: "Para acompanhar o pedido.", t: "Sem álcool" }
    ]
  }
];

/* ───────── Cart (kept on this device only) ───────── */
let cart = {};
try { cart = JSON.parse(localStorage.getItem("kamikase-cart") || "{}") || {}; } catch (e) { cart = {}; }
const saveCart = () => { try { localStorage.setItem("kamikase-cart", JSON.stringify(cart)); } catch (e) { /* private mode */ } };
const cartTotal = () => Object.values(cart).reduce((a, b) => a + b, 0);

function updateCartBadges() {
  const n = cartTotal();
  const c = $("#cartCount");
  c.textContent = n;
  c.dataset.zero = String(n === 0);
  $("#mbCount").textContent = n;
  $("#cartBtn").setAttribute("aria-label", `Abrir pedido (${n} ${n === 1 ? "item" : "itens"})`);
}

function addItem(name) {
  cart[name] = (cart[name] || 0) + 1;
  saveCart(); updateCartBadges(); renderCartItems(); syncDishQty();
  const btn = $("#cartBtn");
  btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
  toast(`${name} adicionado ao pedido`);
}

function changeQty(name, delta) {
  cart[name] = (cart[name] || 0) + delta;
  if (cart[name] <= 0) delete cart[name];
  saveCart(); updateCartBadges(); renderCartItems(); syncDishQty();
}

function renderCartItems() {
  const box = $("#cartItems");
  const names = Object.keys(cart);
  if (!names.length) {
    box.innerHTML = `<div class="cart-empty"><b>Seu pedido está vazio</b>Toque em + nos itens do cardápio para adicionar.</div>`;
    return;
  }
  box.innerHTML = names.map(n => `
    <div class="cart-row">
      <span>${n}</span>
      <div class="stepper">
        <button type="button" data-dec="${n}" aria-label="Remover um ${n}">−</button>
        <b>${cart[n]}</b>
        <button type="button" data-inc="${n}" aria-label="Adicionar um ${n}">+</button>
      </div>
    </div>`).join("");
}

function syncDishQty() {
  $$(".dish").forEach(card => {
    const n = card.dataset.name;
    const chip = card.querySelector(".qty-chip");
    const q = cart[n] || 0;
    card.querySelector(".add-btn").classList.toggle("added", q > 0);
    if (q > 0) {
      if (chip) chip.textContent = `${q} no pedido`;
      else card.insertAdjacentHTML("beforeend", `<span class="qty-chip">${q} no pedido</span>`);
    } else if (chip) chip.remove();
  });
}

let lastFocus = null;
function openCart() {
  lastFocus = document.activeElement;
  renderCartItems();
  $("#cart").hidden = false;
  document.body.style.overflow = "hidden";
  $(".cart-close").focus();
}
function closeCart() {
  if ($("#cart").hidden) return;
  $("#cart").hidden = true;
  document.body.style.overflow = "";
  lastFocus?.focus();
}

function initCart() {
  $("#cartBtn").addEventListener("click", openCart);
  $$("[data-open-cart]").forEach(b => b.addEventListener("click", openCart));
  $$("[data-close-cart]").forEach(b => b.addEventListener("click", closeCart));
  $("#cartItems").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]"); const dec = e.target.closest("[data-dec]");
    if (inc) changeQty(inc.dataset.inc, 1);
    if (dec) changeQty(dec.dataset.dec, -1);
  });

  let mode = "Entrega", pay = "Pix";
  const addrField = $("#addrField");
  $$(".seg").forEach(seg => seg.addEventListener("click", (e) => {
    const b = e.target.closest(".seg-btn"); if (!b) return;
    $$(".seg-btn", seg).forEach(x => { x.classList.toggle("active", x === b); x.setAttribute("aria-checked", String(x === b)); });
    if (b.dataset.mode) { mode = b.dataset.mode; addrField.hidden = mode !== "Entrega"; }
    if (b.dataset.pay) pay = b.dataset.pay;
  }));

  $("#cartForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const hint = $("#cartHint");
    const name = $("#cName"), addr = $("#cAddr");
    [name, addr].forEach(i => i.classList.remove("invalid"));
    if (!cartTotal()) { hint.textContent = "Adicione pelo menos um item do cardápio."; return; }
    if (name.value.trim().length < 2) { name.classList.add("invalid"); hint.textContent = "Informe seu nome."; name.focus(); return; }
    if (mode === "Entrega" && addr.value.trim().length < 5) { addr.classList.add("invalid"); hint.textContent = "Informe o endereço de entrega."; addr.focus(); return; }
    hint.textContent = "";
    const lines = Object.entries(cart).map(([n, q]) => `• ${q}x ${n}`).join("\n");
    const note = $("#cNote").value.trim();
    const msg = `Olá, Kamikase! 🍣 Quero fazer um pedido pelo site:\n\n${lines}\n\n` +
      `*Nome:* ${name.value.trim()}\n*Recebimento:* ${mode}\n` +
      (mode === "Entrega" ? `*Endereço:* ${addr.value.trim()}\n` : "") +
      `*Pagamento:* ${pay}\n` + (note ? `*Obs.:* ${note}\n` : "") +
      `\nPode me confirmar o valor e o tempo de ${mode === "Entrega" ? "entrega" : "preparo"}? Obrigado!`;
    window.open(waLink(msg), "_blank", "noopener");
  });

  updateCartBadges();
}

/* ───────── Menu tabs with sliding pill ───────── */
function renderMenu(id) {
  const cat = MENU.find(c => c.id === id);
  const grid = $("#menuGrid");
  grid.setAttribute("aria-labelledby", `tab-${id}`);
  grid.innerHTML = cat.items.map((it, i) => `
    <article class="dish" data-name="${it.n}" style="animation-delay:${i * 50}ms">
      <div class="dish-top">
        <span class="dish-tag">${it.t}</span>
        <button type="button" class="add-btn" aria-label="Adicionar ${it.n} ao pedido">+</button>
      </div>
      <h3>${it.n}</h3>
      <p>${it.d}</p>
    </article>`).join("");
  $$(".dish", grid).forEach(card => {
    card.querySelector(".add-btn").addEventListener("click", () => addItem(card.dataset.name));
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
  syncDishQty();
}

function movePill(pill, el, container) {
  if (!pill || !el) return;
  const c = container.getBoundingClientRect(), r = el.getBoundingClientRect();
  pill.style.width = `${r.width}px`;
  pill.style.transform = `translateX(${r.left - c.left + container.scrollLeft}px)`;
  pill.style.opacity = "1";
}

function initTabs() {
  const tabs = $(".tabs");
  const pill = $("#tabPill");
  tabs.insertAdjacentHTML("beforeend", MENU.map((c, i) =>
    `<button type="button" role="tab" class="tab" id="tab-${c.id}" data-id="${c.id}" aria-selected="${i === 0}" aria-controls="menuGrid" tabindex="${i === 0 ? 0 : -1}">${c.label}</button>`).join(""));
  const btns = $$(".tab", tabs);
  const select = (b, focus) => {
    btns.forEach(x => { const on = x === b; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; });
    movePill(pill, b, tabs);
    renderMenu(b.dataset.id);
    if (focus) b.focus();
    b.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  };
  btns.forEach((b, i) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); select(btns[(i + 1) % btns.length], true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); select(btns[(i - 1 + btns.length) % btns.length], true); }
    });
  });
  renderMenu(MENU[0].id);
  const place = () => movePill(pill, btns.find(b => b.getAttribute("aria-selected") === "true"), tabs);
  place();
  window.addEventListener("resize", place);
  document.fonts?.ready.then(place);
  tabs.addEventListener("scroll", place, { passive: true });
}

/* ───────── Opening status & hours table ───────── */
function localNow() {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(new Date()).reduce((a, x) => (a[x.type] = x.value, a), {});
  return { day: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday], hour: (+p.hour % 24) + (+p.minute) / 60 };
}
const fmt = (h) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return `${String(hh).padStart(2, "0")}h${mm ? String(mm).padStart(2, "0") : ""}`; };

function status() {
  const { day, hour } = localNow();
  const today = CONFIG.hours[day];
  const cur = today.find(([a, b]) => hour >= a && hour < b);
  if (cur) return { open: true, text: `Aberto agora · até ${fmt(cur[1])}` };
  const next = today.find(([a]) => hour < a);
  if (next) return { open: false, text: `Fechado agora · abre às ${fmt(next[0])}${next[0] >= 18 ? " para o jantar" : ""}` };
  return { open: false, text: `Fechado agora · abre amanhã às ${fmt(CONFIG.hours[(day + 1) % 7][0][0])}` };
}

function renderStatus() {
  const s = status();
  $("#statusDot").classList.toggle("open", s.open);
  $("#statusText").textContent = s.text;
  const inl = $("#statusInline"); inl.textContent = s.text; inl.classList.toggle("open", s.open);
}

function renderHours() {
  const names = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const { day } = localNow();
  const order = [1, 2, 3, 4, 5, 6, 0];
  $("#hoursBody").innerHTML = order.map(d => `
    <tr class="${d === day ? "today" : ""}">
      <td>${names[d]}${d === day ? " (hoje)" : ""}</td>
      <td>${CONFIG.hours[d].map(([a, b]) => `${fmt(a)}–${fmt(b)}`).join(" · ")}</td>
    </tr>`).join("");
}

/* ───────── Scroll effects ───────── */
function initScrollFx() {
  const header = $("#siteHeader");
  const frame = $("#expandFrame");
  const expand = $(".expand");
  const expandText = $(".expand-text");
  const giant = $(".footer-giant");
  let lastY = window.scrollY, ticking = false;

  const update = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 30);
    header.classList.toggle("hide", y > lastY && y > 600 && !$("#navLinks").classList.contains("open"));
    lastY = y;

    if (frame && expand) {
      const r = expand.getBoundingClientRect();
      const total = expand.offsetHeight - window.innerHeight;
      const p = reduceMotion ? 0.35 : Math.min(1, Math.max(0, -r.top / (total * 0.8)));
      frame.style.setProperty("--p", p.toFixed(3));
      if (!reduceMotion) expandText.style.opacity = String(1 - Math.min(1, p * 1.8));
    }
    if (giant) {
      const r = giant.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight * 0.7)));
      giant.style.setProperty("--fill", `${Math.round(p * 100)}%`);
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  window.addEventListener("resize", update);
  update();
}

function initNav() {
  const btn = $("#menuBtn"), nav = $("#navLinks"), pill = $("#navPill");
  const set = (o) => { nav.classList.toggle("open", o); btn.setAttribute("aria-expanded", String(o)); btn.setAttribute("aria-label", o ? "Fechar menu" : "Abrir menu"); };
  btn.addEventListener("click", (e) => { e.stopPropagation(); set(!nav.classList.contains("open")); });
  $$("a", nav).forEach(a => a.addEventListener("click", () => set(false)));
  document.addEventListener("click", (e) => { if (nav.classList.contains("open") && !nav.contains(e.target)) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { set(false); closeCart(); } });

  // Sliding pill follows the section in view
  const links = $$(".nav-link");
  let active = null;
  const place = () => {
    if (active && getComputedStyle(pill).display !== "none") movePill(pill, active, nav);
    else pill.style.opacity = "0";
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach(en => {
      if (!en.isIntersecting) return;
      active = links.find(l => l.getAttribute("href") === "#" + en.target.id) || null;
      links.forEach(l => l.classList.toggle("active", l === active));
      place();
    }), { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(l => { const s = $(l.getAttribute("href")); if (s) io.observe(s); });
    const hero = $("#inicio");
    new IntersectionObserver(([en]) => { if (en.isIntersecting) { active = null; links.forEach(l => l.classList.remove("active")); place(); } }, { rootMargin: "-45% 0px -50% 0px" }).observe(hero);
  }
  window.addEventListener("resize", place);
}

function initReveal() {
  const els = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -10% 0px" });
  els.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });
}

function initCounter() {
  const el = $("[data-count]");
  if (!el) return;
  const target = +el.dataset.count;
  const run = () => {
    if (reduceMotion) { el.textContent = target; return; }
    const t0 = performance.now(), dur = 1600;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!("IntersectionObserver" in window)) return run();
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.5 });
  io.observe(el);
}

let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

document.addEventListener("DOMContentLoaded", () => {
  $$("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });
  renderStatus(); renderHours();
  setInterval(renderStatus, 60000);
  initTabs();
  initCart();
  initNav();
  initScrollFx();
  initReveal();
  initCounter();
  $("#year").textContent = new Date().getFullYear();
});
