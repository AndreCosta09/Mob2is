import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
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
import BackIcon from "../assets/back.svg";
import { getApiErrorMessage, getPOIs, searchPois } from "../api/mockApi";
import { getAppPalette, getModalAnimationType } from "../utils/accessibility";
import { haversineMeters } from "../utils/map/geo";

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

export default function ExploreSearchPanel({
  bottomOffset = 0,
  onPickDestination,
  reduceMotion = false,
  highContrast = false,
  userCoord = null,
  embedded = false,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [listening, setListening] = useState(false);
  const [heardText, setHeardText] = useState("");
  const [searchErrorMessage, setSearchErrorMessage] = useState("");
  const finishVoiceWithTextRef = useRef(null);
  const voiceFinishingRef = useRef(false);
  const sheetDragStartYRef = useRef(0);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const { i18n, t } = useTranslation();
  const colors = getAppPalette(highContrast);

  const enrichResultsWithDistance = useCallback(
    (items = []) => {
      return [...items]
        .map((item) => {
          const distanceKm =
            Array.isArray(userCoord) && Array.isArray(item?.coords)
              ? haversineMeters(userCoord, item.coords) / 1000
              : null;

          return {
            ...item,
            distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
          };
        })
        .sort((a, b) => {
          const distA = Number.isFinite(a.distanceKm) ? a.distanceKm : Infinity;
          const distB = Number.isFinite(b.distanceKm) ? b.distanceKm : Infinity;
          return distA - distB;
        });
    },
    [userCoord]
  );

  const load = useCallback(
    async (query) => {
      try {
        const response = await searchPois(query);
        setResults(enrichResultsWithDistance(response));
        setSearchErrorMessage("");
      } catch (error) {
        setResults([]);
        setSearchErrorMessage(getApiErrorMessage(error, t("api.cannot_search_destinations")));
      }
    },
    [enrichResultsWithDistance, t]
  );

  useEffect(() => {
    if (!open) return;
    load(q);
  }, [load, open, q, userCoord]);

  const attachVoiceListeners = useCallback(() => {
    Voice.onSpeechResults = (event) => {
      const text = event?.value?.[0] ?? "";
      if (!text || voiceFinishingRef.current) return;
      voiceFinishingRef.current = true;
      setHeardText(text);
      finishVoiceWithTextRef.current?.(text);
    };

    Voice.onSpeechPartialResults = (event) => {
      const text = event?.value?.[0] ?? "";
      if (text) setHeardText(text);
    };

    Voice.onSpeechError = () => {
      voiceFinishingRef.current = false;
      setListening(false);
    };

    Voice.onSpeechEnd = () => {
      setListening(false);
    };
  }, []);

  async function resetVoiceEngine() {
    try {
      await Voice.cancel();
    } catch {}
    try {
      await Voice.destroy();
    } catch {}
    try {
      Voice.removeAllListeners();
    } catch {}
    attachVoiceListeners();
  }

  async function stopVoice() {
    await resetVoiceEngine();
    voiceFinishingRef.current = false;
    setListening(false);
  }

  async function finishVoiceWithText(text) {
    await stopVoice();

    try {
      const pois = await getPOIs();
      setSearchErrorMessage("");
      const match = bestPoiMatch(text, pois);

      if (match?.poi && match.score >= 0.52) {
        pick(enrichResultsWithDistance([match.poi])[0]);
        return;
      }

      setQ(text);
      setOpen(true);
      await load(text);
    } catch (error) {
      setSearchErrorMessage(getApiErrorMessage(error, t("api.cannot_load_destinations")));
      setQ(text);
      setOpen(true);
      await load(text);
    }
  }

  finishVoiceWithTextRef.current = finishVoiceWithText;

  useEffect(() => {
    attachVoiceListeners();

    return () => {
      Voice.destroy()
        .then(() => Voice.removeAllListeners())
        .catch(() => {});
    };
  }, [attachVoiceListeners]);

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
    if (listening) return;

    const ok = await ensureMicPermission();
    if (!ok) return;

    setHeardText("");
    setSearchErrorMessage("");
    setListening(true);
    voiceFinishingRef.current = false;

    try {
      await resetVoiceEngine();
      const locale = i18n.language?.startsWith("en") ? "en-US" : "pt-PT";
      await Voice.start(locale);
    } catch {
      voiceFinishingRef.current = false;
      setListening(false);
    }
  };

  const onSheetDragGrant = (event) => {
    sheetDragStartYRef.current = event.nativeEvent.pageY;
    sheetTranslateY.stopAnimation();
  };

  const onSheetDragMove = (event) => {
    const dy = Math.max(0, event.nativeEvent.pageY - sheetDragStartYRef.current);
    sheetTranslateY.setValue(dy);
  };

  const onSheetDragRelease = (event) => {
    const dy = event.nativeEvent.pageY - sheetDragStartYRef.current;
    if (dy > 48) {
      Animated.timing(sheetTranslateY, {
        toValue: 520,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        sheetTranslateY.setValue(0);
        setOpen(false);
      });
      return;
    }

    Animated.spring(sheetTranslateY, {
      toValue: 0,
      damping: 20,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <View
        style={
          embedded
            ? styles.panelEmbedded
            : [styles.panel, { bottom: bottomOffset + EXTRA_GAP }]
        }
      >
        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Pressable style={styles.searchTapArea} onPress={openModal}>
            <View style={[styles.leftCircle, { backgroundColor: colors.surfaceAlt }]}>
              <SearchIcon width={18} height={18} color={colors.muted} />
            </View>
            <Text style={[styles.title, { color: colors.muted }]}>{t("exploreSearch.where_to")}</Text>
          </Pressable>

          <Pressable
            style={[styles.rightCircle, { backgroundColor: colors.accent }]}
            onPress={startVoice}
            accessibilityLabel={t("a11y.voice_search")}
          >
            <MicrofoneIcon width={14} height={18} color={highContrast ? colors.accentText : "#FFFFFF"} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={listening}
        transparent
        animationType={getModalAnimationType(reduceMotion, "fade")}
      >
        <View style={[styles.listenBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.listenCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.listenTitle, { color: colors.text }]}>{t("exploreSearch.listening_title")}</Text>
            <Text style={[styles.listenSub, { color: colors.muted }]} numberOfLines={2}>
              {heardText ? `"${heardText}"` : t("exploreSearch.listening_hint")}
            </Text>

            <Pressable
              style={[
                styles.listenCancel,
                { backgroundColor: highContrast ? colors.text : "#051F41" },
              ]}
              onPress={stopVoice}
            >
              <Text style={styles.listenCancelText}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={open}
        transparent
        animationType={getModalAnimationType(reduceMotion, "fade")}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)} />

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: 20,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View
            style={styles.handleHit}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={onSheetDragGrant}
            onResponderMove={onSheetDragMove}
            onResponderRelease={onSheetDragRelease}
            onResponderTerminate={onSheetDragRelease}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.sheetTop}>
            <Pressable
              onPress={() => setOpen(false)}
              hitSlop={10}
              style={[
                styles.backBtn,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <BackIcon width={20} height={20} />
            </Pressable>

            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t("exploreSearch.placeholder")}
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceAlt,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              autoFocus
            />

            <Pressable
              style={[styles.pencilCircle, { backgroundColor: colors.accent }]}
              onPress={startVoice}
              accessibilityLabel={t("a11y.voice_search")}
            >
              <MicrofoneIcon width={14} height={18} color={highContrast ? colors.accentText : "#FFFFFF"} />
            </Pressable>
          </View>

          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              searchErrorMessage ? (
                <View
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: colors.dangerBg,
                      borderColor: colors.dangerBorder,
                    },
                  ]}
                >
                  <Text style={[styles.errorText, { color: colors.dangerText }]}>{searchErrorMessage}</Text>
                </View>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 10 }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => pick(item)}
                style={[
                  styles.rowItem,
                  index === 0 && {
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: highContrast ? colors.border : "#C9D1DA" },
                    index === 0 && styles.dotActive,
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: colors.text },
                      index === 0 && styles.itemTitleActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.itemSub,
                      { color: colors.muted },
                      index === 0 && styles.itemSubActive,
                    ]}
                  >
                    {t("common.city_viana")}
                  </Text>
                </View>
                <Text style={[styles.km, { color: colors.text }, index === 0 && styles.kmActive]}>
                  {Number.isFinite(item.distanceKm)
                    ? `${item.distanceKm.toFixed(1).replace(".", ",")} km`
                    : `-- ${t("common.km")}`}
                </Text>
              </Pressable>
            )}
          />
        </Animated.View>
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
  panelEmbedded: {
    width: "100%",
    backgroundColor: "transparent",
  },
  searchRow: {
    height: 58,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 8,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F18F01",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: "#6B7A88",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.08)",
    maxHeight: "54%",
  },
  handleHit: {
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingTop: 2,
    paddingBottom: 10,
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(11,45,77,0.16)",
  },
  sheetTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontWeight: "800",
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
    borderRadius: 20,
    borderWidth: 1,
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
