import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking } from "react-native";
import Geolocation from "react-native-geolocation-service";
import { useTranslation } from "react-i18next";

import {
  calculateRouteMultiObjective,
  getApiErrorMessage,
  getClassifiedStreets,
  VIANA_COORDS,
} from "../api/mockApi";
import { haversineMeters } from "../utils/map/geo";
import { buildRouteGeojsonFromCaminho } from "../utils/map/route";
import {
  DEV_STATIC_LOCATION_COORDS,
  ensureLocationReady,
  shouldUseDevStaticLocation,
} from "../utils/locationPermission";
import { getMotionDuration } from "../utils/accessibility";
import { devLog, devWarn } from "../utils/logger";

function mapConditionToIncapacidade(conditionKey) {
  if (conditionKey === "asd") return "Autismo";
  if (conditionKey === "visual") return "Invisual";
  return "MobReduzida";
}

function isCustomDestinationPoi(poi) {
  return !!poi?.isCustomPoint || poi?.graphPointId == null;
}

function normalizePreferredPerfil(value) {
  return value === "rapida" || value === "acessivel" || value === "equilibrada"
    ? value
    : "equilibrada";
}

function formatDurationCompact(value) {
  const totalMinutes = Math.round(Number(value));
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return null;
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!minutes) return `${hours} h`;
  return `${hours} h ${String(minutes).padStart(2, "0")} min`;
}

function formatDistanceText(valueMeters) {
  const totalMeters = Math.round(Number(valueMeters));
  if (!Number.isFinite(totalMeters) || totalMeters <= 0) return "";
  if (totalMeters < 1000) return `${totalMeters} m`;
  return `${(totalMeters / 1000).toFixed(1).replace(".", ",")} km`;
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

  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const lngDeltaRad = toRad(lng2 - lng1);

  const y = Math.sin(lngDeltaRad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lngDeltaRad);

  const bearingRad = Math.atan2(y, x);
  return (toDeg(bearingRad) + 360) % 360;
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

function pointSegDistanceMeters(p, a, b) {
  const lat0 = p[1];
  const mLat = 111320;
  const mLng = 111320 * Math.cos((lat0 * Math.PI) / 180);

  const px = p[0] * mLng;
  const py = p[1] * mLat;
  const ax = a[0] * mLng;
  const ay = a[1] * mLat;
  const bx = b[0] * mLng;
  const by = b[1] * mLat;

  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;

  const vv = vx * vx + vy * vy;
  let t = 0;
  if (vv > 0) t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / vv));

  const cx = ax + t * vx;
  const cy = ay + t * vy;
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function distanceToRouteMeters(userLngLat, flatCoords, cursorIdx) {
  if (!flatCoords?.length || flatCoords.length < 2) return Infinity;

  const searchBehind = 40;
  const searchAhead = 160;
  const start = Math.max(0, (cursorIdx ?? 0) - searchBehind);
  const end = Math.min(flatCoords.length - 2, (cursorIdx ?? 0) + searchAhead);

  let best = Infinity;
  for (let i = start; i <= end; i++) {
    const d = pointSegDistanceMeters(userLngLat, flatCoords[i], flatCoords[i + 1]);
    if (d < best) best = d;
  }
  return best;
}

export default function useRouteNavigation({
  cameraRef,
  tabBarH = 0,
  insets = { top: 0, bottom: 0 },
  condition,
  routePreference,
  reduceMotion = false,
}) {
  const { t } = useTranslation();

  const conditionRef = useRef(condition);
  useEffect(() => {
    conditionRef.current = condition;
  }, [condition]);

  const routePreferenceRef = useRef(normalizePreferredPerfil(routePreference));
  useEffect(() => {
    routePreferenceRef.current = normalizePreferredPerfil(routePreference);
  }, [routePreference]);

  const [selectedPoi, setSelectedPoi] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [routeActive, setRouteActive] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false);

  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedPerfil, setSelectedPerfil] = useState(
    normalizePreferredPerfil(routePreference)
  );
  const [following, setFollowing] = useState(false);

  const [activePerfil, setActivePerfil] = useState(null);
  const activePerfilRef = useRef(null);
  useEffect(() => {
    activePerfilRef.current = activePerfil;
  }, [activePerfil]);

  const routeCalculationRequestRef = useRef(0);
  const poiPreviewRequestRef = useRef(0);

  const [navMode, setNavMode] = useState("idle");
  const navModeRef = useRef("idle");
  useEffect(() => {
    navModeRef.current = navMode;
  }, [navMode]);

  const [routeFullGeojson, setRouteFullGeojson] = useState(null);
  const [routeRemainingGeojson, setRouteRemainingGeojson] = useState(null);
  const [routeSegments, setRouteSegments] = useState([]);
  const [etaMin, setEtaMin] = useState(0);

  const [userCoord, setUserCoord] = useState(null);
  const didCenterOnUser = useRef(false);

  const routeNormRef = useRef(null);
  const flatCoordsRef = useRef([]);
  const indexMapRef = useRef([]);
  const nearestIdxRef = useRef(0);

  const headingRef = useRef(0);
  const lastCoordRef = useRef(null);
  const lastCamTsRef = useRef(0);

  const offRouteMeters = 40;
  const offRouteConfirmCount = 1;
  const minRecalcIntervalMs = 15000;

  const routeInFlightRef = useRef(false);
  const lastRecalcAtRef = useRef(0);
  const offRouteCountRef = useRef(0);

  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeCalculationMessage, setRouteCalculationMessage] = useState(
    t("routeFlow.calculating_route")
  );
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const applyLocationRef = useRef(() => {});

  const [classifiedStreetsRaw, setClassifiedStreetsRaw] = useState([]);

  useEffect(() => {
    if (!isCalculatingRoute) {
      setRouteCalculationMessage(t("routeFlow.calculating_route"));
    }
  }, [isCalculatingRoute, t]);

  useEffect(() => {
    if (routeActive) return;
    setSelectedPerfil(normalizePreferredPerfil(routePreference));
  }, [routeActive, routePreference]);

  useEffect(() => {
    if (!apiErrorMessage) return undefined;

    const timeoutId = setTimeout(() => {
      setApiErrorMessage("");
    }, 5500);

    return () => clearTimeout(timeoutId);
  }, [apiErrorMessage]);

  const beginRouteCalculationRequest = () => {
    const nextId = routeCalculationRequestRef.current + 1;
    routeCalculationRequestRef.current = nextId;
    return nextId;
  };

  const isRouteCalculationRequestActive = (requestId) =>
    routeCalculationRequestRef.current === requestId;

  const cancelRouteCalculation = () => {
    routeCalculationRequestRef.current += 1;
    poiPreviewRequestRef.current += 1;
    routeInFlightRef.current = false;
    setIsCalculatingRoute(false);
    setRouteCalculationMessage(t("routeFlow.calculating_route"));
    setApiErrorMessage("");
    setNavSheetOpen(false);
    setRouteActive(false);
    setDetailsOpen(true);
  };

  const setCam = (opts) => {
    if (!cameraRef?.current?.setCamera) return;
    cameraRef.current.setCamera({
      animationMode: "easeTo",
      animationDuration: getMotionDuration(reduceMotion, 250),
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
      animationDuration: getMotionDuration(reduceMotion, 650),
    });
  };

  const getRouteBbox = (fc) => {
    const feats = fc?.features ?? [];
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
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
      const coords = f?.geometry?.coordinates ?? [];
      coords.forEach(pushCoord);
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
        cameraRef.current.fitBounds(
          bbox.ne,
          bbox.sw,
          [paddingTop, paddingRight, paddingBottom, paddingLeft],
          getMotionDuration(reduceMotion, 650)
        );
        return;
      }

      if (cameraRef?.current?.setCamera) {
        cameraRef.current.setCamera({
          bounds: {
            ne: bbox.ne,
            sw: bbox.sw,
            paddingTop,
            paddingRight,
            paddingBottom,
            paddingLeft,
          },
          pitch: 0,
          heading: 0,
          animationMode: "easeTo",
          animationDuration: getMotionDuration(reduceMotion, 650),
        });
      }
    } catch (e) {
      console.warn("[Mob2is] fitRouteToView error:", e);
    }
  };

  const rebuildRouteCache = (routeGeojson) => {
    routeNormRef.current = routeGeojson;
    flatCoordsRef.current = [];
    indexMapRef.current = [];
    nearestIdxRef.current = 0;

    const feats = routeGeojson?.features ?? [];
    for (let fi = 0; fi < feats.length; fi++) {
      const coords = feats[fi]?.geometry?.coordinates ?? [];
      for (let ci = 0; ci < coords.length; ci++) {
        flatCoordsRef.current.push(coords[ci]);
        indexMapRef.current.push({ featureIndex: fi, coordIndex: ci });
      }
    }

    setRouteRemainingGeojson(routeGeojson);
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
    const windowSize = 220;
    const from = Math.max(0, lastIdx - windowSize);
    const to = Math.min(flat.length - 1, lastIdx + windowSize);

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
      animationDuration: getMotionDuration(reduceMotion, 220),
    });
  };

  const applyPathDataToMap = async (pd, { keepFollowing = false, fromLngLat = null } = {}) => {
    if (!pd) {
      devWarn("[Mob2is] applyPathDataToMap sem path data");
      return false;
    }

    const caminho = Array.isArray(pd?.caminho) ? pd.caminho : [];
    const accessArr = pd?.niveis_acessibilidade ?? pd?.cores ?? [];

    devLog("[Mob2is] applyPathDataToMap input", {
      perfil: pd?.perfil,
      caminhoCount: caminho.length,
      accessCount: Array.isArray(accessArr) ? accessArr.length : 0,
    });

    const built = buildRouteGeojsonFromCaminho(caminho, accessArr);
    const routeGeojson = built.geojson;

    if (!routeGeojson?.features?.length) {
      console.warn("[Mob2is] sem geometria desenhavel na rota", {
        perfil: pd?.perfil,
        pd,
      });
      return false;
    }

    setRouteFullGeojson(routeGeojson);
    rebuildRouteCache(routeGeojson);

    setRouteSegments(built.segments);
    setEtaMin(
      Number.isFinite(Number(pd?.estimated_time_min)) && Number(pd?.estimated_time_min) > 0
        ? Math.round(Number(pd.estimated_time_min))
        : 0
    );
    setRouteActive(true);

    if (!keepFollowing) {
      setNavMode("preview");
      fitRouteToView(routeGeojson, { bottomPad: tabBarH + 420 });
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
      throw new Error("POI sem identificador de destino valido (Ponto/graphPointId).");
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

    const pd = Array.isArray(resp?.rotas)
      ? resp.rotas.find((r) => r?.perfil === perfil) || resp.rotas[0]
      : resp;
    await applyPathDataToMap(pd, { keepFollowing: true, fromLngLat });
  };

  const maybeRecalculateOffRoute = async (userLngLat) => {
    if (navModeRef.current !== "follow") return;
    if (!routeNormRef.current) return;
    if (routeInFlightRef.current) return;

    const now = Date.now();
    if (now - lastRecalcAtRef.current < minRecalcIntervalMs) return;

    const d = distanceToRouteMeters(userLngLat, flatCoordsRef.current, nearestIdxRef.current);

    if (d <= offRouteMeters) {
      offRouteCountRef.current = 0;
      return;
    }

    offRouteCountRef.current += 1;
    if (offRouteCountRef.current < offRouteConfirmCount) return;

    offRouteCountRef.current = 0;
    lastRecalcAtRef.current = now;
    routeInFlightRef.current = true;

    try {
      await recalcRouteFromHere(userLngLat);
      setApiErrorMessage("");
    } catch (error) {
      console.warn("[Mob2is] recalculateRouteFromHere error:", error);
      setApiErrorMessage(getApiErrorMessage(error, t("api.cannot_recalculate_route")));
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
      setCam({
        centerCoordinate: c,
        zoomLevel: 15,
        pitch: 0,
        heading: 0,
        animationMode: "flyTo",
        animationDuration: getMotionDuration(reduceMotion, 900),
      });
      return;
    }

    if (navModeRef.current === "follow") {
      setFollowCamera(c);
      maybeRecalculateOffRoute(c);
    }
  };

  useEffect(() => {
    applyLocationRef.current = applyLocation;
  });

  useEffect(() => {
    let watchId = null;
    let alive = true;

    const start = async () => {
      try {
        if (shouldUseDevStaticLocation()) {
          console.log("[Mob2is] A usar localização fixa de desenvolvimento", {
            lng: DEV_STATIC_LOCATION_COORDS[0],
            lat: DEV_STATIC_LOCATION_COORDS[1],
          });
          applyLocationRef.current(DEV_STATIC_LOCATION_COORDS[0], DEV_STATIC_LOCATION_COORDS[1]);
          return;
        }

        watchId = Geolocation.watchPosition(
          (pos) => {
            if (!alive) return;
            const { longitude, latitude } = pos.coords || {};
            applyLocationRef.current(longitude, latitude);
          },
          (err) => devWarn("[Mob2is] watchPosition error:", err),
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
        devWarn("[Mob2is] start watch error:", e);
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
        if (alive) {
          setClassifiedStreetsRaw(Array.isArray(raw) ? raw : []);
          setApiErrorMessage("");
        }
      } catch (e) {
        console.warn("getClassifiedStreets error:", e);
        if (alive) {
          setApiErrorMessage(getApiErrorMessage(e, t("api.cannot_load_street_accessibility")));
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [t]);

  const pickDestination = (poi) => {
    poiPreviewRequestRef.current += 1;
    setSelectedPoi(
      poi?.isCustomPoint
        ? {
            ...poi,
            routePreviewLoaded: true,
            routePreviewLoading: false,
          }
        : {
            ...poi,
            etaText: userCoord ? t("common.loading") : poi?.etaText,
            distanceText: userCoord ? "" : poi?.distanceText,
            routePreviewLoaded: false,
            routePreviewLoading: false,
          }
    );
    setDetailsOpen(true);
    setApiErrorMessage("");

    setRouteActive(false);
    setNavSheetOpen(false);
    setNavMode("idle");

    setFollowing(false);
    setRouteOptions([]);
    setSelectedPerfil(routePreferenceRef.current);
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
      setCam({
        centerCoordinate: poi.coords,
        zoomLevel: 15.2,
        pitch: 0,
        heading: 0,
        animationMode: "flyTo",
        animationDuration: getMotionDuration(reduceMotion, 650),
      });
    }
  };

  useEffect(() => {
    if (routeActive || !detailsOpen || !selectedPoi?.coords || selectedPoi?.isCustomPoint || !userCoord) {
      return;
    }

    if (selectedPoi?.routePreviewLoaded || selectedPoi?.routePreviewLoading) {
      return;
    }

    const requestId = poiPreviewRequestRef.current + 1;
    poiPreviewRequestRef.current = requestId;
    const poiId = String(selectedPoi.id);

    setSelectedPoi((current) => {
      if (!current || String(current.id) !== poiId) return current;
      return {
        ...current,
        routePreviewLoading: true,
        etaText: current.etaText || t("common.loading"),
      };
    });

    (async () => {
      try {
        const incapacidade = mapConditionToIncapacidade(conditionRef.current);
        const [lng, lat] = userCoord;
        const [lngE, latE] = selectedPoi.coords;
        const preferredPerfil = normalizePreferredPerfil(routePreferenceRef.current);
        const end = resolvePoiEnd(selectedPoi);

        if (end == null) {
          throw new Error("POI sem identificador de destino valido.");
        }

        const resp = await calculateRouteMultiObjective({
          incapacidade,
          end,
          lati: lat,
          longi: lng,
          latE,
          lngE,
          perfil: preferredPerfil,
        });

        if (poiPreviewRequestRef.current !== requestId) return;

        const rotas = Array.isArray(resp?.rotas) ? resp.rotas : [resp].filter(Boolean);
        const previewRoute =
          rotas.find((item) => item?.perfil === preferredPerfil) ||
          rotas.find((item) => item?.perfil === "equilibrada") ||
          rotas[0];

        const etaValue =
          Number(previewRoute?.estimated_time_min) > 0
            ? t("navigation.eta_value", {
                value: formatDurationCompact(previewRoute.estimated_time_min),
              })
            : t("poiDetails.fallback_eta");
        const distanceValue = formatDistanceText(previewRoute?.total_distance_m);

        setSelectedPoi((current) => {
          if (!current || String(current.id) !== poiId) return current;
          return {
            ...current,
            etaText: etaValue,
            distanceText: distanceValue,
            routePreviewLoading: false,
            routePreviewLoaded: true,
          };
        });
      } catch (error) {
        if (poiPreviewRequestRef.current !== requestId) return;

        devWarn("[Mob2is] preview route summary error:", error);
        setSelectedPoi((current) => {
          if (!current || String(current.id) !== poiId) return current;
          return {
            ...current,
            routePreviewLoading: false,
            routePreviewLoaded: true,
          };
        });
      }
    })();
  }, [detailsOpen, routeActive, selectedPoi, t, userCoord]);

  const openNavigationSheet = () => setNavSheetOpen(true);
  const closeNavigationSheet = () => setNavSheetOpen(false);

  const clearRoute = () => {
    routeCalculationRequestRef.current += 1;
    poiPreviewRequestRef.current += 1;
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
    setSelectedPerfil(routePreferenceRef.current);
    setActivePerfil(null);
    setApiErrorMessage("");

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

  const handleRouteLocationFailure = (status) => {
    if (status === "denied") {
      Alert.alert(
        t("routeFlow.permission_required_title"),
        t("routeFlow.permission_required_message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("routeFlow.open_settings"),
            onPress: () => {
              Linking.openSettings().catch((error) => {
                console.warn("[Mob2is] Não foi possível abrir as definições:", error);
              });
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      t("routeFlow.enable_location_title"),
      t("routeFlow.enable_location_message"),
      [{ text: t("common.ok") }]
    );
  };

  const ensureLocationForRoute = async () => {
    const locationState = await ensureLocationReady({ prompt: true });

    if (!locationState.ok) {
      handleRouteLocationFailure(locationState.status);
      return null;
    }

    if (Array.isArray(locationState.coords)) {
      applyLocation(locationState.coords[0], locationState.coords[1]);
      return locationState.coords;
    }

    return null;
  };

  const startNavigation = async (poiArg) => {
    const poi = poiArg ?? selectedPoi;
    if (!poi?.coords) return;

    const [lngE, latE] = poi.coords;
    const incapacidade = mapConditionToIncapacidade(conditionRef.current);

    const end = resolvePoiEnd(poi);
    if (end == null && !poi?.isCustomPoint) {
      console.warn("[Mob2is] POI sem end valido");
      return;
    }

    const requestId = beginRouteCalculationRequest();
    setIsCalculatingRoute(true);
    setRouteCalculationMessage(t("routeFlow.checking_location"));
    setApiErrorMessage("");

    devLog("[Mob2is] startNavigation", {
      poi: poi?.title,
      end: poi?.isCustomPoint ? null : end,
      incapacidade,
    });

    try {
      const from = await ensureLocationForRoute();
      if (!isRouteCalculationRequestActive(requestId)) return;

      if (!from) {
        setDetailsOpen(true);
        return;
      }

      const [lng, lat] = from;

      setSelectedPoi(poi);
      setDetailsOpen(false);
      setNavSheetOpen(false);
      setFollowing(false);
      setActivePerfil(null);
      setRouteCalculationMessage(t("routeFlow.calculating_route"));

      const resp = await calculateRouteMultiObjective({
        incapacidade,
        end: poi?.isCustomPoint ? null : end,
        lati: lat,
        longi: lng,
        latE,
        lngE,
        perfil: null,
      });
      if (!isRouteCalculationRequestActive(requestId)) return;

      devLog("[Mob2is] resposta final multi-rota", resp);

      const rotas = Array.isArray(resp?.rotas) ? resp.rotas : [resp].filter(Boolean);
      if (!rotas.length) {
        console.warn("[Mob2is] resposta sem rotas");
        setDetailsOpen(true);
        return;
      }

      const preferredOrder = [
        routePreferenceRef.current,
        "equilibrada",
        "rapida",
        "acessivel",
      ].filter((perfil, index, arr) => arr.indexOf(perfil) === index);

      const pick =
        preferredOrder
          .map((perfil) => rotas.find((route) => route?.perfil === perfil))
          .find(Boolean) || rotas[0];

      setRouteOptions(rotas);
      setSelectedPerfil(pick?.perfil ?? "equilibrada");

      const applied = await applyPathDataToMap(pick, { keepFollowing: false });
      if (!isRouteCalculationRequestActive(requestId)) return;

      devLog("[Mob2is] applyPathDataToMap resultado", {
        applied,
        pickedPerfil: pick?.perfil,
      });

      if (!applied) {
        setRouteActive(false);
        setNavSheetOpen(false);
        setDetailsOpen(true);
        return;
      }

      setApiErrorMessage("");
      setNavSheetOpen(true);
    } catch (e) {
      if (!isRouteCalculationRequestActive(requestId)) return;
      console.warn("calculateRouteMultiObjective error:", e);
      setApiErrorMessage(getApiErrorMessage(e, t("api.cannot_calculate_route")));
      setRouteActive(false);
      setNavSheetOpen(false);
      setDetailsOpen(true);
    } finally {
      if (isRouteCalculationRequestActive(requestId)) {
        setIsCalculatingRoute(false);
        setRouteCalculationMessage(t("routeFlow.calculating_route"));
      }
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

  const userFeature = useMemo(() => {
    if (!userCoord) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: userCoord },
        },
      ],
    };
  }, [userCoord]);

  const selectedFeature = useMemo(() => {
    if (!selectedPoi?.coords) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: selectedPoi.coords },
        },
      ],
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
    isCalculatingRoute,
    routeCalculationMessage,
    apiErrorMessage,
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
    cancelRouteCalculation,
  };
}
