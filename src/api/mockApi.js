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

const ROUTE_V2_POST_TIMEOUT_MS = 20000;
const ROUTE_V2_POLL_TIMEOUT_MS = 120000;
const API_USER_MESSAGES = {
  "/getPOIs": "Nao foi possivel carregar os pontos de interesse.",
  "/getTaxis": "Nao foi possivel carregar os taxis.",
  "/getClassifiedStreets": "Nao foi possivel carregar a acessibilidade das ruas.",
  "/calculateRoute": "Nao foi possivel calcular a rota.",
  "/calculateRouteMultiObjective": "Nao foi possivel calcular a rota.",
  "/calculateRouteMultiObjectiveV2": "Nao foi possivel calcular a rota.",
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

function cleanPayload(obj) {
  const payload = { ...(obj ?? {}) };

  Object.keys(payload).forEach((k) => {
    if (
      payload[k] === null ||
      payload[k] === undefined ||
      (typeof payload[k] === "number" && Number.isNaN(payload[k]))
    ) {
      delete payload[k];
    }
  });

  return payload;
}

function cleanRoutePayloadPreserveNulls(obj) {
  const payload = { ...(obj ?? {}) };

  Object.keys(payload).forEach((k) => {
    const v = payload[k];
    if (v === undefined || (typeof v === "number" && Number.isNaN(v))) {
      delete payload[k];
    }
  });

  return payload;
}

function isV2BadGatewayError(err) {
  const msg = String(err?.message ?? "");
  return msg.includes("HTTP 502 em /calculateRouteMultiObjectiveV2");
}

function getApiDefaultUserMessage(path) {
  if (!path) return "Ocorreu um erro ao comunicar com o servidor.";

  if (API_USER_MESSAGES[path]) return API_USER_MESSAGES[path];
  if (path.startsWith("/calculateRouteMultiObjectiveV2/")) {
    return API_USER_MESSAGES["/calculateRouteMultiObjectiveV2"];
  }

  return "Ocorreu um erro ao comunicar com o servidor.";
}

function createApiError(path, cause, fallbackMessage) {
  const error = new Error(String(cause?.message ?? fallbackMessage ?? "Erro de API."));
  error.cause = cause;
  error.apiPath = path;
  error.userMessage = getApiDefaultUserMessage(path);
  return error;
}

function normalizeApiError(path, error, fallbackMessage) {
  if (error?.userMessage) return error;
  return createApiError(path, error, fallbackMessage);
}

export function getApiErrorMessage(error, fallback = "Ocorreu um erro ao comunicar com o servidor.") {
  return error?.userMessage || fallback;
}

async function calculateRouteMultiObjectiveLegacy({
  incapacidade,
  end,
  lati,
  longi,
  latE,
  lngE,
  perfil = null,
} = {}) {
  const payload = cleanPayload({ incapacidade, end, lati, longi, latE, lngE, perfil });
  return httpPostJson("/calculateRouteMultiObjective", payload, { timeoutMs: 30000 });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRouteV2PollDelayMs(attempt) {
  if (attempt <= 3) return 2000;
  if (attempt <= 8) return 4000;
  return 8000;
}

async function httpGetJson(path, { timeoutMs = 25000 } = {}) {
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

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    throw normalizeApiError(path, error, `Falha a pedir ${path}`);
  }
}

async function httpPostJson(path, body, { timeoutMs = 25000 } = {}) {
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

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    throw normalizeApiError(path, error, `Falha a pedir ${path}`);
  }
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
  const payload = cleanPayload({ incapacidade, end, lati, longi, latE, lngE });
  return httpPostJson("/calculateRoute", payload, { timeoutMs: 30000 });
}

/*
 * LEGADO — endpoint antigo síncrono
 *
 * export async function calculateRouteMultiObjective({
 *   incapacidade,
 *   end,
 *   lati,
 *   longi,
 *   latE,
 *   lngE,
 *   perfil = null,
 * } = {}) {
 *   const payload = cleanPayload({ incapacidade, end, lati, longi, latE, lngE, perfil });
 *   return httpPostJson("/calculateRouteMultiObjective", payload, { timeoutMs: 30000 });
 * }
 */

function normalizeScaledCoordinate(value, kind) {
  let n = Number(value);
  if (!Number.isFinite(n)) return null;

  const limit = kind === "lat" ? 90 : 180;

  while (Math.abs(n) > limit && Math.abs(n) >= 1000) {
    n /= 10;
  }

  if (kind === "lat" && Math.abs(n) > 90) return null;
  if (kind === "lng" && Math.abs(n) > 180) return null;

  return n;
}

function normalizePointObjectToLngLat(point) {
  if (!point || typeof point !== "object") return null;

  const lat = normalizeScaledCoordinate(
    point.latitude ?? point.lat ?? point.y,
    "lat"
  );
  const lng = normalizeScaledCoordinate(
    point.longitude ?? point.lng ?? point.x,
    "lng"
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lng, lat];
}

function normalizeCaminhoSegment(segment) {
  if (!Array.isArray(segment)) return [];

  return segment
    .map((point) => normalizePointObjectToLngLat(point))
    .filter(Boolean);
}

function normalizeV2Caminho(caminho) {
  if (!Array.isArray(caminho)) return [];

  return caminho
    .map(normalizeCaminhoSegment)
    .filter((segment) => Array.isArray(segment) && segment.length >= 2);
}

function normalizeSingleRouteFromV2(route) {
  if (!route || typeof route !== "object") return route;

  const rawPontos = Array.isArray(route.pontos) ? route.pontos : [];
  const rawCaminho = normalizeV2Caminho(route.caminho);

  return {
    ...route,
    pontos: rawPontos,
    caminho: rawCaminho,
    cores: Array.isArray(route.niveis_acessibilidade)
      ? route.niveis_acessibilidade
      : Array.isArray(route.cores)
      ? route.cores
      : [],
    caminhoNos: rawPontos,
    pontosCoords: rawCaminho,
  };
}

function normalizeMultiObjectiveResultFromV2(result) {
  if (!result || typeof result !== "object") return result;

  if (Array.isArray(result.rotas)) {
    return {
      ...result,
      rotas: result.rotas.map(normalizeSingleRouteFromV2),
    };
  }

  return normalizeSingleRouteFromV2(result);
}

async function pollCalculateRouteMultiObjectiveV2(
  taskId,
  { timeoutMs = ROUTE_V2_POLL_TIMEOUT_MS } = {}
) {
  const startedAt = Date.now();
  let attempt = 0;

  while (Date.now() - startedAt < timeoutMs) {
    attempt += 1;

    const poll = await httpGetJson(`/calculateRouteMultiObjectiveV2/${taskId}`, {
      timeoutMs: 20000,
    });

    console.log("[Mob2is] V2 poll", {
      attempt,
      elapsedMs: Date.now() - startedAt,
      status: poll?.status,
      taskId,
    });

    if (poll?.status === "done") {
      return normalizeMultiObjectiveResultFromV2(poll?.resultado);
    }

    if (poll?.status === "error") {
      throw createApiError(
        `/calculateRouteMultiObjectiveV2/${taskId}`,
        null,
        poll?.detalhe || "Falha no calculo da rota."
      );
    }

    if (poll?.status === "pending" || poll?.status === "processing") {
      await sleep(getRouteV2PollDelayMs(attempt));
      continue;
    }

    if (poll?.resultado) {
      return normalizeMultiObjectiveResultFromV2(poll.resultado);
    }

    await sleep(getRouteV2PollDelayMs(attempt));
  }

  throw createApiError(
    `/calculateRouteMultiObjectiveV2/${taskId}`,
    null,
    "Timeout a espera do resultado de /calculateRouteMultiObjectiveV2."
  );
}

export async function calculateRouteMultiObjective({
  incapacidade,
  end,
  lati,
  longi,
  latE,
  lngE,
  perfil = null,
} = {}) {
  const rawPayload = {
    incapacidade,
    end,
    lati,
    longi,
    latE,
    lngE,
    perfil,
  };

  const payload = cleanRoutePayloadPreserveNulls(rawPayload);

  console.log("[Mob2is] V2 raw payload object", rawPayload);
  console.log("[Mob2is] V2 cleaned payload object", payload);
  console.log("[Mob2is] V2 cleaned payload JSON", JSON.stringify(payload, null, 2));

  let launch;
  try {
    launch = await httpPostJson("/calculateRouteMultiObjectiveV2", payload, {
      timeoutMs: ROUTE_V2_POST_TIMEOUT_MS,
    });
  } catch (e) {
    if (isV2BadGatewayError(e)) {
      console.warn("[Mob2is] V2 devolveu 502. A usar fallback para /calculateRouteMultiObjective.");
      return calculateRouteMultiObjectiveLegacy(payload);
    }
    throw e;
  }

  console.log("[Mob2is] V2 POST response", launch);

  if (launch?.status === "done") {
    return normalizeMultiObjectiveResultFromV2(launch?.resultado);
  }

  if (launch?.status === "processing" && launch?.task_id) {
    return pollCalculateRouteMultiObjectiveV2(launch.task_id);
  }

  if (launch?.status === "error") {
    throw createApiError(
      "/calculateRouteMultiObjectiveV2",
      null,
      launch?.detalhe || "Falha ao iniciar o calculo da rota."
    );
  }

  if (launch?.resultado) {
    return normalizeMultiObjectiveResultFromV2(launch.resultado);
  }

  throw createApiError(
    "/calculateRouteMultiObjectiveV2",
    null,
    "Resposta inesperada de /calculateRouteMultiObjectiveV2."
  );
}

export async function calculateRouteMultiObjectiveV2(args = {}) {
  return calculateRouteMultiObjective(args);
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
