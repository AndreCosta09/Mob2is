import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  PermissionsAndroid,
  Platform,
} from "react-native";
import Voice from "@react-native-voice/voice";
import { useTranslation } from "react-i18next";
import { getPOIs, searchPois } from "../api/mockApi";

const EXTRA_GAP = 40;


const fmtKm = (n) =>
  new Intl.NumberFormat(i18n.language?.startsWith("en") ? "en-US" : "pt-PT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);

function norm(str) {
  return (str ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dice(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
  }

  let inter = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const c = bigrams.get(bg) || 0;
    if (c > 0) {
      bigrams.set(bg, c - 1);
      inter++;
    }
  }

  return (2 * inter) / ((a.length - 1) + (b.length - 1));
}

function bestPoiMatch(spoken, pois) {
  const q = norm(spoken);
  if (!q) return null;

  const qTokens = q.split(" ").filter(t => t.length >= 3);

  let best = null;
  let bestScore = 0;

  for (const p of pois) {
    const title = norm(p.title);
    if (!title) continue;


    let score = dice(q, title);

    if (qTokens.length) {
      const hits = qTokens.filter(t => title.includes(t)).length;
      const tokenBonus = hits / qTokens.length; 
      score = score * 0.78 + tokenBonus * 0.22;
    }

    if (title.includes(q) || q.includes(title)) score += 0.12;

    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return best ? { poi: best, score: bestScore } : null;
}

export default function ExploreSearchPanel({ bottomOffset = 0, onPickDestination }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [listening, setListening] = useState(false);
  const [heardText, setHeardText] = useState("");


  const { i18n, t } = useTranslation();

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


  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      const text = e?.value?.[0] ?? "";
      if (!text) return;
      setHeardText(text);
      finishVoiceWithText(text);
    };

    Voice.onSpeechError = () => {
      stopVoice();
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  
  }, []);

  const ensureMicPermission = async () => {
    if (Platform.OS !== "android") return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const startVoice = async () => {
    const ok = await ensureMicPermission();
    if (!ok) return;

    setHeardText("");
    setListening(true);

    try {

     const locale = i18n.language?.startsWith("en") ? "en-US" : "pt-PT";
     await Voice.start(locale);

    } catch {
      setListening(false);
    }
  };

  const stopVoice = async () => {
    try { await Voice.stop(); } catch {}
    setListening(false);
  };

  const finishVoiceWithText = async (text) => {
    await stopVoice();

    try {
      const pois = await getPOIs();
      const match = bestPoiMatch(text, pois);


      if (match?.poi && match.score >= 0.52) {
        pick(match.poi); 
        return;
      }

      setQ(text);
      setOpen(true);
      await load(text);
    } catch {
      setQ(text);
      setOpen(true);
      await load(text);
    }
  };

  return (
    <>
      <View style={[styles.panel, { bottom: bottomOffset + EXTRA_GAP }]}>
        <View style={styles.handle} />
        <View style={styles.searchRow}>
          <Pressable style={styles.searchTapArea} onPress={openModal}>
            <View style={styles.leftCircle}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
            </View>
            <Text style={styles.title}>{t("exploreSearch.where_to")}</Text>
          </Pressable>

        
         <Pressable style={styles.rightCircle} onPress={startVoice} accessibilityLabel={t("a11y.voice_search")}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>🎤</Text>
          </Pressable>
        </View>
      </View>

      
      <Modal visible={listening} transparent animationType="fade">
        <View style={styles.listenBackdrop}>
          <View style={styles.listenCard}>
            <Text style={styles.listenTitle}>{t("exploreSearch.listening_title")}</Text>
            <Text style={styles.listenSub} numberOfLines={2}>
              {heardText ? `“${heardText}”` : t("exploreSearch.listening_hint")}
            </Text>

            <Pressable style={styles.listenCancel} onPress={stopVoice}>
              <Text style={styles.listenCancelText}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

   
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
              placeholder={t("exploreSearch.placeholder")}
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
                    {t("common.city_viana")}
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
    paddingLeft: 10,
    paddingRight: 6,
    elevation: 10,
  },
  searchTapArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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

  // Listening UI
  listenBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  listenCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    elevation: 22,
  },
  listenTitle: { fontSize: 16, fontWeight: "900", color: "#0B2D4D" },
  listenSub: { marginTop: 8, fontWeight: "800", color: "#6B7A88" },
  listenCancel: {
    marginTop: 14,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#051F41",
    alignItems: "center",
    justifyContent: "center",
  },
  listenCancelText: { color: "#fff", fontWeight: "900" },
});
