import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const CONDITIONS = [
  { key: "visual", label: "DEFICIÊNCIA VISUAL", color: "#FF6B57", icon: "👁️" },
  { key: "wheelchair", label: "CADEIRA DE RODAS", color: "#8BC34A", icon: "♿" },
  { key: "hearing", label: "DEFICIÊNCIA AUDITIVA", color: "#9C7CF4", icon: "🦻" },
  { key: "asd", label: "ESPECTRO DE AUTISMO (PEA)", color: "#FFD166", icon: "🧩" },
  { key: "stroller", label: "GRÁVIDAS, CRIANÇAS E CARRINHOS", color: "#FF4D6D", icon: "👶" },
  { key: "elder", label: "IDOSO COM MOBILIDADE CONDICIONADA", color: "#4FC3F7", icon: "🧓" },
];

export default function OnboardingScreen({ onDone }) {
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Qual é a sua{"\n"}condição?</Text>

      <View style={styles.list}>
        {CONDITIONS.map((c) => {
          const active = selected === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => setSelected(c.key)}
              style={[styles.row, active && styles.rowActive]}
            >
              <View style={[styles.iconBox, { backgroundColor: c.color }]}>
                <Text style={styles.icon}>{c.icon}</Text>
              </View>

              <Text style={styles.label}>{c.label}</Text>

              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled={!selected}
        onPress={() => onDone?.(selected)}
        style={[styles.btn, !selected && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>Iniciar Rota</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F5F7", paddingHorizontal: 18, paddingTop: 28, paddingBottom: 18 },
  title: { fontSize: 26, fontWeight: "900", color: "#0B2D4D", textAlign: "center", marginBottom: 16 },

  list: { gap: 10 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  rowActive: { borderWidth: 2, borderColor: "#F18F01" },

  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  icon: { fontSize: 18 },

  label: { flex: 1, fontSize: 12, fontWeight: "800", color: "#1E2A36" },

  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#C9D1DA", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: "#F18F01" },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F18F01" },

  btn: {
    marginTop: 18,
    backgroundColor: "#F18F01",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 6,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "#0B2D4D", fontWeight: "900", fontSize: 18 },
});
