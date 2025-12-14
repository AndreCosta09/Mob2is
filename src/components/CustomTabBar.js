import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { searchPois } from "../api/mockApi";

const ICONS = {
  Explorar: "⌖",
  Pesquisar: "🔎",
  Mais: "≡",
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { width } = useWindowDimensions();
  const tabW = width / state.routes.length;

  const activeRouteName = state.routes[state.index]?.name;
  const isExplore = activeRouteName === "Explorar";

  const anim = useRef(new Animated.Value(state.index)).current;

  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    Animated.spring(anim, {
      toValue: state.index,
      useNativeDriver: true,
      damping: 16,
      stiffness: 160,
    }).start();
  }, [state.index, anim]);

  const translateX = anim.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * tabW),
  });

  const notchX = Animated.add(translateX, new Animated.Value(tabW / 2 - 38));
  const ballX = Animated.add(translateX, new Animated.Value(tabW / 2 - 24));

  const openSearch = async () => {
    setSearchOpen(true);
    const r = await searchPois(q);
    setResults(r);
  };

  useEffect(() => {
    if (!searchOpen) return;
    (async () => {
      const r = await searchPois(q);
      setResults(r);
    })();
  }, [q, searchOpen]);

  const pickDestination = (item) => {
    setSearchOpen(false);
    setQ("");
    // manda para o mapa e centra no destino
    navigation.navigate("Explorar", { destination: item });
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.panel, isExplore ? styles.panelTall : styles.panelShort]}>
        <View style={styles.handle} />

        {isExplore ? (
          <Pressable style={styles.searchHeader} onPress={openSearch}>
            <View style={styles.leftIcon}>
              <Text style={styles.leftIconText}>🔍</Text>
            </View>

            <Text style={styles.headerTitle}>Onde deseja ir?</Text>

            <View style={styles.micIcon}>
              <Text style={styles.micText}>🎤</Text>
            </View>
          </Pressable>
        ) : null}

        {/* Tabs (zona branca) */}
        <View style={styles.tabsBar}>
          {/* notch + bola */}
          <Animated.View style={[styles.notchWrap, { transform: [{ translateX: notchX }] }]}>
            <View style={styles.notchCircle} />
            <View style={styles.notchBridge} />
          </Animated.View>

          <Animated.View style={[styles.ball, { transform: [{ translateX: ballX }] }]}>
            <Text style={styles.ballIcon}>{ICONS[activeRouteName] ?? "•"}</Text>
          </Animated.View>

          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            const label =
              descriptors[route.key]?.options?.tabBarLabel ?? route.name;

            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tab}>
                <View style={{ height: 22 }} />
                <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Modal de pesquisa (no estilo do mock: lista por cima do mapa) */}
      <Modal
        visible={searchOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSearchOpen(false)} />

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.searchRow}>
            <Text style={styles.backChevron}>‹</Text>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Praça da..."
              placeholderTextColor="#9AA3AD"
              style={styles.input}
              autoFocus
            />
            <View style={styles.micSmall}>
              <Text style={{ color: "#fff" }}>🎤</Text>
            </View>
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => pickDestination(item)}
                style={[styles.resultRow, index === 0 && styles.resultRowActive]}
              >
                <View style={[styles.dot, index === 0 && styles.dotActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultTitle, index === 0 && styles.resultTitleActive]}>
                    {item.title}
                  </Text>
                  <Text style={styles.resultSub}>VIANA DO CASTELO, PORTUGAL</Text>
                </View>
                <Text style={styles.km}>
                  {(1.7 + index * 0.3).toFixed(1).replace(".", ",")} km
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const TABS_H = 74;

const styles = StyleSheet.create({
  wrapper: { backgroundColor: "transparent" },

  panel: {
    backgroundColor: "#F1F3F6",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    elevation: 25,
    overflow: "visible",
  },
  panelTall: { height: 160 },
  panelShort: { height: 92 },

  handle: {
    width: 54,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C9D1DA",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },

  searchHeader: {
    marginHorizontal: 16,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  leftIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIconText: { fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#6B7A88" },
  micIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F18F01",
    alignItems: "center",
    justifyContent: "center",
  },
  micText: { color: "#fff", fontWeight: "900" },

  tabsBar: {
    height: TABS_H,
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flexDirection: "row",
    overflow: "visible",
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, color: "#9AA3AD" },
  labelActive: { color: "#F18F01", fontWeight: "900" },

  notchWrap: {
    position: "absolute",
    top: -26,
    width: 76,
    height: 76,
    alignItems: "center",
  },
  notchCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#fff",
    elevation: 10,
  },
  notchBridge: {
    position: "absolute",
    bottom: 0,
    width: 76,
    height: 26,
    backgroundColor: "#fff",
  },

  ball: {
    position: "absolute",
    top: -14,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F18F01",
    elevation: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  ballIcon: { color: "#fff", fontWeight: "900", fontSize: 16 },

  // Modal
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 92, // fica “encostado” ao painel
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 14,
    elevation: 30,
    maxHeight: "55%",
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D8DEE6",
    alignSelf: "center",
    marginBottom: 10,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  backChevron: { fontSize: 26, color: "#6B7A88", width: 18 },
  input: {
    flex: 1,
    backgroundColor: "#F3F5F7",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontWeight: "800",
    color: "#0B2D4D",
  },
  micSmall: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F18F01", alignItems: "center", justifyContent: "center" },

  resultRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultRowActive: { backgroundColor: "#F18F01" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#C9D1DA" },
  dotActive: { backgroundColor: "#fff" },
  resultTitle: { fontWeight: "900", color: "#0B2D4D" },
  resultTitleActive: { color: "#fff" },
  resultSub: { fontSize: 10, fontWeight: "800", color: "#6B7A88", marginTop: 2 },
  km: { fontWeight: "900", color: "#0B2D4D" },
});
