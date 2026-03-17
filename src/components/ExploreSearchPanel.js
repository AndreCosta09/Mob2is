import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Voice from "@react-native-voice/voice";
import { useTranslation } from "react-i18next";
import MicrofoneIcon from "../assets/microfone.svg";
import SearchIcon from "../assets/search.svg";
import { getApiErrorMessage, getPOIs, searchPois } from "../api/mockApi";

const EXTRA_GAP = 56;

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
  for (let index = 0; index < a.length - 1; index++) {
    const bg = a.slice(index, index + 2);
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
  }

  let inter = 0;
  for (let index = 0; index < b.length - 1; index++) {
    const bg = b.slice(index, index + 2);
    const count = bigrams.get(bg) || 0;
    if (count > 0) {
      bigrams.set(bg, count - 1);
      inter++;
    }
  }

  return (2 * inter) / (a.length - 1 + (b.length - 1));
}

function bestPoiMatch(spoken, pois) {
  const q = norm(spoken);
  if (!q) return null;

  const qTokens = q.split(" ").filter((token) => token.length >= 3);

  let best = null;
  let bestScore = 0;

  for (const poi of pois) {
    const title = norm(poi.title);
    if (!title) continue;

    let score = dice(q, title);

    if (qTokens.length) {
      const hits = qTokens.filter((token) => title.includes(token)).length;
      const tokenBonus = hits / qTokens.length;
      score = score * 0.78 + tokenBonus * 0.22;
    }

    if (title.includes(q) || q.includes(title)) score += 0.12;

    if (score > bestScore) {
      bestScore = score;
      best = poi;
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
  const [searchErrorMessage, setSearchErrorMessage] = useState("");
  const finishVoiceWithTextRef = useRef(null);

  const { i18n, t } = useTranslation();

  const load = async (query) => {
    try {
      const response = await searchPois(query);
      setResults(response);
      setSearchErrorMessage("");
    } catch (error) {
      setResults([]);
      setSearchErrorMessage(
        getApiErrorMessage(error, "Nao foi possivel pesquisar os destinos.")
      );
    }
  };

  useEffect(() => {
    if (!open) return;
    load(q);
  }, [open, q]);

  async function stopVoice() {
    try {
      await Voice.stop();
    } catch {}
    setListening(false);
  }

  async function finishVoiceWithText(text) {
    await stopVoice();

    try {
      const pois = await getPOIs();
      setSearchErrorMessage("");
      const match = bestPoiMatch(text, pois);

      if (match?.poi && match.score >= 0.52) {
        pick(match.poi);
        return;
      }

      setQ(text);
      setOpen(true);
      await load(text);
    } catch (error) {
      setSearchErrorMessage(
        getApiErrorMessage(error, "Nao foi possivel carregar os destinos.")
      );
      setQ(text);
      setOpen(true);
      await load(text);
    }
  }

  finishVoiceWithTextRef.current = finishVoiceWithText;

  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      const text = event?.value?.[0] ?? "";
      if (!text) return;
      setHeardText(text);
      finishVoiceWithTextRef.current?.(text);
    };

    Voice.onSpeechError = () => {
      try {
        Voice.stop();
      } catch {}
      setListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  const openModal = async () => {
    setOpen(true);
    await load(q);
  };

  const pick = (item) => {
    setOpen(false);
    setQ("");
    setSearchErrorMessage("");
    onPickDestination?.(item);
  };

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

  return (
    <>
      <View style={[styles.panel, { bottom: bottomOffset + EXTRA_GAP }]}>
        <View style={styles.searchRow}>
          <Pressable style={styles.searchTapArea} onPress={openModal}>
            <View style={styles.leftCircle}>
              <SearchIcon width={18} height={18} color="#6B7A88" />
            </View>
            <Text style={styles.title}>{t("exploreSearch.where_to")}</Text>
          </Pressable>

          <Pressable
            style={styles.rightCircle}
            onPress={startVoice}
            accessibilityLabel={t("a11y.voice_search")}
          >
            <MicrofoneIcon width={14} height={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <Modal visible={listening} transparent animationType="fade">
        <View style={styles.listenBackdrop}>
          <View style={styles.listenCard}>
            <Text style={styles.listenTitle}>{t("exploreSearch.listening_title")}</Text>
            <Text style={styles.listenSub} numberOfLines={2}>
              {heardText ? `"${heardText}"` : t("exploreSearch.listening_hint")}
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
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Text style={styles.backChevron}>{"<"}</Text>
            </Pressable>

            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t("exploreSearch.placeholder")}
              placeholderTextColor="#9AA3AD"
              style={styles.input}
              autoFocus
            />

            <Pressable
              style={styles.pencilCircle}
              onPress={startVoice}
              accessibilityLabel={t("a11y.voice_search")}
            >
              <MicrofoneIcon width={14} height={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              searchErrorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{searchErrorMessage}</Text>
                </View>
              ) : null
            }
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
    backgroundColor: "transparent",
  },
  searchRow: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 6,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F18F01",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#6B7A88",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sheet: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.08)",
    maxHeight: "55%",
  },
  sheetTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  backChevron: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6B7A88",
    width: 14,
  },
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
  errorBox: {
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#FFF4E8",
    borderWidth: 1,
    borderColor: "rgba(241,143,1,0.26)",
  },
  errorText: {
    color: "#8A4B00",
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },
  rowActive: {
    backgroundColor: "#F18F01",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C9D1DA",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
  },
  itemTitle: {
    fontWeight: "900",
    color: "#0B2D4D",
  },
  itemTitleActive: {
    color: "#FFFFFF",
  },
  itemSub: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7A88",
    marginTop: 2,
  },
  itemSubActive: {
    color: "#FFFFFF",
  },
  km: {
    fontWeight: "900",
    color: "#0B2D4D",
  },
  kmActive: {
    color: "#FFFFFF",
  },
  listenBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  listenCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    elevation: 22,
  },
  listenTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0B2D4D",
  },
  listenSub: {
    marginTop: 8,
    fontWeight: "800",
    color: "#6B7A88",
  },
  listenCancel: {
    marginTop: 14,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#051F41",
    alignItems: "center",
    justifyContent: "center",
  },
  listenCancelText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
