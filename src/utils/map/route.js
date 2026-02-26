import { haversineMeters, splitLineOnGaps, toNum } from "./geo";
import { levelFromApiColor, paletteColorFromLevel } from "./colors";

export function estimateEtaMinutesFromLines(lines, conditionKey) {
  const flat = (lines ?? []).flat();
  if (!Array.isArray(flat) || flat.length < 2) return 0;

  let meters = 0;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      meters += haversineMeters(line[i - 1], line[i]);
    }
  }

  const slowKeys = new Set(["wheelchair", "elder"]);
  const speed = slowKeys.has(conditionKey) ? 1.0 : 1.25;
  return Math.max(1, Math.round(meters / speed / 60));
}

export function buildStreetIndex(rawStreets) {
  const idx = new Map();

  const normPathCoord = (p) => {
    if (Array.isArray(p) && p.length >= 2) {
      const lng = toNum(p[0]);
      const lat = toNum(p[1]);
      if (lng == null || lat == null) return null;
      return [lng, lat];
    }
    if (p && typeof p === "object") {
      const lng = toNum(p.x ?? p.lng ?? p.longitude);
      const lat = toNum(p.y ?? p.lat ?? p.latitude);
      if (lng == null || lat == null) return null;
      return [lng, lat];
    }
    return null;
  };

  (rawStreets ?? []).forEach((item) => {
    const a = item?.attributes ?? {};
    const g = item?.geometry ?? {};

    const sp = toNum(a.StartPoint ?? a.startpoint);
    const ep = toNum(a.EndPoint ?? a.endpoint);
    if (sp == null || ep == null) return;

    const paths = Array.isArray(g.paths) ? g.paths : [];
    const lines = paths
      .map((path) => (Array.isArray(path) ? path.map(normPathCoord).filter(Boolean) : []))
      .filter((l) => l.length >= 2);

    if (!lines.length) return;

    const key = `${sp}-${ep}`;
    const revKey = `${ep}-${sp}`;

    idx.set(key, {
      start: sp,
      end: ep,
      objectId: a.OBJECTID ?? a.objectid ?? null,
      lines,
    });

    idx.set(revKey, {
      start: ep,
      end: sp,
      objectId: a.OBJECTID ?? a.objectid ?? null,
      lines: lines.map((l) => [...l].reverse()),
    });
  });

  return idx;
}

export function buildRouteGeojsonFromPontos(pontos, cores, streetsIndex) {
  if (!Array.isArray(pontos) || pontos.length < 2) return null;
  if (!(streetsIndex instanceof Map)) return null;

  const features = [];
  const segments = [];
  const linesForEta = [];

  let missing = 0;

  for (let i = 0; i < pontos.length - 1; i++) {
    const a = toNum(pontos[i]);
    const b = toNum(pontos[i + 1]);
    if (a == null || b == null) {
      missing++;
      continue;
    }

    const edge = streetsIndex.get(`${a}-${b}`);
    if (!edge?.lines?.length) {
      missing++;
      continue;
    }

    const apiColor = cores?.[i] != null ? String(cores[i]) : null;
    const level = apiColor ? levelFromApiColor(apiColor) : "Alta acessibilidade";
    const color = paletteColorFromLevel(level);
    const index = segments.length + 1;

    segments.push({ index, color, level });

    const geomLines = edge.lines;
    geomLines.forEach((ln) => linesForEta.push(ln));

    features.push({
      type: "Feature",
      properties: { color, level, index },
      geometry:
        geomLines.length === 1
          ? { type: "LineString", coordinates: geomLines[0] }
          : { type: "MultiLineString", coordinates: geomLines },
    });
  }

  if (missing > Math.max(2, Math.floor((pontos.length - 1) * 0.25))) {
    return null;
  }

  return {
    geojson: { type: "FeatureCollection", features },
    segments,
    linesForEta,
  };
}

export function buildRouteGeojsonFromCaminho(lines, cores = []) {
  const features = [];
  const segments = [];

  const pushFeature = (coords, level) => {
    if (!coords || coords.length < 2) return;
    const color = paletteColorFromLevel(level);
    const index = segments.length + 1;

    segments.push({ index, color, level });

    features.push({
      type: "Feature",
      properties: { color, level, index },
      geometry: { type: "LineString", coordinates: coords },
    });
  };

  const safeLines = (lines ?? []).flatMap((l) => splitLineOnGaps(l, 350));
  if (!safeLines.length) {
    return { geojson: { type: "FeatureCollection", features: [] }, segments: [] };
  }

  if (!Array.isArray(cores) || cores.length <= 1) {
    safeLines.forEach((l) => pushFeature(l, "Alta acessibilidade"));
    return { geojson: { type: "FeatureCollection", features }, segments };
  }

  let colorIdx = 0;

  for (const line of safeLines) {
    if (line.length < 2) continue;

    const firstApi = cores[colorIdx] != null ? String(cores[colorIdx]) : null;
    let currentLevel = firstApi ? levelFromApiColor(firstApi) : "Alta acessibilidade";
    let currentCoords = [line[0]];

    for (let i = 0; i < line.length - 1; i++) {
      const edgeApi = cores[colorIdx] != null ? String(cores[colorIdx]) : null;
      colorIdx++;

      const edgeLevel = edgeApi ? levelFromApiColor(edgeApi) : "Alta acessibilidade";
      const next = line[i + 1];

      if (edgeLevel !== currentLevel && currentCoords.length >= 2) {
        pushFeature(currentCoords, currentLevel);
        currentLevel = edgeLevel;
        currentCoords = [line[i]];
      }

      currentCoords.push(next);
    }

    if (currentCoords.length >= 2) pushFeature(currentCoords, currentLevel);
  }

  return { geojson: { type: "FeatureCollection", features }, segments };
}
