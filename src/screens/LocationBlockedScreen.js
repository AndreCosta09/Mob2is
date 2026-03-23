import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function LocationBlockedScreen({ onRetry, onOpenSettings, onContinue }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View pointerEvents="none" style={styles.bgBlobTop} />
      <View pointerEvents="none" style={styles.bgBlobBottom} />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t("locationBlocked.badge")}</Text>
        </View>

        <Text style={styles.title}>{t("locationBlocked.title")}</Text>
        <Text style={styles.description}>{t("locationBlocked.description")}</Text>
        <Text style={styles.helper}>{t("locationBlocked.helper")}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onOpenSettings} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{t("locationBlocked.open_settings")}</Text>
        </Pressable>

        <Pressable onPress={onRetry} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{t("locationBlocked.retry")}</Text>
        </Pressable>

        <Pressable onPress={onContinue} style={styles.tertiaryButton}>
          <Text style={styles.tertiaryButtonText}>{t("locationBlocked.continue_without_location")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F3F5F7",
    paddingHorizontal: 22,
    justifyContent: "space-between",
  },
  bgBlobTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 180,
    backgroundColor: "rgba(11,45,77,0.07)",
  },
  bgBlobBottom: {
    position: "absolute",
    bottom: -140,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 220,
    backgroundColor: "rgba(241,143,1,0.10)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(241,143,1,0.16)",
    borderWidth: 1,
    borderColor: "rgba(241,143,1,0.24)",
  },
  badgeText: {
    color: "#0B2D4D",
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: "#0B2D4D",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
  },
  description: {
    marginTop: 18,
    color: "rgba(11,45,77,0.82)",
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "700",
  },
  helper: {
    marginTop: 14,
    color: "rgba(11,45,77,0.62)",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#F18F01",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  primaryButtonText: {
    color: "#0B2D4D",
    fontSize: 17,
    fontWeight: "900",
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.12)",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  secondaryButtonText: {
    color: "#0B2D4D",
    fontSize: 16,
    fontWeight: "900",
  },
  tertiaryButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  tertiaryButtonText: {
    color: "rgba(11,45,77,0.72)",
    fontSize: 14,
    fontWeight: "800",
  },
});
