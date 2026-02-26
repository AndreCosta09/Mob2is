import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  View,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  Modal,
  PermissionsAndroid,
} from "react-native";
import Geolocation from "react-native-geolocation-service";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserContext } from "../context/UserContext";
import { calculateRoute, getClassifiedStreets, getPOIs, VIANA_COORDS } from "../api/mockApi";

import Svg, { Path, Circle, Rect, Line } from "react-native-svg";

import ExploreSearchPanel from "../components/ExploreSearchPanel";
import PoiDetailsSheet from "../components/PoiDetailsSheet";
import NavigationSheet from "../components/NavigationSheet";

import { extractLinesFromCaminho, splitLineOnGaps } from "../utils/map/geo";
import {
  buildStreetIndex,
  buildRouteGeojsonFromPontos,
  buildRouteGeojsonFromCaminho,
  estimateEtaMinutesFromLines,
} from "../utils/map/route";

import { useTranslation } from "react-i18next";


const MAPTILER_KEY = "sZvLsgabyQeCL0ehvC55";
const MAP_STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;



function normTxt(s) {
  return (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function iconNameForPoi(poi) {
  const cat = normTxt(poi?.categoryName ?? poi?.categoryId);

  if (cat.includes("saud") || cat.includes("hospital") || cat.includes("clin")) return "health";
  if (cat.includes("cultur") || cat.includes("muse") || cat.includes("teatr") || cat.includes("monum"))
    return "culture";
  if (cat.includes("escol") || cat.includes("educ") || cat.includes("univers")) return "education";
  if (cat.includes("transp") || cat.includes("autocar") || cat.includes("comboio") || cat.includes("parag"))
    return "transport";
  if (cat.includes("rest") || cat.includes("comid") || cat.includes("cafe") || cat.includes("bar"))
    return "food";
  if (cat.includes("desport") || cat.includes("ginas") || cat.includes("pisc")) return "sport";

  return "default";
}

function categoryKeyFromName(nameOrId) {
  const cat = normTxt(nameOrId);

  if (cat.includes("cultur")) return "culture";
  if (cat.includes("saud") || cat.includes("hospital") || cat.includes("clin")) return "health";
  if (cat.includes("transp") || cat.includes("autocar") || cat.includes("comboio")) return "transport";
  if (cat.includes("servic") || cat.includes("public")) return "public_services";
  if (cat.includes("turism")) return "tourism";

  return "other";
}



function mapConditionToIncapacidade(conditionKey) {
  if (conditionKey === "asd") return "Autismo";
  if (conditionKey === "visual") return "Invisual";
  return "MobReduzida";
}

function haversineMeters([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
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

const ICON_COLOR = "#051F41";

function IconDefault({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx="12" cy="11" r="2.5" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
function IconHealth({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z" fill={color} />
    </Svg>
  );
}
function IconCulture({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 10h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M6 10v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M10 10v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 10v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M18 10v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M3.5 10 12 5l8.5 5" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M4 19h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
function IconEducation({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 6h7a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H5V6Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M19 6h-7a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h7V6Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M8 10h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
function IconTransport({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M7 8h10" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="8" cy="18" r="1.7" stroke={color} strokeWidth={2} />
      <Circle cx="16" cy="18" r="1.7" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
function IconFood({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 3v8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M5 3v8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9 3v8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M7 11v10" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M15 3v8c0 1.5 1 2.5 2.5 2.5V21" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 8h5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
function IconSport({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="9" width="3" height="6" rx="1" stroke={color} strokeWidth={2} />
      <Rect x="18" y="9" width="3" height="6" rx="1" stroke={color} strokeWidth={2} />
      <Path d="M6 12h12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x="8" y="10" width="8" height="4" rx="1" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

const POI_SVG = {
  default: IconDefault,
  health: IconHealth,
  culture: IconCulture,
  education: IconEducation,
  transport: IconTransport,
  food: IconFood,
  sport: IconSport,
};

function PoiSvgIcon({ name, size = 18, color }) {
  const Comp = POI_SVG[name] ?? IconDefault;
  return <Comp size={size} color={color} />;
}

function IconCenter({ size = 22, color = "#051F41", accent = "#F09C1F" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="2.5" fill={accent} />
      <Path d="M12 2v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 19v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M2 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M19 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}


export default function MapScreen() {
  const tabBarH = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);

  const { condition } = useContext(UserContext) ?? {};

  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [routeActive, setRouteActive] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false);

  
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

  const streetsIndexRef = useRef(null);

  
  const routeNormRef = useRef(null);
  const flatCoordsRef = useRef([]);
  const indexMapRef = useRef([]); 
  const nearestIdxRef = useRef(0);

  const headingRef = useRef(0);
  const lastCoordRef = useRef(null);
  const lastCamTsRef = useRef(0);

 
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);


  
  const { t } = useTranslation();

  const categories = useMemo(() => {
    const map = new Map();
    for (const p of pois ?? []) {
      if (!p?.categoryId) continue;
      const key = categoryKeyFromName(p.categoryName ?? String(p.categoryId));
      const prev = map.get(p.categoryId) ?? { id: p.categoryId, name: p.categoryName ?? String(p.categoryId), key,count: 0 };
      prev.count += 1;
      map.set(p.categoryId, prev);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [pois]);

  const filteredPois = useMemo(() => {
    if (!selectedCatIds.length) return pois ?? [];
    const s = new Set(selectedCatIds);
    return (pois ?? []).filter((p) => s.has(p.categoryId));
  }, [pois, selectedCatIds]);

  const toggleCat = (id) => {
    setSelectedCatIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };


  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await getPOIs();
        if (alive) setPois(list);
      } catch (e) {
        console.warn("getPOIs error:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await getClassifiedStreets();
        const idx = buildStreetIndex(raw);
        if (alive) streetsIndexRef.current = idx;
        console.log("[Mob2is] classified streets indexed:", idx.size);
      } catch (e) {
        console.warn("getClassifiedStreets error:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ====== map style (remove default POI icons) ======
  const [mapStyle, setMapStyle] = useState(MAP_STYLE_URL);
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(MAP_STYLE_URL);
        const style = await res.json();
        style.layers = (style.layers ?? []).filter((l) => {
          const hasIcon = !!l?.layout?.["icon-image"];
          return !(l?.type === "symbol" && hasIcon);
        });
        if (alive) setMapStyle(style);
      } catch (e) {
        console.warn("[Mob2is] Falha ao carregar estilo, a usar URL normal:", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ====== location watch (SÓ isto -> acaba o “duas bolas”) ======
  useEffect(() => {
    let watchId = null;
    let alive = true;

    const start = async () => {
      try {
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

  // ====== camera helpers ======
  const setCam = (opts) => {
    if (!cameraRef.current?.setCamera) return;
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

  // ====== build route cache for “remaining” ======
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

    // default remaining = full
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
          properties: { ...(f.properties ?? {}) }, // mantém "color"
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

    // procura numa janela à volta do último idx (mais rápido)
    const W = 220;
    let from = Math.max(0, lastIdx - W);
    let to = Math.min(flat.length - 1, lastIdx + W);

    let bestIdx = lastIdx;
    let bestD = Infinity;

    for (let i = from; i <= to; i++) {
      const d = haversineMeters(userC, flat[i]);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }

    // se estivermos muito longe da janela (teleporte), faz scan completo
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

    // não andar para trás e evita updates “micro”
    if (bestIdx <= lastIdx) return;
    if (bestIdx - lastIdx < 3) return;

    nearestIdxRef.current = bestIdx;
    setRouteRemainingGeojson(buildRemainingFromIndex(bestIdx));
  };

  const setFollowCamera = (c, force = false) => {
    const now = Date.now();
    if (!force && now - lastCamTsRef.current < 280) return;
    lastCamTsRef.current = now;

    // heading suave a partir do movimento real
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
        animationDuration: 900,
      });
      return;
    }

    if (navModeRef.current === "follow") {
      setFollowCamera(c);
    }
  };

  // ====== map layers sources ======
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

  // ====== UI actions ======
  const pickDestination = (poi) => {
    setSelectedPoi(poi);
    setDetailsOpen(true);

    setRouteActive(false);
    setNavSheetOpen(false);
    setNavMode("idle");

    setRouteFullGeojson(null);
    setRouteRemainingGeojson(null);
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
        animationDuration: 650,
      });
    }
  };

  const startFollow = () => {
    setNavMode("follow");
    setNavSheetOpen(false);

    // garantir “remaining” começa no full
    if (routeNormRef.current) {
      setRouteRemainingGeojson(routeNormRef.current);
      nearestIdxRef.current = 0;
    }

    if (userCoord) {
      // força um update imediato para evitar “saltos”
      lastCamTsRef.current = 0;
      setFollowCamera(userCoord, true);
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

  // ====== route build ======
  const startNavigation = async (poi) => {
    if (!poi?.coords) return;

    const from = userCoord ?? VIANA_COORDS;
    const [lng, lat] = from;
    const [lngE, latE] = poi.coords;
    const incapacidade = mapConditionToIncapacidade(condition);

    const end =
      poi.graphPointId != null
        ? Number(poi.graphPointId)
        : Number.isFinite(Number(poi.id))
        ? Number(poi.id)
        : null;

    try {
      const resp = await calculateRoute({
        incapacidade,
        end,
        lati: lat,
        longi: lng,
        latE,
        lngE,
      });

      const cores = Array.isArray(resp?.cores) ? resp.cores : [];
      const pontos = Array.isArray(resp?.pontos) ? resp.pontos : null;
      const streetsIndex = streetsIndexRef.current;

      // 1) prefer ponto+streets
      const builtFromPontos = pontos && streetsIndex ? buildRouteGeojsonFromPontos(pontos, cores, streetsIndex) : null;

      if (builtFromPontos?.geojson?.features?.length) {
        const norm = normalizeRouteGeojson(builtFromPontos.geojson);
        setRouteFullGeojson(norm);
        rebuildRouteCache(norm);

        setRouteSegments(builtFromPontos.segments);
        setEtaMin(estimateEtaMinutesFromLines(builtFromPontos.linesForEta, condition));

        setRouteActive(true);
        setNavMode("preview");
        setNavSheetOpen(true);
        setDetailsOpen(false);

        // preview camera (um pouco mais perto)
        const midLine = builtFromPontos.linesForEta[Math.floor(builtFromPontos.linesForEta.length / 2)];
        const midCoord = midLine?.[Math.floor(midLine.length / 2)] ?? builtFromPontos.linesForEta[0]?.[0];
        if (midCoord) {
          setCam({
            centerCoordinate: midCoord,
            zoomLevel: 16.8,
            pitch: 48,
            heading: 0,
            animationMode: "flyTo",
            animationDuration: 700,
          });
        }

        return;
      }

      // 2) fallback caminho
      const lines = extractLinesFromCaminho(resp?.caminho);
      const safeLines = lines.flatMap((l) => splitLineOnGaps(l, 350));
      if (!safeLines.length) {
        console.warn("[Mob2is] Rota sem coordenadas suficientes.", resp);
        return;
      }

      const built = buildRouteGeojsonFromCaminho(safeLines, cores);
      const norm = normalizeRouteGeojson(built.geojson);

      setRouteFullGeojson(norm);
      rebuildRouteCache(norm);

      setRouteSegments(built.segments);
      setEtaMin(estimateEtaMinutesFromLines(safeLines, condition));

      setRouteActive(true);
      setNavMode("preview");
      setNavSheetOpen(true);
      setDetailsOpen(false);

      const midLine = safeLines[Math.floor(safeLines.length / 2)];
      const midCoord = midLine?.[Math.floor(midLine.length / 2)] ?? safeLines[0]?.[0];
      if (midCoord) {
        setCam({
          centerCoordinate: midCoord,
          zoomLevel: 16.8,
          pitch: 48,
          heading: 0,
          animationMode: "flyTo",
          animationDuration: 700,
        });
      }
    } catch (e) {
      console.warn("calculateRoute error:", e);
    }
  };

  // ✅ isto substitui o teu “navRemainingGeojson”
  const routeShape = navMode === "follow" ? routeRemainingGeojson : routeFullGeojson;

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        preferredFramesPerSecond={30}
        surfaceView={true}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: VIANA_COORDS,
            zoomLevel: 15,
            pitch: 0,
            heading: 0,
          }}
        />

        {/* USER (um só ponto) */}
        <MapLibreGL.ShapeSource id="user" shape={userFeature}>
          <MapLibreGL.CircleLayer
            id="user-halo"
            style={{
              circleRadius: 15,
              circleColor: "#F09C1F",
              circleOpacity: 0.18,
              circlePitchAlignment: "map",
            }}
          />
          <MapLibreGL.CircleLayer
            id="user-dot"
            style={{
              circleRadius: 7,
              circleColor: "#1579B3",
              circleStrokeWidth: 3,
              circleStrokeColor: "#FFFFFF",
              circlePitchAlignment: "map",
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* POIs */}
        {(filteredPois ?? [])
          .filter((p) => Array.isArray(p?.coords))
          .map((p) => (
            <MapLibreGL.PointAnnotation
              key={`poi-${p.id}`}
              id={`poi-${p.id}`}
              coordinate={p.coords}
              onSelected={() => pickDestination(p)}
            >
              <View style={styles.poiMarker}>
                <PoiSvgIcon name={iconNameForPoi(p)} size={18} />
              </View>
            </MapLibreGL.PointAnnotation>
          ))}

        {/* destino */}
        <MapLibreGL.ShapeSource id="selected-dest" shape={selectedFeature}>
          <MapLibreGL.CircleLayer
            id="dest-halo"
            style={{
              circleRadius: 12,
              circleColor: "#35B46F",
              circleOpacity: 0.25,
              circlePitchAlignment: "map",
            }}
          />
          <MapLibreGL.CircleLayer
            id="dest-dot"
            style={{
              circleRadius: 7,
              circleColor: "#35B46F",
              circleStrokeWidth: 3,
              circleStrokeColor: "#FFFFFF",
              circlePitchAlignment: "map",
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* rota (cores mantidas com ["get","color"]) */}
        {routeActive && routeShape?.features?.length ? (
          <MapLibreGL.ShapeSource id="route" shape={routeShape}>
            <MapLibreGL.LineLayer
              id="route-shadow"
              style={{
                lineWidth: 11,
                lineColor: "#000000",
                lineOpacity: 0.14,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <MapLibreGL.LineLayer
              id="route-main"
              style={{
                lineWidth: 8,
                lineColor: ["get", "color"],
                lineOpacity: 0.98,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </MapLibreGL.ShapeSource>
        ) : null}
      </MapLibreGL.MapView>

 
      {userCoord ? (
        <Pressable
          onPress={centerBtnPress}
          style={[
            styles.centerBtn,
            { top: insets.top + 82 }, 
          ]}
          accessibilityLabel={t("a11y.map_center_user")}
        >
          <IconCenter />
        </Pressable>
      ) : null}

      {!routeActive && !detailsOpen && categories.length > 1 ? (
        <>
          <Pressable
            style={[styles.filterFab, { top: insets.top + 10 }]}
            onPress={() => setFilterOpen(true)}
            accessibilityLabel={t("a11y.map_open_filters")}
          >
            <Text style={styles.filterFabTitle}>{t("map.filters_title")}</Text>
            <Text style={styles.filterFabSub}>
              {selectedCatIds.length
                  ? t("map.summary_selected", { selected: selectedCatIds.length, visible: filteredPois.length })
                  : t("map.summary_pois_visible", { count: filteredPois.length })}
            </Text>

            {selectedCatIds.length ? (
              <View style={styles.filterFabBadge}>
                <Text style={styles.filterFabBadgeText}>{selectedCatIds.length}</Text>
              </View>
            ) : null}
          </Pressable>

          <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setFilterOpen(false)} />

            <View style={[styles.filterSheet, { paddingBottom: insets.bottom + tabBarH + 12 }]}>
              <View style={styles.sheetHandle} />

              <View style={styles.filterHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filterTitle}>{t("map.filter_sheet_title")}</Text>
                  <Text style={styles.filterSubtitle}>
                    {selectedCatIds.length
                      ? t("map.summary_selected", { selected: selectedCatIds.length, visible: filteredPois.length })
                      : t("map.summary_points_visible", { count: filteredPois.length })}

                  </Text>
                </View>

                <Pressable onPress={() => setSelectedCatIds([])} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>{t("common.clear")}</Text>
                </Pressable>

                <Pressable onPress={() => setFilterOpen(false)} style={styles.btnPrimary}>
                  <View style={styles.btnPrimaryDot} />
                  <Text style={styles.btnPrimaryText}>{t("common.done")}</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.filterGrid} showsVerticalScrollIndicator={false}>
                {categories.map((c) => {
                  const active = selectedCatIds.includes(c.id);
                  const iconName = iconNameForPoi({ categoryName: c.name, categoryId: c.id });

                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => toggleCat(c.id)}
                      style={[styles.catCard, active && styles.catCardActive]}
                    >
                      <View style={[styles.catIconWrap, active && styles.catIconWrapActive]}>
                        <PoiSvgIcon
                          name={iconName}
                          size={16}
                          color={active ? "#1579B3" : "rgba(5,31,65,0.85)"}
                        />
                      </View>

                      <Text numberOfLines={2} style={[styles.catName, active && styles.catNameActive]}>
                        {t(`categories.${c.key}`, { defaultValue: c.name })}
                      </Text>

                      <View style={[styles.catCountPill, active && styles.catCountPillActive]}>
                        <Text style={[styles.catCountText, active && styles.catCountTextActive]}>{c.count}</Text>
                      </View>

                      {active ? <View style={styles.catCheck} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Modal>
        </>
      ) : null}

     
      {routeActive && !navSheetOpen ? (
        <Pressable
          style={[styles.routePill, { bottom: tabBarH + 18 }]}
          onPress={openNavigationSheet}
          accessibilityLabel={t("a11y.map_open_route_details")}
        >
          <View style={styles.routePillBadge} />
          <Text style={styles.routePillText}>{t("map.route_details")}</Text>
        </Pressable>
      ) : null}

      {!routeActive && !detailsOpen ? (
        <ExploreSearchPanel bottomOffset={tabBarH + 10} onPickDestination={pickDestination} />
      ) : null}

      <PoiDetailsSheet
        visible={!routeActive && detailsOpen && !!selectedPoi}
        poi={selectedPoi}
        onClose={() => setDetailsOpen(false)}
        onStartNavigation={startNavigation}
      />

      <NavigationSheet
        active={routeActive && !!selectedPoi}
        open={navSheetOpen}
        bottomOffset={tabBarH + 50}
        poi={selectedPoi}
        etaMin={etaMin}
        segments={routeSegments}
        following={navMode === "follow"}
        onClose={closeNavigationSheet}
        onStartFollow={startFollow}
        onClear={clearRoute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  map: { flex: 1 },

  centerBtn: {
    position: "absolute",
    right: 14,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(246,247,249,0.96)",
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.10)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },

  filterFab: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(246,247,249,0.96)",
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.08)",
    paddingHorizontal: 14,
    justifyContent: "center",
    zIndex: 120,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  filterFabTitle: { fontWeight: "900", color: "#051F41", fontSize: 14 },
  filterFabSub: { marginTop: 2, color: "rgba(5,31,65,0.75)", fontWeight: "800", fontSize: 12 },
  filterFabBadge: {
    position: "absolute",
    right: 12,
    top: 14,
    height: 28,
    minWidth: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#F09C1F",
    alignItems: "center",
    justifyContent: "center",
  },
  filterFabBadgeText: { color: "#051F41", fontWeight: "900" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(5,31,65,0.28)" },

  filterSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(243,245,247,0.99)",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.08)",
    paddingTop: 10,
    paddingHorizontal: 14,
    elevation: 26,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -10 },
  },
  sheetHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(11,45,77,0.16)",
    marginBottom: 10,
  },
  filterHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 12 },
  filterTitle: { fontWeight: "900", fontSize: 16, color: "#051F41" },
  filterSubtitle: { marginTop: 2, fontWeight: "800", fontSize: 12, color: "rgba(5,31,65,0.62)" },

  btnGhost: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(21,121,179,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhostText: { fontWeight: "900", color: "#1579B3" },

  btnPrimary: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#1579B3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPrimaryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F09C1F" },
  btnPrimaryText: { fontWeight: "900", color: "#FFFFFF" },

  filterGrid: { paddingBottom: 18, flexDirection: "row", flexWrap: "wrap", gap: 12 },

  catCard: {
    width: "48%",
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  catCheck: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#39A25D",
  },
  catCardActive: { backgroundColor: "rgba(21,121,179,0.10)", borderColor: "rgba(21,121,179,0.55)" },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(5,31,65,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  catIconWrapActive: { backgroundColor: "rgba(21,121,179,0.14)" },
  catName: { flex: 1, fontWeight: "900", color: "#051F41", fontSize: 13 },
  catNameActive: { color: "#051F41" },
  catCountPill: {
    height: 26,
    minWidth: 30,
    paddingHorizontal: 9,
    borderRadius: 13,
    backgroundColor: "rgba(5,31,65,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  catCountPillActive: { backgroundColor: "rgba(240,156,31,0.22)", borderWidth: 1, borderColor: "rgba(240,156,31,0.55)" },
  catCountText: { fontWeight: "900", color: "rgba(5,31,65,0.78)" },
  catCountTextActive: { color: "#051F41" },

  poiMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 2,
    borderColor: "rgba(11,45,77,0.12)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },

  routePill: {
    position: "absolute",
    right: 16,
    maxWidth: 260,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#051F41",
    borderWidth: 1,
    borderColor: "rgba(21,121,179,0.45)",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 80,
    elevation: 80,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  routePillBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#F09C1F", marginRight: 10 },
  routePillText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
});
