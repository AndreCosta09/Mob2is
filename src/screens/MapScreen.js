import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform, View, StyleSheet, Pressable, Text } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { UserContext } from "../context/UserContext";
import { calculateRoute, getClassifiedStreets, getPOIs, VIANA_COORDS } from "../api/mockApi";

import ExploreSearchPanel from "../components/ExploreSearchPanel";
import PoiDetailsSheet from "../components/PoiDetailsSheet";
import NavigationSheet from "../components/NavigationSheet";

const MAPTILER_KEY = "sZvLsgabyQeCL0ehvC55";
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

function mapConditionToIncapacidade(conditionKey) {
  if (conditionKey === "asd") return "Autismo";
  if (conditionKey === "visual") return "Invisual";
  return "MobReduzida";
}

function toNum(v) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function isPointLike(obj) {
  if (!obj || typeof obj !== "object") return false;
  const lat = toNum(obj.latitude ?? obj.lat ?? obj.y);
  const lng = toNum(obj.longitude ?? obj.lng ?? obj.long ?? obj.x);
  return lat != null && lng != null;
}

function pointToLngLat(obj) {
  const lat = toNum(obj.latitude ?? obj.lat ?? obj.y);
  const lng = toNum(obj.longitude ?? obj.lng ?? obj.long ?? obj.x);
  if (lat == null || lng == null) return null;
  return [lng, lat];
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

function splitLineOnGaps(line, maxGapMeters = 350) {
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

function extractLinesFromCaminho(caminho) {

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
      // embrulhos típicos
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

function hexToRgb(hex) {
  if (!hex) return null;
  const h = String(hex).trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

function rgbToHsv({ r, g, b }) {
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const max = Math.max(rp, gp, bp);
  const min = Math.min(rp, gp, bp);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rp) h = ((gp - bp) / d) % 6;
    else if (max === gp) h = (bp - rp) / d + 2;
    else h = (rp - gp) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function accessibilityLabelFromColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Alta acessibilidade";
  const { h, s } = rgbToHsv(rgb);

  if (s > 0.18) {
    if (h < 15 || h >= 330) return "Baixa acessibilidade";
    if (h >= 15 && h < 75) return "Média acessibilidade";
  }
  return "Alta acessibilidade";
}

const ACCESS_COLORS = {
  alta: "#39A25D", 
  media: "#F0B429", 
  baixa: "#FF4D6D",
};

function rgbLuma({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; 
}

function levelFromApiColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Alta acessibilidade";

  const { h } = rgbToHsv(rgb);
  const l = rgbLuma(rgb);

  if (h >= 80 && h <= 170) return "Alta acessibilidade";
  if (h >= 170 && h <= 260) {
    return l < 0.42 ? "Baixa acessibilidade" : "Média acessibilidade";
  }

  return accessibilityLabelFromColor(hex);
}

function paletteColorFromLevel(level) {
  if (level === "Baixa acessibilidade") return ACCESS_COLORS.baixa;
  if (level === "Média acessibilidade") return ACCESS_COLORS.media;
  return ACCESS_COLORS.alta;
}


function estimateEtaMinutesFromLines(lines, conditionKey) {
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

function buildStreetIndex(rawStreets) {

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

function buildRouteGeojsonFromPontos(pontos, cores, streetsIndex) {
  if (!Array.isArray(pontos) || pontos.length < 2) return null;
  if (!(streetsIndex instanceof Map)) return null;

  const features = [];
  const segments = [];
  const linesForEta = [];

  const lastCore = cores?.length ? String(cores[cores.length - 1]) : "#0B2D4D";

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

function buildRouteGeojsonFromCaminho(lines, cores = []) {
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


export default function MapScreen() {
  const tabBarH = useBottomTabBarHeight();
  const cameraRef = useRef(null);

  const { condition } = useContext(UserContext) ?? {};

  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [routeActive, setRouteActive] = useState(false);   
  const [navSheetOpen, setNavSheetOpen] = useState(false); 
  const [navSheetCollapsed, setNavSheetCollapsed] = useState(true); 



  const [routeGeojson, setRouteGeojson] = useState(null);
  const [routeSegments, setRouteSegments] = useState([]);
  const [etaMin, setEtaMin] = useState(0);

  const [userCoord, setUserCoord] = useState(null);
  const didCenterOnUser = useRef(false);

  const streetsIndexRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === "android") {
      MapLibreGL.requestAndroidLocationPermissions().catch(() => {});
    }
    MapLibreGL.setLocationManager?.({ running: true });
  }, []);


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

  const onUserLocationUpdate = (location) => {
    const c = [location?.coords?.longitude, location?.coords?.latitude];
    if (!c[0] || !c[1]) return;
    setUserCoord(c);

    if (!didCenterOnUser.current && cameraRef.current?.setCamera) {
      didCenterOnUser.current = true;
      cameraRef.current.setCamera({
        centerCoordinate: c,
        zoomLevel: 15,
        pitch: 0,
        heading: 0,
        animationMode: "flyTo",
        animationDuration: 900,
      });
      return;
    }

    if (routeActive  && cameraRef.current?.setCamera) {
      cameraRef.current.setCamera({
        centerCoordinate: c,
        zoomLevel: 16,
        pitch: 55,
        heading: -15,
        animationMode: "easeTo",
        animationDuration: 250,
      });
    }
  };

  const poisFeature = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: (pois ?? [])
        .filter((p) => Array.isArray(p?.coords))
        .map((p) => ({
          type: "Feature",
          properties: { id: String(p.id) },
          geometry: { type: "Point", coordinates: p.coords },
        })),
    };
  }, [pois]);

  const selectedFeature = useMemo(() => {
    if (!selectedPoi?.coords) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: selectedPoi.coords } }],
    };
  }, [selectedPoi]);

  const userFeature = useMemo(() => {
    if (!userCoord) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: userCoord } }],
    };
  }, [userCoord]);

  const pickDestination = (poi) => {
    setSelectedPoi(poi);
    setDetailsOpen(true);
    setRouteActive(false);
    setNavSheetOpen(false);
    setNavSheetCollapsed(true);
    setRouteGeojson(null);
    setRouteSegments([]);
  };

  const onPressPoi = (e) => {
    const f = e?.features?.[0];
    const id = f?.properties?.id;
    if (!id) return;
    const poi = pois.find((p) => String(p.id) === String(id));
    if (poi) pickDestination(poi);
  };

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

      const builtFromPontos = pontos && streetsIndex ? buildRouteGeojsonFromPontos(pontos, cores, streetsIndex) : null;

      if (builtFromPontos?.geojson?.features?.length) {
        setRouteGeojson(builtFromPontos.geojson);
        setRouteSegments(builtFromPontos.segments);
        setEtaMin(estimateEtaMinutesFromLines(builtFromPontos.linesForEta, condition));
        setRouteActive(true);
        setNavSheetOpen(true);
        setNavSheetCollapsed(true); 
        setDetailsOpen(false);
        setDetailsOpen(false);
 
        const midLine = builtFromPontos.linesForEta[Math.floor(builtFromPontos.linesForEta.length / 2)];
        const midCoord = midLine?.[Math.floor(midLine.length / 2)] ?? builtFromPontos.linesForEta[0]?.[0];
        if (midCoord && cameraRef.current?.setCamera) {
          cameraRef.current.setCamera({
            centerCoordinate: midCoord,
            zoomLevel: 15.5,
            pitch: 35,
            heading: 0,
            animationMode: "flyTo",
            animationDuration: 700,
          });
        }

        console.log("[Mob2is] route drawn via pontos+streets:", builtFromPontos.segments.length, "segments");
        return;
      }


      const lines = extractLinesFromCaminho(resp?.caminho);
      const safeLines = lines.flatMap((l) => splitLineOnGaps(l, 350));

      const totalPoints = safeLines.reduce((acc, l) => acc + l.length, 0);
      console.log("[Mob2is] fallback caminho lines:", safeLines.length, "points:", totalPoints, "cores:", cores.length);

      if (!safeLines.length) {
        console.warn("[Mob2is] Rota sem coordenadas suficientes. Exemplo resp:", resp);
        return;
      }

      const built = buildRouteGeojsonFromCaminho(safeLines, cores);

      setRouteGeojson(built.geojson);
      setRouteSegments(built.segments);
      setEtaMin(estimateEtaMinutesFromLines(safeLines, condition));
      setRouteActive(true);
      setNavSheetOpen(true);
      setNavSheetCollapsed(true);
      setDetailsOpen(false);


      const midLine = safeLines[Math.floor(safeLines.length / 2)];
      const midCoord = midLine?.[Math.floor(midLine.length / 2)] ?? safeLines[0]?.[0];
      if (midCoord && cameraRef.current?.setCamera) {
        cameraRef.current.setCamera({
          centerCoordinate: midCoord,
          zoomLevel: 15.5,
          pitch: 35,
          heading: 0,
          animationMode: "flyTo",
          animationDuration: 700,
        });
      }
    } catch (e) {
      console.warn("calculateRoute error:", e);
    }
  };

  const closeNavigationSheet = () => {
    setNavSheetOpen(false);
    setNavSheetCollapsed(true);
  };

  const clearRoute = () => {
    setRouteActive(false);
    setNavSheetOpen(false);
    setNavSheetCollapsed(true);
    setRouteGeojson(null);
    setRouteSegments([]);
    setDetailsOpen(false);
    setSelectedPoi(null);
    setEtaMin(0);
  };


  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={MAP_STYLE}
        logoEnabled={false}
        attributionEnabled={false}
        preferredFramesPerSecond={30}
        surfaceView={true}
      >
        <MapLibreGL.UserLocation visible={false} onUpdate={onUserLocationUpdate} />

        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={selectedPoi?.coords ?? userCoord ?? VIANA_COORDS}
          zoomLevel={routeActive ? 16 : 15}
          pitch={routeActive ? 55 : 0}
          heading={routeActive ? -15 : 0}
          animationMode="flyTo"
          animationDuration={650}
        />

        <MapLibreGL.ShapeSource id="pois" shape={poisFeature} onPress={onPressPoi} hitbox={{ width: 18, height: 18 }}>
          <MapLibreGL.CircleLayer
            id="pois-dot"
            style={{
              circleRadius: 5,
              circleColor: "#0B2D4D",
              circleOpacity: 0.95,
              circleStrokeWidth: 2,
              circleStrokeColor: "#FFFFFF",
              circlePitchAlignment: "map",
            }}
          />
        </MapLibreGL.ShapeSource>

      
        <MapLibreGL.ShapeSource id="user-src" shape={userFeature}>
          <MapLibreGL.CircleLayer
            id="user-halo"
            style={{
              circleRadius: 14,
              circleColor: "#F18F01",
              circleOpacity: 0.22,
              circlePitchAlignment: "map",
            }}
          />
          <MapLibreGL.CircleLayer
            id="user-dot"
            style={{
              circleRadius: 8,
              circleColor: "#F18F01",
              circleStrokeWidth: 3,
              circleStrokeColor: "#FFFFFF",
              circlePitchAlignment: "map",
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Destino selecionado */}
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


        {routeActive && routeGeojson ? (
          <MapLibreGL.ShapeSource id="route" shape={routeGeojson}>
            <MapLibreGL.LineLayer
              id="route-shadow"
              style={{
                lineWidth: 11,
                lineColor: "#000000",
                lineOpacity: 0.16,
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


      {routeActive && !navSheetOpen ? (
      <Pressable
        style={[styles.routePill, { bottom: tabBarH + 18 }]}
        onPress={() => setNavSheetOpen(true)}
        accessibilityLabel="Abrir detalhes da rota"
      >
        <View style={styles.routePillBadge} />
        <Text style={styles.routePillText}>Detalhes da rota</Text>
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
        onClose={closeNavigationSheet}
        onClear={clearRoute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  map: { flex: 1 }, 
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
  routePillBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F09C1F",                
    marginRight: 10,
  },
  routePillText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },






});
