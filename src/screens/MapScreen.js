import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { VIANA_COORDS } from "../api/mockApi";

const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

export default function MapScreen({ route }) {
  const [dest, setDest] = useState(null);

  useEffect(() => {
    if (route?.params?.destination) setDest(route.params.destination);
  }, [route?.params?.destination]);

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView style={styles.map} styleURL={MAP_STYLE} logoEnabled={false}>
        <MapLibreGL.Camera
          zoomLevel={14}
          centerCoordinate={dest?.coords ?? VIANA_COORDS}
          animationMode="flyTo"
        />

        {dest?.coords ? (
          <MapLibreGL.PointAnnotation id="dest" coordinate={dest.coords}>
            <View style={styles.pinOuter}>
              <View style={styles.pinInner} />
            </View>
          </MapLibreGL.PointAnnotation>
        ) : null}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  map: { flex: 1 },
  pinOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#F18F01",
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#F18F01" },
});
