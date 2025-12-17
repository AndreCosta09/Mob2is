import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const clamp = (n, a, b) => Math.max(a, Math.min(n, b));

export default function PoiDetailsSheet({
  visible,
  poi,
  onClose,
  onStartNavigation,
}) {
  const { width, height } = useWindowDimensions();
  const sheetH = Math.round(height * 0.72);

  const y = useRef(new Animated.Value(sheetH + 40)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  const images = useMemo(() => {
    // Se a API/JSON já trouxer imagens, usa-as:
    if (poi?.images?.length) return poi.images;
    if (poi?.image) return [poi.image];

    // Placeholder (funciona com internet)
    const id = poi?.id ?? 1;
    return [
      `https://picsum.photos/seed/mob2is-${id}-a/900/520`,
      `https://picsum.photos/seed/mob2is-${id}-b/900/520`,
    ];
  }, [poi]);

  useEffect(() => {
    if (!visible) {
      Animated.parallel([
        Animated.timing(overlay, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(y, { toValue: sheetH + 40, duration: 200, useNativeDriver: true }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(overlay, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(y, {
        toValue: 0,
        damping: 18,
        stiffness: 160,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, sheetH, overlay, y]);

  if (!poi) return null;

  const title = poi.title ?? "Ponto de Interesse";
  const subtitle = poi.subtitle ?? "VIANA DO CASTELO, PORTUGAL";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
   
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlay }]} />
      </Pressable>

   
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetH,
            transform: [{ translateY: y }],
          },
        ]}
      >
        <View style={styles.handle} />

    
        <View style={styles.header}>
          <View style={styles.pin} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          </View>
        </View>

 
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
        >
          {images.map((uri, idx) => (
            <View key={String(idx)} style={{ width: width - 32 }}>
              <Image source={{ uri }} style={styles.heroImg} />
            </View>
          ))}
        </ScrollView>

 
        <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
 
          <SectionLabel text="TRANSPORTES" />
          <View style={styles.transportRow}>
            <IconPill text="🚌" />
            <IconPill text="🚗" />
            <IconPill text="🚶" />
            <View style={{ flex: 1 }} />
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>Partida às 15h15</Text>
              <Text style={styles.dropdownCaret}>▾</Text>
            </View>
          </View>

          <View style={styles.table}>
            {["Partida às 15h15  →  Chegada às 16h15",
              "Partida às 15h30  →  Chegada às 16h30",
              "Partida às 16h00  →  Chegada às 17h00"].map((t, i) => (
              <View key={i} style={[styles.tableRow, i === 0 && { marginTop: 0 }]}>
                <Text style={styles.tableText}>{t}</Text>
              </View>
            ))}
          </View>

        
          <SectionLabel text="COMÉRCIO" />
          <View style={styles.commerceRow}>
            <Chip text="🍽️" />
            <Chip text="☕" />
            <Chip text="🛍️" />
            <Chip text="🏧" />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        
        <Pressable style={styles.navBtn} onPress={() => onStartNavigation?.(poi)}>
          <Text style={styles.navBtnText}>➤</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

function SectionLabel({ text }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );
}

function IconPill({ text }) {
  return (
    <View style={styles.iconPill}>
      <Text style={styles.iconPillText}>{text}</Text>
    </View>
  );
}

function Chip({ text }) {
  return (
    <View style={styles.chip}>
      <Text style={{ fontSize: 16 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.00)",
  },
  sheet: {
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
  header: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#35B46F",
  },
  title: { fontSize: 22, fontWeight: "900", color: "#0B2D4D" },
  subtitle: { fontSize: 12, fontWeight: "900", color: "#0B2D4D", opacity: 0.75 },

  heroImg: {
    height: 200,
    borderRadius: 18,
    width: "100%",
    backgroundColor: "#E9EDF2",
  },

  sectionLabel: {
    alignSelf: "flex-start",
    backgroundColor: "#F3B11C",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionLabelText: { fontSize: 11, fontWeight: "900", color: "#2A1A00" },

  transportRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconPill: {
    width: 44,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  iconPillText: { fontSize: 16 },

  dropdown: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 8,
  },
  dropdownText: { fontWeight: "900", color: "#6B7A88", fontSize: 12 },
  dropdownCaret: { fontWeight: "900", color: "#6B7A88" },

  table: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    elevation: 6,
  },
  tableRow: {
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: "#F6F7F9",
    paddingHorizontal: 10,
  },
  tableText: { fontWeight: "800", color: "#6B7A88", fontSize: 12 },

  commerceRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  chip: {
    width: 44,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },

  navBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0B2D4D",
    alignItems: "center",
    justifyContent: "center",
    elevation: 30,
  },
  navBtnText: { color: "#fff", fontWeight: "900", fontSize: 18 },
});
