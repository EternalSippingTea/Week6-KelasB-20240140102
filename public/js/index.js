const API_URL = "https://dummyjson.com/products";
const STOK_MENIPIS = 10;

const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const gridEl = document.getElementById("productGrid");
const searchEl = document.getElementById("searchInput");
const categoryEl = document.getElementById("categorySelect");
const reloadBtn = document.getElementById("reloadBtn");

let products = [];

const formatUSD = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.className = isError ? "error" : "";
}

function makeStars(rating) {
  const full = Math.round(rating);
  const el = document.createElement("span");
  el.className = "stars";
  el.setAttribute("aria-hidden", "true");
  el.append("★".repeat(full));
  const off = document.createElement("span");
  off.className = "off";
  off.textContent = "★".repeat(5 - full);
  el.appendChild(off);
  return el;
}

function createCard(p) {
  const card = document.createElement("article");
  card.className = "card";

  if (p.discountPercentage > 0) {
    const disc = document.createElement("span");
    disc.className = "disc";
    disc.textContent = "-" + p.discountPercentage.toFixed(1) + "%";
    card.appendChild(disc);
  }

  const img = document.createElement("img");
  img.className = "thumb";
  img.src = p.thumbnail;
  img.alt = p.title;
  img.loading = "lazy";

  const body = document.createElement("div");
  body.className = "body";

  const cat = document.createElement("div");
  cat.className = "cat";
  cat.textContent = p.category;

  const h2 = document.createElement("h2");
  h2.textContent = p.title;

  const rating = document.createElement("div");
  rating.className = "rating";
  const ratingText = document.createElement("span");
  ratingText.textContent = p.rating.toFixed(2) + " / 5";
  rating.append(makeStars(p.rating), ratingText);

  const prices = document.createElement("div");
  prices.className = "prices";
  const price = document.createElement("span");
  price.className = "price";
  price.textContent = formatUSD(p.price);
  prices.appendChild(price);
  if (p.discountPercentage > 0) {
    const old = document.createElement("span");
    old.className = "old";
    old.textContent = formatUSD(p.price / (1 - p.discountPercentage / 100));
    prices.appendChild(old);
  }
  if (p.stock < STOK_MENIPIS) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Low Stock";
    prices.appendChild(badge);
  }

  body.append(cat, h2, rating, prices);
  card.append(img, body);
  return card;
}

function renderProducts(items) {
  gridEl.innerHTML = "";
  countEl.textContent = "Showing " + items.length + " products";
  if (items.length === 0) {
    setStatus("No matching products found.");
    return;
  }
  setStatus("");
  items.forEach((p) => gridEl.appendChild(createCard(p)));
}

function fillCategories() {
  const current = categoryEl.value;
  categoryEl.length = 1;
  [...new Set(products.map((p) => p.category))].sort().forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categoryEl.appendChild(opt);
  });
  categoryEl.value = current;
}

function applyFilters() {
  const q = searchEl.value.trim().toLowerCase();
  const cat = categoryEl.value;
  renderProducts(products.filter((p) => p.title.toLowerCase().includes(q) && (!cat || p.category === cat)));
}

async function loadProducts() {
  gridEl.innerHTML = "";
  countEl.textContent = "";
  reloadBtn.disabled = true;
  setStatus("Loading products...");
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("status " + res.status);
    const data = await res.json();
    products = data.products || [];
    if (products.length === 0) {
      setStatus("No products to display.");
      return;
    }
    fillCategories();
    applyFilters();
  } catch (err) {
    console.error(err);
    setStatus("Failed to load products (" + err.message + "). Check your internet connection and click Reload.", true);
  } finally {
    reloadBtn.disabled = false;
  }
}

searchEl.addEventListener("input", applyFilters);
categoryEl.addEventListener("change", applyFilters);
reloadBtn.addEventListener("click", loadProducts);
loadProducts();
