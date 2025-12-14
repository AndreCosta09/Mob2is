import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { VIANA_COORDS } from '../api/mockApi';


console.log("MapLibre Status:", MapLibreGL ? "Carregado" : "Falhou");

const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

export default function MapScreen() {
  return (
    <View style={styles.page}>
      <MapLibreGL.MapView style={styles.map} styleURL={MAP_STYLE} logoEnabled={false}>
        <MapLibreGL.Camera zoomLevel={14} centerCoordinate={VIANA_COORDS} animationMode={'flyTo'} />
        <MapLibreGL.PointAnnotation id="point1" coordinate={[-8.8285, 41.6935]}>
          <View style={styles.annotationContainer}>
            <View style={styles.annotationFill} />
          </View>
          <MapLibreGL.Callout title="Casa dos Nichos" />
        </MapLibreGL.PointAnnotation>
      </MapLibreGL.MapView>
      <View style={styles.searchContainer}>
        <Text style={styles.placeholder}>Para onde deseja ir?</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1 },
  map: { flex: 1 },
  annotationContainer: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 15, borderWidth: 2, borderColor: '#F18F01' },
  annotationFill: { width: 15, height: 15, borderRadius: 7.5, backgroundColor: '#F18F01', transform: [{ scale: 0.6 }] },
  searchContainer: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: 'white', padding: 15, borderRadius: 25, elevation: 5, flexDirection: 'row', alignItems: 'center' },
  placeholder: { color: '#999', fontSize: 16 }
});