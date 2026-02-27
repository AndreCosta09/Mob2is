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
      <Path d="M9 7.5v9l8-4.5-8-4.5Z" fill={color} />
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

  // ✅ NOVO: perfis/rotas
  profiles = [], // pode ser ["rapida","equilibrada","acessivel"] OU [{perfil:"..."}]
  selectedPerfil = "equilibrada",
  onSelectPerfil,

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

  // ✅ Normaliza perfis disponíveis
  const availableProfiles = useMemo(() => {
    const arr = Array.isArray(profiles) ? profiles : [];
    const list = arr
      .map((p) => (typeof p === "string" ? p : p?.perfil))
      .filter(Boolean);
    return new Set(list);
  }, [profiles]);

  const orderedProfiles = useMemo(() => ["rapida", "equilibrada", "acessivel"], []);

  const labelForPerfil = (perfil) => {
    if (perfil === "rapida") return t("navigation.profile_fast", { defaultValue: "Rápida" });
    if (perfil === "equilibrada") return t("navigation.profile_balanced", { defaultValue: "Equilibrada" });
    if (perfil === "acessivel") return t("navigation.profile_accessible", { defaultValue: "Acessível" });
    return String(perfil);
  };

  if (!active || !poi) return null;

  return (
    <Animated.View style={[styles.wrap, { bottom: bottomOffset, transform: [{ translateY: y }] }]}>
      {/* ✅ sem botão "Ocultar": tocar no handle fecha */}
      <Pressable onPress={onClose} style={styles.handleHit} accessibilityLabel="Fechar">
        <View style={styles.handle} />
      </Pressable>

      <Text style={styles.destTitle}>{t("navigation.destination", { defaultValue: "Destino" })}</Text>
      <Text style={styles.destName} numberOfLines={2}>
        {poi.title}
      </Text>

      <View style={styles.metaBlock}>
        <Text style={styles.eta}>
          {etaMin ? t("navigation.eta", { min: etaMin, defaultValue: `Tempo estimado: ${etaMin} min` }) : t("navigation.eta_unknown", { defaultValue: "Tempo estimado: —" })}
        </Text>

        {/* ✅ 3 botões de rota */}
        <View style={styles.profileRow}>
          {orderedProfiles.map((perfil) => {
            const hasApiProfiles = availableProfiles.size > 0;
            const disabled = following || (hasApiProfiles && !availableProfiles.has(perfil));
            const isActive = perfil === (selectedPerfil || "equilibrada");

            return (
              <Pressable
                key={perfil}
                disabled={disabled}
                onPress={() => onSelectPerfil?.(perfil)}
                style={[
                  styles.profilePill,
                  isActive && styles.profilePillActive,
                  disabled && styles.profilePillDisabled,
                ]}
              >
                <Text style={[styles.profileText, isActive && styles.profileTextActive]}>
                  {labelForPerfil(perfil)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Nova rota (mantém-se) */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionPillLight} onPress={onClear} accessibilityLabel="Nova rota">
            <IconPinPlus />
            <Text style={styles.actionPillLightText}>{t("navigation.new_route", { defaultValue: "Nova rota" })}</Text>
          </Pressable>
        </View>
      </View>

      {/* Legenda */}
      <View style={styles.legendBox}>
        <View style={styles.legendRow}>
          <DotsLine color={legendColors.alta} />
          <Text style={styles.legendText}>{t("navigation.legend_high", { defaultValue: "Alta acessibilidade" })}</Text>
        </View>
        <View style={styles.legendRow}>
          <DotsLine color={legendColors.media} />
          <Text style={styles.legendText}>{t("navigation.legend_medium", { defaultValue: "Média acessibilidade" })}</Text>
        </View>
        <View style={styles.legendRow}>
          <DotsLine color={legendColors.baixa} />
          <Text style={styles.legendText}>{t("navigation.legend_low", { defaultValue: "Baixa acessibilidade" })}</Text>
        </View>
      </View>

      {/* ✅ Iniciar rota em baixo da legenda */}
      {!following ? (
        <Pressable style={styles.startBtn} onPress={onStartFollow} accessibilityLabel="Iniciar rota">
          <IconPlay />
          <Text style={styles.startBtnText}>{t("navigation.start_route", { defaultValue: "Iniciar rota" })}</Text>
        </Pressable>
      ) : (
        <View style={styles.followChip}>
          <View style={styles.followDot} />
          <Text style={styles.followChipText}>{t("navigation.navigating", { defaultValue: "A navegar…" })}</Text>
        </View>
      )}
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
  handleHit: { alignSelf: "center", paddingVertical: 6, paddingHorizontal: 30 },
  handle: {
    width: 54,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C9D1DA",
    alignSelf: "center",
  },

  destTitle: { textAlign: "center", fontSize: 14, fontWeight: "900", color: "#6B7A88" },
  destName: { textAlign: "center", fontSize: 18, fontWeight: "900", color: "#051F41", marginTop: 6 },

  metaBlock: { marginTop: 16 },
  eta: { fontWeight: "900", color: "#6B7A88" },

  profileRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  profilePill: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(21,121,179,0.25)",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  profilePillActive: { backgroundColor: "#051F41", borderColor: "#051F41" },
  profilePillDisabled: { opacity: 0.45 },
  profileText: { fontWeight: "900", fontSize: 13, color: "#051F41" },
  profileTextActive: { color: "#FFFFFF" },

  actionsRow: { marginTop: 14, alignItems: "flex-start" },

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
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  actionPillLightText: { color: "#051F41", fontWeight: "900", fontSize: 13 },

  legendBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(5,31,65,0.06)",
  },
  legendRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingLeft: 10 },
  dotsLine: { flexDirection: "row", alignItems: "center", gap: 5, width: 72 },
  dot: { width: 9, height: 9, borderRadius: 4 },
  legendText: { fontWeight: "900", color: "#051F41", marginLeft: 35 },

  startBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F09C1F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  startBtnText: { color: "#051F41", fontWeight: "900", fontSize: 14 },

  followChip: {
    marginTop: 12,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(57,162,93,0.12)",
    borderWidth: 1,
    borderColor: "rgba(57,162,93,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  followDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#39A25D" },
  followChipText: { fontWeight: "900", fontSize: 14, color: "#39A25D" },
});