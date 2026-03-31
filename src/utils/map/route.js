import { levelFromApiValue, paletteColorFromLevel } from "./colors";

function toLngLat(point) {
  if (Array.isArray(point) && point.length >= 2) {
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return [lng, lat];
  }

  const lng = Number(point?.longitude);
  const lat = Number(point?.latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

function sameLngLat(a, b, epsilon = 1e-7) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) {
    return false;
  }

  return Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon;
}

export function buildRouteGeojsonFromCaminho(caminho, accessArray = []) {
  const features = [];
  const segments = [];

  const rawSegments = Array.isArray(caminho) ? caminho : [];
  for (let i = 0; i < rawSegments.length; i++) {
    const coords = Array.isArray(rawSegments[i]) ? rawSegments[i].map(toLngLat).filter(Boolean) : [];
    if (coords.length < 2) continue;

    const level = levelFromApiValue(accessArray?.[i]);
    const color = paletteColorFromLevel(level);
    const index = segments.length + 1;

    segments.push({ index, color, level });

    const lastFeature = features[features.length - 1];
    const lastCoords = lastFeature?.geometry?.coordinates ?? [];
    const canMerge =
      lastFeature &&
      lastFeature.properties?.color === color &&
      sameLngLat(lastCoords[lastCoords.length - 1], coords[0]);

    if (canMerge) {
      lastFeature.geometry.coordinates = [...lastCoords, ...coords.slice(1)];
      lastFeature.properties.endIndex = index;
      continue;
    }

    features.push({
      type: "Feature",
      properties: { color, level, index, endIndex: index },
      geometry: { type: "LineString", coordinates: coords },
    });
  }

  return { geojson: { type: "FeatureCollection", features }, segments };
}
