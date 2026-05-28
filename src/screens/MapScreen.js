import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  Modal,
  Animated,
  Easing,
  Image,
} from "react-native";

import MapLibreGL from "@maplibre/maplibre-react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { UserContext } from "../context/UserContext";
import { getApiErrorMessage, getPOIs, VIANA_COORDS } from "../api/mockApi";
import { haversineMeters } from "../utils/map/geo";
import {
  getAppPalette,
  getModalAnimationType,
} from "../utils/accessibility";
import { MAP_STYLE_URL } from "../config/appConfig";

import { PoiSvgIcon, IconCenter, IconFilters, IconClose } from "../components/PoiIcons";
import useRouteNavigation from "../hooks/useRouteNavigation";
import ExploreSearchPanel from "../components/ExploreSearchPanel";
import NavigationSheet from "../components/NavigationSheet";

const POI_IMAGE_PLACEHOLDER = require("../assets/logo/logoIconAPP.png");

const EMPTY_MAP_STYLE = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#F3F5F7",
      },
    },
  ],
};

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


function RouteLoadingDots({ reduceMotion = false, highContrast = false }) {
  const anims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  const dotColor = highContrast ? "#000000" : "#F09C1F";

  useEffect(() => {
    if (reduceMotion) return;

    const loops = anims.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 120),
          Animated.timing(anim, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 420,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay((anims.length - index - 1) * 70),
        ])
      )
    );

    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [anims, reduceMotion]);

  if (reduceMotion) {
    return (
      <View style={styles.routeLoadingWave}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View
            key={`loading-dot-static-${index}`}
            style={[
              styles.routeLoadingWaveDot,
              {
                backgroundColor: dotColor,
                shadowColor: dotColor,
                opacity: 1,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.routeLoadingWave}>
      {anims.map((anim, index) => {
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        });

        const scale = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.22],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.45, 1],
        });

        return (
          <Animated.View
            key={`loading-dot-${index}`}
            style={[
              styles.routeLoadingWaveDot,
              {
                backgroundColor: dotColor,
                shadowColor: dotColor,
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}



export default function MapScreen({ route, navigation }) {
  const tabBarH = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const poiSourceRef = useRef(null);
  const { condition, routePreference, preferences } = useContext(UserContext) ?? {};
  const { t } = useTranslation();
  const reduceMotion = !!preferences?.reduceMotion;
  const highContrast = !!preferences?.highContrast;
  const colors = useMemo(() => getAppPalette(highContrast), [highContrast]);

  const [pois, setPois] = useState([]);
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showStreetAccessibility] = useState(false);
  const [poisErrorMessage, setPoisErrorMessage] = useState("");
  const [mapStyleLoaded, setMapStyleLoaded] = useState(false);
  const [poiRenderVersion, setPoiRenderVersion] = useState(0);
  const [mapZoomLevel, setMapZoomLevel] = useState(15);
  const [poiDockImageFailed, setPoiDockImageFailed] = useState(false);
  const filterSheetDragStartYRef = useRef(0);
  const poiSheetDragStartYRef = useRef(0);
  const filterSheetTranslateY = useRef(new Animated.Value(0)).current;
  const poiSheetTranslateY = useRef(new Animated.Value(0)).current;


  const nav = useRouteNavigation({
    cameraRef,
    tabBarH,
    insets,
    condition,
    routePreference,
    reduceMotion,
  });

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
      isCalculatingRoute,
      routeCalculationMessage,
      apiErrorMessage,
      setDetailsOpen,
      pickDestination,
      startNavigation,
       previewPerfil,
       confirmStartFollow,
       openNavigationSheet,
       closeNavigationSheet,
       clearRoute,
       centerBtnPress,
       cancelRouteCalculation,
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

  const poiShape = useMemo(() => {
    const features = (filteredPois ?? [])
      .filter((poi) => Array.isArray(poi?.coords) && poi?.id !== selectedPoi?.id)
      .map((poi) => ({
        type: "Feature",
        properties: {
          id: String(poi.id),
          title: poi.title ?? "",
        },
        geometry: {
          type: "Point",
          coordinates: poi.coords,
        },
      }));

    return {
      type: "FeatureCollection",
      features,
    };
  }, [filteredPois, selectedPoi]);

  const showClusteredPois = mapZoomLevel < 14.75;

  const toggleCat = (id) => {
    setSelectedCatIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onFilterSheetDragGrant = (event) => {
    filterSheetDragStartYRef.current = event.nativeEvent.pageY;
    filterSheetTranslateY.stopAnimation();
  };

  const onFilterSheetDragMove = (event) => {
    const dy = Math.max(0, event.nativeEvent.pageY - filterSheetDragStartYRef.current);
    filterSheetTranslateY.setValue(dy);
  };

  const onFilterSheetDragRelease = (event) => {
    const dy = event.nativeEvent.pageY - filterSheetDragStartYRef.current;
    if (dy > 48) {
      Animated.timing(filterSheetTranslateY, {
        toValue: 520,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        filterSheetTranslateY.setValue(0);
        setFilterOpen(false);
      });
      return;
    }

    Animated.spring(filterSheetTranslateY, {
      toValue: 0,
      damping: 20,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  };

  const onPoiSheetDragGrant = (event) => {
    poiSheetDragStartYRef.current = event.nativeEvent.pageY;
    poiSheetTranslateY.stopAnimation();
  };

  const onPoiSheetDragMove = (event) => {
    const dy = Math.max(0, event.nativeEvent.pageY - poiSheetDragStartYRef.current);
    poiSheetTranslateY.setValue(dy);
  };

  const onPoiSheetDragRelease = (event) => {
    const dy = event.nativeEvent.pageY - poiSheetDragStartYRef.current;
    if (dy > 48) {
      Animated.timing(poiSheetTranslateY, {
        toValue: 520,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        poiSheetTranslateY.setValue(0);
        setDetailsOpen(false);
      });
      return;
    }

    Animated.spring(poiSheetTranslateY, {
      toValue: 0,
      damping: 20,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await getPOIs();
        if (alive) {
          setPois(list);
          setPoisErrorMessage("");
        }
      } catch (e) {
        console.warn("getPOIs error:", e);
        if (alive) {
          setPoisErrorMessage(getApiErrorMessage(e, t("api.cannot_load_pois")));
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [t]);

  const mapErrorMessage =
    poisErrorMessage ||
    apiErrorMessage ||
    (!MAP_STYLE_URL ? t("map.missing_map_key") : "");

  const [mapStyle, setMapStyle] = useState(MAP_STYLE_URL || EMPTY_MAP_STYLE);
  useEffect(() => {
    if (!MAP_STYLE_URL) return undefined;

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

  useEffect(() => {
    if (!mapStyleLoaded || !pois.length) return;

    const timeoutId = setTimeout(() => {
      setPoiRenderVersion((prev) => prev + 1);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [mapStyleLoaded, pois.length, selectedCatIds.length]);

function buildCustomDestinationPoi([lng, lat], t) {
  return {
    id: `custom-${Date.now()}`,
    title: t("map.custom_destination_title"),
    categoryId: "custom",
    categoryName: "Custom",
    coords: [lng, lat],
    graphPointId: null,
    isCustomPoint: true,
    description: t("map.custom_destination_description", {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }),
    shortDescription: t("map.custom_destination_notice"),
    notice: t("map.custom_destination_notice"),
    routeSummary: t("map.custom_route_summary"),
    trafficSummary: t("map.custom_traffic_summary"),
    image: null,
    rating: null,
    phone: null,
    visits: 0,
    etaText: t("navigation.eta_unknown"),
    distanceText: "",
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

function handleMapPress(event) {
  if (routeActive) return;

  const coord = extractMapPressLngLat(event);
  if (!coord) {
    console.warn("[Mob2is] Não foi possível ler coordenadas do toque no mapa", event);
    return;
  }

  const customPoi = buildCustomDestinationPoi(coord, t);
  pickDestination(customPoi);
}

async function handlePoiSourcePress(event) {
  const feature = event?.features?.[0];
  if (!feature) return;

  if (feature?.properties?.cluster) {
    try {
      const zoom = await poiSourceRef.current?.getClusterExpansionZoom(feature);
      const coords = feature?.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2 && Number.isFinite(zoom)) {
        cameraRef.current?.setCamera?.({
          centerCoordinate: coords,
          zoomLevel: Math.max(zoom, mapZoomLevel + 0.8),
          animationMode: "easeTo",
          animationDuration: reduceMotion ? 0 : 320,
        });
      }
    } catch (error) {
      console.warn("[Mob2is] cluster expansion error:", error);
    }
    return;
  }

  const poiId = String(feature?.properties?.id ?? "");
  const poi = (filteredPois ?? []).find((item) => String(item?.id) === poiId);
  if (poi) {
    pickDestination(poi);
  }
}

function handleRegionDidChange(feature) {
  const nextZoom = Number(feature?.properties?.zoomLevel);
  if (Number.isFinite(nextZoom)) {
    setMapZoomLevel(nextZoom);
  }
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

useEffect(() => {
  const destination = route?.params?.destination;
  if (!destination?.coords) return;

  pickDestination(destination);
  navigation?.setParams?.({ destination: undefined });
}, [route?.params?.destination, navigation, pickDestination]);

useEffect(() => {
  setPoiDockImageFailed(false);
}, [selectedPoi?.id]);

useEffect(() => {
  const hideTabBar = detailsOpen || navSheetOpen || filterOpen;
  navigation?.setOptions?.({
    tabBarStyle: hideTabBar ? { display: "none" } : undefined,
  });
}, [detailsOpen, filterOpen, navSheetOpen, navigation]);

const poiDockDescription =
  selectedPoi?.notice ??
  selectedPoi?.shortDescription ??
  selectedPoi?.description ??
  t("poiDetails.fallback_description");
const poiDockImage = !selectedPoi?.isCustomPoint
  ? selectedPoi?.images?.[0] ?? selectedPoi?.image ?? null
  : null;
const poiDockSubtitle = selectedPoi?.routeSummary ?? selectedPoi?.categoryName ?? "";
const poiDockMeta = !selectedPoi?.isCustomPoint
  ? [selectedPoi?.etaText, selectedPoi?.distanceText].filter(Boolean).join(" | ")
  : "";
const mapDockBottomInset = Math.min(
  146,
  Math.max(112, tabBarH + Math.max(insets.bottom, 8) + 28)
);
const poiDockBottomInset = Math.max(
  20,
  Math.max(insets.bottom, 10) + 12
);
const routeSheetBottomOffset = 0;


  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        preferredFramesPerSecond={30}
        surfaceView={true}
        onPress={handleMapPress}
        onDidFinishLoadingStyle={() => setMapStyleLoaded(true)}
        onRegionDidChange={handleRegionDidChange}
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
              circleRadius: highContrast ? 18 : 15,
              circleColor: colors.accent,
              circleOpacity: highContrast ? 0.3 : 0.18,
              circlePitchAlignment: "map",
            }}
          />
          <MapLibreGL.CircleLayer
            id="user-dot"
            style={{
              circleRadius: highContrast ? 8 : 7,
              circleColor: highContrast ? colors.text : "#1579B3",
              circleStrokeWidth: highContrast ? 4 : 3,
              circleStrokeColor: colors.surface,
              circlePitchAlignment: "map",
            }}
          />
        </MapLibreGL.ShapeSource>

       {/* POIs */}
        {!routeActive && showClusteredPois && poiShape?.features?.length ? (
          <MapLibreGL.ShapeSource
            ref={poiSourceRef}
            id="pois-clustered"
            shape={poiShape}
            cluster
            clusterRadius={42}
            clusterMinPoints={2}
            clusterMaxZoomLevel={14}
            onPress={handlePoiSourcePress}
          >
            <MapLibreGL.CircleLayer
              id="poi-cluster-bubbles"
              filter={["has", "point_count"]}
              style={{
                circleRadius: [
                  "step",
                  ["get", "point_count"],
                  18,
                  10,
                  22,
                  25,
                  26,
                ],
                circleColor: highContrast ? colors.text : colors.accentStrong,
                circleStrokeColor: colors.surface,
                circleStrokeWidth: highContrast ? 3 : 2,
              }}
            />
            <MapLibreGL.SymbolLayer
              id="poi-cluster-count"
              filter={["has", "point_count"]}
              style={{
                textField: ["get", "point_count_abbreviated"],
                textSize: 12,
                textColor: colors.surface,
              }}
            />
            <MapLibreGL.CircleLayer
              id="poi-unclustered-dots"
              filter={["!", ["has", "point_count"]]}
              style={{
                circleRadius: highContrast ? 7 : 6,
                circleColor: colors.surface,
                circleStrokeColor: highContrast ? colors.border : colors.accentStrong,
                circleStrokeWidth: highContrast ? 3 : 2,
              }}
            />
          </MapLibreGL.ShapeSource>
        ) : null}

        {mapStyleLoaded && !routeActive && !showClusteredPois &&
          (filteredPois ?? [])
          .filter((p) => Array.isArray(p?.coords) && p?.id !== selectedPoi?.id)
          .map((p, index) => (
            <MapLibreGL.PointAnnotation
              key={`poi-${poiRenderVersion}-${p.id}-${index}`}
              id={`poi-${poiRenderVersion}-${p.id}-${index}`}
              coordinate={p.coords}
              onSelected={() => pickDestination(p)}
            >
              <View
                collapsable={false}
                style={[
                  styles.poiMarker,
                  {
                    backgroundColor: colors.surface,
                    borderColor: highContrast ? colors.border : "rgba(11,45,77,0.12)",
                  },
                ]}
              >
                <PoiSvgIcon
                  name={iconNameForPoi(p)}
                  size={18}
                  color={highContrast ? colors.text : undefined}
                />
              </View>
            </MapLibreGL.PointAnnotation>
          ))}

        {/* destino */}
        <MapLibreGL.ShapeSource id="selected-dest" shape={selectedFeature}>
          <MapLibreGL.CircleLayer
            id="dest-halo"
            style={{
              circleRadius: highContrast ? 15 : 12,
              circleColor: highContrast ? colors.text : "#35B46F",
              circleOpacity: highContrast ? 0.22 : 0.25,
              circlePitchAlignment: "map",
            }}
          />
          <MapLibreGL.CircleLayer
            id="dest-dot"
            style={{
              circleRadius: highContrast ? 8 : 7,
              circleColor: colors.success,
              circleStrokeWidth: highContrast ? 4 : 3,
              circleStrokeColor: colors.surface,
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
                  lineWidth: highContrast ? 8 : 6,
                  lineColor: "#000000",
                  lineOpacity: highContrast ? 0.16 : 0.08,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <MapLibreGL.LineLayer
                id="free-nav-streets-main"
                style={{
                  lineWidth: highContrast ? 5 : 4,
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
                lineWidth: following ? (highContrast ? 12 : 10) : highContrast ? 10 : 8,
                lineColor: "#000000",
                lineOpacity: highContrast ? 0.24 : 0.14,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <MapLibreGL.LineLayer
              id="route-main"
              style={{
                lineWidth: following ? (highContrast ? 9 : 7) : highContrast ? 7 : 5,
                lineColor: ["get", "color"],
                lineOpacity: 0.98,
                lineCap: "butt",
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
          style={[
            styles.centerBtn,
            {
              top: insets.top + 42,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel={t("a11y.map_center_user")}
        >
          <IconCenter color={colors.text} accent={colors.accent} />
        </Pressable>
      ) : null}

      {/* Botão filtros */}
      {!routeActive && !detailsOpen && categories.length > 1 ? (
        <>
          <Pressable
             style={[
               styles.filterIconBtn,
               {
                  top: insets.top + 42,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
             ]}
            onPress={() => setFilterOpen(true)}
            accessibilityLabel={t("a11y.map_open_filters")}
          >
            <IconFilters size={22} color={colors.text} accent={colors.accent} />

            {selectedCatIds.length ? (
              <View
                style={[
                  styles.filterIconBadge,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.surface,
                  },
                ]}
              >
                <Text style={[styles.filterIconBadgeText, { color: colors.accentText }]}>
                  {selectedCatIds.length}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <Modal
            visible={filterOpen}
            transparent
            animationType={getModalAnimationType(reduceMotion, "slide")}
            onRequestClose={() => setFilterOpen(false)}
          >
            <Pressable
              style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
              onPress={() => setFilterOpen(false)}
            />

            <Animated.View
              style={[
                styles.filterSheet,
                {
                  paddingBottom: insets.bottom + tabBarH + 12,
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  transform: [{ translateY: filterSheetTranslateY }],
                },
              ]}
            >
              <View
                style={styles.sheetHandleHit}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={onFilterSheetDragGrant}
                onResponderMove={onFilterSheetDragMove}
                onResponderRelease={onFilterSheetDragRelease}
                onResponderTerminate={onFilterSheetDragRelease}
              >
                <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.filterHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.filterTitle, { color: colors.text }]}>{t("map.filter_sheet_title")}</Text>
                  <Text style={[styles.filterSubtitle, { color: colors.muted }]}>
                    {selectedCatIds.length
                      ? t("map.summary_selected", { selected: selectedCatIds.length, visible: filteredPois.length })
                      : t("map.summary_points_visible", { count: filteredPois.length })}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSelectedCatIds([])}
                  style={[styles.btnGhost, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.btnGhostText, { color: colors.accentStrong }]}>{t("common.clear")}</Text>
                </Pressable>

                <Pressable
                  onPress={() => setFilterOpen(false)}
                  style={[styles.btnPrimary, { backgroundColor: colors.accentStrong }]}
                >
                  <View style={[styles.btnPrimaryDot, { backgroundColor: colors.accent }]} />
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
                      style={[
                        styles.catCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                        active && styles.catCardActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.catIconWrap,
                          { backgroundColor: colors.surfaceAlt },
                          active && styles.catIconWrapActive,
                        ]}
                      >
                        <PoiSvgIcon
                          name={iconName}
                          size={16}
                          color={active ? colors.accentStrong : colors.text}
                        />
                      </View>

                      <Text
                        numberOfLines={2}
                        style={[styles.catName, { color: colors.text }, active && styles.catNameActive]}
                      >
                        {t(`categories.${c.key}`, { defaultValue: c.name })}
                      </Text>

                      <View
                        style={[
                          styles.catCountPill,
                          { backgroundColor: colors.surfaceAlt },
                          active && styles.catCountPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.catCountText,
                            { color: colors.text },
                            active && styles.catCountTextActive,
                          ]}
                        >
                          {c.count}
                        </Text>
                      </View>

                      {active ? <View style={styles.catCheck} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </Modal>
        </>
      ) : null}

      {mapErrorMessage ? (
        <View
          style={[
            styles.errorBanner,
            {
              top: insets.top + 140,
              backgroundColor: colors.dangerBg,
              borderColor: colors.dangerBorder,
            },
          ]}
        >
          <Text style={[styles.errorBannerText, { color: colors.dangerText }]}>{mapErrorMessage}</Text>
        </View>
      ) : null}

      {/* Pill detalhes rota */}
      {routeActive && !navSheetOpen ? (
        <Pressable
          style={[
            styles.routePill,
            {
              bottom: tabBarH + 18,
              backgroundColor: highContrast ? colors.text : "#051F41",
              borderColor: highContrast ? colors.border : "rgba(21,121,179,0.45)",
            },
          ]}
          onPress={openNavigationSheet}
          accessibilityLabel={t("a11y.map_open_route_details")}
        >
          <View
            style={[
              styles.routePillBadge,
              { backgroundColor: highContrast ? colors.surface : "#F09C1F" },
            ]}
          />
          <Text
            style={[
              styles.routePillText,
              { color: highContrast ? colors.surface : "#FFFFFF" },
            ]}
          >
            {following ? t("navigation.navigating") : t("map.route_details")}
          </Text>
        </Pressable>
      ) : null}

      {/*
      {!routeActive && !detailsOpen ? (
        <ExploreSearchPanel
          bottomOffset={tabBarH + 10}
          onPickDestination={pickDestination}
          reduceMotion={reduceMotion}
          highContrast={highContrast}
          userCoord={userCoord}
        />
      ) : null}
      */}

      {!routeActive && !detailsOpen ? (
        <View
          style={[
            styles.mapBottomDock,
            {
              paddingBottom: mapDockBottomInset,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <ExploreSearchPanel
            embedded
            bottomOffset={tabBarH + 10}
            onPickDestination={pickDestination}
            reduceMotion={reduceMotion}
            highContrast={highContrast}
            userCoord={userCoord}
          />
        </View>
      ) : null}

      {!routeActive && detailsOpen && !!selectedPoi ? (
        <Animated.View
          style={[
            styles.mapBottomDock,
            styles.poiBottomDock,
            {
              paddingBottom: poiDockBottomInset,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ translateY: poiSheetTranslateY }],
            },
          ]}
        >
          <View
            style={styles.sheetHandleHit}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={onPoiSheetDragGrant}
            onResponderMove={onPoiSheetDragMove}
            onResponderRelease={onPoiSheetDragRelease}
            onResponderTerminate={onPoiSheetDragRelease}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          </View>

          <ScrollView
            style={styles.poiDockScroll}
            contentContainerStyle={styles.poiDockScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.poiDockHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.poiDockKicker}>
                  <View style={styles.poiDockDot} />
                  <Text style={[styles.poiDockKickerText, { color: colors.muted }]}>
                    {t("navigation.destination")}
                  </Text>
                </View>

                <Text style={[styles.poiDockTitle, { color: colors.text }]} numberOfLines={3}>
                  {selectedPoi.title}
                </Text>

                {!!poiDockSubtitle ? (
                  <Text style={[styles.poiDockSubtitle, { color: colors.muted }]} numberOfLines={1}>
                    {poiDockSubtitle}
                  </Text>
                ) : null}

                {!!poiDockMeta ? (
                  <Text style={[styles.poiDockMeta, { color: colors.muted }]} numberOfLines={1}>
                    {poiDockMeta}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={() => setDetailsOpen(false)}
                hitSlop={10}
                style={[
                  styles.poiDockCloseBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <IconClose size={18} color={colors.text} />
              </Pressable>
            </View>

            {poiDockImage ? (
              <View style={styles.poiDockHeroWrap}>
                <Image
                  source={poiDockImageFailed ? POI_IMAGE_PLACEHOLDER : { uri: poiDockImage }}
                  style={styles.poiDockHeroImage}
                  resizeMode="cover"
                  onError={() => setPoiDockImageFailed(true)}
                />
              </View>
            ) : null}

            <Text style={[styles.poiDockDescription, { color: colors.text }]}>
              {poiDockDescription}
            </Text>
          </ScrollView>

          <Pressable
            style={[
              styles.poiDockAction,
              {
                backgroundColor: colors.accent,
                borderColor: colors.accent,
              },
            ]}
            onPress={() => startNavigation(selectedPoi)}
          >
            <Text style={[styles.poiDockActionText, { color: colors.accentText }]}>
              {t("poiDetails.select_route")}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <Modal
          visible={isCalculatingRoute}
          transparent
          animationType={getModalAnimationType(reduceMotion, "fade")}
          statusBarTranslucent
        >
          <View style={styles.routeLoadingBackdrop}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={cancelRouteCalculation} />
            <View
              style={[
                styles.routeLoadingCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <RouteLoadingDots reduceMotion={reduceMotion} highContrast={highContrast} />
              <Text style={[styles.routeLoadingTitle, { color: colors.text }]}>
                {t("map.route_loading_title")}
              </Text>
              <Text style={[styles.routeLoadingText, { color: colors.muted }]}>
                {routeCalculationMessage || t("map.route_loading_default")}
              </Text>

              <Pressable
                onPress={cancelRouteCalculation}
                style={[
                  styles.routeLoadingCancelBtn,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.routeLoadingCancelText, { color: colors.text }]}>
                  {t("common.cancel")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

      <NavigationSheet
        active={routeActive && !!selectedPoi}
        open={navSheetOpen}
        bottomOffset={routeSheetBottomOffset}
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

  routeLoadingBackdrop: {
  flex: 1,
  backgroundColor: "rgba(5,31,65,0.24)",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 28,
},

routeLoadingCard: {
  minWidth: 240,
  maxWidth: 320,
  borderRadius: 22,
  backgroundColor: "rgba(246,247,249,0.98)",
  borderWidth: 1,
  borderColor: "rgba(11,45,77,0.08)",
  paddingVertical: 20,
  paddingHorizontal: 18,
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.14,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 24,
},

routeLoadingWave: {
  height: 28,
  flexDirection: "row",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: 8,
  marginBottom: 14,
},

routeLoadingWaveDot: {
  width: 11,
  height: 11,
  borderRadius: 5.5,
  backgroundColor: "#F09C1F",
  shadowColor: "#F09C1F",
  shadowOpacity: 0.28,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
},

routeLoadingTitle: {
  fontSize: 16,
  fontWeight: "900",
  color: "#051F41",
},

routeLoadingText: {
  marginTop: 6,
  fontSize: 13,
  fontWeight: "700",
  color: "rgba(5,31,65,0.68)",
  textAlign: "center",
},
routeLoadingCancelBtn: {
  marginTop: 16,
  minWidth: 108,
  minHeight: 40,
  paddingHorizontal: 16,
  borderRadius: 14,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
},
routeLoadingCancelText: {
  fontSize: 13,
  fontWeight: "900",
},
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
  errorBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,244,232,0.98)",
    borderWidth: 1,
    borderColor: "rgba(241,143,1,0.32)",
    elevation: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  errorBannerText: {
    color: "#8A4B00",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
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
  mapBottomDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    elevation: 28,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -10 },
  },
  poiBottomDock: {
    gap: 12,
    zIndex: 140,
    elevation: 60,
    maxHeight: "72%",
  },
  poiDockScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  poiDockScrollContent: {
    paddingBottom: 4,
    gap: 12,
  },
  poiDockHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  poiDockKicker: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  poiDockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#39A25D",
    marginRight: 6,
  },
  poiDockKickerText: {
    fontSize: 12,
    fontWeight: "800",
  },
  poiDockTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
  },
  poiDockSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
  },
  poiDockMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
  },
  poiDockHeroWrap: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#DDE6F0",
  },
  poiDockHeroImage: {
    width: "100%",
    height: 148,
  },
  poiDockDescription: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  poiDockCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  poiDockAction: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  poiDockActionText: {
    fontSize: 15,
    fontWeight: "900",
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
  sheetHandleHit: {
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingTop: 2,
    paddingBottom: 10,
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
