import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export default function NavigationSheet({ visible, poi, etaMin = 25, onExit }) {
  const y = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    Animated.spring(y, {
      toValue: visible ? 0 : 120,
      damping: 18,
      stiffness: 160,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [visible, y]);

  if (!poi) return null;

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY: y }] }]}>
      <View style={styles.handle} />
      <Text style={styles.destTitle}>Destino</Text>
      <Text style={styles.destName}>{poi.title}</Text>

      <View style={styles.row}>
        <Text style={styles.eta}>⏱️ Tempo estimado: {etaMin} min</Text>

        <Pressable style={styles.exitBtn} onPress={onExit}>
          <Text style={styles.exitBtnText}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 94,
    backgroundColor: "#F6F7F9",
    borderRadius: 22,
    padding: 12,
    elevation: 40,
  },
  handle: {
    width: 54,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C9D1DA",
    alignSelf: "center",
    marginBottom: 10,
  },
  destTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "900",
    color: "#6B7A88",
  },
  destName: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#0B2D4D",
    marginTop: 6,
  },
  row: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eta: { fontWeight: "900", color: "#6B7A88" },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0B2D4D",
    alignItems: "center",
    justifyContent: "center",
  },
  exitBtnText: { color: "#fff", fontWeight: "900" },
});
