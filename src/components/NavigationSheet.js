import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path, Polyline } from "react-native-svg";
import { useTranslation } from "react-i18next";

const SHEET_HIDDEN_Y = 900;

const COLORS = {
  navy: "#051F41",
  orange: "#F09C1F",
  green: "#39A25D",
  yellow: "#E9A11B",
  red: "#F25374",
  textMuted: "#98A5B5",
  bg: "#F3F5F7",
  card: "#EEF1F4",
  cardExpanded: "#EDF0F3",
  shadow: "#000000",
  purple: "#A98AE8",
  blue: "#2B8FCA",
  badgeGray: "#D5D7DB",
  dotGray: "#AEB8C7",
  white: "#FFFFFF",
};

const STATIC_PROFILE_UI = {
  rapida: {
    label: "Rápido",
    distanceKm: 1.2,
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
    distanceKm: 1.2,
    dots: ["g", "g", "g", "g", "g", "y", "g", "g", "g", "g"],
    slopePct: "1%",
    stepsPct: "3%",
    highPct: "90%",
    mediumPct: "8%",
    lowPct: "2%",
    lowSlopeText: "Inclinação reduzida",
    lowStepsText: "Relevo reduzido",
  },
  acessivel: {
    label: "Acessível",
    distanceKm: 1.2,
    dots: ["g", "g", "g", "g", "y", "y", "g", "g", "g", "g"],
    slopePct: "5%",
    stepsPct: "12%",
    highPct: "83%",
    mediumPct: "26%",
    lowPct: "1%",
    lowSlopeText: "Inclinação de baixa acessibilidade",
    lowStepsText: "Relevo com baixa acessibilidade",
  },
};

function formatKm(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1).replace(".", ",")} km`;
}

function IconPlay({ size = 14, color = "#051F41" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 7.5v9l8-4.5-8-4.5Z" fill={color} />
    </Svg>
  );
}

function IconChevron({ open = false, color = "#98A5B5", size = 16 }) {
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

function IconSlope({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 20" fill="none">
      <Polyline
        points="2,15 8,9 13,14 20,6 26,12"
        stroke="#FFFFFF"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconSteps({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 20" fill="none">
      <Path
        d="M3 15h7V9h7V4h8"
        stroke="#FFFFFF"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DotsRow({ dots = [], muted = false }) {
  return (
    <View style={styles.dotsRow}>
      {dots.map((token, index) => {
        let color = COLORS.dotGray;
        if (!muted) {
          if (token === "g") color = COLORS.green;
          else if (token === "y") color = COLORS.yellow;
          else if (token === "r") color = COLORS.red;
        }

        return (
          <View
            key={`${token}-${index}`}
            style={[styles.routeDot, { backgroundColor: color }]}
          />
        );
      })}
    </View>
  );
}

function MetricBadge({ type = "slope", value = "0%", muted = false }) {
  return (
    <View style={[styles.metricBadge, muted && styles.metricBadgeMuted]}>
      <View
        style={[
          styles.metricBadgeIconWrap,
          { backgroundColor: type === "slope" ? COLORS.purple : COLORS.blue },
        ]}
      >
        {type === "slope" ? <IconSlope /> : <IconSteps />}
      </View>
      <View style={styles.metricBadgeValueWrap}>
        <Text style={styles.metricBadgeValue}>{value}</Text>
      </View>
    </View>
  );
}

function LegendRow({ color, value, text }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendValue, { color }]}>{value}</Text>
      <Text style={[styles.legendText, { color }]}>{text}</Text>
    </View>
  );
}

function RouteCard({
  item,
  selected,
  disabled,
  expanded,
  following = false,
  onPress,
  onToggleExpand,
}) {
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
        <View style={styles.routeLeft}>
          <Text
            style={[
              styles.routeTitle,
              { color: selected ? COLORS.orange : COLORS.textMuted },
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>

          <Text
            style={[
              styles.routeKm,
              { color: selected ? COLORS.orange : COLORS.textMuted },
            ]}
          >
            {formatKm(item.distanceKm)}
          </Text>
        </View>

        <View style={styles.routeCenter}>
          <DotsRow dots={item.dots} muted={muted} />

          <View style={styles.routeMetrics}>
            <MetricBadge type="slope" value={item.slopePct} muted={muted} />
            <MetricBadge type="steps" value={item.stepsPct} muted={muted} />
          </View>
        </View>

        <Pressable onPress={onToggleExpand} hitSlop={10} style={styles.chevronBtn}>
          <IconChevron open={expanded} color={selected ? "#96A2B2" : "#BCC5D0"} />
        </Pressable>
      </Pressable>

      {selected && expanded ? (
        <View style={[styles.expandedBox, following && styles.expandedBoxFollowing]}>
          <LegendRow color={COLORS.green} value={item.highPct} text="Alta acessibilidade" />
          <LegendRow color={COLORS.yellow} value={item.mediumPct} text="Média acessibilidade" />
          <LegendRow color={COLORS.red} value={item.lowPct} text="Baixa acessibilidade" />

          <View style={styles.expandedMetricRow}>
            <MetricBadge type="slope" value={item.slopePct} />
            <Text style={styles.expandedMetricText}>{item.lowSlopeText}</Text>
          </View>

          <View style={styles.expandedMetricRow}>
            <MetricBadge type="steps" value={item.stepsPct} />
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
  bottomOffset = 94,
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
  const { height } = useWindowDimensions();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const target = !active || !open ? SHEET_HIDDEN_Y : 0;
    Animated.spring(y, {
      toValue: target,
      damping: 24,
      stiffness: 210,
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
            ? "Rápido"
            : perfil === "equilibrada"
            ? "Equilibrada"
            : "Acessível",
        distanceKm:
          Number(api?.total_distance_m) > 0
            ? Number(api.total_distance_m) / 1000
            : base.distanceKm,
        estimatedTimeMin:
          Number(api?.estimated_time_min) > 0
            ? Number(api.estimated_time_min)
            : etaMin || 0,
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
  }, [apiProfilesByKey, etaMin]);

  const selectedItem =
    routeItems.find((item) => item.perfil === selectedPerfil) ||
    routeItems.find((item) => item.perfil === "equilibrada") ||
    routeItems[0];

  const hasApiProfiles = availableProfiles.size > 0;

 const sheetBottom = 0;
const maxSheetHeight = Math.min(height * 0.62, height - 6);

  if (!active || !poi) return null;

return (
  <Modal
    visible={active && open}
    transparent
    animationType="none"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <View style={styles.modalRoot} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.sheet,
          {
            bottom: 0,
            maxHeight: maxSheetHeight,
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
                {following ? "A navegar • a seguir a tua localização" : "Destino"}
              </Text>
            </View>

            <Text numberOfLines={2} style={styles.title}>
              {poi.title}
            </Text>

            <Text numberOfLines={1} style={styles.subtitleLine}>
              {poi.routeSummary ?? "Via R. de S. Vicente, Av. Cap. Gaspar de Castro"}
            </Text>

            <Text numberOfLines={1} style={styles.subtitleLine}>
              {poi.trafficSummary ?? "Melhor rota, Trânsito habitual"}
            </Text>
          </View>

          <Pressable onPress={onClear ?? onClose} hitSlop={10} style={styles.closeBtn}>
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {!following ? (
            <>
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
            </>
          ) : (
            <RouteCard
              item={selectedItem}
              selected
              disabled={false}
              following
              expanded={expanded}
              onPress={() => {}}
              onToggleExpand={() => setExpanded((prev) => !prev)}
            />
          )}
        </ScrollView>

        {!following ? (
          <Pressable style={styles.startBtn} onPress={onStartFollow}>
            <Text style={styles.startBtnText}>Iniciar Rota</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  </Modal>
);
}

const styles = StyleSheet.create({

modalRoot: {
  flex: 1,
  justifyContent: "flex-end",
},
sheet: {
  position: "absolute",
  left: 0,
  right: 0,
  backgroundColor: COLORS.bg,
  borderTopLeftRadius: 26,
  borderTopRightRadius: 26,
  paddingTop: 8,
  paddingHorizontal: 12,
  paddingBottom: 10,
  elevation: 30,
  shadowColor: COLORS.shadow,
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: -3 },
},


  handleHit: {
    alignSelf: "center",
    paddingVertical: 5,
    paddingHorizontal: 28,
  },

  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#C7CFD8",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 2,
  },

  headerTextWrap: {
    flex: 1,
    paddingRight: 8,
  },

  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },

  kickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
    marginRight: 6,
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
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: COLORS.navy,
  },

  subtitleLine: {
    marginTop: 1,
    fontSize: 11,
    color: "#4F5661",
  },

  closeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
  },

  closeText: {
    fontSize: 26,
    lineHeight: 26,
    color: "#98A4B4",
    fontWeight: "300",
  },

  metaLine: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metaEta: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A2ADB9",
  },

  metaDistance: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A2ADB9",
  },

  scrollContent: {
    paddingBottom: 4,
  },

  routeCardWrap: {
    marginBottom: 10,
  },

routeCard: {
  minHeight: 84,
  borderRadius: 22,
  paddingHorizontal: 12,
  paddingVertical: 9,
  flexDirection: "row",
  alignItems: "center",
  shadowColor: COLORS.shadow,
  shadowOpacity: 0.07,
  shadowRadius: 7,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
},

  routeCardSelected: {
    backgroundColor: COLORS.card,
  },

  routeCardUnselected: {
    backgroundColor: "#F1F4F7",
  },

  routeCardDisabled: {
    opacity: 0.62,
  },

  routeLeft: {
    width: 82,
    justifyContent: "center",
  },

  routeTitle: {
    fontSize: 12,
    fontWeight: "400",
  },

  routeKm: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "400",
  },

  routeCenter: {
    flex: 1,
    paddingRight: 6,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },

  routeDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },



  routeMetrics: {
    marginTop: 7,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },

  metricBadge: {
    height: 26,
    borderRadius: 7,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: COLORS.badgeGray,
  },

  metricBadgeMuted: {
    opacity: 0.7,
  },

  metricBadgeIconWrap: {
    width: 62,
    alignItems: "center",
    justifyContent: "center",
  },

  metricBadgeValueWrap: {
    minWidth: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    backgroundColor: COLORS.badgeGray,
  },
    metricBadgeValue: {
      color: COLORS.white,
      fontSize: 10,
      fontWeight: "800",
    },

  chevronBtn: {
    width: 30,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  expandedBox: {
    marginTop: 6,
    marginHorizontal: 6,
    backgroundColor: COLORS.cardExpanded,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  expandedBoxFollowing: {
    marginHorizontal: 0,
  },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 8,
  },

  legendValue: {
    width: 38,
    fontSize: 12,
    fontWeight: "900",
  },

  legendText: {
    fontSize: 12,
    fontWeight: "900",
  },

  expandedMetricRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  expandedMetricText: {
    flex: 1,
    fontSize: 11,
    color: "#6F7C8B",
    fontWeight: "700",
  },

 startBtn: {
  marginTop: 6,
  height: 44,
  borderRadius: 16,
  backgroundColor: COLORS.orange,
  alignItems: "center",
  justifyContent: "center",
  elevation: 6,
  shadowColor: COLORS.shadow,
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
},

  startBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },
});