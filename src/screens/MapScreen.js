import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { VIANA_COORDS } from "../api/mockApi";
import ExploreSearchPanel from "../components/ExploreSearchPanel";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

export default function MapScreen({ route, navigation }) {
  const [dest, setDest] = useState(null);
  const tabBarH = useBottomTabBarHeight();

  useEffect(() => {
    if (route?.params?.destination) setDest(route.params.destination);
  }, [route?.params?.destination]);

  const pickDestination = (poi) => {
    setDest(poi);
  };

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView style={styles.map} styleURL={MAP_STYLE} logoEnabled={false}>
        <MapLibreGL.Camera
          zoomLevel={14}
          centerCoordinate={dest?.coords ?? VIANA_COORDS}
          animationMode="flyTo"
        />

        {dest?.coords ? (
          <MapLibreGL.PointAnnotation id="dest" coordinate={dest.coords} />
        ) : null}
      </MapLibreGL.MapView>

      <ExploreSearchPanel
        bottomOffset={tabBarH + 10}
        onPickDestination={pickDestination}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  map: { flex: 1 },
});
