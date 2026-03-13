import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Text, ScrollView, Modal } from "react-native";

import MapLibreGL from "@maplibre/maplibre-react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { UserContext } from "../context/UserContext";
import { getPOIs, VIANA_COORDS } from "../api/mockApi";
import { haversineMeters } from "../utils/map/geo";

import { PoiSvgIcon, IconCenter, IconFilters} from "../components/PoiIcons";
import useRouteNavigation from "../hooks/useRouteNavigation";
import ExploreSearchPanel from "../components/ExploreSearchPanel";
import PoiDetailsSheet from "../components/PoiDetailsSheet";
import NavigationSheet from "../components/NavigationSheet";

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

function streetFieldFromCondition(conditionKey) {
  if (conditionKey === "asd") return "Autismo";
  if (conditionKey === "visual") return "Invisual";
  return "MobReduzida";
}

// Assunção temporária para a escala do endpoint getClassifiedStreets:
// 4 = alta, 3 = média, 2/1 = baixa, resto = sem dados.

function streetColorFromConditionValue(value) {
  const n = Number(value);
  if (n >= 4) return "#39A25D";
  if (n === 3) return "#F0B429";
  if (n === 2 || n === 1) return "#FF4D6D";
  return "#9AA3AD";
}

function minDistanceToCoordsMeters(userCoord, coords) {
  if (!Array.isArray(coords) || !coords.length) return Infinity;

  let best = Infinity;
  for (const c of coords) {
    if (!Array.isArray(c) || c.length < 2) continue;
    const d = haversineMeters(userCoord, c);
    if (d < best) best = d;
  }
  return best;
}

function buildNearbyAccessibleStreetsGeoJSON(rawStreets, userCoord, conditionKey, radiusM = 450) {
  if (!Array.isArray(rawStreets) || !userCoord) {
    return { type: "FeatureCollection", features: [] };
  }

  const field = streetFieldFromCondition(conditionKey);
  const features = [];

  for (const item of rawStreets) {
    const attrs = item?.attributes ?? {};
    const geometry = item?.geometry ?? {};
    const value = attrs?.[field];
    const color = streetColorFromConditionValue(value);

    const paths = Array.isArray(geometry?.paths) ? geometry.paths : [];
    for (const path of paths) {
      if (!Array.isArray(path) || path.length < 2) continue;

      const coords = path
        .filter((p) => Array.isArray(p) && p.length >= 2)
        .map(([lng, lat]) => [Number(lng), Number(lat)])
        .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

      if (coords.length < 2) continue;

      const minD = minDistanceToCoordsMeters(userCoord, coords);
      if (minD > radiusM) continue;

      features.push({
        type: "Feature",
        properties: {
          color,
          objectId: attrs.OBJECTID ?? null,
          startPoint: attrs.StartPoint ?? null,
          endPoint: attrs.EndPoint ?? null,
          levelValue: Number.isFinite(Number(value)) ? Number(value) : null,
        },
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}






export default function MapScreen() {
  const tabBarH = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const { condition } = useContext(UserContext) ?? {};
  const { t } = useTranslation();

  const [pois, setPois] = useState([]);
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [showStreetAccessibility, setShowStreetAccessibility] = useState(false);


  const nav = useRouteNavigation({ cameraRef, tabBarH, insets, condition });

  const {
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
    } = nav;







  const categories = useMemo(() => {
    const map = new Map();
    for (const p of pois ?? []) {
      if (!p?.categoryId) continue;
      const key = categoryKeyFromName(p.categoryName ?? String(p.categoryId));
      const prev =
        map.get(p.categoryId) ?? { id: p.categoryId, name: p.categoryName ?? String(p.categoryId), key, count: 0 };
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

function buildCustomDestinationPoi([lng, lat]) {
  return {
    id: `custom-${Date.now()}`,
    title: "Destino selecionado no mapa",
    categoryId: "custom",
    categoryName: "Custom",
    coords: [lng, lat],
    graphPointId: null,
    isCustomPoint: true,
    description: `Ponto selecionado manualmente no mapa (${lat.toFixed(6)}, ${lng.toFixed(6)}).`,
    routeSummary: "Destino personalizado",
    trafficSummary: "Selecionado no mapa",
    image: null,
    rating: null,
    phone: null,
    visits: 0,
  };
}

function extractMapPressLngLat(event) {
  const geoCoords = event?.geometry?.coordinates;
  if (Array.isArray(geoCoords) && geoCoords.length >= 2) {
    const lng = Number(geoCoords[0]);
    const lat = Number(geoCoords[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
  }

  const nativeCoords = event?.nativeEvent?.coordinates;
  if (Array.isArray(nativeCoords) && nativeCoords.length >= 2) {
    const lng = Number(nativeCoords[0]);
    const lat = Number(nativeCoords[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
  }

  const lat = Number(
    event?.nativeEvent?.coordinate?.latitude ?? event?.coordinate?.latitude
  );
  const lng = Number(
    event?.nativeEvent?.coordinate?.longitude ?? event?.coordinate?.longitude
  );

  if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
  return null;
}

function setDestinationMode(useMapSelection) {
  if (useMapSelection === isSelectingOnMap) return;

  setIsSelectingOnMap(useMapSelection);
  setFilterOpen(false);

  if (selectedPoi?.isCustomPoint) {
    setSelectedPoi(null);
    setDetailsOpen(false);
  }
}

function handleMapPress(event) {
  if (!isSelectingOnMap || routeActive) return;

  const coord = extractMapPressLngLat(event);
  if (!coord) {
    console.warn("[Mob2is] Não foi possível ler coordenadas do toque no mapa", event);
    return;
  }

  const customPoi = buildCustomDestinationPoi(coord);
  pickDestination(customPoi);
}

const nearbyStreetAccessibilityShape = useMemo(() => {
  if (!showStreetAccessibility || !userCoord || routeActive) {
    return { type: "FeatureCollection", features: [] };
  }

  return buildNearbyAccessibleStreetsGeoJSON(
    classifiedStreetsRaw,
    userCoord,
    condition,
    450
  );
}, [showStreetAccessibility, classifiedStreetsRaw, userCoord, condition, routeActive]);


  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        preferredFramesPerSecond={30}
        surfaceView={true}
        onPress={handleMapPress}
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

        {/* USER */}
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
        {!isSelectingOnMap &&
          (filteredPois ?? [])
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


        {/* Navegação livre / acessibilidade das ruas */}
          {showStreetAccessibility && !routeActive && nearbyStreetAccessibilityShape?.features?.length ? (
            <MapLibreGL.ShapeSource id="free-nav-streets" shape={nearbyStreetAccessibilityShape}>
              <MapLibreGL.LineLayer
                id="free-nav-streets-shadow"
                style={{
                  lineWidth: 6,
                  lineColor: "#000000",
                  lineOpacity: 0.08,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <MapLibreGL.LineLayer
                id="free-nav-streets-main"
                style={{
                  lineWidth: 4,
                  lineColor: ["get", "color"],
                  lineOpacity: 0.92,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </MapLibreGL.ShapeSource>
          ) : null}

        {/* rota */}
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

      {!routeActive && !detailsOpen ? (
        <View style={[styles.mapModeWrap, { top: insets.top + 10 }]}>
          <View style={styles.mapModePill}>
            <Pressable
              onPress={() => setDestinationMode(false)}
              style={[styles.mapModeBtn, !isSelectingOnMap && styles.mapModeBtnActive]}
              hitSlop={10}
            >
              <Text style={[styles.mapModeBtnText, !isSelectingOnMap && styles.mapModeBtnTextActive]}>
                Destinos
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setDestinationMode(true)}
              style={[styles.mapModeBtn, isSelectingOnMap && styles.mapModeBtnActive]}
              hitSlop={10}
            >
              <Text style={[styles.mapModeBtnText, isSelectingOnMap && styles.mapModeBtnTextActive]}>
                Selecionar no mapa
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Centrar */}
      {userCoord ? (
        <Pressable
          onPress={centerBtnPress}
          style={[styles.centerBtn, { top: insets.top + 82 }]}
          accessibilityLabel={t("a11y.map_center_user")}
        >
          <IconCenter />
        </Pressable>
      ) : null}

      {/* Botão filtros */}
      {!routeActive && !detailsOpen && !isSelectingOnMap && categories.length > 1 ? (
        <>
          <Pressable
             style={[styles.filterIconBtn, { top: insets.top + 82 }]}
            onPress={() => setFilterOpen(true)}
            accessibilityLabel={t("a11y.map_open_filters")}
          >
            <IconFilters size={22} />

            {selectedCatIds.length ? (
              <View style={styles.filterIconBadge}>
                <Text style={styles.filterIconBadgeText}>{selectedCatIds.length}</Text>
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
               
              <Pressable
                    onPress={() => setShowStreetAccessibility((prev) => !prev)}
                    style={[
                      styles.freeNavCard,
                      showStreetAccessibility && styles.freeNavCardActive,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.freeNavTitle,
                          showStreetAccessibility && styles.freeNavTitleActive,
                        ]}
                      >
                        Mostrar acessibilidade das ruas
                      </Text>

                      <Text style={styles.freeNavSubtitle}>
                        Rede pedestre perto da tua posição atual
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.freeNavSwitch,
                        showStreetAccessibility && styles.freeNavSwitchActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.freeNavSwitchKnob,
                          showStreetAccessibility && styles.freeNavSwitchKnobActive,
                        ]}
                      />
                    </View>
                  </Pressable> 

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

      {/* Pill detalhes rota */}
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

      {!routeActive && !detailsOpen && !isSelectingOnMap ? (
        <ExploreSearchPanel bottomOffset={tabBarH + 10} onPickDestination={pickDestination} />
      ) : null}

      <PoiDetailsSheet
        visible={!routeActive && detailsOpen && !!selectedPoi}
        poi={selectedPoi}
        onClose={() => setDetailsOpen(false)}
        onStartNavigation={() => startNavigation(selectedPoi)}
      />

      <NavigationSheet
        active={routeActive && !!selectedPoi}
        open={navSheetOpen}
        bottomOffset={0}
        poi={selectedPoi}
        etaMin={etaMin}
        segments={routeSegments}
        following={following}
        profiles={routeOptions}
        selectedPerfil={selectedPerfil}
        onSelectPerfil={previewPerfil}
        onStartFollow={confirmStartFollow}
        onClose={closeNavigationSheet}
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


  filterIconBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    height: 22,
    minWidth: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#F09C1F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
   },


filterIconBadgeText: { color: "#051F41", fontWeight: "900", fontSize: 11 },
modalBackdrop: { flex: 1, backgroundColor: "rgba(5,31,65,0.28)" },


filterIconBtn: {
  position: "absolute",
  left: 16,
  width: 56,
  height: 56,
  borderRadius: 18,
  backgroundColor: "rgba(246,247,249,0.96)",
  borderWidth: 1,
  borderColor: "rgba(11,45,77,0.08)",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 120,
  elevation: 20,
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
},
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
  catCountPillActive: {
    backgroundColor: "rgba(240,156,31,0.22)",
    borderWidth: 1,
    borderColor: "rgba(240,156,31,0.55)",
  },
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
mapModeWrap: {
  position: "absolute",
  alignSelf: "center",
  zIndex: 140,
  elevation: 24,
},

mapModePill: {
  flexDirection: "row",
  backgroundColor: "rgba(246,247,249,0.97)",
  borderRadius: 18,
  padding: 4,
  borderWidth: 1,
  borderColor: "rgba(11,45,77,0.08)",
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
},

mapModeBtn: {
  minWidth: 126,
  height: 36,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 12,
},

mapModeBtnActive: {
  backgroundColor: "#051F41",
},

mapModeBtnText: {
  fontSize: 13,
  fontWeight: "900",
  color: "#6B7A88",
},

mapModeBtnTextActive: {
  color: "#FFFFFF",
},

freeNavCard: {
  marginBottom: 12,
  minHeight: 68,
  borderRadius: 16,
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "rgba(11,45,77,0.08)",
  paddingVertical: 12,
  paddingHorizontal: 14,
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},

freeNavCardActive: {
  backgroundColor: "rgba(57,162,93,0.10)",
  borderColor: "rgba(57,162,93,0.45)",
},

freeNavTitle: {
  fontSize: 14,
  fontWeight: "900",
  color: "#051F41",
},

freeNavTitleActive: {
  color: "#051F41",
},

freeNavSubtitle: {
  marginTop: 3,
  fontSize: 12,
  fontWeight: "700",
  color: "rgba(5,31,65,0.56)",
},

freeNavSwitch: {
  width: 48,
  height: 28,
  borderRadius: 14,
  backgroundColor: "rgba(11,45,77,0.12)",
  padding: 3,
  justifyContent: "center",
},

freeNavSwitchActive: {
  backgroundColor: "rgba(57,162,93,0.28)",
},

freeNavSwitchKnob: {
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: "#FFFFFF",
  alignSelf: "flex-start",
},

freeNavSwitchKnobActive: {
  alignSelf: "flex-end",
  backgroundColor: "#39A25D",
},



});