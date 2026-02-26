
import AsyncStorage from "@react-native-async-storage/async-storage";

export const VIANA_COORDS = [-8.8273, 41.6946];

const API_BASE_URL = "https://mob2is.pt/viana";


export const CATEGORIES = [];
export const POIS = [];

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; 
const CACHE_KEYS = {
  pois: "mob2is_cache_pois_v2",
  taxis: "mob2is_cache_taxis_v2",
  streets: "mob2is_cache_classified_streets_v1",
};

async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !parsed?.data) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writeCache(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function normalizePhone(v) {
  if (v === null || v === undefined) return null;
  return String(v).trim().replace(/\.0$/, "");
}

function normalizePhotoUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  try {
    return encodeURI(s);
  } catch {
    return s;
  }
}

function slugify(input) {
  const s = (input ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  return s
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pseudoRating(id) {
  const n = Number(String(id).replace(/\D/g, "")) || 1;
  return Number((4 + (n % 9) / 10).toFixed(1)); 
}

async function httpGetJson(path, { timeoutMs = 12000 } = {}) {
  const url = `${API_BASE_URL}${path}`;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout a pedir ${path}`)), timeoutMs)
  );

  const fetchPromise = fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  }).then(async (res) => {
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} em ${path}${txt ? `: ${txt.slice(0, 120)}` : ""}`);
    }
    return res.json();
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

async function httpPostJson(path, body, { timeoutMs = 20000 } = {}) {
  const url = `${API_BASE_URL}${path}`;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout a pedir ${path}`)), timeoutMs)
  );

  const fetchPromise = fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  }).then(async (res) => {
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} em ${path}${txt ? `: ${txt.slice(0, 200)}` : ""}`);
    }
    return res.json();
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

function mapPoiFromApi(item) {
  const a = item?.attributes ?? {};
  const g = item?.geometry ?? {};

  const objectId = a.OBJECTID ?? a.objectid ?? a.Ponto ?? `${Math.random()}`;
  const title = a.DESIGNACAO ?? a.NOME ?? "Sem nome";
  const categoryName = a.CATEGORIA ?? "Outros";
  const categoryId = slugify(categoryName);

  const lng = g.x != null ? Number(g.x) : null;
  const lat = g.y != null ? Number(g.y) : null;
  const coords = lng !== null && lat !== null ? [lng, lat] : null;

  const image = normalizePhotoUrl(a.FOTO);

  return {
    id: String(objectId),
    title,
    categoryId,
    categoryName,

    coords,
    graphPointId: a.Ponto ?? null,
    description: a.DESCRICAO ?? "Sem descrição disponível.",
    phone: normalizePhone(a.TELEFONE),

    image,
    rating: pseudoRating(objectId),
    visits: 0,
  };
}

export async function getClassifiedStreets({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = await readCache(CACHE_KEYS.streets);
    if (cached) return cached;
  }

  const raw = await httpGetJson("/getClassifiedStreets");
  const streets = Array.isArray(raw) ? raw : [];
  await writeCache(CACHE_KEYS.streets, streets);
  return streets;
}


export async function calculateRoute({ incapacidade, end, lati, longi, latE, lngE } = {}) {
  const payload = { incapacidade, end, lati, longi, latE, lngE };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === null || payload[k] === undefined) delete payload[k];
  });
  return httpPostJson("/calculateRoute", payload, { timeoutMs: 30000 });
}

function mapTaxiFromApi(item) {
  const a = item?.attributes ?? {};
  const g = item?.geometry ?? {};

  const objectId = a.OBJECTID ?? a.objectid ?? a.Ponto ?? `${Math.random()}`;
  const lng = g.x != null ? Number(g.x) : null;
  const lat = g.y != null ? Number(g.y) : null;

  return {
    id: String(objectId),
    rua: a.RUA ?? "",
    lugares: a.LUGARES != null ? Number(a.LUGARES) : null,
    ponto: a.Ponto ?? null,
    coords: lng !== null && lat !== null ? [lng, lat] : null,
  };
}


export async function getPOIs({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = await readCache(CACHE_KEYS.pois);
    if (cached) return cached;
  }

  const raw = await httpGetJson("/getPOIs");
  const pois = Array.isArray(raw)
    ? raw.map(mapPoiFromApi).filter((p) => Array.isArray(p.coords))
    : [];

  await writeCache(CACHE_KEYS.pois, pois);
  return pois;
}

export async function getTaxis({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = await readCache(CACHE_KEYS.taxis);
    if (cached) return cached;
  }

  const raw = await httpGetJson("/getTaxis");
  const taxis = Array.isArray(raw)
    ? raw.map(mapTaxiFromApi).filter((t) => Array.isArray(t.coords))
    : [];

  await writeCache(CACHE_KEYS.taxis, taxis);
  return taxis;
}



export async function fetchCategories() {
  const pois = await getPOIs();
  const map = new Map();
  for (const p of pois) {
    if (!p?.categoryId) continue;
    if (!map.has(p.categoryId)) map.set(p.categoryId, p.categoryName);
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}


export async function fetchPoisByCategory(categoryId) {
  const pois = await getPOIs();
  return pois.filter((p) => p.categoryId === categoryId);
}


export async function searchPois(q) {
  const pois = await getPOIs();
  const query = (q ?? "").trim().toLowerCase();
  if (!query) return pois;
  return pois.filter((p) => (p.title ?? "").toLowerCase().includes(query));
}
