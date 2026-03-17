import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LocationBlockedScreen({ onRetry, onOpenSettings }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View pointerEvents="none" style={styles.bgBlobTop} />
      <View pointerEvents="none" style={styles.bgBlobBottom} />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Localização necessária</Text>
        </View>

        <Text style={styles.title}>Não é possível usar a app sem localização</Text>

        <Text style={styles.description}>
          Recusou o acesso à localização. Para proteger a experiência, as funcionalidades da Mob2is ficam bloqueadas até autorizar essa permissão.
        </Text>

        <Text style={styles.helper}>
          Pode voltar a tentar agora ou ativar a permissão nas definições do dispositivo.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onOpenSettings} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Abrir definições</Text>
        </Pressable>

        <Pressable onPress={onRetry} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
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
});
