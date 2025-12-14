import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
} from "react-native";
import { searchPois } from "../api/mockApi";

export default function ExploreSearchPanel({ bottomOffset = 0, onPickDestination }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  const load = async (query) => {
    const r = await searchPois(query);
    setResults(r);
  };

  useEffect(() => {
    if (!open) return;
    load(q);
  }, [q, open]);

  const openModal = async () => {
    setOpen(true);
    await load(q);
  };

  const pick = (item) => {
    setOpen(false);
    setQ("");
    onPickDestination?.(item);
  };

  return (
    <>
      <View style={[styles.panel, { bottom: bottomOffset }]}>
        <View style={styles.handle} />

        <Pressable style={styles.searchRow} onPress={openModal}>
          <View style={styles.leftCircle}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
          </View>

          <Text style={styles.title}>Onde deseja ir?</Text>

          <View style={styles.rightCircle}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>🎤</Text>
          </View>
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

        <View style={[styles.sheet, { bottom: bottomOffset - 8 }]}>
          <View style={styles.sheetTop}>
            <Text style={styles.backChevron}>‹</Text>

            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Praça da..."
              placeholderTextColor="#9AA3AD"
              style={styles.input}
              autoFocus
            />

            <View style={styles.pencilCircle}>
              <Text style={{ color: "#fff", fontWeight: "900" }}>✎</Text>
            </View>
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 10 }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => pick(item)}
                style={[styles.rowItem, index === 0 && styles.rowActive]}
              >
                <View style={[styles.dot, index === 0 && styles.dotActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, index === 0 && styles.itemTitleActive]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemSub, index === 0 && styles.itemSubActive]}>
                    VIANA DO CASTELO, PORTUGAL
                  </Text>
                </View>
                <Text style={[styles.km, index === 0 && styles.kmActive]}>
                  {(1.7 + index * 0.3).toFixed(1).replace(".", ",")} km
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#F1F3F6",
    borderRadius: 22,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 12,
    elevation: 18,
  },
  handle: {
    width: 54,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C9D1DA",
    alignSelf: "center",
    marginBottom: 10,
  },
  searchRow: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    justifyContent: "space-between",
    elevation: 10,
  },
  leftCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  rightCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F18F01",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "800", color: "#6B7A88" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.20)" },
  sheet: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    elevation: 30,
    maxHeight: "55%",
  },
  sheetTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
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
  pencilCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F18F01",
    alignItems: "center",
    justifyContent: "center",
  },

  rowItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowActive: { backgroundColor: "#F18F01" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#C9D1DA" },
  dotActive: { backgroundColor: "#fff" },

  itemTitle: { fontWeight: "900", color: "#0B2D4D" },
  itemTitleActive: { color: "#fff" },
  itemSub: { fontSize: 10, fontWeight: "800", color: "#6B7A88", marginTop: 2 },
  itemSubActive: { color: "#fff" },

  km: { fontWeight: "900", color: "#0B2D4D" },
  kmActive: { color: "#fff" },
});
