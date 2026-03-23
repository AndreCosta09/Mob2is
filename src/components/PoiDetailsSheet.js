import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function PoiDetailsSheet({
  visible,
  poi,
  onClose,
  onStartNavigation,
}) {
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  const expandedHeight = Math.min(Math.max(520, Math.round(screenHeight * 0.74)), 700);
  const collapsedHeight = Math.min(Math.max(420, Math.round(screenHeight * 0.5)), 500);

  const [sheetHeight, setSheetHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(collapsedHeight);

  useEffect(() => {
    if (visible) {
      setExpanded(false);
      setSheetHeight(collapsedHeight);
    } else {
      setExpanded(false);
      setSheetHeight(0);
    }
  }, [visible, collapsedHeight]);

  const heroImage = useMemo(() => {
    if (poi?.images?.length) return poi.images[0];
    if (poi?.image) return poi.image;
    const id = poi?.id ?? 1;
    return `https://picsum.photos/seed/mob2is-${id}-cover/900/520`;
  }, [poi]);

  const closeSheet = () => {
    setExpanded(false);
    setSheetHeight(0);
    onClose?.();
  };

  const onDragGrant = (e) => {
    dragStartYRef.current = e.nativeEvent.pageY;
    dragStartHeightRef.current = sheetHeight || collapsedHeight;
  };

  const onDragMove = (e) => {
    const currentY = e.nativeEvent.pageY;
    const dy = currentY - dragStartYRef.current;

    const nextHeight = clamp(
      dragStartHeightRef.current - dy,
      0,
      expandedHeight
    );

    setSheetHeight(nextHeight);
  };

  const onDragRelease = (e) => {
    const currentY = e.nativeEvent.pageY;
    const dy = currentY - dragStartYRef.current;

    const finalHeight = clamp(
      dragStartHeightRef.current - dy,
      0,
      expandedHeight
    );

    const closeThreshold = collapsedHeight * 0.7;
    const expandThreshold = (collapsedHeight + expandedHeight) / 2;

    if (finalHeight <= closeThreshold) {
      closeSheet();
      return;
    }

    if (finalHeight >= expandThreshold) {
      setExpanded(true);
      setSheetHeight(expandedHeight);
      return;
    }

    setExpanded(false);
    setSheetHeight(collapsedHeight);
  };

  if (!visible || !poi) return null;

  const title = poi.title ?? t("poiDetails.fallback_title");
  const subtitle = poi.subtitle ?? t("poiDetails.fallback_subtitle");
  const eta = poi.etaText ?? t("poiDetails.fallback_eta");
  const distance = poi.distanceText ?? "2,4 km";
  const shortDesc =
    poi.shortDescription ??
    poi.description ??
    t("poiDetails.fallback_description");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={closeSheet} />

        <View style={[styles.sheet, { height: sheetHeight }]}>
          <View
            style={styles.topDragZone}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={onDragGrant}
            onResponderMove={onDragMove}
            onResponderRelease={onDragRelease}
            onResponderTerminate={onDragRelease}
          >
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <View style={styles.destRow}>
                <View style={styles.greenDot} />
                <Text style={styles.destLabel}>{t("navigation.destination")}</Text>
              </View>

              <Pressable
                onPress={closeSheet}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel={t("common.cancel")}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>

            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>

            <View style={styles.heroWrap}>
              <Image
                source={{ uri: heroImage }}
                style={[styles.heroImg, !expanded && styles.heroImgCollapsed]}
              />
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLeft}>{eta}</Text>
            <Text style={styles.metaRight}>{distance}</Text>
          </View>

          {expanded ? (
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.description}>{shortDesc}</Text>
            </ScrollView>
          ) : (
            <View style={styles.bodyCollapsed}>
              <Text style={styles.description} numberOfLines={2}>
                {shortDesc}
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Pressable
              style={styles.ctaBtn}
              onPress={() => onStartNavigation?.(poi)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("poiDetails.select_route")}
            >
              <Text style={styles.ctaText}>{t("poiDetails.select_route")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  sheet: {
    backgroundColor: "#F6F7F9",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
    overflow: "hidden",
  },

  topDragZone: {
    paddingBottom: 6,
  },

  handle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(5,31,65,0.18)",
    marginBottom: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  destRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#39A25D",
    marginRight: 6,
  },

  destLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(5,31,65,0.42)",
  },

  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    fontSize: 24,
    lineHeight: 24,
    color: "rgba(5,31,65,0.38)",
    fontWeight: "400",
  },

  title: {
    marginTop: 2,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900",
    color: "#051F41",
  },

  subtitle: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(5,31,65,0.42)",
  },

  heroWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },

  heroImg: {
    width: "100%",
    height: 170,
    borderRadius: 16,
    backgroundColor: "#E7ECF2",
  },

  heroImgCollapsed: {
    height: 132,
  },

  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metaLeft: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(5,31,65,0.42)",
  },

  metaRight: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(5,31,65,0.42)",
  },

  body: {
    flex: 1,
    marginTop: 8,
  },

  bodyContent: {
    paddingBottom: 8,
  },

  bodyCollapsed: {
    marginTop: 8,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(5,31,65,0.86)",
  },

  footer: {
    paddingTop: 12,
  },

  ctaBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(5,31,65,0.08)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  ctaText: {
    color: "#F09C1F",
    fontSize: 16,
    fontWeight: "900",
  },
});
