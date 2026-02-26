
export function toNum(v) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

export function isPointLike(obj) {
  if (!obj || typeof obj !== "object") return false;
  const lat = toNum(obj.latitude ?? obj.lat ?? obj.y);
  const lng = toNum(obj.longitude ?? obj.lng ?? obj.long ?? obj.x);
  return lat != null && lng != null;
}

export function pointToLngLat(obj) {
  const lat = toNum(obj.latitude ?? obj.lat ?? obj.y);
  const lng = toNum(obj.longitude ?? obj.lng ?? obj.long ?? obj.x);
  if (lat == null || lng == null) return null;
  return [lng, lat];
}

export function haversineMeters([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function splitLineOnGaps(line, maxGapMeters = 350) {
  if (!Array.isArray(line) || line.length < 2) return [];
  const out = [];
  let cur = [line[0]];

  for (let i = 1; i < line.length; i++) {
    const prev = line[i - 1];
    const next = line[i];
    const d = haversineMeters(prev, next);

    if (d > maxGapMeters) {
      if (cur.length >= 2) out.push(cur);
      cur = [next];
      continue;
    }

    cur.push(next);
  }

  if (cur.length >= 2) out.push(cur);
  return out;
}

export function extractLinesFromCaminho(caminho) {
  const normalize = (node) => {
    if (!node) return [];

    if (Array.isArray(node)) {

      if (node.length && node.every(isPointLike)) {
        const line = node.map(pointToLngLat).filter(Boolean);
        return line.length ? [line] : [];
      }

      if (
        node.length >= 2 &&
        (typeof node[0] === "number" || typeof node[0] === "string") &&
        (typeof node[1] === "number" || typeof node[1] === "string")
      ) {
        const a = toNum(node[0]);
        const b = toNum(node[1]);
        if (a != null && b != null) return [[[a, b]]];
      }

      return node.flatMap(normalize);
    }

    if (isPointLike(node)) {
      const c = pointToLngLat(node);
      return c ? [[c]] : [];
    }

    if (typeof node === "object") {
      if (node.geometry) return normalize(node.geometry);
      if (node.coordinates) return normalize(node.coordinates);
      if (node.paths) return normalize(node.paths);
    }

    return [];
  };

  const rawLines = normalize(caminho);


  if (rawLines.length && rawLines.every((l) => l.length === 1)) {
    const merged = rawLines.map((l) => l[0]);
    return merged.length >= 2 ? [merged] : [];
  }

  return rawLines
    .map((line) => {
      const cleaned = [];
      for (const c of line) {
        if (!Array.isArray(c) || c.length < 2) continue;
        const lng = toNum(c[0]);
        const lat = toNum(c[1]);
        if (lng == null || lat == null) continue;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) continue;

        const last = cleaned[cleaned.length - 1];
        if (!last || last[0] !== lng || last[1] !== lat) cleaned.push([lng, lat]);
      }
      return cleaned;
    })
    .filter((l) => l.length >= 2);
}
