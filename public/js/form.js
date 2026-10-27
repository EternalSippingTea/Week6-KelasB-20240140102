// Batas validasi: ubah angka di sini untuk menyesuaikan aturan
const rules = {
  nama:      { min: 3, max: 80 },
  deskripsi: { min: 10, max: 250 },
  promo:     { max: 60 },
  cta:       { max: 60 },
  keywords:  { maxItems: 5, maxLen: 30 },
};

// Platform: label, jumlah hashtag maksimal, batas karakter (jika ada)
const platforms = {
  instagram: { label: "Instagram", tags: 5 },
  tiktok:    { label: "TikTok", tags: 4 },
  facebook:  { label: "Facebook", tags: 2 },
  x:         { label: "X (Twitter)", tags: 2, limit: 280 },
};

// Template caption: setiap gaya bahasa punya beberapa pembuka (dipakai bergantian lewat "Variasi Lain")
const templates = {
  profesional: {
    label: "Profesional", emoji: "✨",
    body: (p, d) => "Sedang mencari pilihan yang sesuai dengan kebutuhan Anda? " + p + " patut Anda kenali lebih dekat. " + d + " Luangkan waktu untuk mengenalinya dan tentukan sendiri apakah " + p + " adalah pilihan yang tepat untuk Anda.",
    hooks: [
      (p) => "Tingkatkan standar Anda bersama " + p + ".",
      (p) => p + ": solusi terbaik untuk kebutuhan Anda.",
      (p) => "Kenali " + p + ", pilihan cerdas untuk Anda.",
    ],
  },
  santai: {
    label: "Santai", emoji: "😋",
    body: (p, d) => "Lagi butuh ide baru? Yuk, kenalan lebih dekat sama " + p + "! " + d + " Siapa tahu, setelah tahu lebih banyak, kamu makin yakin kalau " + p + " cocok buat jadi pilihanmu berikutnya.",
    hooks: [
      (p) => "Hai! Udah kenal " + p + " belum?",
      (p) => "Lagi cari " + p + "? Nah, ini dia!",
      (p) => "Spill dulu ya, " + p + " ini bikin nagih!",
    ],
  },
  semangat: {
    label: "Promo Semangat", emoji: "🚀",
    body: (p, d) => "Saatnya kenalan lebih dekat dengan " + p + "! " + d + " Cari tahu sendiri apa yang membuatnya menarik dan tentukan pilihan terbaik untuk kebutuhanmu.",
    hooks: [
      (p) => "JANGAN SAMPAI KELEWATAN! " + p + " sudah hadir!",
      (p) => "Siap-siap jatuh hati sama " + p + "!",
      (p) => p + " datang bawa kejutan, yuk serbu!",
    ],
  },
  elegan: {
    label: "Elegan", emoji: "🤍",
    body: (p, d) => "Kenali " + p + ", pilihan yang layak mendapat perhatian lebih. " + d + " Luangkan waktu untuk mempertimbangkannya dan putuskan dengan tenang apakah " + p + " sesuai dengan preferensi Anda.",
    hooks: [
      (p) => "Kemewahan sederhana hadir lewat " + p + ".",
      (p) => p + " — detail yang berbicara.",
      (p) => "Hadirkan keanggunan bersama " + p + ".",
    ],
  },
};

const $ = (id) => document.getElementById(id);
const form = $("form");
const captionEl = $("caption");
const fields = { nama: $("nama"), deskripsi: $("deskripsi"), promo: $("promo"), cta: $("cta"), keywords: $("keywords") };

let lastData = null;   // data form terakhir yang valid
let variant = 0;       // indeks variasi template
let riwayat = [];      // riwayat caption sesi ini

// "kopi susu aren" -> "#KopiSusuAren"
function toHashtag(text) {
  const words = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^A-Za-z0-9]+/).filter(Boolean);
  return words.length ? "#" + words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("") : "";
}

const parseKeywords = (v) => v.split(",").map((k) => k.trim()).filter(Boolean);

function lengthCheck(label, v, r) {
  if (v.length < r.min) return label + " minimal " + r.min + " karakter.";
  if (v.length > r.max) return label + " maksimal " + r.max + " karakter.";
  return "";
}

// Setiap validator mengembalikan pesan error, atau "" jika valid
const validators = {
  nama(v) {
    if (!v) return "Nama produk wajib diisi.";
    return lengthCheck("Nama produk", v, rules.nama) || (/\p{L}/u.test(v) ? "" : "Nama produk harus mengandung huruf.");
  },
  deskripsi(v) {
    return v ? lengthCheck("Deskripsi", v, rules.deskripsi) : "Deskripsi wajib diisi.";
  },
  promo(v) {
    return v.length > rules.promo.max ? "Info promo maksimal " + rules.promo.max + " karakter." : "";
  },
  cta(v) {
    return v.length > rules.cta.max ? "CTA maksimal " + rules.cta.max + " karakter." : "";
  },
  keywords(v) {
    const list = parseKeywords(v);
    if (list.length > rules.keywords.maxItems) return "Maksimal " + rules.keywords.maxItems + " kata kunci.";
    if (list.some((k) => k.length > rules.keywords.maxLen)) return "Setiap kata kunci maksimal " + rules.keywords.maxLen + " karakter.";
    return "";
  },
};

function validateField(name) {
  const input = fields[name];
  const value = input.value.trim();
  const error = validators[name](value);
  $(name + "-error").textContent = error;
  input.classList.toggle("invalid", Boolean(error));
  input.classList.toggle("valid", !error && value !== "");
  input.setAttribute("aria-invalid", error ? "true" : "false");
  return !error;
}

function clearState() {
  Object.keys(fields).forEach((name) => {
    $(name + "-error").textContent = "";
    fields[name].classList.remove("valid", "invalid");
    fields[name].removeAttribute("aria-invalid");
  });
  $("hitung-nama").textContent = "0 / " + rules.nama.max;
  $("hitung-deskripsi").textContent = "0 / " + rules.deskripsi.max;
}

// Membuat caption dari data form + nomor variasi
function generate(d, v) {
  const t = templates[d.tone];
  const p = platforms[d.platform];
  const hook = t.hooks[v % t.hooks.length](d.nama);
  const lines = [(d.emoji ? t.emoji + " " : "") + hook, "", t.body(d.nama, d.deskripsi)];
  if (d.promo) lines.push((d.emoji ? "🔥 " : "") + "Promo spesial: " + d.promo + "!");
  if (d.cta) lines.push((d.emoji ? "👉 " : "") + d.cta);

  if (d.hashtag) {
    const seen = new Set();
    const tags = [toHashtag(d.nama), ...parseKeywords(d.keywords).map(toHashtag), "#" + d.platform]
      .filter((h) => h && !seen.has(h.toLowerCase()) && seen.add(h.toLowerCase()))
      .slice(0, p.tags);
    if (tags.length) lines.push("", tags.join(" "));
  }
  return lines.join("\n");
}

function showCaption(text, platformKey, toneKey) {
  const p = platforms[platformKey];
  captionEl.value = text;
  const badge = $("badge");
  badge.hidden = false;
  badge.textContent = p.label + " • " + templates[toneKey].label;

  $("stat-char").textContent = text.length;
  $("stat-word").textContent = text.trim().split(/\s+/).length;
  $("stat-tag").textContent = (text.match(/#\w+/g) || []).length;
  $("salin").disabled = false;

  const info = $("salin-info");
  const over = p.limit && text.length > p.limit;
  info.className = "feedback" + (over ? " warn" : "");
  info.textContent = over ? "Caption melebihi batas " + p.limit + " karakter untuk " + p.label + "." : "";
}

function renderRiwayat() {
  const list = $("riwayat");
  list.replaceChildren();
  $("hapus").hidden = riwayat.length === 0;
  if (riwayat.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Belum ada caption.";
    list.appendChild(li);
    return;
  }
  riwayat.forEach((r) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = platforms[r.platform].label + " • " + r.waktu;
    const snippet = r.text.replace(/\s+/g, " ");
    btn.append(meta, snippet.length > 70 ? snippet.slice(0, 70) + "…" : snippet);
    btn.addEventListener("click", () => showCaption(r.text, r.platform, r.tone)); // event "click": muat ulang dari riwayat
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function buatCaption() {
  const text = generate(lastData, variant);
  showCaption(text, lastData.platform, lastData.tone);
  riwayat.unshift({
    text, platform: lastData.platform, tone: lastData.tone,
    waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  });
  riwayat = riwayat.slice(0, 10);
  renderRiwayat();
  $("variasi").disabled = false;
}

// Event "input": validasi langsung saat mengetik + penghitung karakter
Object.keys(fields).forEach((name) => fields[name].addEventListener("input", () => validateField(name)));
fields.nama.addEventListener("input", () => { $("hitung-nama").textContent = fields.nama.value.length + " / " + rules.nama.max; });
fields.deskripsi.addEventListener("input", () => { $("hitung-deskripsi").textContent = fields.deskripsi.value.length + " / " + rules.deskripsi.max; });

// Event "submit": validasi semua field, lalu buat caption
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const names = Object.keys(fields);
  const results = names.map(validateField);
  if (!results.every(Boolean)) {
    fields[names[results.indexOf(false)]].focus();
    return;
  }
  lastData = {
    nama: fields.nama.value.trim(),
    deskripsi: fields.deskripsi.value.trim(),
    promo: fields.promo.value.trim(),
    cta: fields.cta.value.trim(),
    keywords: fields.keywords.value.trim(),
    platform: $("platform").value,
    tone: $("tone").value,
    emoji: $("emoji").checked,
    hashtag: $("hashtag").checked,
  };
  variant = 0;
  buatCaption();
});

// Event "click": Variasi Lain, Salin, Reset, Hapus Semua
$("variasi").addEventListener("click", () => {
  if (!lastData) return;
  variant++;
  buatCaption();
});

$("salin").addEventListener("click", async () => {
  const info = $("salin-info");
  try {
    await navigator.clipboard.writeText(captionEl.value);
    info.className = "feedback";
    info.textContent = "Caption berhasil disalin.";
  } catch {
    captionEl.select();
    info.className = "feedback warn";
    info.textContent = "Teks sudah dipilih, tekan Ctrl+C untuk menyalin.";
  }
});

$("reset").addEventListener("click", () => {
  form.reset();
  lastData = null;
  variant = 0;
  captionEl.value = "";
  $("badge").hidden = true;
  ["stat-char", "stat-word", "stat-tag"].forEach((id) => { $(id).textContent = 0; });
  $("salin").disabled = true;
  $("variasi").disabled = true;
  $("salin-info").textContent = "";
  clearState();
});

$("hapus").addEventListener("click", () => {
  riwayat = [];
  renderRiwayat();
});

clearState();
