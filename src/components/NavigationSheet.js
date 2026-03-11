import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import { useTranslation } from "react-i18next";

const SHEET_HIDDEN_Y = 900;

const COLORS = {
  navy: "#051F41",
  blue: "#1579B3",
  orange: "#F09C1F",
  green: "#39A25D",
  yellow: "#E9A11B",
  red: "#F25374",
  text: "#0A2342",
  textSoft: "#6B7A88",
  textMuted: "#9AA6B5",
  bg: "#F2F4F7",
  card: "#EDEFF2",
  border: "#D6DDE7",
  greyDot: "#A8B3C2",
  light: "#FFFFFF",
  purple: "#A98AE8",
  blueBadge: "#1D84BF",
};

const STATIC_PROFILE_UI = {
  acessivel: {
    label: "Acessível",
    distanceKm: 2.4,
    dots: ["g", "g", "g", "g", "y", "y", "g", "g", "g", "g"],
    slopePct: "5%",
    stepsPct: "12%",
    highPct: "83%",
    mediumPct: "26%",
    lowPct: "1%",
    lowSlopeText: "Inclinação de baixa acessibilidade",
    lowStepsText: "Relevo com baixa acessibilidade",
  },
  rapida: {
    label: "Rápido",
    distanceKm: 1.7,
    dots: ["g", "g", "g", "y", "y", "r", "g", "g", "y", "g"],
    slopePct: "23%",
    stepsPct: "47%",
    highPct: "52%",
    mediumPct: "31%",
    lowPct: "17%",
    lowSlopeText: "Inclinação moderada",
    lowStepsText: "Relevo irregular",
  },
  equilibrada: {
    label: "Equilibrada",
    distanceKm: 5.2,
    dots: ["g", "g", "g", "g", "g", "y", "y", "g", "g", "g"],
    slopePct: "1%",
    stepsPct: "3%",
    highPct: "90%",
    mediumPct: "8%",
    lowPct: "2%",
    lowSlopeText: "Inclinação reduzida",
    lowStepsText: "Relevo reduzido",
  },
};

function formatKm(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1).replace(".", ",")} km`;
}

function getDotColor(token, muted) {
  if (muted) return COLORS.greyDot;
  if (token === "g") return COLORS.green;
  if (token === "y") return COLORS.yellow;
  if (token === "r") return COLORS.red;
  return COLORS.greyDot;
}

function IconPlay({ size = 14, color = "#FFFFFF" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 7.5v9l8-4.5-8-4.5Z" fill={color} />
    </Svg>
  );
}

function IconChevron({ open = false, color = "#98A5B5", size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d={open ? "M4 12l6-6 6 6" : "M4 8l6 6 6-6"}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconSlope({ size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 20" fill="none">
      <Polyline
        points="2,15 8,9 13,14 20,6 26,12"
        stroke="#FFFFFF"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconSteps({ size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 20" fill="none">
      <Path
        d="M3 15h7V9h7V4h8"
        stroke="#FFFFFF"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DotsRow({ dots = [], muted = false }) {
  return (
    <View style={styles.dotsRow}>
      {dots.map((token, index) => (
        <View
          key={`${token}-${index}`}
          style={[
            styles.routeDot,
            { backgroundColor: getDotColor(token, muted) },
          ]}
        />
      ))}
    </View>
  );
}

function MetricBadge({ variant = "slope", value = "0%", muted = false }) {
  const leftBg = variant === "slope" ? COLORS.purple : COLORS.blueBadge;

  return (
    <View style={[styles.metricBadge, muted && styles.metricBadgeMuted]}>
      <View style={[styles.metricBadgeLeft, { backgroundColor: leftBg }]}>
        {variant === "slope" ? <IconSlope /> : <IconSteps />}
      </View>
      <View style={styles.metricBadgeRight}>
        <Text style={[styles.metricBadgeText, muted && styles.metricBadgeTextMuted]}>{value}</Text>
      </View>
    </View>
  );
}

function LegendPercentRow({ color, text, value }) {
  return (
    <View style={styles.legendPercentRow}>
      <View style={[styles.legendPercentDot, { backgroundColor: color }]} />
      <Text style={[styles.legendPercentValue, { color }]}>{value}</Text>
      <Text style={[styles.legendPercentText, { color }]}>{text}</Text>
    </View>
  );
}

function RouteCard({
  item,
  selected,
  disabled,
  expanded,
  onPress,
  onToggleExpand,
  following = false,
}) {
  const labelColor = selected ? COLORS.orange : COLORS.textMuted;
  const muted = !selected;

  return (
    <View style={styles.routeCardWrap}>
      <Pressable
        onPress={onPress}
        style={[
          styles.routeCard,
          selected ? styles.routeCardSelected : styles.routeCardUnselected,
          disabled && styles.routeCardDisabled,
        ]}
      >
        <View style={styles.routeCardLeft}>
          <Text style={[styles.routeLabel, { color: labelColor }]}>{item.label}</Text>
          <Text style={[styles.routeDistance, { color: labelColor }]}>
            {formatKm(item.distanceKm)}
          </Text>
        </View>

        <View style={styles.routeCardCenter}>
          <DotsRow dots={item.dots} muted={muted} />

          <View style={styles.metricRow}>
            <MetricBadge variant="slope" value={item.slopePct} muted={muted} />
            <MetricBadge variant="steps" value={item.stepsPct} muted={muted} />
          </View>
        </View>

        <Pressable
          onPress={onToggleExpand}
          hitSlop={10}
          style={styles.chevronBtn}
        >
          <IconChevron open={expanded} color={selected ? "#98A5B5" : "#B7C0CC"} />
        </Pressable>
      </Pressable>

      {selected && expanded ? (
        <View style={[styles.expandedPanel, following && styles.expandedPanelFollowing]}>
          <LegendPercentRow
            color={COLORS.green}
            value={item.highPct}
            text="Alta acessibilidade"
          />
          <LegendPercentRow
            color={COLORS.yellow}
            value={item.mediumPct}
            text="Média acessibilidade"
          />
          <LegendPercentRow
            color={COLORS.red}
            value={item.lowPct}
            text="Baixa acessibilidade"
          />

          <View style={styles.expandedMetricsRow}>
            <MetricBadge variant="slope" value={item.slopePct} />
            <Text style={styles.expandedMetricText}>{item.lowSlopeText}</Text>
          </View>

          <View style={styles.expandedMetricsRow}>
            <MetricBadge variant="steps" value={item.stepsPct} />
            <Text style={styles.expandedMetricText}>{item.lowStepsText}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function NavigationSheet({
  active,
  open,
  bottomOffset = 0,
  poi,
  etaMin = 0,
  following = false,
  profiles = [],
  selectedPerfil = "equilibrada",
  onSelectPerfil,
  onClose,
  onClear,
  onStartFollow,
}) {
  const y = useRef(new Animated.Value(SHEET_HIDDEN_Y)).current;
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const target = !active || !open ? SHEET_HIDDEN_Y : 0;
    Animated.spring(y, {
      toValue: target,
      damping: 24,
      stiffness: 200,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [active, open, y]);

  useEffect(() => {
    setExpanded(false);
  }, [selectedPerfil, following]);

  const availableProfiles = useMemo(() => {
    const arr = Array.isArray(profiles) ? profiles : [];
    const list = arr
      .map((p) => (typeof p === "string" ? p : p?.perfil))
      .filter(Boolean);
    return new Set(list);
  }, [profiles]);

  const apiProfilesByKey = useMemo(() => {
    const arr = Array.isArray(profiles) ? profiles : [];
    const map = new Map();
    arr.forEach((p) => {
      if (p && typeof p === "object" && p.perfil) map.set(p.perfil, p);
    });
    return map;
  }, [profiles]);

  const routeItems = useMemo(() => {
    const order = ["rapida", "equilibrada", "acessivel"];

    return order.map((perfil) => {
      const base = STATIC_PROFILE_UI[perfil];
      const api = apiProfilesByKey.get(perfil);

      return {
        perfil,
        label:
          perfil === "rapida"
            ? t("navigation.profile_fast", { defaultValue: "Rápido" })
            : perfil === "equilibrada"
            ? t("navigation.profile_balanced", { defaultValue: "Equilibrada" })
            : t("navigation.profile_accessible", { defaultValue: "Acessível" }),
        distanceKm:
          Number(api?.total_distance_m) > 0
            ? Number(api.total_distance_m) / 1000
            : base.distanceKm,
        estimatedTimeMin:
          Number(api?.estimated_time_min) > 0 ? Number(api.estimated_time_min) : etaMin || 0,
        dots: base.dots,
        slopePct: base.slopePct,
        stepsPct: base.stepsPct,
        highPct: base.highPct,
        mediumPct: base.mediumPct,
        lowPct: base.lowPct,
        lowSlopeText: base.lowSlopeText,
        lowStepsText: base.lowStepsText,
      };
    });
  }, [apiProfilesByKey, etaMin, t]);

  const selectedItem =
    routeItems.find((item) => item.perfil === selectedPerfil) ||
    routeItems.find((item) => item.perfil === "equilibrada") ||
    routeItems[0];

  const hasApiProfiles = availableProfiles.size > 0;

  const routeSummary =
    poi?.routeSummary ?? "Via R. de S. Vicente, Av. Cap. Gaspar de Castro";
  const trafficSummary =
    poi?.trafficSummary ?? "Melhor rota, Trânsito habitual";

  if (!active || !poi) return null;

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          bottom: 0,
          paddingBottom: Math.max(14, bottomOffset > 0 ? 14 : 14),
          transform: [{ translateY: y }],
        },
      ]}
    >
      <Pressable onPress={onClose} style={styles.handleHit}>
        <View style={styles.handle} />
      </Pressable>

      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerDot} />
            <Text style={[styles.kickerText, following && styles.kickerTextFollowing]}>
              {following
                ? "A navegar • a seguir a tua localização"
                : "Destino"}
            </Text>
          </View>

          <Text numberOfLines={2} style={styles.title}>
            {poi.title}
          </Text>

          <Text numberOfLines={1} style={styles.routeSummary}>
            {routeSummary}
          </Text>

          <Text numberOfLines={1} style={styles.trafficSummary}>
            {trafficSummary}
          </Text>
        </View>

        <Pressable
          onPress={onClear ?? onClose}
          hitSlop={10}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      <View style={styles.metaLine}>
        <Text style={styles.metaEta}>
          {t("navigation.eta", {
            min: selectedItem?.estimatedTimeMin || etaMin || 0,
            defaultValue: `Tempo estimado: ${selectedItem?.estimatedTimeMin || etaMin || 0} min`,
          })}
        </Text>
        <Text style={styles.metaDistance}>{formatKm(selectedItem?.distanceKm)}</Text>
      </View>

      {!following ? (
        <>
          <View style={styles.routesList}>
            {routeItems.map((item) => {
              const unavailable = hasApiProfiles && !availableProfiles.has(item.perfil);
              const selected = item.perfil === selectedItem?.perfil;

              return (
                <RouteCard
                  key={item.perfil}
                  item={item}
                  selected={selected}
                  disabled={unavailable}
                  expanded={selected && expanded}
                  onPress={() => {
                    if (unavailable) return;
                    onSelectPerfil?.(item.perfil);
                  }}
                  onToggleExpand={() => {
                    if (!selected) {
                      if (!unavailable) onSelectPerfil?.(item.perfil);
                      setExpanded(true);
                      return;
                    }
                    setExpanded((prev) => !prev);
                  }}
                />
              );
            })}
          </View>

          <Pressable style={styles.startBtn} onPress={onStartFollow}>
            <IconPlay />
            <Text style={styles.startBtnText}>
              {t("navigation.start_route", { defaultValue: "Iniciar Rota" })}
            </Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.routesListFollowing}>
          <RouteCard
            item={selectedItem}
            selected
            disabled={false}
            following
            expanded={expanded}
            onPress={() => {}}
            onToggleExpand={() => setExpanded((prev) => !prev)}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 14,
    elevation: 40,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
  },

  handleHit: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 30,
  },

  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#C4CCD6",
  },

  headerRow: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  headerTextWrap: {
    flex: 1,
    paddingRight: 8,
  },

  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  kickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
    marginRight: 6,
    marginTop: 1,
  },

  kickerText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
   kickerTextFollowing: {
    color: COLORS.green,
  },

  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: COLORS.navy,
  },

  routeSummary: {
    marginTop: 2,
    fontSize: 12,
    color: "#1B1F24",
  },

  trafficSummary: {
    marginTop: 1,
    fontSize: 11,
    color: "#2F3135",
  },

  closeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
  },

  closeText: {
    fontSize: 28,
    lineHeight: 28,
    color: "#96A2B3",
    fontWeight: "300",
  },

  metaLine: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metaEta: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A4AEBC",
  },

  metaDistance: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A4AEBC",
  },

  routesList: {
    gap: 10,
  },

  routesListFollowing: {
    paddingBottom: 6,
  },

  routeCardWrap: {
    gap: 10,
  },

  routeCard: {
    minHeight: 90,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  routeCardSelected: {
    backgroundColor: "#ECEFF3",
  },

  routeCardUnselected: {
    backgroundColor: "#F1F3F6",
  },

  routeCardDisabled: {
    opacity: 0.55,
  },

  routeCardLeft: {
    width: 105,
    justifyContent: "center",
  },

  routeLabel: {
    fontSize: 17,
    fontWeight: "400",
  },

  routeDistance: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: "400",
  },

  routeCardCenter: {
    flex: 1,
    justifyContent: "center",
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "nowrap",
  },

  routeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  metricRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  metricBadge: {
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "#D9D9D9",
  },

  metricBadgeMuted: {
    opacity: 0.7,
  },

  metricBadgeLeft: {
    width: 62,
    alignItems: "center",
    justifyContent: "center",
  },

  metricBadgeRight: {
    minWidth: 58,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  metricBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  metricBadgeTextMuted: {
    color: "#EDF2F7",
  },

  chevronBtn: {
    width: 28,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 10,
  },

  expandedPanel: {
    marginTop: -2,
    marginBottom: 2,
    marginHorizontal: 8,
    backgroundColor: "#ECEFF3",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  expandedPanelFollowing: {
    marginHorizontal: 0,
    marginTop: -4,
  },

  legendPercentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  legendPercentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  legendPercentValue: {
    width: 40,
    fontWeight: "900",
    fontSize: 14,
  },

  legendPercentText: {
    fontWeight: "900",
    fontSize: 14,
  },

  expandedMetricsRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  expandedMetricText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: "700",
  },

  startBtn: {
    marginTop: 12,
    marginBottom: 4,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  startBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});