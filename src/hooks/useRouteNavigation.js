import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import Geolocation from "react-native-geolocation-service";

import { calculateRouteMultiObjective, getClassifiedStreets, VIANA_COORDS } from "../api/mockApi";
import { extractLinesFromCaminho, haversineMeters, splitLineOnGaps } from "../utils/map/geo";
import {
  buildRouteGeojsonFromCaminho,
  buildRouteGeojsonFromPontos,
  buildStreetIndex,
  estimateEtaMinutesFromLines,
} from "../utils/map/route";

const DEV_FORCE_LOCATION = true;
const DEV_FIXED_COORD = [-8.846155, 41.693145]; 

function mapConditionToIncapacidade(conditionKey) {
  if (conditionKey === "asd") return "Autismo";
  if (conditionKey === "visual") return "Invisual";
  return "MobReduzida";
}

function isCustomDestinationPoi(poi) {
  return !!poi?.isCustomPoint || poi?.graphPointId == null;
}

function routeSignature(route) {
  if (Array.isArray(route?.pontos) && route.pontos.length) {
    return `p:${route.pontos.join(">")}`;
  }

  if (Array.isArray(route?.caminho) && route.caminho.length) {
    return `c:${JSON.stringify(route.caminho)}`;
  }

  return `perfil:${route?.perfil ?? "unknown"}`;
}

function dedupeMultiRoutes(rotas = []) {
  const out = [];
  const seen = new Set();

  for (const route of rotas) {
    if (!route) continue;
    const sig = routeSignature(route);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(route);
  }

  return out;
}

function resolvePoiEnd(poi) {
  const graphPointId = poi?.graphPointId;
  if (graphPointId !== null && graphPointId !== undefined && String(graphPointId).trim() !== "") {
    return graphPointId;
  }

  const fallbackId = poi?.id;
  if (fallbackId !== null && fallbackId !== undefined && String(fallbackId).trim() !== "") {
    return fallbackId;
  }

  return null;
}

function bearingDeg([lng1, lat1], [lng2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

function lerpAngle(a, b, t) {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
}

function offsetForwardMeters([lng, lat], headingDeg, meters) {
  const rad = (headingDeg * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / 111320;
  const dLng = (meters * Math.sin(rad)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

function normalizeRouteGeojson(fc) {
  if (!fc?.features?.length) return { type: "FeatureCollection", features: [] };

  const out = [];
  for (const f of fc.features) {
    if (!f?.geometry) continue;

    if (f.geometry.type === "LineString") {
      out.push(f);
      continue;
    }
    if (f.geometry.type === "MultiLineString") {
      for (const coords of f.geometry.coordinates ?? []) {
        out.push({
          type: "Feature",
          properties: { ...(f.properties ?? {}) },
          geometry: { type: "LineString", coordinates: coords },
        });
      }
    }
  }
  return { type: "FeatureCollection", features: out };
}

function pointSegDistanceMeters(p, a, b) {
  const lat0 = p[1];
  const mLat = 111320;
  const mLng = 111320 * Math.cos((lat0 * Math.PI) / 180);

  const px = p[0] * mLng,
    py = p[1] * mLat;
  const ax = a[0] * mLng,
    ay = a[1] * mLat;
  const bx = b[0] * mLng,
    by = b[1] * mLat;

  const vx = bx - ax,
    vy = by - ay;
  const wx = px - ax,
    wy = py - ay;

  const vv = vx * vx + vy * vy;
  let t = 0;
  if (vv > 0) t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / vv));

  const cx = ax + t * vx,
    cy = ay + t * vy;
  const dx = px - cx,
    dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function distanceToRouteMeters(userLngLat, flatCoords, cursorIdx) {
  if (!flatCoords?.length || flatCoords.length < 2) return Infinity;

  const SEARCH_BEHIND = 40;
  const SEARCH_AHEAD = 160;

  const start = Math.max(0, (cursorIdx ?? 0) - SEARCH_BEHIND);
  const end = Math.min(flatCoords.length - 2, (cursorIdx ?? 0) + SEARCH_AHEAD);

  let best = Infinity;
  for (let i = start; i <= end; i++) {
    const d = pointSegDistanceMeters(userLngLat, flatCoords[i], flatCoords[i + 1]);
    if (d < best) best = d;
  }
  return best;
}

export default function useRouteNavigation({ cameraRef, tabBarH = 0, insets = { top: 0, bottom: 0 }, condition }) {
  const conditionRef = useRef(condition);
  useEffect(() => {
    conditionRef.current = condition;
  }, [condition]);

  const [selectedPoi, setSelectedPoi] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  
  const [routeActive, setRouteActive] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false);

  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedPerfil, setSelectedPerfil] = useState("equilibrada");
  const [following, setFollowing] = useState(false);

  const [activePerfil, setActivePerfil] = useState(null);
  const activePerfilRef = useRef(null);
  useEffect(() => {
    activePerfilRef.current = activePerfil;
  }, [activePerfil]);

  const [navMode, setNavMode] = useState("idle"); // idle | preview | follow
  const navModeRef = useRef("idle");
  useEffect(() => {
    navModeRef.current = navMode;
  }, [navMode]);

  const [routeFullGeojson, setRouteFullGeojson] = useState(null);
  const [routeRemainingGeojson, setRouteRemainingGeojson] = useState(null);
  const [routeSegments, setRouteSegments] = useState([]);
  const [etaMin, setEtaMin] = useState(0);

  // Localização
  const [userCoord, setUserCoord] = useState(null);
  const didCenterOnUser = useRef(false);

  // Ruas indexadas
  const streetsIndexRef = useRef(null);

  // Cache rota (progressão)
  const routeNormRef = useRef(null);
  const flatCoordsRef = useRef([]);
  const indexMapRef = useRef([]);
  const nearestIdxRef = useRef(0);

  const headingRef = useRef(0);
  const lastCoordRef = useRef(null);
  const lastCamTsRef = useRef(0);

  // Off-route recalc
  const OFF_ROUTE_M = 40;
  const OFF_ROUTE_CONFIRM_COUNT = 1;
  const MIN_RECALC_INTERVAL_MS = 15_000;

  const routeInFlightRef = useRef(false);
  const lastRecalcAtRef = useRef(0);
  const offRouteCountRef = useRef(0);



  const [classifiedStreetsRaw, setClassifiedStreetsRaw] = useState([]);

  const setCam = (opts) => {
    if (!cameraRef?.current?.setCamera) return;
    cameraRef.current.setCamera({
      animationMode: "easeTo",
      animationDuration: 250,
      ...opts,
    });
  };

  const resetCamera = (center = userCoord ?? VIANA_COORDS) => {
    setCam({
      centerCoordinate: center,
      zoomLevel: 15,
      pitch: 0,
      heading: 0,
      animationMode: "flyTo",
      animationDuration: 650,
    });
  };

  const getRouteBbox = (fc) => {
    const feats = fc?.features ?? [];
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    let count = 0;

    const pushCoord = (c) => {
      if (!Array.isArray(c) || c.length < 2) return;
      const [lng, lat] = c;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
      count++;
    };

    for (const f of feats) {
      const g = f?.geometry;
      if (!g) continue;

      if (g.type === "LineString") (g.coordinates ?? []).forEach(pushCoord);
      else if (g.type === "MultiLineString") (g.coordinates ?? []).forEach((ln) => (ln ?? []).forEach(pushCoord));
    }

    if (!count || !Number.isFinite(minLng) || !Number.isFinite(minLat)) return null;
    return { sw: [minLng, minLat], ne: [maxLng, maxLat] };
  };

  const fitRouteToView = (routeFc, { bottomPad } = {}) => {
    const bbox = getRouteBbox(routeFc);
    if (!bbox) return;

    const paddingTop = Math.max(70, (insets?.top ?? 0) + 20);
    const paddingBottom = bottomPad ?? (tabBarH + 420);
    const paddingLeft = 50;
    const paddingRight = 50;

    try {
      if (cameraRef?.current?.fitBounds) {
        cameraRef.current.fitBounds(bbox.ne, bbox.sw, [paddingTop, paddingRight, paddingBottom, paddingLeft], 650);
        return;
      }

      if (cameraRef?.current?.setCamera) {
        cameraRef.current.setCamera({
          bounds: { ne: bbox.ne, sw: bbox.sw, paddingTop, paddingRight, paddingBottom, paddingLeft },
          pitch: 0,
          heading: 0,
          animationMode: "easeTo",
          animationDuration: 650,
        });
      }
    } catch (e) {
      console.warn("[Mob2is] fitRouteToView error:", e);
    }
  };

  const rebuildRouteCache = (routeFcNormalized) => {
    routeNormRef.current = routeFcNormalized;
    flatCoordsRef.current = [];
    indexMapRef.current = [];
    nearestIdxRef.current = 0;

    const feats = routeFcNormalized?.features ?? [];
    for (let fi = 0; fi < feats.length; fi++) {
      const coords = feats[fi]?.geometry?.coordinates ?? [];
      for (let ci = 0; ci < coords.length; ci++) {
        flatCoordsRef.current.push(coords[ci]);
        indexMapRef.current.push({ featureIndex: fi, coordIndex: ci });
      }
    }

    setRouteRemainingGeojson(routeFcNormalized);
  };

  const buildRemainingFromIndex = (globalIdx) => {
    const norm = routeNormRef.current;
    if (!norm?.features?.length) return norm;

    const mapItem = indexMapRef.current[globalIdx];
    if (!mapItem) return norm;

    const curF = mapItem.featureIndex;
    const curC = mapItem.coordIndex;

    const out = [];
    for (let fi = curF; fi < norm.features.length; fi++) {
      const f = norm.features[fi];
      const coords = f?.geometry?.coordinates ?? [];
      const sliced = fi === curF ? coords.slice(Math.max(0, curC)) : coords;

      if (sliced.length >= 2) {
        out.push({
          type: "Feature",
          properties: { ...(f.properties ?? {}) },
          geometry: { type: "LineString", coordinates: sliced },
        });
      }
    }

    return { type: "FeatureCollection", features: out };
  };

  const updateNavProgress = (userC) => {
    const flat = flatCoordsRef.current;
    if (!flat?.length) return;

    const lastIdx = nearestIdxRef.current ?? 0;

    const W = 220;
    const from = Math.max(0, lastIdx - W);
    const to = Math.min(flat.length - 1, lastIdx + W);

    let bestIdx = lastIdx;
    let bestD = Infinity;

    for (let i = from; i <= to; i++) {
      const d = haversineMeters(userC, flat[i]);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }

    if (bestD > 60) {
      bestD = Infinity;
      bestIdx = lastIdx;
      for (let i = 0; i < flat.length; i += 2) {
        const d = haversineMeters(userC, flat[i]);
        if (d < bestD) {
          bestD = d;
          bestIdx = i;
        }
      }
    }

    if (bestIdx <= lastIdx) return;
    if (bestIdx - lastIdx < 3) return;

    nearestIdxRef.current = bestIdx;
    setRouteRemainingGeojson(buildRemainingFromIndex(bestIdx));
  };

  const setFollowCamera = (c, force = false) => {
    const now = Date.now();
    if (!force && now - lastCamTsRef.current < 280) return;
    lastCamTsRef.current = now;

    const prev = lastCoordRef.current;
    if (prev) {
      const d = haversineMeters(prev, c);
      if (d < 0.8 && !force) return;

      const b = bearingDeg(prev, c);
      headingRef.current = lerpAngle(headingRef.current, b, 0.22);
    }
    lastCoordRef.current = c;

    updateNavProgress(c);

    const centerAhead = offsetForwardMeters(c, headingRef.current, 28);

    setCam({
      centerCoordinate: centerAhead,
      zoomLevel: 18.1,
      pitch: 68,
      heading: headingRef.current,
      animationMode: "easeTo",
      animationDuration: 220,
    });
  };

  const applyPathDataToMap = async (pd, { keepFollowing = false, fromLngLat = null } = {}) => {
  if (!pd) {
    console.warn("[Mob2is] applyPathDataToMap sem path data");
    return false;
  }

  const accessArr = pd?.niveis_acessibilidade ?? pd?.cores ?? [];
  const pontos = Array.isArray(pd?.pontos) ? pd.pontos : null;
  const streetsIndex = streetsIndexRef.current;

  console.log("[Mob2is] applyPathDataToMap input", {
    perfil: pd?.perfil,
    pontosCount: Array.isArray(pontos) ? pontos.length : 0,
    caminhoCount: Array.isArray(pd?.caminho) ? pd.caminho.length : 0,
    accessCount: Array.isArray(accessArr) ? accessArr.length : 0,
    hasStreetIndex: streetsIndex instanceof Map,
  });

  const builtFromPontos =
    pontos && streetsIndex ? buildRouteGeojsonFromPontos(pontos, accessArr, streetsIndex) : null;

  if (builtFromPontos?.geojson?.features?.length) {
    console.log("[Mob2is] rota construída via pontos", {
      perfil: pd?.perfil,
      featureCount: builtFromPontos.geojson.features.length,
      segmentCount: builtFromPontos.segments.length,
    });

    const norm = normalizeRouteGeojson(builtFromPontos.geojson);

    setRouteFullGeojson(norm);
    rebuildRouteCache(norm);

    setRouteSegments(builtFromPontos.segments);
    setEtaMin(estimateEtaMinutesFromLines(builtFromPontos.linesForEta, conditionRef.current));
    setRouteActive(true);

    if (!keepFollowing) {
      setNavMode("preview");
      fitRouteToView(norm, { bottomPad: tabBarH + 420 });
    }

    if (keepFollowing && fromLngLat) {
      updateNavProgress(fromLngLat);
      setRouteRemainingGeojson(buildRemainingFromIndex(nearestIdxRef.current));
    }

    return true;
  }

  const lines = extractLinesFromCaminho(pd?.caminho);
  const safeLines = lines.flatMap((l) => splitLineOnGaps(l, 350));

  console.log("[Mob2is] fallback caminho", {
    perfil: pd?.perfil,
    rawLines: lines.length,
    safeLines: safeLines.length,
    totalPoints: safeLines.reduce((acc, l) => acc + l.length, 0),
  });

  if (!safeLines.length) {
    console.warn("[Mob2is] sem geometria desenhável na rota", {
      perfil: pd?.perfil,
      pd,
    });
    return false;
  }

  const built = buildRouteGeojsonFromCaminho(safeLines, accessArr);
  const norm = normalizeRouteGeojson(built.geojson);

  setRouteFullGeojson(norm);
  rebuildRouteCache(norm);

  setRouteSegments(built.segments);
  setEtaMin(estimateEtaMinutesFromLines(safeLines, conditionRef.current));
  setRouteActive(true);

  if (!keepFollowing) {
    setNavMode("preview");
    fitRouteToView(norm, { bottomPad: tabBarH + 420 });
  }

  if (keepFollowing && fromLngLat) {
    updateNavProgress(fromLngLat);
    setRouteRemainingGeojson(buildRemainingFromIndex(nearestIdxRef.current));
  }

  return true;
};

  const recalcRouteFromHere = async (fromLngLat) => {
    if (!selectedPoi?.coords) return;

    const incapacidade = mapConditionToIncapacidade(conditionRef.current);
    const [lng, lat] = fromLngLat;
    const [lngE, latE] = selectedPoi.coords;

   const customPoint = isCustomDestinationPoi(selectedPoi);
   const end = customPoint ? null : resolvePoiEnd(selectedPoi);

    if (!customPoint && end == null) {
      throw new Error("POI sem identificador de destino válido (Ponto/graphPointId).");
    }

    const perfil = activePerfilRef.current ?? null;

    const resp = await calculateRouteMultiObjective({
      incapacidade,
      end,
      lati: lat,
      longi: lng,
      latE,
      lngE,
      perfil,
    });

    const pd = Array.isArray(resp?.rotas) ? resp.rotas.find((r) => r?.perfil === perfil) || resp.rotas[0] : resp;
    await applyPathDataToMap(pd, { keepFollowing: true, fromLngLat });
  };

  const maybeRecalculateOffRoute = async (userLngLat) => {
    if (navModeRef.current !== "follow") return;
    if (!routeNormRef.current) return;
    if (routeInFlightRef.current) return;

    const now = Date.now();
    if (now - lastRecalcAtRef.current < MIN_RECALC_INTERVAL_MS) return;

    const d = distanceToRouteMeters(userLngLat, flatCoordsRef.current, nearestIdxRef.current);

    if (d <= OFF_ROUTE_M) {
      offRouteCountRef.current = 0;
      return;
    }

    offRouteCountRef.current += 1;
    if (offRouteCountRef.current < OFF_ROUTE_CONFIRM_COUNT) return;

    offRouteCountRef.current = 0;
    lastRecalcAtRef.current = now;
    routeInFlightRef.current = true;

    try {
      await recalcRouteFromHere(userLngLat);
    } finally {
      routeInFlightRef.current = false;
    }
  };

  const applyLocation = (lng, lat) => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    const c = [lng, lat];
    setUserCoord(c);

    if (!didCenterOnUser.current) {
      didCenterOnUser.current = true;
      setCam({ centerCoordinate: c, zoomLevel: 15, pitch: 0, heading: 0, animationMode: "flyTo", animationDuration: 900 });
      return;
    }

    if (navModeRef.current === "follow") {
      setFollowCamera(c);
      maybeRecalculateOffRoute(c);
    }
  };


  useEffect(() => {
    let watchId = null;
    let alive = true;

    const start = async () => {
      try {

        if (__DEV__ && DEV_FORCE_LOCATION) {
          console.log("[Mob2is] A usar localização fixa de desenvolvimento", {
            lng: DEV_FIXED_COORD[0],
            lat: DEV_FIXED_COORD[1],
          });
          applyLocation(DEV_FIXED_COORD[0], DEV_FIXED_COORD[1]);
          return;
        }
        if (Platform.OS === "android") {
          const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
          const already = await PermissionsAndroid.check(fine);
          const granted = already ? PermissionsAndroid.RESULTS.GRANTED : await PermissionsAndroid.request(fine);

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn("[Mob2is] Permissão de localização recusada.");
            return;
          }
        }

        watchId = Geolocation.watchPosition(
          (pos) => {
            if (!alive) return;
            const { longitude, latitude } = pos.coords || {};
            applyLocation(longitude, latitude);
          },
          (err) => console.warn("[Mob2is] watchPosition error:", err),
          {
            enableHighAccuracy: true,
            distanceFilter: 1,
            interval: 1000,
            fastestInterval: 700,
            forceRequestLocation: true,
            showLocationDialog: true,
          }
        );
      } catch (e) {
        console.warn("[Mob2is] start watch error:", e);
      }
    };

    start();

    return () => {
      alive = false;
      if (watchId != null) Geolocation.clearWatch(watchId);
      Geolocation.stopObserving?.();
    };

  }, []);


  useEffect(() => {
  let alive = true;

  (async () => {
        try {
          const raw = await getClassifiedStreets();
          const idx = buildStreetIndex(raw);

          if (alive) {
            streetsIndexRef.current = idx;
            setClassifiedStreetsRaw(Array.isArray(raw) ? raw : []);
          }
        } catch (e) {
          console.warn("getClassifiedStreets error:", e);
        }
      })();

      return () => {
        alive = false;
      };
    }, []);

  const pickDestination = (poi) => {
    setSelectedPoi(poi);
    setDetailsOpen(true);

    setRouteActive(false);
    setNavSheetOpen(false);
    setNavMode("idle");

    setFollowing(false);
    setRouteOptions([]);
    setSelectedPerfil("equilibrada");
    setActivePerfil(null);

    setRouteFullGeojson(null);
    setRouteRemainingGeojson(null);
    setRouteSegments([]);
    setEtaMin(0);

    routeNormRef.current = null;
    flatCoordsRef.current = [];
    indexMapRef.current = [];
    nearestIdxRef.current = 0;

    headingRef.current = 0;
    lastCoordRef.current = null;

    if (poi?.coords) {
      setCam({ centerCoordinate: poi.coords, zoomLevel: 15.2, pitch: 0, heading: 0, animationMode: "flyTo", animationDuration: 650 });
    }
  };

  const openNavigationSheet = () => setNavSheetOpen(true);
  const closeNavigationSheet = () => setNavSheetOpen(false);

  const clearRoute = () => {
    setNavMode("idle");
    headingRef.current = 0;
    lastCoordRef.current = null;
    nearestIdxRef.current = 0;

    resetCamera(userCoord ?? VIANA_COORDS);

    setRouteActive(false);
    setNavSheetOpen(false);

    setRouteFullGeojson(null);
    setRouteRemainingGeojson(null);
    setRouteSegments([]);
    setEtaMin(0);

    setFollowing(false);
    setRouteOptions([]);
    setSelectedPerfil("equilibrada");
    setActivePerfil(null);

    setDetailsOpen(false);
    setSelectedPoi(null);

    routeNormRef.current = null;
    flatCoordsRef.current = [];
    indexMapRef.current = [];
  };

  const centerBtnPress = () => {
    if (!userCoord) return;
    if (navModeRef.current === "follow") {
      lastCamTsRef.current = 0;
      setFollowCamera(userCoord, true);
    } else {
      resetCamera(userCoord);
    }
  };

 const startNavigation = async (poiArg) => {
  const poi = poiArg ?? selectedPoi;
  if (!poi?.coords) return;

  const from = userCoord ?? VIANA_COORDS;
  const [lng, lat] = from;
  const [lngE, latE] = poi.coords;

  const incapacidade = mapConditionToIncapacidade(conditionRef.current);

  const customPoint = isCustomDestinationPoi(poi);
  const end = customPoint ? null : resolvePoiEnd(poi);

  if (!customPoint && end == null) {
    console.warn("[Mob2is] POI sem end válido");
    return;
}

  setSelectedPoi(poi);
  setDetailsOpen(false);
  setNavSheetOpen(false);
  setFollowing(false);
  setActivePerfil(null);

  console.log("[Mob2is] startNavigation", {
    poi: poi?.title,
    end,
    incapacidade,
  });

  try {
    const resp = await calculateRouteMultiObjective({
      incapacidade,
      end,
      lati: lat,
      longi: lng,
      latE,
      lngE,
      perfil: null,
    });

    console.log("[Mob2is] resposta final multi-rota", resp);

   const rotasRaw = Array.isArray(resp?.rotas) ? resp.rotas : [resp].filter(Boolean);
   const rotas = dedupeMultiRoutes(rotasRaw);

    if (!rotas.length) {
      console.warn("[Mob2is] resposta sem rotas");
      setDetailsOpen(true);
      return;
    }

    const pick =
      rotas.find((r) => r?.perfil === "equilibrada") ||
      rotas.find((r) => r?.perfil === "rapida") ||
      rotas.find((r) => r?.perfil === "acessivel") ||
      rotas[0];

    setRouteOptions(rotas);
    setSelectedPerfil(pick?.perfil ?? "equilibrada");

    const applied = await applyPathDataToMap(pick, { keepFollowing: false });

    console.log("[Mob2is] applyPathDataToMap resultado", {
      applied,
      pickedPerfil: pick?.perfil,
    });

    if (!applied) {
      setRouteActive(false);
      setNavSheetOpen(false);
      setDetailsOpen(true);
      return;
    }

    setNavSheetOpen(true);
  } catch (e) {
    console.warn("calculateRouteMultiObjective error:", e);
    setRouteActive(false);
    setNavSheetOpen(false);
    setDetailsOpen(true);
  }
};

  const previewPerfil = async (perfil) => {
    setSelectedPerfil(perfil);
    const pd = routeOptions.find((r) => r?.perfil === perfil) || routeOptions[0];
    if (pd) await applyPathDataToMap(pd, { keepFollowing: false });
  };

  const startFollow = () => {
    setNavMode("follow");
    setNavSheetOpen(false);

    if (routeNormRef.current) {
      setRouteRemainingGeojson(routeNormRef.current);
      nearestIdxRef.current = 0;
    }

    if (userCoord) {
      lastCamTsRef.current = 0;
      setFollowCamera(userCoord, true);
    }
  };

  const confirmStartFollow = () => {
    setActivePerfil(selectedPerfil);
    setFollowing(true);
    startFollow();
  };

  // Shapes (prontos para o Map)
  const userFeature = useMemo(() => {
    if (!userCoord) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: userCoord } }],
    };
  }, [userCoord]);

  const selectedFeature = useMemo(() => {
    if (!selectedPoi?.coords) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: selectedPoi.coords } }],
    };
  }, [selectedPoi]);

  const routeShape = navMode === "follow" ? routeRemainingGeojson : routeFullGeojson;

  return {

    selectedPoi,
    detailsOpen,
    routeActive,
    navSheetOpen,
    routeOptions,
    selectedPerfil,
    following,
    etaMin,
    routeSegments,
    userCoord,
    routeShape,
    userFeature,
    selectedFeature,
    classifiedStreetsRaw,

    setDetailsOpen,
    setSelectedPoi,

 
    pickDestination,
    startNavigation,
    previewPerfil,
    confirmStartFollow,
    openNavigationSheet,
    closeNavigationSheet,
    clearRoute,
    centerBtnPress,
  };
}