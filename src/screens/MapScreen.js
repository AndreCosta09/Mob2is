import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Text, ScrollView, Modal } from "react-native";

import MapLibreGL from "@maplibre/maplibre-react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { UserContext } from "../context/UserContext";
import { getPOIs, VIANA_COORDS } from "../api/mockApi";

import { PoiSvgIcon, IconCenter } from "../components/PoiIcons";
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

export default function MapScreen() {
  const tabBarH = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const { condition } = useContext(UserContext) ?? {};
  const { t } = useTranslation();

  const [pois, setPois] = useState([]);
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

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
    setDetailsOpen,
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
});