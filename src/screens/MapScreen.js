import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, View, StyleSheet } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { VIANA_COORDS } from "../api/mockApi";
import ExploreSearchPanel from "../components/ExploreSearchPanel";
import PoiDetailsSheet from "../components/PoiDetailsSheet";
import NavigationSheet from "../components/NavigationSheet";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const MAPTILER_KEY = "sZvLsgabyQeCL0ehvC55";
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

function buildMockRoute(from, to) {
  const [x1, y1] = from;
  const [x2, y2] = to;

  const pts = [];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t + Math.sin(t * Math.PI) * 0.0012;
    const y = y1 + (y2 - y1) * t + Math.cos(t * Math.PI) * 0.0006;
    pts.push([x, y]);
  }

  return {
    geojson: {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: pts } },
      ],
    },
    etaMin: 25,
  };
}

export default function MapScreen() {
  const tabBarH = useBottomTabBarHeight();
  const cameraRef = useRef(null);

  const [selectedPoi, setSelectedPoi] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [navMode, setNavMode] = useState(false);
  const [routeGeojson, setRouteGeojson] = useState(null);
  const [etaMin, setEtaMin] = useState(25);

  const [userCoord, setUserCoord] = useState(null);
  const lastLocTs = useRef(0);
  const lastCentered = useRef(null);

  const didCenterOnUser = useRef(false);




  useEffect(() => {
    if (Platform.OS === "android") {

      MapLibreGL.requestAndroidLocationPermissions().catch(() => {});
    }

    MapLibreGL.setLocationManager?.({ running: true });
  }, []);

 const onUserLocationUpdate = (location) => {
  const c = [location?.coords?.longitude, location?.coords?.latitude];
  if (!c[0] || !c[1]) return;

  setUserCoord(c);

  if (!didCenterOnUser.current && cameraRef.current?.setCamera) {
    didCenterOnUser.current = true;
    lastCentered.current = c;

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
  if (navMode && cameraRef.current?.setCamera) {
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




  const selectedFeature = useMemo(() => {
    if (!selectedPoi?.coords) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: selectedPoi.coords } },
      ],
    };
  }, [selectedPoi]);


  const userFeature = useMemo(() => {
    if (!userCoord) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: userCoord } },
      ],
    };
  }, [userCoord]);

  const pickDestination = (poi) => {
    setSelectedPoi(poi);
    setDetailsOpen(true);
    setNavMode(false);
    setRouteGeojson(null);
  };

  const startNavigation = (poi) => {
    if (!poi?.coords) return;

    const from = userCoord ?? VIANA_COORDS; 
    const { geojson, etaMin: eta } = buildMockRoute(from, poi.coords);

    setRouteGeojson(geojson);
    setEtaMin(eta);
    setNavMode(true);

  
    setDetailsOpen(false);
  };

  const exitNavigation = () => {

    setNavMode(false);
    setRouteGeojson(null);
    setDetailsOpen(false);
    setSelectedPoi(null);
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
            zoomLevel={navMode ? 16 : 15}
            pitch={navMode ? 55 : 0}
            heading={navMode ? -15 : 0}
            animationMode="flyTo"
            animationDuration={650}
          />



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


        {navMode && routeGeojson ? (
          <MapLibreGL.ShapeSource id="route" shape={routeGeojson}>
            <MapLibreGL.LineLayer
              id="route-shadow"
              style={{ lineWidth: 10, lineOpacity: 0.18, lineCap: "round", lineJoin: "round" }}
            />
            <MapLibreGL.LineLayer
              id="route-main"
              style={{ lineWidth: 6, lineCap: "round", lineJoin: "round", lineDasharray: [1, 1.5] }}
            />
          </MapLibreGL.ShapeSource>
        ) : null}
      </MapLibreGL.MapView>

     
      {!navMode && !detailsOpen ? (
        <ExploreSearchPanel bottomOffset={tabBarH + 10} onPickDestination={pickDestination} />
      ) : null}

      <PoiDetailsSheet
        visible={!navMode && detailsOpen && !!selectedPoi}
        poi={selectedPoi}
        onClose={() => setDetailsOpen(false)}
        onStartNavigation={startNavigation}
      />

      <NavigationSheet visible={navMode && !!selectedPoi} poi={selectedPoi} etaMin={etaMin} onExit={exitNavigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  map: { flex: 1 },
});
