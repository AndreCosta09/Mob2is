import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { useTranslation } from "react-i18next";




function DotsLine({ color }) {
  const dots = useMemo(() => Array.from({ length: 7 }), []);
  return (
    <View style={styles.dotsLine}>
      {dots.map((_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

function IconChevronDown({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconPinPlus({ size = 18, color = "#051F41", accent = "#F09C1F" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s7-5.3 7-12a7 7 0 10-14 0c0 6.7 7 12 7 12z"
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="2.6" stroke={color} strokeWidth={2.2} />
      <Line x1="18.2" y1="6.2" x2="18.2" y2="11" stroke={accent} strokeWidth={2.6} strokeLinecap="round" />
      <Line x1="15.8" y1="8.6" x2="20.6" y2="8.6" stroke={accent} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

function IconPlay({ size = 18, color = "#051F41" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 7.5v9l8-4.5-8-4.5Z"
        fill={color}
      />
    </Svg>
  );
}

export default function NavigationSheet({
  active,
  open,
  bottomOffset = 94,
  poi,
  etaMin = 0,
  segments = [],
  following = false,
  onClose,
  onClear,
  onStartFollow,
}) {
  const hiddenY = 900;
  const y = useRef(new Animated.Value(hiddenY)).current;
  const { t } = useTranslation();
  useEffect(() => {
    const target = !active || !open ? hiddenY : 0;

    Animated.spring(y, {
      toValue: target,
      damping: 22,
      stiffness: 180,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [active, open, y]);

  const legendColors = useMemo(() => {
    return { alta: "#39A25D", media: "#F0B429", baixa: "#FF4D6D" };
  }, []);

  if (!active || !poi) return null;

  return (
    <Animated.View style={[styles.wrap, { bottom: bottomOffset, transform: [{ translateY: y }] }]}>
      <View style={styles.handle} />

      <Text style={styles.destTitle}>{t("navigation.destination")}</Text>
      <Text style={styles.destName} numberOfLines={2}>
        {poi.title}
      </Text>

      <View style={styles.metaBlock}>
        <Text style={styles.eta}>{etaMin ? t("navigation.eta", { min: etaMin }) : t("navigation.eta_unknown")}</Text>

        {following ? (
          <Text style={styles.followingHint}>{t("navigation.following_hint")}</Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.actionPillDark} onPress={onClose} accessibilityLabel="Ocultar detalhes">
            <IconChevronDown />
            <Text style={styles.actionPillDarkText}>{t("navigation.hide")}</Text>
          </Pressable>

          {!following ? (
            <Pressable style={styles.actionPillOrange} onPress={onStartFollow} accessibilityLabel="Iniciar rota">
              <IconPlay />
              <Text style={styles.actionPillOrangeText}>{t("navigation.start_route")}</Text>
            </Pressable>
          ) : (
            <View style={styles.actionChip}>
              <View style={styles.actionChipDot} />
              <Text style={styles.actionChipText}>{t("navigation.navigating")}</Text>
            </View>
          )}

          <Pressable style={styles.actionPillLight} onPress={onClear} accessibilityLabel="Nova rota">
            <IconPinPlus />
            <Text style={styles.actionPillLightText}>{t("navigation.new_route")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.legendBox}>
        <View style={styles.legendRow}>
          <DotsLine color={legendColors.alta} />
          <Text style={styles.legendText}>{t("navigation.legend_high")}</Text>
        </View>
        <View style={styles.legendRow}>
          <DotsLine color={legendColors.media} />
          <Text style={styles.legendText}>{t("navigation.legend_medium")}</Text>
        </View>
        <View style={styles.legendRow}>
          <DotsLine color={legendColors.baixa} />
          <Text style={styles.legendText}>{t("navigation.legend_low")}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#F6F7F9",
    borderRadius: 22,
    padding: 14,
    elevation: 40,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
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
    color: "#051F41",
    marginTop: 6,
  },

  metaBlock: { marginTop: 16 },
  eta: { fontWeight: "900", color: "#6B7A88" },
  followingHint: { marginTop: 6, fontWeight: "900", color: "#1579B3", fontSize: 12 },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },

  actionPillDark: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#051F41",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 10,
  },
  actionPillDarkText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },

  actionPillOrange: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F09C1F",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 10,
  },
  actionPillOrangeText: { color: "#051F41", fontWeight: "900", fontSize: 13 },

  actionPillLight: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(21,121,179,0.35)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 8,
  },
  actionPillLightText: { color: "#051F41", fontWeight: "900", fontSize: 13 },

  actionChip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(57,162,93,0.14)",
    borderWidth: 1,
    borderColor: "rgba(57,162,93,0.35)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionChipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#39A25D" },
  actionChipText: { fontWeight: "900", color: "#051F41", fontSize: 13 },

  legendBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(5,31,65,0.06)",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingLeft: 10,
  },
  dotsLine: { flexDirection: "row", alignItems: "center", gap: 5, width: 72 },
  dot: { width: 9, height: 9, borderRadius: 4 },
  legendText: { fontWeight: "900", color: "#051F41", marginLeft: 35 },
});
