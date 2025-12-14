import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchCategories, fetchPoisByCategory } from "../api/mockApi";

export default function SearchScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await fetchCategories();
      setCategories(c);
    })();
  }, []);

  const pickCategory = async (cat) => {
    setSelectedCat(cat);
    setSelectedPoi(null);
    const list = await fetchPoisByCategory(cat.id);
    setPois(list);
  };

  const goToMap = (poi) => {
    navigation.navigate("Explorar", { destination: poi });
  };

  // 1) Detalhe do POI
  if (selectedPoi) {
    return (
      <View style={styles.page}>
        <View style={styles.greenHeader}>
          <Pressable onPress={() => setSelectedPoi(null)} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{selectedPoi.title}</Text>
        </View>

        <View style={styles.detailImage} />
        <View style={styles.detailBody}>
          <View style={styles.detailMeta}>
            <Text style={styles.rating}>★ {String(selectedPoi.rating).replace(".", ",")}</Text>
            <Text style={styles.metaText}>Visitas guiadas por marcação</Text>
          </View>

          <Text style={styles.desc}>{selectedPoi.description}</Text>
          {selectedPoi.visits ? (
            <Text style={styles.visits}>Visitas: {selectedPoi.visits}</Text>
          ) : null}

          <Pressable style={styles.primaryBtn} onPress={() => goToMap(selectedPoi)}>
            <Text style={styles.primaryBtnText}>Ir até ao local</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => {}}>
            <Text style={styles.secondaryBtnText}>Navegar pelo interior</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // 2) Lista de POIs da categoria
  if (selectedCat) {
    return (
      <View style={styles.page}>
        <View style={styles.greenHeader}>
          <Pressable onPress={() => setSelectedCat(null)} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{selectedCat.name}</Text>
        </View>

        <FlatList
          data={pois}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => setSelectedPoi(item)}>
              <View style={styles.cardImage} />
              <View style={styles.cardFooter}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.cardRating}>
                  <Text style={styles.cardRatingText}>{String(item.rating).replace(".", ",")}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  }

  // 3) Lista de categorias
  return (
    <View style={styles.page}>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <Pressable style={styles.catBtn} onPress={() => pickCategory(item)}>
            <Text style={styles.catText}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F5F7" },

  greenHeader: {
    height: 70,
    backgroundColor: "#33A35A",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 28, color: "#fff", marginTop: -2 },
  headerTitle: { flex: 1, textAlign: "center", color: "#0B2D4D", fontWeight: "900", fontSize: 18, marginRight: 40 },

  catBtn: {
    backgroundColor: "#E9EDF2",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  catText: { fontWeight: "900", color: "#0B2D4D" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    elevation: 8,
  },
  cardImage: { height: 160, backgroundColor: "#DDE6F0" },
  cardFooter: { padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontWeight: "900", color: "#0B2D4D" },
  cardRating: { backgroundColor: "#F3F5F7", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  cardRatingText: { fontWeight: "900", color: "#0B2D4D" },

  detailImage: { height: 220, backgroundColor: "#DDE6F0" },
  detailBody: { padding: 14 },
  detailMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  rating: { fontWeight: "900", color: "#0B2D4D" },
  metaText: { color: "#6B7A88", fontWeight: "800", fontSize: 12 },

  desc: { color: "#1E2A36", lineHeight: 20, marginBottom: 10 },
  visits: { color: "#6B7A88", fontWeight: "800", marginBottom: 14 },

  primaryBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 4,
    marginBottom: 12,
  },
  primaryBtnText: { color: "#0B2D4D", fontWeight: "900" },

  secondaryBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 4,
  },
  secondaryBtnText: { color: "#0B2D4D", fontWeight: "900" },
});
